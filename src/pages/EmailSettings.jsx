import { useState, useEffect, useCallback, useTransition } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Palette,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Monitor,
  Share2,
  FileText,
  Loader2,
  Building2,
  Mail,
  Server,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/layout/Loading";
import { supabase } from "@/lib/supabase";
import {
  COLOR_PRESETS,
  getEmailConfig,
  saveEmailConfig,
  resetEmailConfig,
  saveSmtpConfig,
  fetchSmtpConfigFromDB,
} from "@/lib/emailConfig";
import { renderEmailTemplate, sendEmail } from "@/lib/emailService";
import { canManageEmailSettings, canManageEmails } from "@/lib/permissions";

const SAMPLE_TEMPLATE_PROPS = {
  announcement: {
    title: "Exciting Workshop Coming Soon! 🚀",
    message:
      "We are thrilled to announce our upcoming workshop. Join us to learn new skills, build real projects, and connect with fellow enthusiasts!\n\nDate: Saturday, 4:00 PM\nVenue: Main Auditorium",
  },
  event: {
    recipientName: "Jane Doe",
    eventTitle: "Annual Technology Summit 2025",
    eventDescription:
      "Explore modern software development, serverless architectures, and engineering best practices with industry guest speakers.",
    eventDate: "November 15, 2025",
    eventTime: "4:00 PM - 6:00 PM",
    eventLocation: "Campus Auditorium & Online",
    registrationLink: "https://example.com/events/register",
    isCompetition: false,
  },
  certificate: {
    recipientName: "Jane Doe",
    eventName: "Annual Hackathon 2025",
    eventDate: "October 20, 2025",
    position: "1st",
    hasAttachment: true,
  },
  interview: {
    candidateName: "Jane Doe",
    interviewDate: "October 25, 2025",
    interviewTime: "3:30 PM",
    location: "Campus Room 101 / Online",
    meetingLink: "https://meet.google.com/example",
    instructions: "Please arrive 10 minutes early and keep your portfolio ready.",
  },
  induction: {
    name: "Jane Doe",
    deadline: "October 30, 2025",
  },
  selection: {
    recipientName: "Jane Doe",
    role: "Technical Lead",
  },
  rejection: {
    recipientName: "Jane Doe",
  },
  contact: {
    recipientName: "Jane",
    originalSubject: "Inquiry about Event Participation",
    originalMessage:
      "Hello team, I wanted to ask if students from other departments can also participate in the event?",
    responseMessage:
      "Hi Jane! Yes, the event is open to students across all departments. We look forward to seeing you!",
    responderName: "Support Team",
  },
};

const TEMPLATE_OPTIONS = [
  { id: "announcement", label: "Announcement" },
  { id: "event", label: "Event Announcement" },
  { id: "certificate", label: "Certificate" },
  { id: "interview", label: "Interview" },
  { id: "induction", label: "Inductions" },
  { id: "selection", label: "Selection" },
  { id: "rejection", label: "Rejection" },
  { id: "contact", label: "Contact Reply" },
];

