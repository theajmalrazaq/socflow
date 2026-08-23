import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Row,
  Column,
  Font,
  Button,
  Img,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";
import { DEFAULT_EMAIL_CONFIG } from "../src/lib/emailConfig";

export const AnnouncementEmail = ({ title, message, config = {} }) => {
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
            webFont={{ url: "https://nmanumr.com/fonts/Recoleta-Regular.woff2", format: "woff2" }}
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
          <Preview>{title ? `${title} - ${cfg.brandName || "Announcement"}` : `Announcement from ${cfg.brandName || "Society"}`}</Preview>
          <Container className="mx-auto w-full max-w-[600px] p-0">
            <Section
              className="rounded-xl border border-border"
              style={{ backgroundColor: cfg.cardBackgroundColor || "#ffffff" }}
            >
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
                    alt="Banner"
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  {title || "Announcement"} 📢
                </Heading>

                {cfg.brandName && (
                  <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                    {cfg.brandName}
                  </Text>
                )}

                <Text className="text-base text-foreground leading-7 mb-6 text-left whitespace-pre-wrap">
                  {message || ""}
                </Text>

                {cfg.websiteUrl && (
                  <Row className="mb-3">
                    <Column align="left">
                      <Button
                        className="w-full block text-sm py-[12px] text-center font-semibold"
                        style={{
                          backgroundColor: cfg.primaryColor || "#2A43F8",
                          color: cfg.buttonTextColor || "#ffffff",
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

              {/* Secondary Section */}
              <Section className="p-8 bg-muted/30 text-left">
                <Heading className="m-0 mb-3 font-serif font-bold text-lg text-foreground text-left">
                  Stay Updated 🔔
                </Heading>
                <Text className="m-0 mb-4 text-sm text-muted-foreground leading-6 text-left">
                  Keep an eye on your inbox for more updates and announcements from {cfg.brandName || "our team"}. Follow us on social media to stay connected with our community!
                </Text>
              </Section>

              <Hr className="border-border m-0" />

              {/* Footer */}
              <Section className="p-8 text-left">
                {(cfg.instagramUrl || cfg.linkedinUrl || cfg.twitterUrl || cfg.websiteUrl) && (
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
                )}

                <Text className="text-xs text-muted-foreground m-0 text-left">
                  {cfg.footerCopyright || `© ${new Date().getFullYear()} ${cfg.brandName || "Society"}. All rights reserved.`}
                </Text>

                <Text className="text-xs text-muted-foreground mt-2 text-left">
                  {cfg.footerDisclaimer ||
                    (cfg.supportEmail
                      ? `This is an automated email sent by the ${cfg.brandName || "Society"} management system. If you find any mistake, please report at ${cfg.supportEmail}.`
                      : `This is an automated email sent by the ${cfg.brandName || "Society"} management system.`)}
                </Text>

                {cfg.supportEmail && (
                  <Text className="text-xs text-muted-foreground mt-1 text-left">
                    Contact:{" "}
                    <Link href={`mailto:${cfg.supportEmail}`} className="text-foreground underline">
                      {cfg.supportEmail}
                    </Link>
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

export default AnnouncementEmail;
