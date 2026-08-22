import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  User,
  Link,
  Image,
  Trophy,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mail,
  Loader,
} from "lucide-react";
import { sendBulkEmails } from "@/lib/emailService.jsx";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function NewEvent() {
  const navigateto = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;
  const descriptionRef = useRef(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(undefined);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("AM");
  const [speaker, setspeaker] = useState("");
  const [linkPrimary, setLinkPrimary] = useState("");
  const [linkSecondary, setLinkSecondary] = useState("");
  const [linkOneText, setLinkOneText] = useState("");
  const [linkTwoText, setLinkTwoText] = useState("");
  const [location, setLocation] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [description, setDescription] = useState("");
  const [iscomepition, setiscompetition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Email Announcement State
  const [sendEmail, setSendEmail] = useState(false);
  const [customRecipients, setCustomRecipients] = useState("");
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const applyFormat = (command) => {
    const el = descriptionRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = description.slice(0, start);
    const selected = description.slice(start, end);
    const after = description.slice(end);

    let newVal = description;
    let cursor = end;

    switch (command) {
      case "bold":
        newVal = `${before}**${selected || "bold text"}**${after}`;
        cursor = start + 2 + (selected ? selected.length : 9);
        break;
      case "italic":
        newVal = `${before}_${selected || "italic text"}_${after}`;
        cursor = start + 1 + (selected ? selected.length : 11);
        break;
      case "underline":
        newVal = `${before}<u>${selected || "underlined text"}</u>${after}`;
        cursor = start + 3 + (selected ? selected.length : 15);
        break;
      case "insertUnorderedList": {
        const lines = (selected || "List item").split("\n");
        const items = lines.map((l) => `- ${l}`).join("\n");
        newVal = `${before}${items}${after}`;
        cursor = before.length + items.length;
        break;
      }
      case "insertOrderedList": {
        const lines = (selected || "List item").split("\n");
        const items = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
        newVal = `${before}${items}${after}`;
        cursor = before.length + items.length;
        break;
      }
      default:
        return;
    }

    setDescription(newVal);
    setTimeout(() => {
      try {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      } catch {}
    }, 0);
  };

  const formatTime = () => {
    if (!hour || !minute) return "";
    const h24 =
      period === "PM" && hour !== "12"
        ? String(parseInt(hour) + 12).padStart(2, "0")
        : period === "AM" && hour === "12"
          ? "00"
          : hour.padStart(2, "0");
    return `${h24}:${minute}`;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formattedTime = formatTime();
      const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

      const { error } = await supabase
        .from("events")
        .insert([
          {
            title: title || null,
            date: formattedDate,
            time: formattedTime || null,
            link_primary: linkPrimary || null,
            linkone_text: linkOneText || null,
            link_secondary: linkSecondary || null,
            linktwo_text: linkTwoText || null,
            location: location || null,
            img_url: imgUrl || null,
            description: description || null,
            speaker: speaker || null,
            is_competition: iscomepition || false,
          },
        ])
        .select();

      if (error) {
        throw error;
      } else {
        if (sendEmail) {
          try {
            const { data: members, error: memberError } = await supabase
              .from("members")
              .select("nu_email, name")
              .eq("status", true);

            if (memberError) throw memberError;

            const recipients = members.map((m) => ({
              email: m.nu_email,
              name: m.name,
            }));

            if (customRecipients) {
              const customs = customRecipients.split(",").flatMap((e) => {
                const trimmed = e.trim();
                return trimmed ? [trimmed] : [];
              });
              customs.forEach((email) => {
                recipients.push({ email, name: "Guest" });
              });
            }

            if (recipients.length > 0) {
              toast.info("Sending announcement emails...");
              await sendBulkEmails({
                recipients,
                subject: `${iscomepition ? "New Competition" : "New Event"} - ${title}`,
                templateName: "event",
                templateProps: (recipient) => ({
                  recipientName: recipient.name,
                  eventTitle: title,
                  eventDescription: description,
                  eventDate: formattedDate,
                  eventTime: formattedTime,
                  eventLocation: location,
                  eventImage: imgUrl,
                  registrationLink: linkPrimary,
                  isCompetition: iscomepition,
                }),
                onProgress: (current, total) => {
                  setSendingProgress({ current, total });
                },
              });
              toast.success("Announcement emails sent!");
            }
          } catch (emailErr) {
            console.error("Failed to send emails:", emailErr);
            toast.error("Event created but failed to send emails.");
          }
        }

        setTitle("");
        setDate(undefined);
        setHour("");
        setMinute("");
        setPeriod("AM");
        setLinkPrimary("");
        setLinkSecondary("");
        setLinkOneText("");
        setLinkTwoText("");
        setLocation("");
        setImgUrl("");
        setDescription("");
        setspeaker("");
        setiscompetition(false);

        toast(
          <div>
            <strong>Event Posted Successfully!</strong>
            <div>
              Your event has been scheduled and published
              <button
                onClick={() => navigateto("/events")}
                className="underline text-sm ml-2 leading-none hover:opacity-80 transition-opacity cursor-pointer"
              >
                View
              </button>
            </div>
          </div>,
        );
      }
    } catch {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Event failed to post. Please try again.</div>
        </div>,
      );
    }

    setLoading(false);
  };

  const handleConfirmSubmit = () => {
    handleSubmit();
    setIsDialogOpen(false);
  };

  return (
    <>
      {access === "Y29udGVudF9vbmx5" || access === "RnVsbA==" ? (
        <div className="w-full flex flex-col items-start px-2 py-4">
          {/* Header Section */}
          <div className="relative w-full flex flex-col mb-8">
            <div
              className="absolute top-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(45deg, #2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
              }}
            />

            <div className="w-full relative flex items-start flex-col justify-start z-10 py-4">
              <div className="flex items-center gap-3 mb-4">
                <h2
                  className="text-4xl sm:text-5xl font-extrabold text-left font-recoleta"
                  style={{
                    backgroundImage: "linear-gradient(45deg,#2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Schedule New Event
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 text-left">
                Create and publish events that inspire your community
              </p>
            </div>
          </div>

          {}
          <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full max-w-4xl">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-6">
                {}
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-600/5 border border-purple-600/20">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    <div>
                      <label htmlFor="competition" className="font-semibold text-sm">
                        Competition Event
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable if this is a competitive event
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="competition"
                    checked={iscomepition}
                    onCheckedChange={setiscompetition}
                  />
                </div>

                {}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Event Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter event title"
                    className="h-11 bg-background/60"
                    required
                  />
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Event Date *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!date}
                          className={cn(
                            "h-11 w-full justify-start bg-background/60 text-left font-normal",
                            "data-[empty=true]:text-muted-foreground",
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateCalendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          captionLayout="dropdown"
                          startMonth={new Date(2020, 0)}
                          endMonth={new Date(2030, 11)}
                          defaultMonth={date || new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Event Time *
                    </label>
                    <div className="flex gap-2">
                      <Select value={hour} onValueChange={setHour}>
                        <SelectTrigger className="h-11 bg-background/60">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={minute} onValueChange={setMinute}>
                        <SelectTrigger className="h-11 bg-background/60">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutes.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="h-11 w-24 bg-background/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Speaker
                    </label>
                    <Input
                      value={speaker}
                      onChange={(e) => setspeaker(e.target.value)}
                      placeholder="Speaker name"
                      className="h-11 bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Location
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Event location"
                      className="h-11 bg-background/60"
                    />
                  </div>
                </div>

                {}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Link className="w-4 h-4 text-primary" />
                      Primary Link
                    </label>
                    <Input
                      value={linkPrimary}
                      onChange={(e) => setLinkPrimary(e.target.value)}
                      placeholder="https://example.com/register"
                      className="h-11 bg-background/60"
                      type="url"
                    />
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground block mb-1">
                        Primary Link Text
                      </label>
                      <Input
                        value={linkOneText}
                        onChange={(e) => setLinkOneText(e.target.value)}
                        placeholder="Button text (e.g., Register)"
                        className="h-9 bg-background/50"
                        type="text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Link className="w-4 h-4 text-primary" />
                      Secondary Link
                    </label>
                    <Input
                      value={linkSecondary}
                      onChange={(e) => setLinkSecondary(e.target.value)}
                      placeholder="https://example.com/info"
                      className="h-11 bg-background/60"
                      type="url"
                    />
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground block mb-1">
                        Secondary Link Text
                      </label>
                      <Input
                        value={linkTwoText}
                        onChange={(e) => setLinkTwoText(e.target.value)}
                        placeholder="Button text (e.g., Learn More)"
                        className="h-9 bg-background/50"
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                {}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Image className="w-4 h-4 text-primary" />
                    Event Image URL
                  </label>
                  <Input
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="h-11 bg-background/60"
                    type="url"
                  />
                  {imgUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={imgUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Description</label>

                  {}
                  <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-background/80 border border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat("bold")}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat("italic")}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat("underline")}
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-8 bg-border/50 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat("insertUnorderedList")}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat("insertOrderedList")}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                  </div>

                  {}
                  <Textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event..."
                    className="min-h-[200px] p-4 rounded-lg bg-background/60 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar above to format your description
                  </p>
                </div>

                {/* Email Announcement Section */}
                <div className="p-4 rounded-lg bg-blue-600/5 border border-blue-600/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <label htmlFor="sendEmail" className="font-semibold text-sm">
                          Send Announcement Email
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Notify members about this event via email
                        </p>
                      </div>
                    </div>
                    <Switch id="sendEmail" checked={sendEmail} onCheckedChange={setSendEmail} />
                  </div>

                  {sendEmail && (
                    <div className="space-y-4 pt-2 border-t border-blue-600/10">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Recipients</label>
                        <p className="text-xs text-muted-foreground">
                          Email will be sent to all active members
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Additional Recipients (Optional)
                        </label>
                        <Input
                          value={customRecipients}
                          onChange={(e) => setCustomRecipients(e.target.value)}
                          placeholder="email1@example.com, email2@example.com"
                          className="h-11 bg-background/60"
                        />
                        <p className="text-xs text-muted-foreground">
                          Comma separated email addresses
                        </p>
                      </div>

                      {sendingProgress.total > 0 && (
                        <div className="text-sm text-blue-500 font-medium">
                          Sending emails: {sendingProgress.current} / {sendingProgress.total}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigateto("/events")}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </span>
                    ) : (
                      "Schedule Event"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-6 md:px-8 py-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                * Required fields. Fill in the details and click Schedule Event to publish.
              </div>
            </CardFooter>
          </Card>

          {}
          <div className="w-full mt-12 text-center">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              Made With
              <Heart className="mx-1 w-4 fill-orange-600 animate-pulse" />
              <a
                href="https://theajmalrazaq.github.io"
                target="_blank"
                className="text-orange-600 font-mono font-bold uppercase hover:underline ml-1"
                rel="noreferrer"
              >
                Ajmal Razaq Bhatti
              </a>
            </div>
          </div>

          {}
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent className="overflow-hidden">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to schedule this event? It will be published immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmSubmit}
                  className="bg-linear-to-r from-[#2A43F8] to-[#4482ff]"
                >
                  Confirm & Schedule
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        navigateto("/nopermission")
      )}
    </>
  );
}

export default NewEvent;
