import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  Row,
  Column,
  Font,
} from "@react-email/components";
import * as React from "react";
import { DEFAULT_EMAIL_CONFIG } from "../src/lib/emailConfig";

interface ContactEmailProps {
  recipientName?: string;
  originalSubject?: string;
  originalMessage?: string;
  responseMessage?: string;
  responderName?: string;
  config?: any;
}

export const ContactEmail = ({
  recipientName,
  originalSubject,
  originalMessage,
  responseMessage,
  responderName,
  config = {},
}: ContactEmailProps) => {
  const cfg = { ...DEFAULT_EMAIL_CONFIG, ...config };
  const baseUrl = cfg.websiteUrl || "#";

  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: cfg.cardBackgroundColor || "#ffffff",
                foreground: cfg.textColor || "#09090b",
                muted: "#f4f4f5",
                "muted-foreground": cfg.mutedColor || "#71717a",
                border: cfg.borderColor || "#e4e4e7",
                primary: cfg.textColor || "#18181b",
                brand: cfg.primaryColor || "#2A43F8",
              },
              fontFamily: {
                sans: ['"Product Sans"', "sans-serif"],
                serif: ['"Recoleta Regular"', "serif"],
              },
            },
          },
        }}
      >
        <Head>
          <Font
            fontFamily="Recoleta Regular"
            fallbackFontFamily="serif"
            webFont={{
              url: "https://nmanumr.com/fonts/Recoleta-Regular.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
          <Font
            fontFamily="Product Sans"
            fallbackFontFamily="sans-serif"
            webFont={{
              url: "https://fonts.gstatic.com/s/productsans/v5/HYvgU2fE2nRJvZ5JFAumwegdm0LZdjqr5-oayXSOefg.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>
        <Body
          className="font-sans py-10 px-4"
          style={{ backgroundColor: cfg.backgroundColor || "#fafafa" }}
        >
          <Preview>Response to: {originalSubject ?? "Your Message"}</Preview>
          <Container className="mx-auto w-full max-w-[600px] p-0">
            {/* Card Container */}
            <Section
              className="rounded-xl border border-border"
              style={{ backgroundColor: cfg.cardBackgroundColor || "#ffffff" }}
            >
              {/* Header / Hero */}
              <Section className="p-8 text-left">
                {cfg.logoUrl && (
                  <div className="mb-6">
                    <Img
                      src={cfg.logoUrl}
                      width={64}
                      height={64}
                      alt={cfg.brandName || "Logo"}
                      style={{ borderRadius: "12px", objectFit: "contain" }}
                    />
                  </div>
                )}

                {cfg.bannerUrl && (
                  <Img
                    alt="Contact Response"
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  We've Got Your Message! 💬
                </Heading>

                <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                  Response from {responderName || cfg.senderName || cfg.brandName || "Support Team"}
                </Text>

                <Text className="text-base text-foreground leading-7 mb-6 text-left">
                  Hi {recipientName || "there"}! 👋
                  <br />
                  <br />
                  Thank you for reaching out to us. We've received your message and here's our response:
                </Text>
              </Section>

              <Hr className="border-border m-0" />

              {/* Original Message Section */}
              <Section className="p-8 bg-muted/30 text-left">
                <Heading className="m-0 mb-3 font-serif font-bold text-lg text-foreground text-left">
                  Your Message 📝
                </Heading>
                {originalSubject && (
                  <Text
                    className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-left"
                    style={{ color: cfg.primaryColor || "#2A43F8" }}
                  >
                    Subject: {originalSubject}
                  </Text>
                )}
                {originalMessage && (
                  <Section
                    className="p-4 rounded-r-lg"
                    style={{
                      borderLeft: `4px solid ${cfg.primaryColor || "#2A43F8"}`,
                      backgroundColor: `${cfg.primaryColor}08`,
                    }}
                  >
                    <Text className="m-0 text-sm text-foreground leading-6 text-left whitespace-pre-wrap">
                      {originalMessage}
                    </Text>
                  </Section>
                )}
              </Section>

              <Hr className="border-border m-0" />

              {/* Response Section */}
              <Section className="p-8 text-left">
                <Heading className="m-0 mb-6 font-serif font-bold text-xl text-foreground text-left">
                  Our Response ✉️
                </Heading>

                <Text className="m-0 mb-6 text-base text-foreground leading-7 text-left whitespace-pre-wrap">
                  {responseMessage || ""}
                </Text>

                <Text className="m-0 text-sm text-muted-foreground text-left">
                  Best regards,
                  <br />
                  <strong className="text-foreground">
                    {responderName || cfg.senderName || cfg.brandName || "The Team"}
                  </strong>
                </Text>
              </Section>

              <Hr className="border-border m-0" />

              {/* Footer */}
              <Section className="p-8 text-left">
                <Row className="mb-6">
                  <Column>
                    {cfg.instagramUrl && (
                      <Link
                        href={cfg.instagramUrl}
                        className="text-sm text-muted-foreground hover:text-foreground no-underline mr-6"
                      >
                        Instagram
                      </Link>
                    )}
                    {cfg.linkedinUrl && (
                      <Link
                        href={cfg.linkedinUrl}
                        className="text-sm text-muted-foreground hover:text-foreground no-underline mr-6"
                      >
                        LinkedIn
                      </Link>
                    )}
                    {cfg.twitterUrl && (
                      <Link
                        href={cfg.twitterUrl}
                        className="text-sm text-muted-foreground hover:text-foreground no-underline mr-6"
                      >
                        Twitter / X
                      </Link>
                    )}
                    {cfg.websiteUrl && (
                      <Link
                        href={baseUrl}
                        className="text-sm text-muted-foreground hover:text-foreground no-underline"
                      >
                        Website
                      </Link>
                    )}
                  </Column>
                </Row>

                <Text className="text-xs text-muted-foreground m-0 text-left">
                  {cfg.footerCopyright || `© ${new Date().getFullYear()} ${cfg.brandName || "Society"}. All rights reserved.`}
                </Text>
                {cfg.showCreatorCredit && cfg.creatorName && (
                  <Text className="text-xs text-muted-foreground mt-2 text-left">
                    Crafted with <span className="text-red-500">♥</span> by{" "}
                    <Link
                      href={cfg.creatorLink || "#"}
                      className="text-foreground underline"
                    >
                      {cfg.creatorName}
                    </Link>
                  </Text>
                )}
                {cfg.footerDisclaimer && (
                  <Text className="text-xs text-muted-foreground mt-2 text-left">
                    {cfg.footerDisclaimer}{" "}
                    {cfg.supportEmail && (
                      <Link href={`mailto:${cfg.supportEmail}`} className="text-foreground underline">
                        {cfg.supportEmail}
                      </Link>
                    )}
                  </Text>
                )}

                {/* Powered by Socflow */}
                <Text className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border text-left">
                  Powered by{" "}
                  <Link
                    href="https://socflow.app"
                    className="text-foreground font-semibold underline"
                  >
                    Socflow
                  </Link>
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContactEmail;
