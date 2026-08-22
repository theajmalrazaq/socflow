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

interface InductionEmailProps {
  name?: string;
  deadline?: string;
  config?: any;
}

export const InductionEmail = ({
  name,
  deadline,
  config = {},
}: InductionEmailProps) => {
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
          <Preview>Inductions are Open! Join {cfg.brandName || "Our Society"}</Preview>
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
                    alt="Inductions Banner"
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  Building Tomorrow's Leaders 🚀
                </Heading>

                <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                  {cfg.brandName || "Society"} Inductions
                </Text>

                <Text className="text-sm text-foreground leading-7 mb-6 text-left">
                  {name ? `Dear ${name},` : "Hello,"}
                  <br />
                  <br />
                  We are delighted to open inductions for {cfg.brandName || "our organization"}! ✨ Join a vibrant community dedicated to fostering leadership, innovation, and impact. 💡
                </Text>

                {deadline && (
                  <div
                    className="p-4 rounded-lg mb-6 border"
                    style={{
                      backgroundColor: `${cfg.primaryColor}10`,
                      borderColor: `${cfg.primaryColor}30`,
                    }}
                  >
                    <Text className="text-sm text-foreground font-medium m-0 text-left">
                      ⏰ Last Date to Apply: {deadline}
                    </Text>
                    <Text className="text-xs text-muted-foreground m-0 mt-1 text-left">
                      Don't miss this opportunity! Submit your application before the deadline.
                    </Text>
                  </div>
                )}

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
                        Apply Now
                      </Button>
                    </Column>
                  </Row>
                )}
              </Section>

              <Hr className="border-border m-0" />

              {/* Secondary Section */}
              <Section className="p-8 bg-muted/30 text-left">
                <Heading className="m-0 mb-3 font-serif font-bold text-lg text-foreground text-left">
                  Why Join {cfg.brandName || "Us"}? 🌟
                </Heading>
                <Text className="m-0 mb-4 text-sm text-muted-foreground leading-6 text-left">
                  Get hands-on experience, organize impactful events, network with peers and experts, and accelerate your personal growth.
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

                {cfg.footerDisclaimer && (
                  <Text className="text-xs text-muted-foreground mt-2 text-left">
                    {cfg.footerDisclaimer}
                  </Text>
                )}

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

export default InductionEmail;
