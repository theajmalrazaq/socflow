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

interface CertificateEmailProps {
  recipientName?: string;
  eventName?: string;
  eventDate?: string;
  certificateUrl?: string;
  position?: string;
  hasAttachment?: boolean;
  config?: any;
}

export const CertificateEmail = ({
  recipientName,
  eventName,
  eventDate,
  certificateUrl,
  position,
  hasAttachment,
  config = {},
}: CertificateEmailProps) => {
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
          <Preview>Your Certificate from {cfg.brandName || "Society"} - {eventName ?? "Event"}</Preview>
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
                    alt="Certificate Achievement"
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  Congratulations, {recipientName}! 🎉
                </Heading>

                <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                  Your achievement certificate is ready - {cfg.brandName || "Society"}
                </Text>

                <Text className="text-base text-foreground leading-7 mb-6 text-left">
                  We're thrilled to present you with your certificate of{" "}
                  {position ? `${position} place in` : "participation for"} <strong>{eventName}</strong>{" "}
                  held on {eventDate}. Your dedication and effort have been truly remarkable! 🌟
                </Text>
                {hasAttachment && (
                  <div
                    className="p-4 rounded-lg mb-6 border"
                    style={{
                      backgroundColor: `${cfg.primaryColor}10`,
                      borderColor: `${cfg.primaryColor}30`,
                    }}
                  >
                    <Text className="text-sm text-foreground font-medium m-0 text-left">
                      📎 Your certificate is attached to this email
                    </Text>
                    <Text className="text-xs text-muted-foreground m-0 mt-1 text-left">
                      Please check your email attachments to download your certificate
                    </Text>
                  </div>
                )}
                {cfg.websiteUrl && (
                  <Row>
                    <Column align="left">
                      <Button
                        className="w-full block text-sm border border-zinc-200 border-solid py-[12px] text-center font-semibold"
                        style={{
                          backgroundColor: "#ffffff",
                          color: cfg.textColor || "#18181b",
                          borderRadius: "8px",
                        }}
                        href={baseUrl}
                      >
                        Visit Website
                      </Button>
                    </Column>
                  </Row>
                )}
              </Section>

              <Hr className="border-border m-0" />

              {/* Achievement Section */}
              <Section className="p-8 bg-muted/30 text-left">
                <Heading className="m-0 mb-3 font-serif font-bold text-lg text-foreground text-left">
                  {position ? `🏆 ${position} Place Achievement` : "Your Achievement"}
                </Heading>
                <Text className="m-0 mb-4 text-sm text-muted-foreground leading-6 text-left">
                  {position
                    ? `Exceptional performance! You've earned ${position} place among all participants. Keep up the amazing work!`
                    : "Thank you for your active participation and contribution. We hope you gained valuable knowledge and experience."}
                </Text>
              </Section>

              <Hr className="border-border m-0" />

              {/* Share Section */}
              {(cfg.linkedinUrl || cfg.instagramUrl || cfg.twitterUrl) && (
                <>
                  <Section className="p-8 text-left">
                    <Heading className="m-0 mb-6 font-serif font-bold text-xl text-foreground text-left">
                      Share Your Achievement 📢
                    </Heading>

                    <Text className="m-0 mb-4 text-sm text-muted-foreground text-left">
                      Don't forget to share your certificate on social media and tag us!
                    </Text>

                    {[
                      { title: "LinkedIn", icon: "💼", desc: "Share with professionals", href: cfg.linkedinUrl },
                      { title: "Instagram", icon: "📸", desc: "Show your achievement", href: cfg.instagramUrl },
                      { title: "Twitter", icon: "🐦", desc: "Tweet your success", href: cfg.twitterUrl },
                    ]
                      .filter((item) => Boolean(item.href))
                      .map((item) => (
                        <Row key={item.title} className="mb-4">
                          <Column className="w-[36px] pr-3 align-top">
                            <Section
                              className="w-8 h-8 border"
                              style={{
                                backgroundColor: `${cfg.primaryColor}15`,
                                borderColor: `${cfg.primaryColor}30`,
                                borderRadius: "8px",
                              }}
                            >
                              <Row>
                                <Column align="center" valign="middle">
                                  <Text className="text-base leading-8 m-0">{item.icon}</Text>
                                </Column>
                              </Row>
                            </Section>
                          </Column>
                          <Column className="align-top">
                            <Text className="m-0 font-bold text-xs text-foreground mb-0.5 text-left">
                              {item.title}
                            </Text>
                            <Text className="m-0 text-[10px] text-muted-foreground leading-3 text-left">
                              {item.desc}
                            </Text>
                          </Column>
                        </Row>
                      ))}
                  </Section>
                  <Hr className="border-border m-0" />
                </>
              )}

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

export default CertificateEmail;
