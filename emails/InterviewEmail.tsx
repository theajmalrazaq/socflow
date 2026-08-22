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
  Button,
} from "@react-email/components";
import * as React from "react";
import { DEFAULT_EMAIL_CONFIG } from "../src/lib/emailConfig";

interface InterviewEmailProps {
  candidateName?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  location?: string;
  instructions?: string;
  config?: any;
}

export const InterviewEmail = ({
  candidateName,
  interviewDate,
  interviewTime,
  meetingLink,
  location,
  instructions,
  config = {},
}: InterviewEmailProps) => {
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
          <Preview>Interview Scheduled - {cfg.brandName || "Society"} Inductions</Preview>
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
                    alt="Interview Scheduled"
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  Interview Scheduled! 📅
                </Heading>

                <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                  {cfg.brandName || "Society"} Inductions
                </Text>

                <Text className="text-base text-foreground leading-7 mb-6 text-left">
                  Dear {candidateName || "Candidate"},
                  <br />
                  <br />
                  Congratulations on making it to the interview stage! We're excited to meet you and learn more about your skills and passion. 🚀
                </Text>

                {meetingLink && (
                  <Row className="mb-3">
                    <Column align="left">
                      <Button
                        className="w-full block text-sm py-[12px] text-center font-semibold"
                        style={{
                          backgroundColor: cfg.primaryColor || "#2A43F8",
                          color: cfg.buttonTextColor || "#ffffff",
                          borderRadius: "8px",
                        }}
                        href={meetingLink}
                      >
                        Join Online Interview
                      </Button>
                    </Column>
                  </Row>
                )}
              </Section>

              <Hr className="border-border m-0" />

              {/* Interview Details Section */}
              <Section className="p-8 bg-muted/30 text-left">
                <Heading className="m-0 mb-4 font-serif font-bold text-lg text-foreground text-left">
                  Interview Details 📍
                </Heading>
                {interviewDate && (
                  <Text className="m-0 mb-2 text-sm text-foreground text-left">
                    📅 <strong>Date:</strong> {interviewDate}
                  </Text>
                )}
                {interviewTime && (
                  <Text className="m-0 mb-2 text-sm text-foreground text-left">
                    ⏰ <strong>Time:</strong> {interviewTime}
                  </Text>
                )}
                {location && (
                  <Text className="m-0 mb-2 text-sm text-foreground text-left">
                    📍 <strong>Location / Venue:</strong> {location}
                  </Text>
                )}
                {instructions && (
                  <Text className="m-0 mt-3 text-sm text-muted-foreground text-left leading-6">
                    📝 <strong>Instructions:</strong> {instructions}
                  </Text>
                )}
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

export default InterviewEmail;
