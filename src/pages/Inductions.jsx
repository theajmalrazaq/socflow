import { useState, useEffect } from "react";
import {
  File,
  Mail,
  Search,
  Filter,
  MessageCircle,
  Trash2,
  Check,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Heart,
  Users,
  Phone,
  GraduationCap,
  Calendar,
  Link as LinkIcon,
  MapPin,
  Loader,
} from "lucide-react";
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
import {
  sendInterviewEmail,
  sendSelectionEmail,
  sendRejectionEmail,
  sendAnnouncementEmail,
} from "@/lib/emailService.jsx";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormatDate } from "@/components/subcomponents/FormatDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/layout/Loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useOutletContext } from "react-router-dom";
import { canManageInductions } from "@/lib/permissions";

import {
  useInductionsQuery,
  useUpdateInductionStatusMutation,
  useDeleteInductionMutation,
  useBulkUpdateInductionStatusMutation,
} from "@/hooks/queries/useInductions";

export function Inductions() {
  const navigateto = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  useEffect(() => {
    if (access && !canManageInductions(access)) {
      navigateto("/no-permission");
    }
  }, [access, navigateto]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [teamsList, _setTeamsList] = useState([]);
  const [exportFilter, setExportFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [responseToView, setResponseToView] = useState(null);
  const responsesPerPage = 10;
  const [responseToDelete, setResponseToDelete] = useState(null);

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: inductionsData,
    isLoading: loading,
    isError: error,
  } = useInductionsQuery({
    page,
    limit: responsesPerPage,
    status: statusFilter,
    team: teamFilter,
    search: debouncedSearchTerm,
  });

  const updateInductionStatusMutation = useUpdateInductionStatusMutation();
  const deleteInductionMutation = useDeleteInductionMutation();
  const _bulkUpdateInductionMutation = useBulkUpdateInductionStatusMutation();

  const filteredResponses = inductionsData?.data || [];
  const totalResponses = inductionsData?.total || 0;

  // Interview Scheduling State
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState(null);
  const [interviewData, setInterviewData] = useState({
    date: undefined,
    // times from <input type="time"> as "HH:MM"
    startTime: "",
    endTime: "",
    interviewType: "online", // online or physical
    meetingLink: "",
    room: "",
    instructions: "",
  });
  const [sendingInterview, setSendingInterview] = useState(false);
  const [isBulkInterviewDialogOpen, setIsBulkInterviewDialogOpen] = useState(false);
  const [bulkInterviewData, setBulkInterviewData] = useState({
    date: undefined,
    startTime: "",
    endTime: "",
    interviewType: "online",
    meetingLink: "",
    room: "",
  });
  const [sendingBulkInterview, setSendingBulkInterview] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState({ success: [], failed: [] });
  const [bulkTarget, setBulkTarget] = useState("waiting");
  const [bulkTargetCount, setBulkTargetCount] = useState(0);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementData, setAnnouncementData] = useState({ title: "", message: "" });
  const [singleAnnouncementRecipient, setSingleAnnouncementRecipient] = useState(null);

  // New states for granular loading and bulk progress
  const updatingStatusId = updateInductionStatusMutation.isPending
    ? updateInductionStatusMutation.variables?.id
    : null;
  const updatingStatusValue = updateInductionStatusMutation.isPending
    ? updateInductionStatusMutation.variables?.status
    : undefined;
  const [processingEmailId, setProcessingEmailId] = useState(null);
  const [isBulkProgressDialogOpen, setIsBulkProgressDialogOpen] = useState(false);
  const [bulkActionTitle, setBulkActionTitle] = useState("");

  // Time picker states for single interview
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");

  // Time picker states for bulk interview
  const [bulkStartHour, setBulkStartHour] = useState("");
  const [bulkStartMinute, setBulkStartMinute] = useState("");
  const [bulkStartPeriod, setBulkStartPeriod] = useState("AM");
  const [bulkEndHour, setBulkEndHour] = useState("");
  const [bulkEndMinute, setBulkEndMinute] = useState("");
  const [bulkEndPeriod, setBulkEndPeriod] = useState("AM");

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

  const openBulkInterviewDialog = async (target = "waiting") => {
    try {
      setBulkTarget(target);
      const responses = await fetchFilteredResponses(target);
      setBulkTargetCount(Array.isArray(responses) ? responses.length : 0);
    } catch {
      setBulkTargetCount(0);
    }
    setIsBulkInterviewDialogOpen(true);
  };

  const deleteResponse = async () => {
    if (!responseToDelete) {
      toast.error("No Response Selected");
      return;
    }

    try {
      await deleteInductionMutation.mutateAsync(String(responseToDelete.id));
      setResponseToDelete(null);
    } catch {}
  };

  const updateResponseStatus = async (responseupdate, status) => {
    try {
      await updateInductionStatusMutation.mutateAsync({
        id: responseupdate.id,
        status,
      });
      setResponseToView((prev) => (prev?.id === responseupdate.id ? { ...prev, status } : prev));
    } catch {}
  };

  const fetchFilteredResponses = async (type) => {
    const { data, error } = await supabase.from("inductionResponses").select("*");

    if (error || !Array.isArray(data)) {
      return [];
    }

    let results = data;
    if (type === "selected") {
      results = results.filter((response) => response.status === true);
    } else if (type === "rejected") {
      results = results.filter((response) => response.status === false);
    } else if (type === "waiting") {
      results = results.filter((response) => response.status === null);
    }

    if (teamFilter && teamFilter !== "all") {
      results = results.filter((r) => r.team === teamFilter);
    }

    return results;
  };

  const openInterviewDialog = (candidate) => {
    setInterviewCandidate(candidate);
    setInterviewData({
      date: undefined,
      startTime: "",
      endTime: "",
      interviewType: "online",
      meetingLink: "",
      room: "",
      instructions: "",
    });
    setIsInterviewDialogOpen(true);
  };

  const handleSendInterview = async () => {
    // Format times from picker states
    const formattedStartTime = formatTime(startHour, startMinute, startPeriod);
    const formattedEndTime = formatTime(endHour, endMinute, endPeriod);

    if (!interviewData.date || !formattedStartTime || !formattedEndTime) {
      toast.error("Date, Start Time, and End Time are required");
      return;
    }

    // Validate based on interview type
    if (interviewData.interviewType === "online" && !interviewData.meetingLink) {
      toast.error("Meeting link is required for online interviews");
      return;
    }

    if (interviewData.interviewType === "physical" && !interviewData.room) {
      toast.error("Room is required for physical interviews");
      return;
    }

    setSendingInterview(true);

    try {
      // Format date for display
      const formattedDate = format(interviewData.date, "PPPP");

      // Format time range
      const timeRange = `${formattedStartTime} - ${formattedEndTime}`;

      // Determine location and meeting link based on interview type
      const location =
        interviewData.interviewType === "online" ? "Google Meet" : interviewData.room;

      const meetingLink =
        interviewData.interviewType === "online" ? interviewData.meetingLink : undefined;

      await sendInterviewEmail({
        to: interviewCandidate.nu_email,
        candidateName: interviewCandidate.name,
        interviewDate: formattedDate,
        interviewTime: timeRange,
        meetingLink,
        location,
        instructions: interviewData.instructions,
      });

      toast.success(`Interview scheduled for ${interviewCandidate.name}`);
      setIsInterviewDialogOpen(false);
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      toast.error(error.message || "Failed to send interview email");
    } finally {
      setSendingInterview(false);
    }
  };

  const handleBulkScheduleInterview = async () => {
    // Format times from picker states
    const formattedStartTime = formatTime(bulkStartHour, bulkStartMinute, bulkStartPeriod);
    const formattedEndTime = formatTime(bulkEndHour, bulkEndMinute, bulkEndPeriod);

    if (!bulkInterviewData.date || !formattedStartTime || !formattedEndTime) {
      toast.error("Date, Start Time, and End Time are required");
      return;
    }

    // Validate based on interview type
    if (bulkInterviewData.interviewType === "online" && !bulkInterviewData.meetingLink) {
      toast.error("Meeting link is required for online interviews");
      return;
    }

    if (bulkInterviewData.interviewType === "physical" && !bulkInterviewData.room) {
      toast.error("Room is required for physical interviews");
      return;
    }

    // Get all responses to send to (respect bulk target: waiting/selected/rejected/all)
    const responsesToSend = await fetchFilteredResponses(bulkTarget === "all" ? "all" : bulkTarget);

    if (responsesToSend.length === 0) {
      toast.error("No candidates to send interviews to");
      return;
    }

    setSendingBulkInterview(true);
    setBulkProgress({ current: 0, total: responsesToSend.length });
    setBulkResults({ success: [], failed: [] });

    // Format date for display
    const formattedDate = format(bulkInterviewData.date, "PPPP");

    // Format time range
    const timeRange = `${formattedStartTime} - ${formattedEndTime}`;

    // Determine location and meeting link based on interview type
    const location =
      bulkInterviewData.interviewType === "online" ? "Google Meet" : bulkInterviewData.room;

    const meetingLink =
      bulkInterviewData.interviewType === "online" ? bulkInterviewData.meetingLink : undefined;

    const results = { success: [], failed: [] };
    const BATCH_SIZE = 5;
    let completedInterviews = 0;

    // Send emails concurrently in batches with progress updates
    for (let i = 0; i < responsesToSend.length; i += BATCH_SIZE) {
      const batch = responsesToSend.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (candidate) => {
          try {
            if (!candidate.nu_email) {
              results.failed.push({ name: candidate.name, error: "No email address" });
              return;
            }

            await sendInterviewEmail({
              to: candidate.nu_email,
              candidateName: candidate.name,
              interviewDate: formattedDate,
              interviewTime: timeRange,
              meetingLink,
              location,
            });

            results.success.push(candidate.name);
          } catch (error) {
            console.error(`Failed to send to ${candidate.name}:`, error);
            results.failed.push({ name: candidate.name, error: error.message });
          } finally {
            completedInterviews += 1;
            setBulkProgress({ current: completedInterviews, total: responsesToSend.length });
            setBulkResults({ success: [...results.success], failed: [...results.failed] });
          }
        }),
      );
    }

    setSendingBulkInterview(false);

    // Show summary toast
    if (results.failed.length === 0) {
      toast.success(`Successfully sent ${results.success.length} interview emails!`);
      setIsBulkInterviewDialogOpen(false);
    } else {
      toast.warning(`Sent ${results.success.length} emails, ${results.failed.length} failed`);
    }
  };

  // Send selection emails in bulk (for selected candidates)
  const handleSendSelectionEmails = async () => {
    const responsesToSend = await fetchFilteredResponses("selected");
    if (responsesToSend.length === 0) {
      toast.error("No selected candidates to send emails to");
      return;
    }

    setBulkActionTitle("Sending Selection Emails");
    setIsBulkProgressDialogOpen(true);
    setSendingBulkInterview(true);
    setBulkProgress({ current: 0, total: responsesToSend.length });
    setBulkResults({ success: [], failed: [] });

    const results = { success: [], failed: [] };
    const BATCH_SIZE = 5;
    let completedSelections = 0;

    for (let i = 0; i < responsesToSend.length; i += BATCH_SIZE) {
      const batch = responsesToSend.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (candidate) => {
          try {
            if (!candidate.nu_email) {
              results.failed.push({ name: candidate.name, error: "No email address" });
              return;
            }

            await sendSelectionEmail({ to: candidate.nu_email, recipientName: candidate.name });
            results.success.push(candidate.name);
          } catch (error) {
            console.error(`Failed to send selection email to ${candidate.name}:`, error);
            results.failed.push({ name: candidate.name, error: error.message });
          } finally {
            completedSelections += 1;
            setBulkProgress({ current: completedSelections, total: responsesToSend.length });
            setBulkResults({ success: [...results.success], failed: [...results.failed] });
          }
        }),
      );
    }

    setSendingBulkInterview(false);
    if (results.failed.length === 0) {
      toast.success(`Successfully sent ${results.success.length} selection emails!`);
    } else {
      toast.warning(`Sent ${results.success.length} emails, ${results.failed.length} failed`);
    }
  };

  // Send rejection emails in bulk (for rejected candidates)
  const handleSendRejectionEmails = async () => {
    const responsesToSend = await fetchFilteredResponses("rejected");
    if (responsesToSend.length === 0) {
      toast.error("No rejected candidates to send emails to");
      return;
    }

    setBulkActionTitle("Sending Rejection Emails");
    setIsBulkProgressDialogOpen(true);
    setSendingBulkInterview(true);
    setBulkProgress({ current: 0, total: responsesToSend.length });
    setBulkResults({ success: [], failed: [] });

    const results = { success: [], failed: [] };
    const BATCH_SIZE = 5;
    let completedRejections = 0;

    for (let i = 0; i < responsesToSend.length; i += BATCH_SIZE) {
      const batch = responsesToSend.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (candidate) => {
          try {
            if (!candidate.nu_email) {
              results.failed.push({ name: candidate.name, error: "No email address" });
              return;
            }

            await sendRejectionEmail({ to: candidate.nu_email, recipientName: candidate.name });
            results.success.push(candidate.name);
          } catch (error) {
            console.error(`Failed to send rejection email to ${candidate.name}:`, error);
            results.failed.push({ name: candidate.name, error: error.message });
          } finally {
            completedRejections += 1;
            setBulkProgress({ current: completedRejections, total: responsesToSend.length });
            setBulkResults({ success: [...results.success], failed: [...results.failed] });
          }
        }),
      );
    }

    setSendingBulkInterview(false);
    if (results.failed.length === 0) {
      toast.success(`Successfully sent ${results.success.length} rejection emails!`);
    } else {
      toast.warning(`Sent ${results.success.length} emails, ${results.failed.length} failed`);
    }
  };

  // Send announcement emails in bulk based on current filter
  const handleSendAnnouncementEmails = async () => {
    // If a single recipient is set (per-row announcement), send only to them.
    let responsesToSend = [];
    if (singleAnnouncementRecipient) {
      responsesToSend = [singleAnnouncementRecipient];
    } else {
      // Use the current statusFilter to decide recipients for bulk
      const type = statusFilter === "all" ? "all" : statusFilter;
      responsesToSend = await fetchFilteredResponses(type);
      if (responsesToSend.length === 0) {
        toast.error("No recipients for announcement");
        return;
      }
    }

    // Validate announcement data
    if (!announcementData.title?.trim() || !announcementData.message?.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSendingBulkInterview(true);
    setBulkProgress({ current: 0, total: responsesToSend.length });
    setBulkResults({ success: [], failed: [] });

    const results = { success: [], failed: [] };
    const BATCH_SIZE = 5;
    let completedAnnouncements = 0;

    for (let i = 0; i < responsesToSend.length; i += BATCH_SIZE) {
      const batch = responsesToSend.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (candidate) => {
          try {
            if (!candidate.nu_email) {
              results.failed.push({ name: candidate.name, error: "No email address" });
              return;
            }

            await sendAnnouncementEmail({
              to: candidate.nu_email,
              title: announcementData.title,
              message: announcementData.message,
            });

            results.success.push(candidate.name);
          } catch (error) {
            console.error(`Failed to send announcement to ${candidate.name}:`, error);
            results.failed.push({ name: candidate.name, error: error.message });
          } finally {
            completedAnnouncements += 1;
            setBulkProgress({ current: completedAnnouncements, total: responsesToSend.length });
            setBulkResults({ success: [...results.success], failed: [...results.failed] });
          }
        }),
      );
    }

    setSendingBulkInterview(false);
    setIsAnnouncementDialogOpen(false);
    setSingleAnnouncementRecipient(null);

    if (results.failed.length === 0) {
      toast.success(`Successfully sent ${results.success.length} announcements!`);
    } else {
      toast.warning(`Sent ${results.success.length} emails, ${results.failed.length} failed`);
    }
  };

  const handleExportCSV = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const csvContent = [
      [
        "name",
        "roll_no",
        "nu_email",
        "whatsapp_no",
        "skills",
        "experience",
        "team",
        "status",
        "registered_at",
      ],
      ...dataToExport.map((response) => [
        response.name,
        response.roll_no,
        response.nu_email,
        response.whatsapp_no,
        response.skills,
        response.experience,
        response.team,
        response.status === null ? "Waiting" : response.status === true ? "Selected" : "Rejected",
        response.registered_at,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
      type === "selected"
        ? "selected_responses.csv"
        : type === "rejected"
          ? "rejected_responses.csv"
          : type === "waiting"
            ? "waiting_responses.csv"
            : "all_responses.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVCF = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const vcfContent = dataToExport
      .map(
        (response) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${response.name}\nTEL:${response.whatsapp_no}\nEMAIL:${response.nu_email}\nEND:VCARD`,
      )
      .join("\n");

    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
      type === "selected"
        ? "selected_contacts.vcf"
        : type === "rejected"
          ? "rejected_contacts.vcf"
          : type === "waiting"
            ? "waiting_contacts.vcf"
            : "all_contacts.vcf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  // Per-response email actions
  const sendSelectionTo = async (response) => {
    if (!response?.nu_email) {
      toast.error("No email address for this candidate");
      return;
    }
    setProcessingEmailId(response.id);
    try {
      await sendSelectionEmail({ to: response.nu_email, recipientName: response.name });
      toast.success(
        <div>
          <div>Selection email sent to {response.name}</div>
        </div>,
      );
    } catch (err) {
      console.error("Failed to send selection email:", err);
      toast.error(err?.message || "Failed to send selection email");
    } finally {
      setProcessingEmailId(null);
    }
  };

  const sendRejectionTo = async (response) => {
    if (!response?.nu_email) {
      toast.error("No email address for this candidate");
      return;
    }
    setProcessingEmailId(response.id);
    try {
      await sendRejectionEmail({ to: response.nu_email, recipientName: response.name });
      toast.success(
        <div>
          <div>Rejection email sent to {response.name}</div>
        </div>,
      );
    } catch (err) {
      console.error("Failed to send rejection email:", err);
      toast.error(err?.message || "Failed to send rejection email");
    } finally {
      setProcessingEmailId(null);
    }
  };

  const prepareAnnouncementTo = (response) => {
    // Open announcement dialog pre-targeted to single recipient
    setSingleAnnouncementRecipient(response);
    setAnnouncementData({ title: "", message: "" });
    setIsAnnouncementDialogOpen(true);
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if ((page + 1) * responsesPerPage < totalResponses) {
      setPage(page + 1);
    }
  };

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
      ) : (
        <div className="w-full flex flex-col items-start px-2 py-4">
                {/* Search & Filters */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="relative w-full sm:w-80 md:w-96 max-w-md">
                    <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search responses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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
                              : statusFilter === "selected"
                                ? "Selected"
                                : statusFilter === "rejected"
                                  ? "Rejected"
                                  : "Waiting"}
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Filter Responses</DropdownMenuLabel>
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
                              setStatusFilter("selected");
                              setPage(0);
                            }}
                          >
                            Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusFilter("rejected");
                              setPage(0);
                            }}
                          >
                            Rejected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusFilter("waiting");
                              setPage(0);
                            }}
                          >
                            Waiting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center mr-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-11 gap-2 inline-flex items-center"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {teamFilter === "all" ? "Team" : teamFilter}
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Filter by Team</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setTeamFilter("all");
                              setPage(0);
                            }}
                          >
                            All
                          </DropdownMenuItem>
                          {teamsList && teamsList.length > 0 ? (
                            teamsList.map((team) => (
                              <DropdownMenuItem
                                key={team}
                                onClick={() => {
                                  setTeamFilter(team);
                                  setPage(0);
                                }}
                              >
                                {team}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem className="opacity-70 pointer-events-none">
                              No teams
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-11 gap-2 flex-1 md:flex-none"
                        >
                          <File className="h-4 w-4" />
                          Export
                          {exportFilter && exportFilter !== "all" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (
                              {exportFilter
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                              )
                            </span>
                          )}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export As</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportCSV("all");
                            setExportFilter("all");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (All)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportCSV("selected")}>
                          <FileDown className="w-4 mr-2" />
                          CSV (Selected)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportCSV("rejected")}>
                          <FileDown className="w-4 mr-2" />
                          CSV (Rejected)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportCSV("waiting");
                            setExportFilter("waiting");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (Waiting)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportVCF("all");
                            setExportFilter("all");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (All)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportVCF("selected")}>
                          <FileDown className="w-4 mr-2" />
                          VCF (Selected)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportVCF("rejected")}>
                          <FileDown className="w-4 mr-2" />
                          VCF (Rejected)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportVCF("waiting");
                            setExportFilter("waiting");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (Waiting)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-11 gap-2 inline-flex items-center"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Mail
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Bulk Emails</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openBulkInterviewDialog("waiting")}>
                            <Calendar className="mr-2 w-4" />
                            Send Interviews
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSendSelectionEmails}>
                            <Check className="mr-2 w-4" />
                            Send Selection Emails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSendRejectionEmails}>
                            <X className="mr-2 w-4" />
                            Send Rejection Emails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsAnnouncementDialogOpen(true)}>
                            <File className="mr-2 w-4" />
                            Send Announcement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {}
                <div className="w-full">
                  {filteredResponses.length === 0 ? (
                    <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-xl font-semibold text-muted-foreground mb-2">
                            No responses found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "Try adjusting your search"
                              : error
                                ? "Error loading responses"
                                : "No induction responses available"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                      <ul className="divide-y divide-border/50">
                        {filteredResponses.map((response) => (
                          <li
                            key={response.id}
                            className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                          >
                            {}
                            <div className="shrink-0">
                              <div className="w-14 h-14 rounded-full bg-white/95 text-black flex items-center justify-center font-bold text-xl border border-border/30">
                                {response.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                            </div>

                            {}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                                  {response.name}
                                </h3>
                                <Badge
                                  className={`${
                                    response.status === null
                                      ? "bg-orange-500 text-white border-none"
                                      : response.status === true
                                        ? "bg-green-700 text-white border-none"
                                        : "bg-red-600 text-white border-none"
                                  }`}
                                >
                                  {response.status === null
                                    ? "Waiting"
                                    : response.status === true
                                      ? "Selected"
                                      : "Rejected"}
                                </Badge>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                                {response.roll_no && (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                    <span>{response.roll_no}</span>
                                  </div>
                                )}
                                {response.nu_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">{response.nu_email}</span>
                                  </div>
                                )}
                                {response.whatsapp_no && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                    <span>{response.whatsapp_no}</span>
                                  </div>
                                )}
                                {response.team && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-primary" />
                                    <span>{response.team}</span>
                                  </div>
                                )}
                              </div>

                              {}
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={updatingStatusId === response.id}
                                      >
                                        {response.status === null
                                          ? "Waiting"
                                          : response.status === true
                                            ? "Selected"
                                            : "Rejected"}
                                        <ChevronDown className="w-3.5 h-3.5 ml-2" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          updateResponseStatus(response, true);
                                        }}
                                      >
                                        {updatingStatusId === response.id &&
                                        updatingStatusValue === true ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                          </span>
                                        ) : (
                                          <>
                                            <Check className="mr-2 w-4" />
                                            Set Selected
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          updateResponseStatus(response, false);
                                        }}
                                      >
                                        {updatingStatusId === response.id &&
                                        updatingStatusValue === false ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                          </span>
                                        ) : (
                                          <>
                                            <X className="mr-2 w-4" />
                                            Set Rejected
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          updateResponseStatus(response, null);
                                        }}
                                      >
                                        {updatingStatusId === response.id &&
                                        updatingStatusValue === null ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                          </span>
                                        ) : (
                                          <>
                                            <GraduationCap className="mr-2 w-4" />
                                            Set Waiting
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      Contact
                                      <ChevronDown className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuLabel>Contact</DropdownMenuLabel>
                                    {response.whatsapp_no ? (
                                      <DropdownMenuItem
                                        onClick={() => handleSendWhatsApp(response.whatsapp_no)}
                                      >
                                        <MessageCircle className="mr-2 w-4" />
                                        Message
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="opacity-70 pointer-events-none">
                                        <MessageCircle className="mr-2 w-4" />
                                        Message (no phone)
                                      </DropdownMenuItem>
                                    )}

                                    {response.status === null ? (
                                      response.nu_email ? (
                                        <DropdownMenuItem
                                          onClick={() => openInterviewDialog(response)}
                                        >
                                          <Calendar className="mr-2 w-4" />
                                          Schedule Interview
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem className="opacity-70 pointer-events-none">
                                          <Calendar className="mr-2 w-4" />
                                          Schedule Interview (no email)
                                        </DropdownMenuItem>
                                      )
                                    ) : null}

                                    {response.status === true ? (
                                      response.nu_email ? (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault();
                                            sendSelectionTo(response);
                                          }}
                                        >
                                          {processingEmailId === response.id ? (
                                            <span className="flex items-center">
                                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                                              Sending...
                                            </span>
                                          ) : (
                                            <>
                                              <Check className="mr-2 w-4" />
                                              Send Selection Email
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem className="opacity-70 pointer-events-none">
                                          <Check className="mr-2 w-4" />
                                          Send Selection Email (no email)
                                        </DropdownMenuItem>
                                      )
                                    ) : null}

                                    {response.status === false ? (
                                      response.nu_email ? (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault();
                                            sendRejectionTo(response);
                                          }}
                                        >
                                          {processingEmailId === response.id ? (
                                            <span className="flex items-center">
                                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                                              Sending...
                                            </span>
                                          ) : (
                                            <>
                                              <X className="mr-2 w-4" />
                                              Send Rejection Email
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem className="opacity-70 pointer-events-none">
                                          <X className="mr-2 w-4" />
                                          Send Rejection Email (no email)
                                        </DropdownMenuItem>
                                      )
                                    ) : null}

                                    <DropdownMenuItem
                                      onClick={() => prepareAnnouncementTo(response)}
                                    >
                                      <File className="mr-2 w-4" />
                                      Send Announcement
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setResponseToView(response)}
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setResponseToDelete(response)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {}
                            <div className="shrink-0 text-right w-28">
                              <div className="text-xs text-muted-foreground">Registered</div>
                              <div className="text-sm font-semibold">
                                {response.registered_at ? (
                                  <FormatDate dateString={response.registered_at} />
                                ) : (
                                  "-"
                                )}
                              </div>
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
                            {page * responsesPerPage + 1} -{" "}
                            {Math.min((page + 1) * responsesPerPage, totalResponses)}
                          </strong>{" "}
                          of{" "}
                          <strong className="text-foreground font-semibold">
                            {totalResponses}
                          </strong>{" "}
                          responses
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
                            disabled={(page + 1) * responsesPerPage >= totalResponses}
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
                {responseToView && (
                  <AlertDialog
                    open={Boolean(responseToView)}
                    onOpenChange={(open) => {
                      if (!open) setResponseToView(null);
                    }}
                  >
                    <AlertDialogContent className="overflow-hidden">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-start">
                          Response Details - {responseToView.name}
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-start space-y-3">
                          <div>
                            <strong>Skills:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.skills
                                ? responseToView.skills
                                : "No skills provided."}
                            </p>
                          </div>
                          <div>
                            <strong>Experience:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.experience
                                ? responseToView.experience
                                : "No experience provided."}
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setResponseToView(null)}>
                          Close
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {}
                <AlertDialog
                  open={Boolean(responseToDelete)}
                  onOpenChange={(open) => !open && setResponseToDelete(null)}
                >
                  {responseToDelete && (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete the response from{" "}
                          <strong>{responseToDelete.name}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteResponse}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  )}
                </AlertDialog>

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
              </div>
            )}

      {/* Interview Scheduling Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {interviewCandidate?.name}. An email will be sent with the
              details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!interviewData.date}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "data-[empty=true]:text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {interviewData.date ? (
                      format(interviewData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={interviewData.date}
                    onSelect={(date) => setInterviewData({ ...interviewData, date })}
                    captionLayout="dropdown"
                    startMonth={new Date(2020, 0)}
                    endMonth={new Date(2030, 11)}
                    defaultMonth={interviewData.date || new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex gap-2">
                  <Select value={startHour} onValueChange={setStartHour}>
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

                  <Select value={startMinute} onValueChange={setStartMinute}>
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

                  <Select value={startPeriod} onValueChange={setStartPeriod}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex gap-2">
                  <Select value={endHour} onValueChange={setEndHour}>
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

                  <Select value={endMinute} onValueChange={setEndMinute}>
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

                  <Select value={endPeriod} onValueChange={setEndPeriod}>
                    <SelectTrigger className="w-20">
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

            {/* Interview Type Selection */}
            <div className="space-y-3">
              <Label>Interview Type</Label>
              <RadioGroup
                value={interviewData.interviewType}
                onValueChange={(value) =>
                  setInterviewData({ ...interviewData, interviewType: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="font-normal cursor-pointer">
                    Online (Google Meet)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="physical" id="physical" />
                  <Label htmlFor="physical" className="font-normal cursor-pointer">
                    Physical
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional Fields Based on Interview Type */}
            {interviewData.interviewType === "online" ? (
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Google Meet Link *</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    id="meetingLink"
                    placeholder="https://meet.google.com/..."
                    className="pl-9"
                    value={interviewData.meetingLink}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        meetingLink: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="room">Room / Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    id="room"
                    placeholder="Room 101, Block A"
                    className="pl-9"
                    value={interviewData.room}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        room: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Please bring your portfolio..."
                value={interviewData.instructions}
                onChange={(e) =>
                  setInterviewData({
                    ...interviewData,
                    instructions: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInterviewDialogOpen(false)}
              disabled={sendingInterview}
            >
              Cancel
            </Button>
            <Button onClick={handleSendInterview} disabled={sendingInterview}>
              {sendingInterview ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                "Schedule & Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              Send an announcement to all candidates in the current filter. Provide a title and a
              short message.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="Announcement title"
                value={announcementData.title}
                onChange={(e) =>
                  setAnnouncementData({ ...announcementData, title: e.target.value })
                }
                disabled={sendingBulkInterview}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                placeholder="Write your announcement here..."
                value={announcementData.message}
                onChange={(e) =>
                  setAnnouncementData({ ...announcementData, message: e.target.value })
                }
                disabled={sendingBulkInterview}
                rows={6}
              />
            </div>

            {/* Progress / Results — reuse bulk state */}
            {sendingBulkInterview && !singleAnnouncementRecipient && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Sending announcements...</span>
                  <span className="text-muted-foreground">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <Progress
                  value={(bulkProgress.current / Math.max(1, bulkProgress.total)) * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementDialogOpen(false)}
              disabled={sendingBulkInterview}
            >
              Cancel
            </Button>
            <Button onClick={handleSendAnnouncementEmails} disabled={sendingBulkInterview}>
              {sendingBulkInterview ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                "Send Announcement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Interview Scheduling Dialog */}
      <Dialog open={isBulkInterviewDialogOpen} onOpenChange={setIsBulkInterviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Bulk Interviews</DialogTitle>
            <DialogDescription>
              Schedule interviews for all {bulkTargetCount} candidates in the selected target (
              {bulkTarget}).
              {statusFilter !== "all" && ` Current list filter: ${statusFilter}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!bulkInterviewData.date}
                    disabled={sendingBulkInterview}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "data-[empty=true]:text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {bulkInterviewData.date ? (
                      format(bulkInterviewData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={bulkInterviewData.date}
                    onSelect={(date) => setBulkInterviewData({ ...bulkInterviewData, date })}
                    captionLayout="dropdown"
                    startMonth={new Date(2020, 0)}
                    endMonth={new Date(2030, 11)}
                    defaultMonth={bulkInterviewData.date || new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex gap-2">
                  <Select
                    value={bulkStartHour}
                    onValueChange={setBulkStartHour}
                    disabled={sendingBulkInterview}
                  >
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

                  <Select
                    value={bulkStartMinute}
                    onValueChange={setBulkStartMinute}
                    disabled={sendingBulkInterview}
                  >
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

                  <Select
                    value={bulkStartPeriod}
                    onValueChange={setBulkStartPeriod}
                    disabled={sendingBulkInterview}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex gap-2">
                  <Select
                    value={bulkEndHour}
                    onValueChange={setBulkEndHour}
                    disabled={sendingBulkInterview}
                  >
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

                  <Select
                    value={bulkEndMinute}
                    onValueChange={setBulkEndMinute}
                    disabled={sendingBulkInterview}
                  >
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

                  <Select
                    value={bulkEndPeriod}
                    onValueChange={setBulkEndPeriod}
                    disabled={sendingBulkInterview}
                  >
                    <SelectTrigger className="w-20">
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
          </div>

          <div className="space-y-4">
            {/* Interview Type Selection */}
            <div className="space-y-3">
              <Label>Interview Type</Label>
              <RadioGroup
                value={bulkInterviewData.interviewType}
                onValueChange={(value) =>
                  setBulkInterviewData({ ...bulkInterviewData, interviewType: value })
                }
                className="flex gap-4"
                disabled={sendingBulkInterview}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="bulk-online" />
                  <Label htmlFor="bulk-online" className="font-normal cursor-pointer">
                    Online (Google Meet)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="physical" id="bulk-physical" />
                  <Label htmlFor="bulk-physical" className="font-normal cursor-pointer">
                    Physical
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional Fields Based on Interview Type */}
            {bulkInterviewData.interviewType === "online" ? (
              <div className="space-y-2">
                <Label htmlFor="bulk-meetingLink">Google Meet Link *</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    id="bulk-meetingLink"
                    placeholder="https://meet.google.com/..."
                    className="pl-9"
                    value={bulkInterviewData.meetingLink}
                    onChange={(e) =>
                      setBulkInterviewData({
                        ...bulkInterviewData,
                        meetingLink: e.target.value,
                      })
                    }
                    disabled={sendingBulkInterview}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bulk-room">Room / Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    id="bulk-room"
                    placeholder="Room 101, Block A"
                    className="pl-9"
                    value={bulkInterviewData.room}
                    onChange={(e) =>
                      setBulkInterviewData({
                        ...bulkInterviewData,
                        room: e.target.value,
                      })
                    }
                    disabled={sendingBulkInterview}
                  />
                </div>
              </div>
            )}

            {/* CC input for bulk emails */}
            <div className="space-y-2">
              <Label htmlFor="bulk-cc">CC (optional, comma separated)</Label>
              <Input
                id="bulk-cc"
                placeholder="manager@example.com, hr@example.com"
                className="pl-3"
                value={bulkInterviewData.cc}
                onChange={(e) => setBulkInterviewData({ ...bulkInterviewData, cc: e.target.value })}
                disabled={sendingBulkInterview}
              />
            </div>

            {/* Progress Section */}
            {sendingBulkInterview && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Sending emails...</span>
                  <span className="text-muted-foreground">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <Progress
                  value={(bulkProgress.current / bulkProgress.total) * 100}
                  className="h-2"
                />

                {bulkResults.success.length > 0 && (
                  <div className="text-xs text-green-600">✓ Sent: {bulkResults.success.length}</div>
                )}
                {bulkResults.failed.length > 0 && (
                  <div className="text-xs text-red-600">✗ Failed: {bulkResults.failed.length}</div>
                )}
              </div>
            )}

            {/* Results Summary */}
            {!sendingBulkInterview && bulkProgress.total > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                <div className="font-medium text-sm mb-2">Results:</div>
                {bulkResults.success.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-green-600">
                      ✓ Successfully sent ({bulkResults.success.length}):
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bulkResults.success.join(", ")}
                    </div>
                  </div>
                )}
                {bulkResults.failed.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="text-xs font-medium text-red-600">
                      Failed ({bulkResults.failed.length}):
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {bulkResults.failed.map((f, i) => (
                        <div key={i}>
                          {f.name}: {f.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkInterviewDialogOpen(false);
                // Reset after closing
                setTimeout(() => {
                  setBulkProgress({ current: 0, total: 0 });
                  setBulkResults({ success: [], failed: [] });
                }, 300);
              }}
              disabled={sendingBulkInterview}
            >
              {bulkProgress.total > 0 && !sendingBulkInterview ? "Close" : "Cancel"}
            </Button>
            {(!bulkProgress.total || sendingBulkInterview) && (
              <Button
                onClick={handleBulkScheduleInterview}
                disabled={sendingBulkInterview || bulkTargetCount === 0}
              >
                {sendingBulkInterview ? (
                  <div className="flex items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  `Send to ${bulkTargetCount} Candidates`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Bulk Progress Dialog */}
      <Dialog open={isBulkProgressDialogOpen} onOpenChange={setIsBulkProgressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{bulkActionTitle}</DialogTitle>
            <DialogDescription>
              Processing bulk action. Please do not close this window until completion.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Processing...</span>
                <span className="text-muted-foreground">
                  {bulkProgress.current} / {bulkProgress.total}
                </span>
              </div>
              <Progress
                value={(bulkProgress.current / Math.max(1, bulkProgress.total)) * 100}
                className="h-2"
              />

              {bulkResults.success.length > 0 && (
                <div className="text-xs text-green-600">✓ Sent: {bulkResults.success.length}</div>
              )}
              {bulkResults.failed.length > 0 && (
                <div className="text-xs text-red-600">✗ Failed: {bulkResults.failed.length}</div>
              )}
            </div>

            {/* Results Summary */}
            {!sendingBulkInterview && bulkProgress.total > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                <div className="font-medium text-sm mb-2">Results:</div>
                {bulkResults.success.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-green-600">
                      Successfully sent ({bulkResults.success.length}):
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bulkResults.success.join(", ")}
                    </div>
                  </div>
                )}
                {bulkResults.failed.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="text-xs font-medium text-red-600">
                      ✗ Failed ({bulkResults.failed.length}):
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {bulkResults.failed.map((f, i) => (
                        <div key={i}>
                          {f.name}: {f.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsBulkProgressDialogOpen(false);
                // Reset after closing
                setTimeout(() => {
                  setBulkProgress({ current: 0, total: 0 });
                  setBulkResults({ success: [], failed: [] });
                }, 300);
              }}
              disabled={sendingBulkInterview}
            >
              {sendingBulkInterview ? "Processing..." : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Inductions;
