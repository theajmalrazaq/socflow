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
import { DEFAULT_EMAIL_CONFIG, getEmailFontSizes } from "../src/lib/emailConfig";

interface EventEmailProps {
  recipientName?: string;
  eventTitle?: string;
  eventDescription?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventImage?: string;
  registrationLink?: string;
  isCompetition?: boolean;
  config?: any;
}

export const EventEmail = ({
  recipientName,
  eventTitle,
  eventDescription,
  eventDate,
  eventTime,
  eventLocation,
  eventImage,
  registrationLink,
  isCompetition,
  config = {},
}: EventEmailProps) => {
  const cfg = { ...DEFAULT_EMAIL_CONFIG, ...config };

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
              fontSize: getEmailFontSizes(cfg.fontSize),
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
          <Preview>{isCompetition ? "New Competition" : "New Event"} - {eventTitle ?? "Event"}</Preview>
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

                {(eventImage || cfg.bannerUrl) && (
                  <Img
                    alt={eventTitle || "Event Image"}
                    className="w-full mb-10"
                    style={{ borderRadius: "12px" }}
                    height={"auto"}
                    src={eventImage || cfg.bannerUrl}
                  />
                )}

                <Heading className="m-0 mb-2 font-serif font-bold text-2xl text-foreground tracking-tight text-left">
                  {isCompetition ? "🏆 " : "🎯 "}{eventTitle}
                </Heading>

                <Text className="m-0 mb-6 text-sm text-muted-foreground text-left">
                  {isCompetition ? "Competition Announcement" : "Event Announcement"} - {cfg.brandName || "Society"}
                </Text>

                <Text className="text-base text-foreground leading-7 mb-6 text-left">
                  Hey {recipientName || "Member"}! 👋
                  <br />
                  <br />
                  {eventDescription}
                </Text>

                <Row className="mb-3">
                  <Column align="left">
                    <Button
                      className="w-full block text-sm py-[12px] text-center font-semibold"
                      style={{
                        backgroundColor: cfg.primaryColor || "#2A43F8",
                        color: cfg.buttonTextColor || "#ffffff",
                        borderRadius: "8px",
                      }}
                      href={registrationLink || "#"}
                    >
                      {isCompetition ? "Register for Competition" : "Register Now"}
                    </Button>
                  </Column>
                </Row>
              </Section>

              <Hr className="border-border m-0" />

              {/* Event Details Section */}
              {(eventDate || eventTime || eventLocation) && (
                <>
                  <Section className="p-8 bg-muted/30 text-left">
                    <Heading className="m-0 mb-4 font-serif font-bold text-lg text-foreground text-left">
                      Event Details 📍
                    </Heading>
                    {eventDate && (
                      <Text className="m-0 mb-2 text-sm text-foreground text-left">
                        📅 <strong>Date:</strong> {eventDate}
                      </Text>
                    )}
                    {eventTime && (
                      <Text className="m-0 mb-2 text-sm text-foreground text-left">
                        ⏰ <strong>Time:</strong> {eventTime}
                      </Text>
                    )}
                    {eventLocation && (
                      <Text className="m-0 text-sm text-foreground text-left">
                        📍 <strong>Location:</strong> {eventLocation}
                      </Text>
                    )}
                  </Section>
                  <Hr className="border-border m-0" />
                </>
              )}

              {/* Footer */}
              <Section className="p-8 text-left border-t border-border">
                {(cfg.instagramUrl || cfg.linkedinUrl) && (
                  <Row className="mb-4">
                    <Column>
                      {cfg.instagramUrl && (
                        <Link
                          href={cfg.instagramUrl}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground no-underline mr-4"
                        >
                          Instagram
                        </Link>
                      )}
                      {cfg.linkedinUrl && (
                        <Link
                          href={cfg.linkedinUrl}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground no-underline"
                        >
                          LinkedIn
                        </Link>
                      )}
                    </Column>
                  </Row>
                )}

                <Text className="text-xs text-muted-foreground m-0 leading-5 text-left">
                  {cfg.footerDisclaimer || (cfg.brandName ? `This email was sent by ${cfg.brandName}.` : "This is an automated communication.")}
                </Text>

                <Text className="text-[11px] text-muted-foreground m-0 mt-3 text-left">
                  {cfg.footerCopyright || `© ${new Date().getFullYear()} ${cfg.brandName || "Society"}. All rights reserved.`}
                </Text>

                {/* Powered by Socflow */}
                <Text className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border text-left">
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

export default EventEmail;
