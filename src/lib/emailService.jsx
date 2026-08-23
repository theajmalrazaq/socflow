import { render } from "@react-email/render";
import CertificateEmail from "../../emails/CertificateEmail";
import InterviewEmail from "../../emails/InterviewEmail";
import SelectionEmail from "../../emails/SelectionEmail";
import RejectionEmail from "../../emails/RejectionEmail";
import AnnouncementEmail from "../../emails/AnnouncementEmail";
import EventEmail from "../../emails/EventEmail";
import ContactEmail from "../../emails/ContactEmail";
import InductionEmail from "../../emails/InductionEmail";
import { getEmailConfig, getSmtpConfig } from "./emailConfig";

/**
 * Email templates registry
 */
export const EMAIL_TEMPLATES = {
  announcement: AnnouncementEmail,
  event: EventEmail,
  certificate: CertificateEmail,
  interview: InterviewEmail,
  induction: InductionEmail,
  selection: SelectionEmail,
  rejection: RejectionEmail,
  contact: ContactEmail,
};

/**
 * Render an email template to HTML
 * @param {string} templateName - Name of the template
 * @param {object} props - Props to pass to the template
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderEmailTemplate(templateName, props = {}) {
  const Template = EMAIL_TEMPLATES[templateName];
  if (!Template) {
    throw new Error(`Email template "${templateName}" not found`);
  }
  const config = props?.config ? { ...getEmailConfig(), ...props.config } : getEmailConfig();
  const mergedProps = { ...props, config };
  // Render to HTML string - await in case it's async
  const html = await render(<Template {...mergedProps} />, { pretty: false });
  return html;
}

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send a single email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - Name of the email template
 * @param {object} options.templateProps - Props to pass to the template
 * @param {Array} options.attachments - Array of attachments
 * @param {string} options.fromName - Custom sender display name
 * @returns {Promise<object>} Response from the API
 */
