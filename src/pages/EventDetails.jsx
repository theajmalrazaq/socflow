import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  Mail,
  Search,
  MessageCircle,
  Trash2,
  Check,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trophy,
  Medal,
  Award,
  ChevronDown,
  Users,
  GraduationCap,
  Phone,
  UserCheck,
  CheckCircle2,
  Loader,
} from "lucide-react";
import { Certificate } from "@/components/subcomponents/Certificate";
import { sendCertificateEmail } from "@/lib/emailService.jsx";
import Loading from "@/components/layout/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canViewRegistrations, hasPermission } from "@/lib/permissions";

export function EventDetails() {
  const navigator = useNavigate();
  const location = useLocation();
  const outlet = useOutletContext();
  const permissions = location.state?.permissions || outlet?.permissions;
  const { event_id, is_competition } = location.state || {};

  useEffect(() => {
    if (permissions && !canViewRegistrations(permissions)) {
      navigator("/nopermission");
    }
  }, [permissions, navigator]);

  const [filteredResponses, setFilteredResponses] = useState([]);
  const [error, setError] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [responsesPerPage] = useState(10);
  const [totalResponses, setTotalResponses] = useState(0);
  const [previousResponses, setPreviousResponses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");

  // Granular loading states
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingStatusValue, setUpdatingStatusValue] = useState(undefined);
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState(null);
  const [updatingAttendanceValue, setUpdatingAttendanceValue] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);

  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [winnerPosition, setWinnerPosition] = useState(null);
  const [winnerImageUrl, setWinnerImageUrl] = useState("");
  const [winners, setWinners] = useState([]);
  const [eventName, setEventName] = useState(location.state?.event_name || "");
  const [processingEmailId, setProcessingEmailId] = useState(null);
  const [currentCertificate, setCurrentCertificate] = useState(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!event_id) return;

      if (eventName) return;

      const { data } = await supabase.from("events").select("title").eq("id", event_id).single();

      if (data) {
        setEventName(data.title || data.name || "Event");
      }
    };

    fetchEventDetails();
  }, [event_id, eventName, is_competition]);

  const eventtype = is_competition ? "competitionsResponses" : "eventsResponses";

  const attendanceColumn = useCallback(() => "attendance", []);

  const getAttendance = (response) => {
    if (!response) return null;
    if (Object.prototype.hasOwnProperty.call(response, "attendance")) return response.attendance;
    if (Object.prototype.hasOwnProperty.call(response, "attendence")) return response.attendence;
    return null;
  };

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

  const fetchWinners = useCallback(async () => {
    const { data, error } = await supabase
      .from("competitionWinners")
      .select("*")
      .eq("event_id", event_id);

    if (error) {
      console.error("Error fetching winners:", error);
    } else {
      setWinners(data || []);
    }
  }, [event_id]);

  useEffect(() => {
    if (is_competition && event_id) {
      fetchWinners();
    }
  }, [is_competition, event_id, fetchWinners]);

  useEffect(() => {
    if (selectedWinner && winners.some((w) => w.response_id === selectedWinner.id)) {
      setSelectedWinner(null);
    }
  }, [winners, selectedWinner]);

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);

      let query = supabase
        .from(eventtype)
        .select("*", { count: "exact" })
        .range(page * responsesPerPage, (page + 1) * responsesPerPage - 1)
        .eq("event_id", event_id)
        .order("id", { ascending: false });

      if (statusFilter !== "all" && is_competition) {
        query = query.eq(
          "status",
          statusFilter === "verified" ? true : statusFilter === "rejected" ? false : null,
        );
      }

      if (attendanceFilter !== "all") {
        const attCol = attendanceColumn(is_competition);
        query = query.eq(
          attCol,
          attendanceFilter === "present" ? true : attendanceFilter === "absent" ? false : null,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        setError(true);
      } else {
        setPreviousResponses(data || []);
        if (!debouncedSearchTerm.trim()) {
          setFilteredResponses(data || []);
        }
        setTotalResponses(count || 0);
      }
      setLoading(false);
    };

    fetchResponses();
  }, [
    page,
    responsesPerPage,
    debouncedSearchTerm,
    event_id,
    eventtype,
    statusFilter,
    attendanceFilter,
    is_competition,
    attendanceColumn,
  ]);

  const check = !is_competition ? "name" : "team_name";

  useEffect(() => {
    const fetchSearchResults = async () => {
      const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();

      const { data: responsesForSearch, error } = await supabase
        .from(eventtype)
        .select("*")
        .eq("event_id", event_id)
        .or(`roll_no.ilike.%${lowerCaseSearchTerm}%,${check}.ilike.%${lowerCaseSearchTerm}%`);

      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      setFilteredResponses(responsesForSearch);
    };

    if (debouncedSearchTerm.trim()) {
      fetchSearchResults();
    } else {
      setFilteredResponses(previousResponses);
    }
  }, [debouncedSearchTerm, previousResponses, event_id, eventtype, check]);

  const deleteResponse = async () => {
    if (!responseToDelete) {
      toast.error("No Response Selected");
      return;
    }

    setDeletingId(responseToDelete.id);

    try {
      const { error } = await supabase
        .from(eventtype)
        .delete()
        .eq("id", String(responseToDelete.id));

      if (error) throw new Error(error.message);

      setFilteredResponses((prevResponses) =>
        prevResponses.filter((response) => response.id !== responseToDelete.id),
      );
      setPreviousResponses((prevResponses) =>
        prevResponses.filter((response) => response.id !== responseToDelete.id),
      );

      toast.success("Response deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete response");
    } finally {
      setResponseToDelete(null);
      setDeletingId(null);
    }
  };

  const updateAttendance = async (response, attendance) => {
    setUpdatingAttendanceId(response.id);
    setUpdatingAttendanceValue(attendance);
    const attCol = attendanceColumn(is_competition);
    const payload = {};
    payload[attCol] = attendance;

    try {
      const { error } = await supabase
        .from(eventtype)
        .update(payload)
        .eq("id", String(response.id));

      if (error) {
        toast.error("Unable to update attendance");
      } else {
        setFilteredResponses((prevResponses) =>
          prevResponses.map((r) => (r.id === response.id ? { ...r, [attCol]: attendance } : r)),
        );
        setPreviousResponses((prevResponses) =>
          prevResponses.map((r) => (r.id === response.id ? { ...r, [attCol]: attendance } : r)),
        );
        toast.success("Attendance updated successfully");
      }
    } finally {
      setUpdatingAttendanceId(null);
      setUpdatingAttendanceValue(undefined);
    }
  };

  const updateResponseStatus = async (response, status) => {
    setUpdatingStatusId(response.id);
    setUpdatingStatusValue(status);

    try {
      const { error } = await supabase
        .from(eventtype)
        .update({ status })
        .eq("id", String(response.id));

      if (error) {
        toast.error("Failed to update status");
      } else {
        setFilteredResponses((prevResponses) =>
          prevResponses.map((r) => (r.id === response.id ? { ...r, status } : r)),
        );
        setPreviousResponses((prevResponses) =>
          prevResponses.map((r) => (r.id === response.id ? { ...r, status } : r)),
        );
        toast.success("Status updated successfully");
      }
    } finally {
      setUpdatingStatusId(null);
      setUpdatingStatusValue(undefined);
    }
  };

  const addWinner = async () => {
    if (!selectedWinner || !winnerPosition) {
      toast.error("Please select a winner and position");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("competitionWinners").insert([
        {
          event_id: event_id,
          response_id: selectedWinner.id,
          position: winnerPosition,
          img_url: winnerImageUrl || null,
        },
      ]);

      if (error) throw new Error(error.message);

      toast.success(`Winner added for position ${winnerPosition}`);
      fetchWinners();
      setIsWinnerDialogOpen(false);
      setSelectedWinner(null);
      setWinnerPosition(null);
      setWinnerImageUrl("");
    } catch (error) {
      toast.error(error.message || "Failed to add winner");
    } finally {
      setLoading(false);
    }
  };

  const removeWinner = async (winnerId) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("competitionWinners").delete().eq("id", winnerId);

      if (error) throw new Error(error.message);

      toast.success("Winner removed successfully");
      setWinners((prev) => prev.filter((w) => w.id !== winnerId));
      await fetchWinners();
    } catch (error) {
      toast.error(error.message || "Failed to remove winner");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredResponses = async (type) => {
    const { data, error } = await supabase.from(eventtype).select("*").eq("event_id", event_id);

    if (error) {
      return [];
    }

    if (type === "Verified") {
      return data.filter((response) => response.status === true);
    }
    if (type === "rejected") {
      return data.filter((response) => response.status === false);
    }
    if (type === "all") {
      return data;
    }

    return [];
  };

  const handleExportCSV = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const csvContent = `data:text/csv;charset=utf-8,${[
      ["Name", "Roll No", "Email", "Whatsapp", "Status"],
      ...dataToExport.map((response) => [
        response.name || response.team_name,
        response.roll_no || response.member_one_rollno,
        response.nu_email,
        response.whatsapp_no,
        response.status === null ? "Waiting" : response.status === true ? "Verified" : "Rejected",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n")}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVCF = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const vcfContent = dataToExport
      .map(
        (response) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${response.name || response.team_name}\nTEL:${response.whatsapp_no}\nEMAIL:${response.nu_email}\nEND:VCARD`,
      )
      .join("\n");

    const encodedUri = encodeURI(`data:text/vcard;charset=utf-8,${vcfContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_contacts.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const handleSendWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
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

  const getPositionIcon = (position) => {
    const icons = {
      1: <Trophy className="h-4 w-4" />,
      2: <Medal className="h-4 w-4" />,
      3: <Award className="h-4 w-4" />,
    };
    return icons[position] || <Trophy className="h-4 w-4" />;
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MLSACFD-${result}`;
  };

  const handleSendCertificate = async (response) => {
    setProcessingEmailId(response.id);

    try {
      // Prepare list of recipients based on event type
      let recipients = [];

      if (is_competition) {
        recipients.push({
          name: response.member_one_name,
          email: response.member_one_numail,
          roll: response.member_one_rollno,
        });

        if (response.member_two_name) {
          recipients.push({
            name: response.member_two_name,
            email: response.member_two_numail,
            roll: response.member_two_rollno,
          });
        }
      } else {
        recipients.push({
          name: response.name,
          email: response.nu_email,
          roll: response.roll_no,
        });
      }

      // Filter out invalid recipients
      recipients = recipients.filter((r) => r.name && r.email);

      if (recipients.length === 0) {
        toast.error("No valid recipients found with email addresses");
        return;
      }

      const isWinner = winners.some((w) => w.response_id === response.id);
      const winnerDetails = winners.find((w) => w.response_id === response.id);
      const position = winnerDetails?.position;

      for (const recipient of recipients) {
        // Check for existing certificate code
        let code;
        const { data: existingCert } = await supabase
          .from("certification")
          .select("code")
          .eq("event_id", event_id)
          .eq("name", recipient.name)
          .maybeSingle();

        if (existingCert) {
          code = existingCert.code;
        } else {
          code = generateCode();
          const { error: insertError } = await supabase.from("certification").insert([
            {
              name: recipient.name,
              code: code,
              event_id: event_id,
              created_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
            console.error("Error inserting certificate:", insertError);
            code = generateCode(); // Retry once with new code
            await supabase.from("certification").insert([
              {
                name: recipient.name,
                code: code,
                event_id: event_id,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }

        // Set certificate data for rendering
        setCurrentCertificate({
          name: recipient.name,
          eventName: eventName,
          date: location.state?.date || new Date(),
          code: code,
          type: isWinner ? "Winner" : "Participant",
          position: position,
        });

        // Wait for render
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (certificateRef.current) {
          const dataUrl = await toPng(certificateRef.current, {
            cacheBust: true,
            pixelRatio: 1.5,
          });

          const base64Content = dataUrl.split(",")[1];
          const safeEventName = (eventName || "Event").replace(/[^a-z0-9]/gi, "_");

          console.log("Sending certificate to:", recipient.email);

          await sendCertificateEmail({
            to: recipient.email,
            recipientName: recipient.name,
            eventName: eventName || "Event",
            eventDate: new Date(location.state?.date || new Date()).toLocaleDateString(),
            certificateUrl: "#",
            position: isWinner ? position : undefined,
            attachments: [
              {
                filename: `${safeEventName}_Certificate.png`,
                content: base64Content,
                encoding: "base64",
              },
            ],
          });

          console.log(`Certificate sent successfully to ${recipient.name}`);
        }
      }

      toast.success(`Certificate(s) sent successfully`);
    } catch (error) {
      console.error("Error sending certificate:", error);
      toast.error("Failed to send certificate");
    } finally {
      setProcessingEmailId(null);
      setCurrentCertificate(null);
    }
  };

  return (
    <>
      {canViewRegistrations(permissions) ? (
        <div className="w-full space-y-6 px-2 py-4">
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
                  Manage Events
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 text-left">
                Organize, track, and manage all your events in one place
              </p>

              {}
              <div className="w-full max-w-3xl flex flex-col gap-5 items-center">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name or roll no..."
                    className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto items-center">
                  {is_competition && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-11 w-[180px] px-3 inline-flex items-center justify-between bg-background/60 backdrop-blur-xl border-border/50"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {statusFilter === "all"
                                ? "All Status"
                                : statusFilter === "verified"
                                  ? "Verified"
                                  : statusFilter === "rejected"
                                    ? "Rejected"
                                    : "Waiting"}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setStatusFilter("all");
                            setPage(0);
                          }}
                        >
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setStatusFilter("verified");
                            setPage(0);
                          }}
                        >
                          Verified
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
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 w-[180px] px-3 inline-flex items-center justify-between bg-background/60 backdrop-blur-xl border-border/50"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <UserCheck className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {attendanceFilter === "all"
                              ? "All Attendance"
                              : attendanceFilter === "present"
                                ? "Present"
                                : attendanceFilter === "absent"
                                  ? "Absent"
                                  : "Waiting"}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Filter by attendance</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setAttendanceFilter("all");
                          setPage(0);
                        }}
                      >
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setAttendanceFilter("present");
                          setPage(0);
                        }}
                      >
                        Present
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setAttendanceFilter("absent");
                          setPage(0);
                        }}
                      >
                        Absent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setAttendanceFilter("waiting");
                          setPage(0);
                        }}
                      >
                        Waiting
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 gap-2 flex-1 md:flex-none"
                      >
                        <FileDown className="h-4 w-4" />
                        Export
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export As</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExportCSV("all")}>
                        <FileDown className="w-4 mr-2" />
                        CSV (All)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportVCF("all")}>
                        <FileDown className="w-4 mr-2" />
                        VCF (All)
                      </DropdownMenuItem>
                      {is_competition && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleExportCSV("Verified")}>
                            <FileDown className="w-4 mr-2" />
                            CSV (Verified)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportVCF("Verified")}>
                            <FileDown className="w-4 mr-2" />
                            VCF (Verified)
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <CertificateGenerator
                    eventId={event_id}
                    eventName={eventName}
                    eventDate={location.state?.date || new Date()}
                    responses={previousResponses}
                    isCompetition={is_competition}
                    winners={winners}
                  />
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="registrations" className="space-y-4">
            <TabsList className="bg-background/60 border border-border/50 backdrop-blur-xl">
              <TabsTrigger value="registrations">Registrations</TabsTrigger>
              {is_competition && <TabsTrigger value="winners">Winners</TabsTrigger>}
            </TabsList>

            <TabsContent value="registrations" className="space-y-4">
              {}

              {}
              <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <Loading />
                    </div>
                  ) : (
                    <div>
                      {filteredResponses.length > 0 ? (
                        <ul className="divide-y divide-border/50">
                          {filteredResponses.map((response, idx) => (
                            <li
                              key={response.id}
                              className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                            >
                              {}
                              <div className="shrink-0">
                                <div className="w-14 h-14 rounded-full bg-white/95 text-black flex items-center justify-center font-bold text-xl border border-border/30">
                                  {response.date ? new Date(response.date).getDate() : idx + 1}
                                </div>
                              </div>

                              {}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                  <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                                    {is_competition ? response.team_name : response.name}
                                  </h3>

                                  {}
                                  <div className="flex items-center gap-2">
                                    {is_competition && (
                                      <Badge
                                        className={`${
                                          response.status === null
                                            ? "bg-orange-500"
                                            : response.status === true
                                              ? "bg-green-600"
                                              : "bg-red-600"
                                        } text-white border-none`}
                                      >
                                        {response.status === null
                                          ? "Waiting"
                                          : response.status === true
                                            ? "Verified"
                                            : "Rejected"}
                                      </Badge>
                                    )}

                                    <Badge
                                      className={`${
                                        getAttendance(response) === null
                                          ? "bg-orange-500"
                                          : getAttendance(response) === true
                                            ? "bg-green-600"
                                            : "bg-red-600"
                                      } text-white border-none`}
                                    >
                                      {getAttendance(response) === null
                                        ? "Waiting"
                                        : getAttendance(response) === true
                                          ? "Present"
                                          : "Absent"}
                                    </Badge>
                                  </div>
                                </div>

                                {}
                                <div className="text-sm text-muted-foreground space-y-3">
                                  {is_competition ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <div className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                                          Member 1
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Users className="w-3.5 h-3.5 text-primary" />
                                          <span className="font-medium text-foreground">
                                            {response.member_one_name || "-"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                          <span>{response.member_one_rollno || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-3.5 h-3.5 text-primary" />
                                          <span className="truncate">
                                            {response.member_one_numail || "-"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                                          Member 2
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Users className="w-3.5 h-3.5 text-primary" />
                                          <span className="font-medium text-foreground">
                                            {response.member_two_name || "-"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                          <span>{response.member_two_rollno || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-3.5 h-3.5 text-primary" />
                                          <span className="truncate">
                                            {response.member_two_numail || "-"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                        <span>{response.roll_no || "-"}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                        <span className="truncate">{response.nu_email || "-"}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-primary" />
                                        <span>{response.whatsapp_no || "-"}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {}
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  {is_competition && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          {response.status === true
                                            ? "Verified"
                                            : response.status === false
                                              ? "Rejected"
                                              : "Status"}
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
                                              <Check className="mr-2 w-4 h-4" /> Verify
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
                                              <X className="mr-2 w-4 h-4" /> Reject
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={updatingAttendanceId === response.id}
                                      >
                                        {getAttendance(response) === true
                                          ? "Present"
                                          : getAttendance(response) === false
                                            ? "Absent"
                                            : "Attendance"}
                                        <ChevronDown className="w-3.5 h-3.5 ml-2" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuLabel>Mark Attendance</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          updateAttendance(response, true);
                                        }}
                                      >
                                        {updatingAttendanceId === response.id &&
                                        updatingAttendanceValue === true ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                          </span>
                                        ) : (
                                          <>
                                            <Check className="mr-2 w-4 h-4" /> Present
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          updateAttendance(response, false);
                                        }}
                                      >
                                        {updatingAttendanceId === response.id &&
                                        updatingAttendanceValue === false ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                          </span>
                                        ) : (
                                          <>
                                            <X className="mr-2 w-4 h-4" /> Absent
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Contact
                                        <ChevronDown className="w-3.5 h-3.5 ml-2" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuLabel>Contact</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => handleSendWhatsApp(response.whatsapp_no)}
                                      >
                                        <MessageCircle className="mr-2 w-4 h-4" />
                                        Message
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleSendEmail(response.nu_email)}
                                      >
                                        <Mail className="mr-2 w-4 h-4" />
                                        Email
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleSendCertificate(response);
                                        }}
                                      >
                                        {processingEmailId === response.id ? (
                                          <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                          </span>
                                        ) : (
                                          <>
                                            <Award className="mr-2 w-4 h-4" />
                                            Send Certificate
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>

                                  {response.link && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(response.link)}
                                    >
                                      <Eye className="w-3.5 h-3.5 mr-1" />
                                      View Link
                                    </Button>
                                  )}

                                  {hasPermission(permissions, "events", "deleteEvent") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setResponseToDelete(response)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          {error ? "Error loading registrations" : "No registrations found"}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {filteredResponses.length > 0 && (
                <div className="fixed bottom-6 right-8 z-30 pointer-events-auto">
                  <div className="inline-flex items-center gap-3 rounded-full bg-background/85 backdrop-blur-2xl border border-border/80 px-4 py-2.5 shadow-xl text-xs text-muted-foreground transition-all duration-200 hover:shadow-2xl">
                    <span>
                      Showing{" "}
                      <strong className="text-foreground font-semibold">
                        {page * responsesPerPage + 1} -{" "}
                        {Math.min((page + 1) * responsesPerPage, totalResponses)}
                      </strong>{" "}
                      of <strong className="text-foreground font-semibold">{totalResponses}</strong>{" "}
                      results
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
            </TabsContent>

            {is_competition && (
              <TabsContent value="winners" className="space-y-4">
                <Card className="bg-background/60 border border-border/50 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Competition Winners</CardTitle>
                        <CardDescription>Manage and display competition winners</CardDescription>
                      </div>
                      <Button onClick={() => setIsWinnerDialogOpen(true)}>
                        <Trophy className="h-4 w-4 mr-2" />
                        Add Winner
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {winners.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        {winners
                          .sort((a, b) => a.position - b.position)
                          .map((winner) => {
                            const response = filteredResponses.find(
                              (r) => r.id === winner.response_id,
                            );
                            return (
                              <Card
                                key={winner.id}
                                className="overflow-hidden bg-background/60 backdrop-blur-xl border-border/50"
                              >
                                <CardHeader className="p-4 border-b border-border/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getPositionIcon(winner.position)}
                                      <CardTitle className="text-lg">
                                        Position {winner.position}
                                      </CardTitle>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                      onClick={() => removeWinner(winner.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  {winner.img_url && (
                                    <img
                                      src={winner.img_url}
                                      alt={`Winner ${winner.position}`}
                                      className="w-full h-48 object-cover rounded-md mb-4"
                                    />
                                  )}
                                  <div className="space-y-2">
                                    <p className="font-semibold text-lg">
                                      {response?.team_name || "Team Name"}
                                    </p>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <p>Member 1: {response?.member_one_name || "N/A"}</p>
                                      <p>Member 2: {response?.member_two_name || "N/A"}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Winners Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add winners to showcase competition results
                        </p>
                        <Button onClick={() => setIsWinnerDialogOpen(true)}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Add First Winner
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          <AlertDialog
            open={!!responseToDelete}
            onOpenChange={(open) => !open && setResponseToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the registration.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteResponse}
                  disabled={deletingId === responseToDelete?.id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingId === responseToDelete?.id ? (
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
          </AlertDialog>

          {is_competition && (
            <Dialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Competition Winner</DialogTitle>
                  <DialogDescription>
                    Select a team and position to add as a winner
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Team</label>
                    <Select
                      value={selectedWinner?.id?.toString()}
                      onValueChange={(value) => {
                        const winner = filteredResponses.find((r) => r.id.toString() === value);
                        setSelectedWinner(winner);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredResponses
                          .filter(
                            (r) =>
                              r.status === true && !winners.some((w) => w.response_id === r.id),
                          )
                          .map((response) => (
                            <SelectItem key={response.id} value={response.id.toString()}>
                              {response.team_name} - {response.member_one_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position</label>
                    <Select
                      value={winnerPosition?.toString()}
                      onValueChange={(value) => setWinnerPosition(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            1st Place
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2">
                            <Medal className="h-4 w-4 text-gray-400" />
                            2nd Place
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-700" />
                            3rd Place
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image URL (Optional)</label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={winnerImageUrl}
                      onChange={(e) => setWinnerImageUrl(e.target.value)}
                    />
                  </div>

                  {selectedWinner && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium mb-2">Selected Team:</p>
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{selectedWinner.team_name}</p>
                          <p className="text-muted-foreground">
                            {selectedWinner.member_one_name} & {selectedWinner.member_two_name}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWinnerDialogOpen(false);
                      setSelectedWinner(null);
                      setWinnerPosition(null);
                      setWinnerImageUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addWinner} disabled={!selectedWinner || !winnerPosition}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Add Winner
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      ) : (
        navigator("/nopermission")
      )}
      <div className="fixed left-[-9999px] top-[-9999px]">
        {currentCertificate && <Certificate ref={certificateRef} {...currentCertificate} />}
      </div>
    </>
  );
}

export default EventDetails;