export function EmailSettings() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  useEffect(() => {
    if (access && !canManageEmailSettings(access) && !canManageEmails(access)) {
      navigate("/no-permission");
    }
  }, [access, navigate]);

  const [activeSection, setActiveSection] = useState("society_profile");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(() => getEmailConfig());
  const [selectedTemplate, setSelectedTemplate] = useState("announcement");
  const [viewMode, setViewMode] = useState("desktop");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSociety, setIsSavingSociety] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [, startTransition] = useTransition();

  // Society & Account Profile State from DB
  const [societyData, setSocietyData] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    adminName: "",
    logoUrl: "",
    coverUrl: "",
    brandingColor: "#2A43F8",
    instagramUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  // SMTP & Delivery Credentials State (BYO Gmail / SMTP)
  const [smtpData, setSmtpData] = useState({
    user: "",
    pass: "",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    fromName: "",
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Fetch Society, User & SMTP from Supabase on mount
  useEffect(() => {
    async function loadSocietyAndUser() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Fetch SMTP config from DB
        const loadedSmtp = await fetchSmtpConfigFromDB();
        if (loadedSmtp) {
          setSmtpData({
            user: loadedSmtp.user || "",
            pass: loadedSmtp.pass || "",
            host: loadedSmtp.host || "smtp.gmail.com",
            port: loadedSmtp.port || 465,
            secure: loadedSmtp.secure !== undefined ? loadedSmtp.secure : true,
            fromName: loadedSmtp.fromName || "",
          });
        }

        if (!user) return;

        // Fetch User record
        const { data: userRecords } = await supabase
          .from("users")
          .select("*")
          .or(`user_id.eq.${user.id},userId.eq.${user.id},email.eq.${user.email}`);

        const currentU = userRecords && userRecords[0] ? userRecords[0] : null;

        // Fetch Society record
        let currentSoc = null;
        if (currentU?.society_id) {
          const { data: soc } = await supabase
            .from("societies")
            .select("*")
            .eq("id", currentU.society_id)
            .single();
          currentSoc = soc;
        } else if (currentU?.society_username) {
          const { data: soc } = await supabase
            .from("societies")
            .select("*")
            .eq("username", currentU.society_username)
            .single();
          currentSoc = soc;
        } else {
          const { data: socList } = await supabase
            .from("societies")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);
          if (socList && socList.length > 0) currentSoc = socList[0];
        }

        const cfg = getEmailConfig();

        setSocietyData({
          id: currentSoc?.id || null,
          name: currentSoc?.name || cfg.brandName || user.user_metadata?.society_name || "",
          username:
            currentSoc?.username ||
            currentU?.society_username ||
            user.user_metadata?.society_username ||
            "",
          email: currentSoc?.email || user.email || cfg.supportEmail || "",
          adminName: currentU?.name || user.user_metadata?.name || user.email?.split("@")[0] || "",
          logoUrl: currentSoc?.logo_url || cfg.logoUrl || "",
          coverUrl: currentSoc?.cover_url || cfg.bannerUrl || "",
          brandingColor: currentSoc?.branding_color || cfg.primaryColor || "#2A43F8",
          instagramUrl: currentSoc?.instagram_url || cfg.instagramUrl || "",
          linkedinUrl: currentSoc?.linkedin_url || cfg.linkedinUrl || "",
          websiteUrl: currentSoc?.website_url || cfg.websiteUrl || "",
        });
      } catch (err) {
        console.warn("Could not load society data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSocietyAndUser();
  }, []);

  // Re-render email HTML for preview
  const updatePreview = useCallback(async (currentConfig, templateId) => {
    setPreviewLoading(true);
    try {
      const props = {
        ...SAMPLE_TEMPLATE_PROPS[templateId],
        config: currentConfig,
      };
      const html = await renderEmailTemplate(templateId, props);
      setPreviewHtml(html);
    } catch (err) {
      console.error("Failed to render preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        updatePreview(formData, selectedTemplate);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [formData, selectedTemplate, updatePreview]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      buttonTextColor: preset.buttonTextColor,
      backgroundColor: preset.backgroundColor,
      cardBackgroundColor: preset.cardBackgroundColor,
      borderColor: preset.borderColor,
      textColor: preset.textColor,
      mutedColor: preset.mutedColor,
    }));
    toast.success(`Applied "${preset.name}" color preset`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveEmailConfig(formData);
      toast.success("Email template settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(err.message || "Failed to save email settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSociety = async (e) => {
    if (e) e.preventDefault();
    if (!societyData.name.trim()) {
      toast.error("Society name is required");
      return;
    }
    setIsSavingSociety(true);
    try {
      // 1. Update/Upsert societies table in Supabase
      let socId = societyData.id;
      if (socId) {
        await supabase
          .from("societies")
          .update({
            name: societyData.name.trim(),
            username: societyData.username.trim().toLowerCase(),
            email: societyData.email.trim(),
            logo_url: societyData.logoUrl.trim(),
            cover_url: societyData.coverUrl.trim(),
            branding_color: societyData.brandingColor,
            instagram_url: societyData.instagramUrl.trim() || null,
            linkedin_url: societyData.linkedinUrl.trim() || null,
            website_url: societyData.websiteUrl.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", socId);
      } else {
        const { data: newSoc } = await supabase
          .from("societies")
          .upsert({
            name: societyData.name.trim(),
            username: societyData.username.trim().toLowerCase(),
            email: societyData.email.trim(),
            logo_url: societyData.logoUrl.trim(),
            cover_url: societyData.coverUrl.trim(),
            branding_color: societyData.brandingColor,
            instagram_url: societyData.instagramUrl.trim() || null,
            linkedin_url: societyData.linkedinUrl.trim() || null,
            website_url: societyData.websiteUrl.trim() || null,
          })
          .select("id")
          .single();
        if (newSoc) socId = newSoc.id;
      }

      // 2. Sync to emailConfig & app_settings
      await saveEmailConfig({
        ...formData,
        brandName: societyData.name.trim(),
        senderName: `${societyData.name.trim()} Team`,
        logoUrl: societyData.logoUrl.trim(),
        bannerUrl: societyData.coverUrl.trim(),
        primaryColor: societyData.brandingColor,
        instagramUrl: societyData.instagramUrl.trim(),
        linkedinUrl: societyData.linkedinUrl.trim(),
        websiteUrl: societyData.websiteUrl.trim(),
        supportEmail: societyData.email.trim(),
      });

      // Update local email formData state
      setFormData((prev) => ({
        ...prev,
        brandName: societyData.name.trim(),
        senderName: `${societyData.name.trim()} Team`,
        logoUrl: societyData.logoUrl.trim(),
        bannerUrl: societyData.coverUrl.trim(),
        primaryColor: societyData.brandingColor,
        instagramUrl: societyData.instagramUrl.trim(),
        linkedinUrl: societyData.linkedinUrl.trim(),
        websiteUrl: societyData.websiteUrl.trim(),
        supportEmail: societyData.email.trim(),
      }));

      toast.success("Society profile and branding synchronized across database & templates!");
    } catch (err) {
      console.error("Failed to save society profile:", err);
      toast.error(err.message || "Failed to update society profile");
    } finally {
      setIsSavingSociety(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaults = await resetEmailConfig();
      setFormData(defaults);
      setResetDialogOpen(false);
      toast.success("Settings reset to factory defaults");
    } catch (err) {
      console.error("Error resetting settings:", err);
      toast.error("Failed to reset settings");
    }
  };

  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault();
    if (!smtpData.user.trim()) {
      toast.error("Sender / Gmail address is required");
      return;
    }
    if (!smtpData.pass.trim()) {
      toast.error("Google App Password is required");
      return;
    }
    setIsSavingSmtp(true);
    try {
      const portNum = Number(smtpData.port) || 465;
      const isSecure = portNum === 465 ? true : Boolean(smtpData.secure);
      await saveSmtpConfig({
        user: smtpData.user.trim(),
        pass: smtpData.pass.trim().replace(/\s+/g, ""),
        host: smtpData.host.trim() || "smtp.gmail.com",
        port: portNum,
        secure: isSecure,
        fromName: smtpData.fromName.trim() || formData.brandName || "Society Team",
      });
      toast.success("Custom SMTP credentials saved to database!");
    } catch (err) {
      console.error("Failed to save SMTP config:", err);
      toast.error(err.message || "Failed to save SMTP credentials");
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    if (!smtpData.user.trim() || !smtpData.pass.trim()) {
      toast.error("Please enter your Gmail and App Password before testing");
      return;
    }
    setTestingSmtp(true);
    try {
      const portNum = Number(smtpData.port) || 465;
      const isSecure = portNum === 465 ? true : Boolean(smtpData.secure);
      // Save credentials first
      await saveSmtpConfig({
        user: smtpData.user.trim(),
        pass: smtpData.pass.trim().replace(/\s+/g, ""),
        host: smtpData.host.trim() || "smtp.gmail.com",
        port: portNum,
        secure: isSecure,
        fromName: smtpData.fromName.trim() || formData.brandName || "Society Team",
      });

      const recipient = societyData.email || smtpData.user.trim();
      const currentBrand = formData.brandName || societyData.name || smtpData.fromName || "Society";
      const testConfig = {
        ...formData,
        brandName: currentBrand,
        senderName: smtpData.fromName || formData.senderName || currentBrand,
        supportEmail: formData.supportEmail || societyData.email || "",
        footerCopyright:
          formData.footerCopyright ||
          `© ${new Date().getFullYear()} ${currentBrand}. All rights reserved.`,
        footerDisclaimer: formData.footerDisclaimer || "",
      };

      await sendEmail({
        to: recipient,
        subject: `[SMTP Test] Delivery Verified for ${currentBrand}`,
        templateName: "announcement",
        templateProps: {
          title: "SMTP Connection Verified! 🚀",
          message:
            "Congratulations! Your custom Gmail SMTP credentials are properly configured and operational. All outgoing emails from this dashboard will now be sent securely through your Gmail account.",
          config: testConfig,
        },
        fromName: smtpData.fromName || currentBrand,
      });

      toast.success(`Verification email successfully delivered to ${recipient}!`);
    } catch (err) {
      console.error("SMTP Test Failed:", err);
      toast.error(
        err.message ||
          "SMTP connection failed. Check your Gmail address and 16-character App Password.",
      );
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error("Please enter a valid recipient email address");
      return;
    }
    setSendingTest(true);
    try {
      const templateProps = {
        ...SAMPLE_TEMPLATE_PROPS[selectedTemplate],
        config: formData,
      };

      await sendEmail({
        to: testEmailAddress.trim(),
        subject: `[TEST] ${formData.brandName || "Preview"} - ${selectedTemplate.toUpperCase()} Template`,
        templateName: selectedTemplate,
        templateProps,
        fromName: formData.senderName || formData.brandName,
      });

      toast.success(`Test email sent successfully to ${testEmailAddress}!`);
      setTestDialogOpen(false);
    } catch (err) {
      console.error("Failed to send test email:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="w-full flex flex-col items-start px-2 py-4 pb-16">
      {/* Top Setting Category Switcher & Action Buttons Bar */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Settings Navigation Tabs / Buttons */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveSection("society_profile")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSection === "society_profile"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Building2 className="size-4 text-primary" />
            <span>Society & Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("email_templates")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSection === "email_templates"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Mail className="size-4 text-primary" />
            <span>Email Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("smtp")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSection === "smtp"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Server className="size-4 text-primary" />
            <span>SMTP & Delivery</span>
          </button>
        </div>

        {/* Action Buttons for Email Templates */}
        {activeSection === "email_templates" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="gap-1.5 cursor-pointer h-10"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
              Reset Defaults
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestDialogOpen(true)}
              className="gap-1.5 cursor-pointer h-10"
            >
              <Send className="size-4 text-blue-500" />
              Send Test Email
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-sm h-10 px-4 font-semibold"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 1: Society & Account Profile (DB Synced) */}
      {activeSection === "society_profile" && (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Society & Account Settings */}
          <div className="lg:col-span-7 w-full flex flex-col gap-6">
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
              <CardHeader className="text-left pb-4">
                <CardTitle className="text-xl font-bold">Society & Organization Profile</CardTitle>
                <CardDescription>
                  Manage chapter identity, logo assets, brand colors, and official contact channels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-left">
                <form onSubmit={handleSaveSociety} className="space-y-4">
                  {/* Society Name & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="socName" className="text-xs font-semibold">
                        Society / Chapter Name
                      </Label>
                      <Input
                        id="socName"
                        value={societyData.name}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter your society or chapter name"
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="socHandle" className="text-xs font-semibold">
                        Society Handle / Slug
                      </Label>
                      <Input
                        id="socHandle"
                        value={societyData.username}
                        onChange={(e) =>
                          setSocietyData((prev) => ({
                            ...prev,
                            username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                          }))
                        }
                        placeholder="e.g. tech-society, ai-club"
                        required
                        className="h-10 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Admin Email & Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="socEmail" className="text-xs font-semibold">
                        Official Contact Email
                      </Label>
                      <Input
                        id="socEmail"
                        type="email"
                        value={societyData.email}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="society@university.edu or contact@domain.org"
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="adminLead" className="text-xs font-semibold">
                        Lead / Admin Name
                      </Label>
                      <Input
                        id="adminLead"
                        value={societyData.adminName}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, adminName: e.target.value }))
                        }
                        placeholder="Enter lead administrator's full name"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Branding Color Picker & Presets */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Society Primary Brand Color</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {societyData.brandingColor}
                      </span>
                    </Label>

                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            setSocietyData((prev) => ({ ...prev, brandingColor: p.primaryColor }))
                          }
                          className={`size-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                            societyData.brandingColor.toLowerCase() === p.primaryColor.toLowerCase()
                              ? "border-foreground scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: p.primaryColor }}
                          title={p.name}
                        >
                          {societyData.brandingColor.toLowerCase() ===
                            p.primaryColor.toLowerCase() && (
                            <Check className="size-3.5 text-white drop-shadow-sm" />
                          )}
                        </button>
                      ))}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="color"
                          value={societyData.brandingColor}
                          onChange={(e) =>
                            setSocietyData((prev) => ({
                              ...prev,
                              brandingColor: e.target.value,
                            }))
                          }
                          className="size-8 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                        />
                        <Input
                          value={societyData.brandingColor}
                          onChange={(e) =>
                            setSocietyData((prev) => ({
                              ...prev,
                              brandingColor: e.target.value,
                            }))
                          }
                          className="w-24 h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="socLogo" className="text-xs font-semibold">
                      Logo URL (Square 1:1 format)
                    </Label>
                    <Input
                      id="socLogo"
                      value={societyData.logoUrl}
                      onChange={(e) =>
                        setSocietyData((prev) => ({ ...prev, logoUrl: e.target.value }))
                      }
                      placeholder="https://example.com/logo.png"
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  {/* Cover URL */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="socCover"
                      className="text-xs font-semibold flex items-center justify-between"
                    >
                      <span>Cover / Banner Image Link</span>
                      <span className="text-[11px] text-primary font-medium">
                        Recommended: 1200 × 400 px (3:1)
                      </span>
                    </Label>
                    <Input
                      id="socCover"
                      value={societyData.coverUrl}
                      onChange={(e) =>
                        setSocietyData((prev) => ({ ...prev, coverUrl: e.target.value }))
                      }
                      placeholder="https://example.com/banner.jpg"
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  {/* Social Handles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="socInsta" className="text-xs font-semibold">
                        Instagram
                      </Label>
                      <Input
                        id="socInsta"
                        value={societyData.instagramUrl}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, instagramUrl: e.target.value }))
                        }
                        placeholder="https://instagram.com/your_handle"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="socLinkedIn" className="text-xs font-semibold">
                        LinkedIn
                      </Label>
                      <Input
                        id="socLinkedIn"
                        value={societyData.linkedinUrl}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, linkedinUrl: e.target.value }))
                        }
                        placeholder="https://linkedin.com/company/your-society"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="socWeb" className="text-xs font-semibold">
                        Website
                      </Label>
                      <Input
                        id="socWeb"
                        value={societyData.websiteUrl}
                        onChange={(e) =>
                          setSocietyData((prev) => ({ ...prev, websiteUrl: e.target.value }))
                        }
                        placeholder="https://your-society-website.org"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={isSavingSociety}
                      className="w-full sm:w-auto gap-2 cursor-pointer font-semibold h-10 px-6 bg-primary text-primary-foreground shadow-sm"
                    >
                      {isSavingSociety ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Save Society Profile & Sync Database
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Society Card Preview */}
          <div className="lg:col-span-5 w-full flex flex-col gap-4">
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs overflow-hidden">
              <CardHeader className="text-left pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold">Live Society Card Preview</CardTitle>
                <CardDescription className="text-xs">
                  How your society appears across public portals and email headers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Banner */}
                <div className="w-full h-32 bg-muted relative overflow-hidden">
                  {societyData.coverUrl ? (
                    <img
                      src={societyData.coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: societyData.brandingColor, opacity: 0.8 }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))`,
                    }}
                  />
                </div>

                {/* Profile Card Body */}
                <div className="p-5 text-left relative">
                  <div className="size-16 rounded-2xl border-2 border-background bg-white shadow-md overflow-hidden shrink-0 flex items-center justify-center -mt-10 mb-3 relative z-10">
                    {societyData.logoUrl ? (
                      <img
                        src={societyData.logoUrl}
                        alt="Logo"
                        className="size-full object-contain p-1"
                        onError={(e) => {
                          e.target.src = "";
                        }}
                      />
                    ) : (
                      <Building2 className="size-7 text-muted-foreground" />
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-foreground truncate">
                    {societyData.name || "Society Name"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono truncate mb-3">
                    @{societyData.username || "handle"}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Brand Color:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className="size-3 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: societyData.brandingColor }}
                        />
                        <span>{societyData.brandingColor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Official Email:</span>
                      <span className="text-foreground truncate max-w-[200px]">
                        {societyData.email || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 2: Email Templates Customizer */}
      {activeSection === "email_templates" && (
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Settings Tabs (6 cols on XL) */}
          <div className="xl:col-span-6 w-full flex flex-col gap-6">
            <Tabs defaultValue="brand" className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-11 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="brand" className="text-xs sm:text-sm gap-1.5 cursor-pointer">
                  <Sparkles className="size-3.5" />
                  <span>Branding</span>
                </TabsTrigger>
                <TabsTrigger value="theme" className="text-xs sm:text-sm gap-1.5 cursor-pointer">
                  <Palette className="size-3.5" />
                  <span>Colors</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="text-xs sm:text-sm gap-1.5 cursor-pointer">
                  <Share2 className="size-3.5" />
                  <span>Social</span>
                </TabsTrigger>
                <TabsTrigger value="footer" className="text-xs sm:text-sm gap-1.5 cursor-pointer">
                  <FileText className="size-3.5" />
                  <span>Footer</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Brand Info */}
              <TabsContent value="brand" className="space-y-4 mt-4">
                <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
                  <CardHeader className="text-left pb-3">
                    <CardTitle className="text-base font-bold">Brand Identity & Assets</CardTitle>
                    <CardDescription className="text-xs">
                      Primary organization details attached to all outgoing email headers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="brandName" className="text-xs font-semibold">
                          Brand / Society Name
                        </Label>
                        <Input
                          id="brandName"
                          value={formData.brandName}
                          onChange={(e) => handleChange("brandName", e.target.value)}
                          placeholder="Enter brand or organization name"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="senderName" className="text-xs font-semibold">
                          Default Sender Name
                        </Label>
                        <Input
                          id="senderName"
                          value={formData.senderName}
                          onChange={(e) => handleChange("senderName", e.target.value)}
                          placeholder="e.g. Executive Team or Events Team"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="logoUrl" className="text-xs font-semibold">
                        Logo Image URL (1:1 Square)
                      </Label>
                      <Input
                        id="logoUrl"
                        value={formData.logoUrl}
                        onChange={(e) => handleChange("logoUrl", e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bannerUrl" className="text-xs font-semibold">
                        Header Banner Image URL (1200 × 400 px)
                      </Label>
                      <Input
                        id="bannerUrl"
                        value={formData.bannerUrl}
                        onChange={(e) => handleChange("bannerUrl", e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="websiteUrl" className="text-xs font-semibold">
                          Website URL
                        </Label>
                        <Input
                          id="websiteUrl"
                          value={formData.websiteUrl}
                          onChange={(e) => handleChange("websiteUrl", e.target.value)}
                          placeholder="https://your-society-website.org"
                          className="h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="supportEmail" className="text-xs font-semibold">
                          Support / Reply-To Email
                        </Label>
                        <Input
                          id="supportEmail"
                          value={formData.supportEmail}
                          onChange={(e) => handleChange("supportEmail", e.target.value)}
                          placeholder="support@domain.org or contact@domain.org"
                          className="h-10 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Colors & Theme */}
              <TabsContent value="theme" className="space-y-4 mt-4">
                <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
                  <CardHeader className="text-left pb-3">
                    <CardTitle className="text-base font-bold">
                      Email Palette & Theme Presets
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pick a curated palette or customize individual button and card colors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Color Presets</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <Button
                            key={preset.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreset(preset)}
                            className="h-auto py-2 px-2.5 flex items-center justify-start gap-2 border-border/80 hover:border-primary/60 cursor-pointer"
                          >
                            <span
                              className="size-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <span className="text-xs truncate">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="primaryColor" className="text-xs font-semibold">
                          Primary Button & Accent Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="primaryColorPicker"
                            value={formData.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                            className="size-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                          />
                          <Input
                            id="primaryColor"
                            value={formData.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="buttonTextColor" className="text-xs font-semibold">
                          Button Text Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="btnTextPicker"
                            value={formData.buttonTextColor}
                            onChange={(e) => handleChange("buttonTextColor", e.target.value)}
                            className="size-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                          />
                          <Input
                            id="buttonTextColor"
                            value={formData.buttonTextColor}
                            onChange={(e) => handleChange("buttonTextColor", e.target.value)}
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="backgroundColor" className="text-xs font-semibold">
                          Outer Email Background
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="bgPicker"
                            value={formData.backgroundColor}
                            onChange={(e) => handleChange("backgroundColor", e.target.value)}
                            className="size-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                          />
                          <Input
                            id="backgroundColor"
                            value={formData.backgroundColor}
                            onChange={(e) => handleChange("backgroundColor", e.target.value)}
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cardBackgroundColor" className="text-xs font-semibold">
                          Inner Card Background
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="cardBgPicker"
                            value={formData.cardBackgroundColor}
                            onChange={(e) => handleChange("cardBackgroundColor", e.target.value)}
                            className="size-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                          />
                          <Input
                            id="cardBackgroundColor"
                            value={formData.cardBackgroundColor}
                            onChange={(e) => handleChange("cardBackgroundColor", e.target.value)}
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Social Links */}
              <TabsContent value="social" className="space-y-4 mt-4">
                <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
                  <CardHeader className="text-left pb-3">
                    <CardTitle className="text-base font-bold">Social Channels & Links</CardTitle>
                    <CardDescription className="text-xs">
                      Social profile buttons rendered at the bottom of each email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <Label htmlFor="instagramUrl" className="text-xs font-semibold">
                        Instagram URL
                      </Label>
                      <Input
                        id="instagramUrl"
                        value={formData.instagramUrl}
                        onChange={(e) => handleChange("instagramUrl", e.target.value)}
                        placeholder="https://instagram.com/your_handle"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="linkedinUrl" className="text-xs font-semibold">
                        LinkedIn URL
                      </Label>
                      <Input
                        id="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/company/your-society"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="twitterUrl" className="text-xs font-semibold">
                        Twitter / X URL
                      </Label>
                      <Input
                        id="twitterUrl"
                        value={formData.twitterUrl}
                        onChange={(e) => handleChange("twitterUrl", e.target.value)}
                        placeholder="https://x.com/your_handle"
                        className="h-10 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: Footer & Disclaimers */}
              <TabsContent value="footer" className="space-y-4 mt-4">
                <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
                  <CardHeader className="text-left pb-3">
                    <CardTitle className="text-base font-bold">
                      Footer Information & Disclaimers
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Customize copyright statement, automated disclaimers, and optional developer
                      credit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <Label htmlFor="footerCopyright" className="text-xs font-semibold">
                        Copyright Notice
                      </Label>
                      <Input
                        id="footerCopyright"
                        value={formData.footerCopyright}
                        onChange={(e) => handleChange("footerCopyright", e.target.value)}
                        placeholder="© 2025 [Your Organization]. All rights reserved."
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="footerDisclaimer" className="text-xs font-semibold">
                        Automated Email Disclaimer
                      </Label>
                      <Textarea
                        id="footerDisclaimer"
                        value={formData.footerDisclaimer}
                        onChange={(e) => handleChange("footerDisclaimer", e.target.value)}
                        placeholder="e.g. This is an automated email sent on behalf of the organization..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">
                          Show Creator Credit in Footer
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Display "Crafted with ♥ by ..." at bottom
                        </p>
                      </div>
                      <Switch
                        checked={formData.showCreatorCredit}
                        onCheckedChange={(checked) => handleChange("showCreatorCredit", checked)}
                      />
                    </div>

                    {formData.showCreatorCredit && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="creatorName" className="text-xs font-semibold">
                            Creator Name
                          </Label>
                          <Input
                            id="creatorName"
                            value={formData.creatorName}
                            onChange={(e) => handleChange("creatorName", e.target.value)}
                            placeholder="Enter developer or creator name"
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="creatorLink" className="text-xs font-semibold">
                            Creator Profile Link
                          </Label>
                          <Input
                            id="creatorLink"
                            value={formData.creatorLink}
                            onChange={(e) => handleChange("creatorLink", e.target.value)}
                            placeholder="https://linkedin.com/in/profile-url"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Live Interactive Preview (6 cols on XL) */}
          <div className="xl:col-span-6 w-full flex flex-col gap-4">
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs overflow-hidden">
              <CardHeader className="text-left pb-3 border-b border-border/40">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold">Live Template Preview</CardTitle>

                  {/* Device Switcher */}
                  <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
                    <Button
                      type="button"
                      size="sm"
                      variant={viewMode === "desktop" ? "default" : "ghost"}
                      onClick={() => setViewMode("desktop")}
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                      <Monitor className="size-3.5" /> Desktop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={viewMode === "mobile" ? "default" : "ghost"}
                      onClick={() => setViewMode("mobile")}
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                      <Smartphone className="size-3.5" /> Mobile
                    </Button>
                  </div>
                </div>

                {/* Template Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar">
                  {TEMPLATE_OPTIONS.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      size="sm"
                      variant={selectedTemplate === t.id ? "default" : "outline"}
                      onClick={() => setSelectedTemplate(t.id)}
                      className="h-7 px-3 text-xs rounded-full cursor-pointer shrink-0"
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              {/* Preview Frame Container */}
              <CardContent className="p-0 bg-muted/30 relative min-h-[580px] max-h-[720px] flex items-center justify-center overflow-auto">
                {previewLoading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-10">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                )}

                <div
                  className={`transition-all duration-200 my-4 shadow-md rounded-xl overflow-hidden border border-border/80 bg-white ${
                    viewMode === "desktop" ? "w-full max-w-[620px]" : "w-[375px] max-w-full"
                  }`}
                  style={{ height: "640px" }}
                >
                  <iframe
                    title="Email Live Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 3: SMTP & Delivery (Bring Your Own Gmail/SMTP) */}
      {activeSection === "smtp" && (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: SMTP Configuration Form */}
          <div className="lg:col-span-7 w-full flex flex-col gap-6">
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
              <CardHeader className="text-left pb-4">
                <CardTitle className="text-xl font-bold">SMTP Mail Delivery Engine</CardTitle>
                <CardDescription>
                  Configure your own custom Gmail account or SMTP server to dispatch official
                  chapter emails directly from your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-left">
                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  {/* Gmail Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpUser" className="text-xs font-semibold">
                      Gmail / Sender Email Address
                    </Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      value={smtpData.user}
                      onChange={(e) => setSmtpData((prev) => ({ ...prev, user: e.target.value }))}
                      placeholder="your-society@gmail.com"
                      required
                      className="h-10"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      This address will be used as the authenticated sender and "From" header.
                    </p>
                  </div>

                  {/* Gmail App Password (16-char) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smtpPass" className="text-xs font-semibold">
                        Google App Password (16 characters)
                      </Label>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        Generate App Password
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="smtpPass"
                        type={showSmtpPassword ? "text" : "password"}
                        value={smtpData.pass}
                        onChange={(e) => setSmtpData((prev) => ({ ...prev, pass: e.target.value }))}
                        placeholder="xxxx xxxx xxxx xxxx"
                        required
                        className="h-10 pr-10 font-mono text-xs tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        tabIndex={-1}
                      >
                        {showSmtpPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Do not use your standard Google account login password. Generate a
                      16-character dedicated <strong>App Password</strong>.
                    </p>
                  </div>

                  {/* Sender Display Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpFromName" className="text-xs font-semibold">
                      Sender Display Name
                    </Label>
                    <Input
                      id="smtpFromName"
                      value={smtpData.fromName}
                      onChange={(e) =>
                        setSmtpData((prev) => ({ ...prev, fromName: e.target.value }))
                      }
                      placeholder={formData.brandName || "e.g. Society Executive Board"}
                      className="h-10"
                    />
                  </div>

                  {/* Advanced Host & Port Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="smtpHost" className="text-xs font-semibold">
                        SMTP Host Endpoint
                      </Label>
                      <Input
                        id="smtpHost"
                        value={smtpData.host}
                        onChange={(e) => setSmtpData((prev) => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="h-10 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="smtpPort" className="text-xs font-semibold">
                        SMTP Port
                      </Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={smtpData.port}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setSmtpData((prev) => ({
                            ...prev,
                            port: p,
                            secure: p === 465 ? true : p === 587 ? false : prev.secure,
                          }));
                        }}
                        placeholder="465"
                        className="h-10 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* SSL Switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Require SSL/TLS Encryption</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Required for Port 465 (Recommended for Gmail)
                      </p>
                    </div>
                    <Switch
                      checked={smtpData.secure || Number(smtpData.port) === 465}
                      onCheckedChange={(checked) =>
                        setSmtpData((prev) => ({ ...prev, secure: checked }))
                      }
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <Button
                      type="submit"
                      disabled={isSavingSmtp}
                      className="gap-2 cursor-pointer font-semibold h-10 px-6 bg-primary text-primary-foreground shadow-sm"
                    >
                      {isSavingSmtp ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Save SMTP Credentials
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={testingSmtp || !smtpData.user || !smtpData.pass}
                      onClick={handleTestSmtpConnection}
                      className="gap-2 cursor-pointer font-semibold h-10 px-4 border-primary/40 hover:bg-primary/5 text-primary"
                    >
                      {testingSmtp ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4 text-primary" />
                      )}
                      Test SMTP Connection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Setup Instructions & Engine Diagnostics */}
          <div className="lg:col-span-5 w-full flex flex-col gap-5">
            {/* Status Card */}
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
              <CardHeader className="text-left pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold">SMTP Engine Status</CardTitle>
                <CardDescription className="text-xs">
                  Real-time transport diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-left">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Configured Account:</span>
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {smtpData.user || "Not configured"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Server Host:</span>
                    <span className="font-mono text-foreground">
                      {smtpData.host || "smtp.gmail.com"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Port & Encryption:</span>
                    <span className="font-mono text-foreground">
                      {smtpData.port} ({smtpData.secure ? "SSL" : "TLS"})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to generate Google App Password */}
            <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
              <CardHeader className="text-left pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold">
                  How to get your Gmail App Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Follow these 4 simple steps in Google Account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-left text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    Enable <strong>2-Step Verification</strong> on your Google Account if not
                    already turned on.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    Visit{" "}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      myaccount.google.com/apppasswords
                    </a>
                    .
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    Enter an app name (e.g. <strong>"Society Dashboard"</strong>) and click{" "}
                    <strong>Create</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <p>
                    Copy the <strong>16-character generated code</strong> and paste it into the
                    Google App Password field on the left.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reset Confirmation Alert Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Reset Email Settings to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all branding, logos, color palettes, and footer configurations to
              their original factory defaults. Any customized settings will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader className="text-left">
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a rendered test sample of the{" "}
              <strong className="text-foreground capitalize">{selectedTemplate}</strong> template to
              verify your branding in real inboxes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="testEmail" className="text-xs font-semibold">
                Recipient Email Address
              </Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="your.email@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Template:</span>
                <span className="font-semibold text-foreground capitalize">{selectedTemplate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sender:</span>
                <span className="font-semibold text-foreground">
                  {formData.senderName || formData.brandName || "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Primary Color:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span
                    className="size-2.5 rounded-full inline-block"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <span>{formData.primaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="gap-1.5 cursor-pointer bg-primary text-primary-foreground font-semibold"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailSettings;
