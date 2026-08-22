import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Send, Palette, ExternalLink } from "lucide-react";
import { getEmailConfig } from "@/lib/emailConfig";
import { sendAnnouncementEmail } from "@/lib/emailService";

export function SendEmail() {
  const [loading, setLoading] = useState(false);
  const emailConfig = getEmailConfig();
  const [formData, setFormData] = useState({
    to: "",
    subject: `Announcement from ${emailConfig.brandName || "MLSA CFD"}`,
    message: "",
  });

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendAnnouncementEmail({
        to: formData.to,
        title: formData.subject,
        message: formData.message,
      });

      toast.success("Email sent successfully!");

      setFormData({
        to: "",
        subject: `Announcement from ${emailConfig.brandName || "MLSA CFD"}`,
        message: "",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start px-2 py-4">
      {/* Header Section */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight font-recoleta text-left mb-1"
            style={{
              backgroundImage: "linear-gradient(45deg,#2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Compose & Send Email
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-left">
            Send announcement emails with customized branding, colors, and layout.
          </p>
        </div>

        <Link to="/settings">
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
            <Palette className="size-4 text-primary" />
            Customize Template
          </Button>
        </Link>
      </div>

      {/* Email Form */}
      <div className="w-full max-w-3xl">
        <Card className="rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-xs">
          <CardHeader className="text-left">
            <CardTitle className="text-xl font-bold">Email Details</CardTitle>
            <CardDescription>
              Emails will be sent using your current template branding (
              <span className="font-semibold text-foreground">{emailConfig.brandName}</span>, colors, and logo).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-5 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs font-semibold">
                  Recipient Email(s)
                </Label>
                <Input
                  id="to"
                  placeholder="recipient@example.com, member2@example.com"
                  type="text"
                  required
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter single email address or comma-separated emails.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold">
                  Subject Line
                </Label>
                <Input
                  id="subject"
                  placeholder="Email Subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold">
                  Message Content
                </Label>
                <Textarea
                  id="message"
                  placeholder="Write your email body here..."
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[180px] resize-y text-sm"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground">
                  Paragraph breaks and spacing are preserved in the final HTML email.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    <strong>Active Brand:</strong> {emailConfig.brandName}
                  </span>
                  <span>
                    <strong>Sender:</strong> {emailConfig.senderName || emailConfig.brandName}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className="size-3 rounded-full border border-black/10 inline-block"
                    style={{ backgroundColor: emailConfig.primaryColor }}
                  />
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Theme Color: {emailConfig.primaryColor}
                  </span>
                  <Link
                    to="/settings"
                    className="text-xs text-primary underline ml-auto inline-flex items-center gap-1"
                  >
                    Change in Settings <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 cursor-pointer font-semibold"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SendEmail;
