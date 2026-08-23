import { useState, useEffect, useRef, useMemo } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Trophy,
  Search,
  Filter,
  ChevronDown,
  Loader,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Mail,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sendBulkEmails } from "@/lib/emailService.jsx";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/layout/Loading";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { canViewRegistrations, hasPermission } from "@/lib/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";

import {
  useEventsQuery,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "@/hooks/queries/useEvents";
import { useEventsPageStore } from "@/stores/useEventsPageStore";

export function Events() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  const {
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    selectedEvent,
    setSelectedEvent,
    eventToDelete,
    setEventToDelete,
    isCreateOpen,
    setIsCreateOpen,
    createStep,
    setCreateStep,
    createLoading,
    setCreateLoading,
  } = useEventsPageStore();

  const eventsPerPage = 10;
  const locationRoute = useLocation();

  const { data: eventsData, isLoading: loading } = useEventsQuery({
    page,
    limit: eventsPerPage,
  });
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();

  const events = eventsData?.events || [];

  // Edit Event State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [linkPrimary, setLinkPrimary] = useState("");
  const [linkSecondary, setLinkSecondary] = useState("");
  const [linkOneText, setLinkOneText] = useState("");
  const [linkTwoText, setLinkTwoText] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [location, setLocation] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isCompetition, setIsCompetition] = useState(false);

  // Create Event Popup State
  const [createTitle, setCreateTitle] = useState("");
  const [createDate, setCreateDate] = useState(undefined);
  const [createHour, setCreateHour] = useState("");
  const [createMinute, setCreateMinute] = useState("");
  const [createPeriod, setCreatePeriod] = useState("AM");
  const [createSpeaker, setCreateSpeaker] = useState("");
  const [createLinkPrimary, setCreateLinkPrimary] = useState("");
  const [createLinkSecondary, setCreateLinkSecondary] = useState("");
  const [createLinkOneText, setCreateLinkOneText] = useState("");
  const [createLinkTwoText, setCreateLinkTwoText] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createImgUrl, setCreateImgUrl] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createIsCompetition, setCreateIsCompetition] = useState(false);
  const [createSendEmail, setCreateSendEmail] = useState(false);
  const [createCustomRecipients, setCreateCustomRecipients] = useState("");
  const [createSendingProgress, setCreateSendingProgress] = useState({ current: 0, total: 0 });
  const createDescriptionRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(locationRoute.search);
    if (params.get("new") === "true") {
      setIsCreateOpen(true);
    }
  }, [locationRoute.search, setIsCreateOpen]);

  // Granular loading states
  const updatingEventId = updateEventMutation.isPending ? selectedEvent?.id : null;
  const deletingId = deleteEventMutation.isPending ? eventToDelete?.id : null;

  // Time picker states
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("AM");

  // Time picker options
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // Helper function to format time for database (HH:MM in 24-hour format)
  const formatTime = (hour, minute, period) => {
    if (!hour || !minute) return "";
    const h24 =
      period === "PM" && hour !== "12"
        ? String(parseInt(hour) + 12).padStart(2, "0")
        : period === "AM" && hour === "12"
          ? "00"
          : hour.padStart(2, "0");
    return `${h24}:${minute}`;
  };

  // Helper function to parse time from database (HH:MM 24-hour) to picker states
  const parseTime = (timeString) => {
    if (!timeString) return { hour: "", minute: "", period: "AM" };
    const [h24, m] = timeString.split(":");
    const hourNum = parseInt(h24);
    const hour12 =
      hourNum === 0
        ? "12"
        : hourNum > 12
          ? String(hourNum - 12).padStart(2, "0")
          : String(hourNum).padStart(2, "0");
    const period = hourNum >= 12 ? "PM" : "AM";
    return { hour: hour12, minute: m, period };
  };

  const handleUpdate = async () => {
    const formattedTime = formatTime(hour, minute, period);
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

    try {
      await updateEventMutation.mutateAsync({
        id: String(selectedEvent.id),
        title: title || null,
        date: formattedDate,
        time: formattedTime || null,
        speaker: speaker || null,
        link_primary: linkPrimary || null,
        linkone_text: linkOneText || null,
        link_secondary: linkSecondary || null,
        linktwo_text: linkTwoText || null,
        location: location || null,
        img_url: imgUrl || null,
        description: description || null,
        is_competition: isCompetition || false,
      });
      setSelectedEvent(null);
    } catch {}
  };

  const deleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEventMutation.mutateAsync(String(eventToDelete.id));
      setEventToDelete(null);
    } catch {}
  };

  const applyCreateFormat = (command) => {
    const el = createDescriptionRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = createDescription.slice(0, start);
    const selected = createDescription.slice(start, end);
    const after = createDescription.slice(end);

    let newVal = createDescription;
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

    setCreateDescription(newVal);
    setTimeout(() => {
      try {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      } catch {}
    }, 0);
  };

  const handleCreateEvent = async () => {
    setCreateLoading(true);
    try {
      const formattedTime = formatTime(createHour, createMinute, createPeriod);
      const formattedDate = createDate ? format(createDate, "yyyy-MM-dd") : null;

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: createTitle || null,
            date: formattedDate,
            time: formattedTime || null,
            link_primary: createLinkPrimary || null,
            linkone_text: createLinkOneText || null,
            link_secondary: createLinkSecondary || null,
            linktwo_text: createLinkTwoText || null,
            location: createLocation || null,
            img_url: createImgUrl || null,
            description: createDescription || null,
            speaker: createSpeaker || null,
            is_competition: createIsCompetition || false,
          },
        ])
        .select();

      if (error) throw error;

      if (createSendEmail) {
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

          if (createCustomRecipients) {
            const customs = createCustomRecipients.split(",").flatMap((e) => {
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
              subject: `${createIsCompetition ? "New Competition" : "New Event"} - ${createTitle}`,
              templateName: "event",
              templateProps: (recipient) => ({
                recipientName: recipient.name,
                eventTitle: createTitle,
                eventDescription: createDescription,
                eventDate: formattedDate,
                eventTime: formattedTime,
                eventLocation: createLocation,
                eventImage: createImgUrl,
                registrationLink: createLinkPrimary,
                isCompetition: createIsCompetition,
              }),
              onProgress: (current, total) => {
                setCreateSendingProgress({ current, total });
              },
            });
            toast.success("Announcement emails sent!");
          }
        } catch (emailErr) {
          console.error("Failed to send emails:", emailErr);
          toast.error("Event created but failed to send emails.");
        }
      }

      if (data && data[0]) {
        setEvents((prev) => [data[0], ...prev]);
        setFilteredResponses((prev) => [data[0], ...prev]);
      }

      setCreateTitle("");
      setCreateDate(undefined);
      setCreateHour("");
      setCreateMinute("");
      setCreatePeriod("AM");
      setCreateLinkPrimary("");
      setCreateLinkSecondary("");
      setCreateLinkOneText("");
      setCreateLinkTwoText("");
      setCreateLocation("");
      setCreateImgUrl("");
      setCreateDescription("");
      setCreateSpeaker("");
      setCreateIsCompetition(false);
      setCreateSendEmail(false);
      setCreateCustomRecipients("");
      setCreateStep(1);
      setIsCreateOpen(false);

      toast(
        <div>
          <strong>Event Scheduled Successfully!</strong>
          <div>Your new event has been created and published.</div>
        </div>,
      );
    } catch {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Event failed to post. Check your input and try again.</div>
        </div>,
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleNextStep = () => {
    if (createStep === 1) {
      if (!createTitle.trim()) {
        toast.error("Please enter an event title");
        return;
      }
      if (!createDate) {
        toast.error("Please pick an event date");
        return;
      }
      if (!createHour || !createMinute) {
        toast.error("Please select event time (hour & minute)");
        return;
      }
    }
    setCreateStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (events.length === eventsPerPage) setPage(page + 1);
  };

  const filteredResponses = useMemo(() => {
    const q = (search || "").toLowerCase();
    let result = events;

    if (statusFilter === "competition") {
      result = result.filter((e) => e.is_competition);
    } else if (statusFilter === "non_competition") {
      result = result.filter((e) => !e.is_competition);
    }

    if (q) {
      result = result.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.speaker || "").toLowerCase().includes(q) ||
          (e.location || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [search, events, statusFilter]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-start px-2 py-4"
        >
          {/* Search & Actions Bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:w-80 md:w-96 max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search events, speaker or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {}
              <div className="flex items-center mr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 gap-2 inline-flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {statusFilter === "all"
                        ? "Filter"
                        : statusFilter === "competition"
                          ? "Competition"
                          : "Non-Competition"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter Events</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("all");
                        setPage(0);
                      }}
                    >
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("competition");
                        setPage(0);
                      }}
                    >
                      Competition
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("non_competition");
                        setPage(0);
                      }}
                    >
                      Non-Competition
                    </DropdownMenuItem>
                    {}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {hasPermission(access, "events", "createEvent") && (
                <Button
                  size="lg"
                  className="h-11 gap-2 w-full md:w-auto"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Event
                </Button>
              )}
            </div>
          </div>

          {/* List of Events */}
          <div className="w-full">
            {filteredResponses.length === 0 ? (
              <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <CardContent className="py-16">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold text-muted-foreground mb-2">
                      No events found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? "Try adjusting your search"
                        : "Get started by creating your first event"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <ul className="divide-y divide-border/50">
                  {filteredResponses.map((event, idx) => (
                    <li
                      key={event.id}
                      className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                    >
                      {/* Left Badge - Date or Index */}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-lg bg-white/95 text-black flex items-center justify-center font-bold text-xl border border-border/30">
                          {event.date ? new Date(event.date).getDate() : idx + 1}
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                            {event.title}
                          </h3>
                          {event.is_competition && (
                            <div className="ml-1 px-2 py-0.5 rounded-full bg-purple-600/10 text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-600/20">
                              <Trophy className="w-3 h-3" />
                              Competition
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                          {event.speaker && (
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate">{event.speaker}</span>
                            </div>
                          )}
                          {event.date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {event.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p
                            className="text-sm text-muted-foreground line-clamp-2 mt-3"
                            dangerouslySetInnerHTML={{
                              __html: event.description,
                            }}
                          />
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {canViewRegistrations(access) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[100px]"
                              onClick={() =>
                                navigate(`/events/details`, {
                                  state: {
                                    event_id: event.id,
                                    event_name: event.title,
                                    is_competition: event.is_competition,
                                    permissions: access,
                                  },
                                })
                              }
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Registrations
                            </Button>
                          )}

                          {hasPermission(access, "events", "editEvent") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[100px]"
                              onClick={() => {
                                setSelectedEvent(event);
                                setTitle(event.title || "");
                                setDate(event.date ? new Date(event.date) : undefined);

                                // Parse time for time picker
                                const parsedTime = parseTime(event.time);
                                setHour(parsedTime.hour);
                                setMinute(parsedTime.minute);
                                setPeriod(parsedTime.period);

                                setSpeaker(event.speaker || "");
                                setLinkPrimary(event.link_primary || "");
                                setLinkSecondary(event.link_secondary || "");
                                setLinkOneText(event.linkone_text || "");
                                setLinkTwoText(event.linktwo_text || "");
                                setLocation(event.location || "");
                                setImgUrl(event.img_url || "");
                                setDescription(event.description || "");
                                setIsCompetition(event.is_competition || false);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          )}

                          {hasPermission(access, "events", "deleteEvent") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[100px] text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setEventToDelete(event)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="shrink-0 text-right w-24">
                        <div className="text-xs text-muted-foreground">Registrations</div>
                        <div className="text-2xl font-bold">{event.responseCount ?? 0}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {}
            {filteredResponses.length > 0 && (
              <div className="fixed bottom-6 right-8 z-30 pointer-events-auto">
                <div className="inline-flex items-center gap-3 rounded-full bg-background/85 backdrop-blur-2xl border border-border/80 px-4 py-2.5 shadow-xl text-xs text-muted-foreground transition-all duration-200 hover:shadow-2xl">
                  <span>
                    Showing{" "}
                    <strong className="text-foreground font-semibold">
                      {page * eventsPerPage + 1} - {page * eventsPerPage + events.length}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground font-semibold">
                      {filteredResponses.length}
                    </strong>{" "}
                    events
                  </span>
                  <div className="flex items-center gap-1 border-l border-border/60 pl-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full hover:bg-accent"
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full hover:bg-accent"
                      onClick={handleNextPage}
                      disabled={events.length < eventsPerPage}
                    >
                      <ChevronRight className="size-3.5" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <Dialog
            open={Boolean(selectedEvent)}
            onOpenChange={(open) => !open && setSelectedEvent(null)}
          >
            {selectedEvent && (
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>Update the details of the event.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event Title"
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!date}
                          className={cn(
                            "w-full justify-start text-left font-normal",
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
                    <label className="text-sm font-medium">Event Time</label>
                    <div className="flex gap-2">
                      <Select value={hour} onValueChange={setHour}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="Speaker"
                    />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      value={linkPrimary}
                      onChange={(e) => setLinkPrimary(e.target.value)}
                      placeholder="Primary Link"
                    />
                    <Input
                      value={linkOneText}
                      onChange={(e) => setLinkOneText(e.target.value)}
                      placeholder="Primary Link Button Text"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      value={linkSecondary}
                      onChange={(e) => setLinkSecondary(e.target.value)}
                      placeholder="Secondary Link"
                    />
                    <Input
                      value={linkTwoText}
                      onChange={(e) => setLinkTwoText(e.target.value)}
                      placeholder="Secondary Link Button Text"
                      className="text-sm"
                    />
                  </div>

                  <Input
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="Image URL"
                  />
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCompetition"
                      checked={isCompetition}
                      onChange={(e) => setIsCompetition(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="isCompetition" className="text-sm font-medium">
                      Is Competition
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleUpdate}
                    disabled={updatingEventId === selectedEvent.id}
                    className="bg-green-700 text-white hover:bg-green-800"
                  >
                    {updatingEventId === selectedEvent.id ? (
                      <span className="flex items-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>

          {}
          <AlertDialog
            open={Boolean(eventToDelete)}
            onOpenChange={(open) => !open && setEventToDelete(null)}
          >
            {eventToDelete && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete!!</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete the Event and its Registrations
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteEvent}
                    disabled={deletingId === eventToDelete.id}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deletingId === eventToDelete.id ? (
                      <span className="flex items-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>

          {/* Multi-Step Create Event Modal Dialog */}
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) setCreateStep(1);
            }}
          >
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader className="pr-12">
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    Schedule New Event
                  </DialogTitle>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
                    Step {createStep} of 4
                  </span>
                </div>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Follow the steps below to set up, format, and publish your new society event.
                </DialogDescription>
              </DialogHeader>

              {/* Step Navigation Bar */}
              <div className="flex items-center gap-6 border-b border-border/40 pb-4 mb-3 overflow-x-auto">
                {[
                  { step: 1, label: "Basic Info" },
                  { step: 2, label: "Links & Media" },
                  { step: 3, label: "Description" },
                  { step: 4, label: "Announce & Review" },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (s.step < createStep) setCreateStep(s.step);
                    }}
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium transition-all shrink-0 py-1 px-3 rounded-full",
                      createStep === s.step
                        ? "bg-foreground text-background font-semibold shadow-sm"
                        : createStep > s.step
                          ? "text-emerald-500 hover:text-emerald-400 cursor-pointer"
                          : "text-muted-foreground/70 cursor-not-allowed",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        createStep === s.step
                          ? "bg-background text-foreground"
                          : createStep > s.step
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {createStep > s.step ? "✓" : s.step}
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Step 1: Basic Info */}
              {createStep === 1 && (
                <div className="space-y-5 py-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-600/5 border border-purple-600/20">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-purple-400" />
                      <div>
                        <label htmlFor="createCompetition" className="font-semibold text-sm">
                          Competition Event
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Enable if this is a competitive event with entries
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="createCompetition"
                      checked={createIsCompetition}
                      onCheckedChange={setCreateIsCompetition}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Event Title *
                    </label>
                    <Input
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="e.g. AI & Web Development Bootcamp 2026"
                      className="h-11 bg-background/60"
                      required
                    />
                  </div>

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
                            data-empty={!createDate}
                            className={cn(
                              "h-11 w-full justify-start bg-background/60 text-left font-normal",
                              "data-[empty=true]:text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {createDate ? format(createDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateCalendar
                            mode="single"
                            selected={createDate}
                            onSelect={setCreateDate}
                            captionLayout="dropdown"
                            startMonth={new Date(2020, 0)}
                            endMonth={new Date(2030, 11)}
                            defaultMonth={createDate || new Date()}
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
                        <Select value={createHour} onValueChange={setCreateHour}>
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

                        <Select value={createMinute} onValueChange={setCreateMinute}>
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

                        <Select value={createPeriod} onValueChange={setCreatePeriod}>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Speaker
                      </label>
                      <Input
                        value={createSpeaker}
                        onChange={(e) => setCreateSpeaker(e.target.value)}
                        placeholder="e.g. Dr. Alex Vance"
                        className="h-11 bg-background/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Location
                      </label>
                      <Input
                        value={createLocation}
                        onChange={(e) => setCreateLocation(e.target.value)}
                        placeholder="e.g. Main Auditorium / Online"
                        className="h-11 bg-background/60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Links & Media */}
              {createStep === 2 && (
                <div className="space-y-5 py-2 animate-in fade-in-50 duration-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      Event Cover Image URL
                    </label>
                    <Input
                      value={createImgUrl}
                      onChange={(e) => setCreateImgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                      className="h-11 bg-background/60"
                      type="url"
                    />
                    {createImgUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-background/40 p-1">
                        <img
                          src={createImgUrl}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Link className="w-4 h-4 text-primary" />
                        Primary Link (Registration / Form)
                      </label>
                      <Input
                        value={createLinkPrimary}
                        onChange={(e) => setCreateLinkPrimary(e.target.value)}
                        placeholder="https://forms.gle/example"
                        className="h-11 bg-background/60"
                        type="url"
                      />
                      <Input
                        value={createLinkOneText}
                        onChange={(e) => setCreateLinkOneText(e.target.value)}
                        placeholder="Button text (e.g., Register Now)"
                        className="h-9 bg-background/50 text-xs mt-1"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Link className="w-4 h-4 text-primary" />
                        Secondary Link (More Info / Resource)
                      </label>
                      <Input
                        value={createLinkSecondary}
                        onChange={(e) => setCreateLinkSecondary(e.target.value)}
                        placeholder="https://docs.google.com/presentation/example"
                        className="h-11 bg-background/60"
                        type="url"
                      />
                      <Input
                        value={createLinkTwoText}
                        onChange={(e) => setCreateLinkTwoText(e.target.value)}
                        placeholder="Button text (e.g., View Guidelines)"
                        className="h-9 bg-background/50 text-xs mt-1"
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Event Description */}
              {createStep === 3 && (
                <div className="space-y-4 py-2 animate-in fade-in-50 duration-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detailed Description</label>

                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-background/80 border border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyCreateFormat("bold")}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyCreateFormat("italic")}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyCreateFormat("underline")}
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
                        onClick={() => applyCreateFormat("insertUnorderedList")}
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyCreateFormat("insertOrderedList")}
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                    </div>

                    <Textarea
                      ref={createDescriptionRef}
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Write an engaging overview of what participants will learn or experience..."
                      className="min-h-[220px] p-4 rounded-lg bg-background/60 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: You can use bold, lists, and formatted text using the toolbar above.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Announcement & Review */}
              {createStep === 4 && (
                <div className="space-y-5 py-2 animate-in fade-in-50 duration-200">
                  {/* Event Summary Preview Card */}
                  <div className="p-4 rounded-2xl bg-background/40 border border-border/50 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Event Summary Preview
                    </h4>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {createTitle || "Untitled Event"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          {createDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {format(createDate, "PPP")}
                            </span>
                          )}
                          {createHour && createMinute && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              {createHour}:{createMinute} {createPeriod}
                            </span>
                          )}
                          {createLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {createLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      {createIsCompetition && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Competition
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email Announcement Section */}
                  <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <div>
                          <label htmlFor="createSendEmail" className="font-semibold text-sm">
                            Send Announcement Email
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Automatically broadcast an announcement to active society members
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="createSendEmail"
                        checked={createSendEmail}
                        onCheckedChange={setCreateSendEmail}
                      />
                    </div>

                    {createSendEmail && (
                      <div className="space-y-3 pt-2 border-t border-blue-600/10">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">
                            Additional Recipients (Optional)
                          </label>
                          <Input
                            value={createCustomRecipients}
                            onChange={(e) => setCreateCustomRecipients(e.target.value)}
                            placeholder="email1@example.com, email2@example.com"
                            className="h-11 bg-background/60"
                          />
                        </div>
                        {createSendingProgress.total > 0 && (
                          <div className="text-sm text-blue-500 font-medium">
                            Sending emails: {createSendingProgress.current} /{" "}
                            {createSendingProgress.total}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2 pt-3 border-t border-border/40">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  {createStep > 1 && (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setCreateStep(createStep - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  {createStep < 4 ? (
                    <Button type="button" onClick={handleNextStep}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleCreateEvent} disabled={createLoading}>
                      {createLoading ? (
                        <span className="flex items-center">
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </span>
                      ) : (
                        "Schedule & Publish Event"
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {}
          <div className="w-full mt-12 text-center">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="https://socflow.app"
                target="_blank"
                className="text-foreground font-medium hover:underline ml-1"
                rel="noreferrer"
              >
                Socflow
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default Events;