export async function sendEmail({
  to,
  subject,
  templateName,
  templateProps = {},
  attachments = [],
  fromName,
}) {
  // Validate email
  if (!isValidEmail(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  const currentConfig = templateProps?.config
    ? { ...getEmailConfig(), ...templateProps.config }
    : getEmailConfig();

  // Render template with customized settings
  const html = await renderEmailTemplate(templateName, { ...templateProps, config: currentConfig });

  const senderDisplayName =
    fromName || currentConfig.senderName || currentConfig.brandName || "Society Team";

  // Send email via API
  const response = await fetch("/api/SendEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      attachments,
      fromName: senderDisplayName,
      smtpConfig: getSmtpConfig(),
    }),
  });

  const responseText = await response.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Delivery service responded with status ${response.status}: ${responseText.slice(0, 120) || "Empty response"}`,
    );
  }

  if (!response.ok) {
    const detailedMessage = data?.error
      ? `${data.message}: ${data.error}`
      : data?.message || `Failed to send email (${response.status})`;
    throw new Error(detailedMessage);
  }

  if (data?.sent === 0 && data?.failed > 0) {
    const firstError = data?.results?.[0]?.error || data?.message || "Delivery failed";
    throw new Error(firstError);
  }

  return data;
}

/**
 * Send bulk emails with progress tracking
 * @param {object} options - Bulk email options
 * @param {Array<string>} options.recipients - Array of recipient email addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - Name of the email template
 * @param {object|Function} options.templateProps - Props to pass to the template (object or function that takes recipient)
 * @param {Function} options.onProgress - Progress callback (current, total, recipient)
 * @param {number} options.batchSize - Number of emails to send in parallel (default: 5)
 * @param {number} options.delayMs - Delay between batches in milliseconds (default: 1000)
 * @returns {Promise<object>} Results with success and failed arrays
 */
export async function sendBulkEmails({
  recipients,
  subject,
  templateName,
  templateProps,
  onProgress,
  batchSize = 5,
  delayMs = 1000,
}) {
  const results = {
    success: [],
    failed: [],
  };

  // Process in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map(async (recipient) => {
      try {
        const email = typeof recipient === "string" ? recipient : recipient.email;

        // Get props for this recipient
        const props =
          typeof templateProps === "function" ? templateProps(recipient) : templateProps;

        await sendEmail({
          to: email,
          subject,
          templateName,
          templateProps: props,
        });

        results.success.push(recipient);

        if (onProgress) {
          onProgress(results.success.length + results.failed.length, recipients.length, recipient);
        }
      } catch (error) {
        results.failed.push({ recipient, error: error.message });

        if (onProgress) {
          onProgress(results.success.length + results.failed.length, recipients.length, recipient);
        }
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches (except for the last batch)
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Send certificate email
 */
export async function sendCertificateEmail({
  to,
  recipientName,
  eventName,
  eventDate,
  certificateUrl,
  position,
  hasAttachment = false,
  attachments = [],
}) {
  return sendEmail({
    to,
    subject: `Your Certificate - ${eventName}`,
    templateName: "certificate",
    templateProps: {
      recipientName,
      eventName,
      eventDate,
      certificateUrl,
      position,
      hasAttachment,
    },
    attachments,
  });
}

/**
 * Send interview email
 */
export async function sendInterviewEmail({
  to,
  candidateName,
  interviewDate,
  interviewTime,
  interviewSlot,
  meetingLink,
  location,
  instructions,
}) {
  const cfg = getEmailConfig();
  return sendEmail({
    to,
    subject: `Interview Scheduled - ${cfg.brandName} Inductions`,
    templateName: "interview",
    templateProps: {
      candidateName,
      interviewDate,
      interviewTime,
      interviewSlot,
      meetingLink,
      location,
      instructions,
    },
  });
}

/**
 * Send event announcement email
 */
export async function sendEventEmail({
  to,
  recipientName,
  eventTitle,
  eventDescription,
  eventDate,
  eventTime,
  eventLocation,
  eventImage,
  registrationLink,
  isCompetition,
}) {
  return sendEmail({
    to,
    subject: `${isCompetition ? "New Competition" : "New Event"} - ${eventTitle}`,
    templateName: "event",
    templateProps: {
      recipientName,
      eventTitle,
      eventDescription,
      eventDate,
      eventTime,
      eventLocation,
      eventImage,
      registrationLink,
      isCompetition,
    },
  });
}

/**
 * Send selection email
 */
export async function sendSelectionEmail({ to, recipientName, role }) {
  return sendEmail({
    to,
    subject: "Congratulations — You are selected!",
    templateName: "selection",
    templateProps: { recipientName, role },
  });
}

/**
 * Send rejection email
 */
export async function sendRejectionEmail({ to, recipientName }) {
  return sendEmail({
    to,
    subject: "Application Update",
    templateName: "rejection",
    templateProps: { recipientName },
  });
}

/**
 * Send contact response email
 */
export async function sendContactResponseEmail({
  to,
  recipientName,
  originalSubject,
  originalMessage,
  responseMessage,
  responderName,
}) {
  return sendEmail({
    to,
    subject: `Re: ${originalSubject}`,
    templateName: "contact",
    templateProps: {
      recipientName,
      originalSubject,
      originalMessage,
      responseMessage,
      responderName,
    },
  });
}

/**
 * Send induction announcement email
 */
export async function sendInductionEmail({ to, recipientEmails, name, deadline }) {
  const cfg = getEmailConfig();
  const rawList =
    recipientEmails ||
    (Array.isArray(to)
      ? to
      : typeof to === "string"
        ? to.split(/[;,]+/).flatMap((s) => {
            const trimmed = s.trim();
            return trimmed ? [trimmed] : [];
          })
        : []);

  if (Array.isArray(rawList) && rawList.length > 1) {
    const bulkRes = await sendBulkEmails({
      recipients: rawList,
      subject: `Inductions are Open! Join ${cfg.brandName}`,
      templateName: "induction",
      templateProps: {
        name,
        deadline,
      },
    });
    return {
      success: bulkRes.success.length > 0,
      sent: bulkRes.success.length,
      failed: bulkRes.failed.length,
      ...bulkRes,
    };
  }

  const singleTo = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : to;
  const res = await sendEmail({
    to: singleTo,
    subject: `Inductions are Open! Join ${cfg.brandName}`,
    templateName: "induction",
    templateProps: {
      name,
      deadline,
    },
  });
  return { success: true, sent: 1, ...res };
}

/**
 * Send announcement email
 */
export async function sendAnnouncementEmail({ to, recipientEmails, title, message }) {
  const cfg = getEmailConfig();
  const rawList =
    recipientEmails ||
    (Array.isArray(to)
      ? to
      : typeof to === "string" && to.includes(",")
        ? to.split(/[;,]+/).flatMap((s) => {
            const trimmed = s.trim();
            return trimmed ? [trimmed] : [];
          })
        : null);

  if (Array.isArray(rawList) && rawList.length > 1) {
    const bulkRes = await sendBulkEmails({
      recipients: rawList,
      subject: title || `Announcement from ${cfg.brandName}`,
      templateName: "announcement",
      templateProps: { title, message },
    });
    return {
      success: bulkRes.success.length > 0,
      sent: bulkRes.success.length,
      failed: bulkRes.failed.length,
      ...bulkRes,
    };
  }

  const singleTo = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : to;
  const res = await sendEmail({
    to: singleTo,
    subject: title || `Announcement from ${cfg.brandName}`,
    templateName: "announcement",
    templateProps: { title, message },
  });
  return { success: true, sent: 1, ...res };
}
