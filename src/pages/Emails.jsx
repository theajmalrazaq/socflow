import { useState, useEffect, startTransition } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Search,
  File,
  Mail,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Heart,
  Filter,
  ChevronDown,
  Hourglass,
  Pause,
  MessageSquare,
  Reply,
  Send,
  Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import Loading from "@/components/layout/Loading";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FormatDate } from "@/components/subcomponents/FormatDate";
import { sendContactResponseEmail } from "@/lib/emailService.jsx";
import { useOutletContext } from "react-router-dom";
import { canManageEmails, hasPermission } from "@/lib/permissions";

export function Emails() {
  const navigateto = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [error, setError] = useState(null);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportFilter, setExportFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [previousResponses, setPreviousResponses] = useState([]);
  const [responseToView, setResponseToView] = useState(null);
  const [responseToReply, setResponseToReply] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Granular loading states
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingStatusValue, setUpdatingStatusValue] = useState(undefined);
  const [_deletingId, setDeletingId] = useState(null);

  const responsesPerPage = 10;

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

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);

      const from = page * responsesPerPage;
      const to = (page + 1) * responsesPerPage - 1;

      let query = supabase.from("contactResponses").select("*", {
        count: "exact",
      });

      if (statusFilter === "responded") {
        query = query.eq("status", true);
      } else if (statusFilter === "on_hold") {
        query = query.eq("status", false);
      } else if (statusFilter === "waiting") {
        query = query.is("status", null);
      }

      let { data, count, error } = await query.order("id", { ascending: false }).range(from, to);

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
  }, [page, responsesPerPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();

      let searchQuery = supabase
        .from("contactResponses")
        .select("*")
        .or(
          `Name.ilike.%${lowerCaseSearchTerm}%,Email.ilike.%${lowerCaseSearchTerm}%,Subject.ilike.%${lowerCaseSearchTerm}%`,
        );

      if (statusFilter === "responded") {
        searchQuery = searchQuery.eq("status", true);
      } else if (statusFilter === "on_hold") {
        searchQuery = searchQuery.eq("status", false);
      } else if (statusFilter === "waiting") {
        searchQuery = searchQuery.is("status", null);
      }

      const { data: responsesForSearch, error } = await searchQuery;

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
  }, [debouncedSearchTerm, previousResponses, statusFilter]);

  const updateResponseStatus = async (responseupdate, status) => {
    setUpdatingStatusId(responseupdate.id);
    setUpdatingStatusValue(status);

    try {
      const { error } = await supabase
        .from("contactResponses")
        .update({ status })
        .eq("id", responseupdate.id);

      if (error) throw error;

      setFilteredResponses((prevResponses) =>
        prevResponses.map((response) =>
          response.id === responseupdate.id ? { ...response, status } : response,
        ),
      );

      setPreviousResponses((prev) =>
        prev.map((response) =>
          response.id === responseupdate.id ? { ...response, status } : response,
        ),
      );

      setResponseToView((prev) => (prev?.id === responseupdate.id ? { ...prev, status } : prev));

      toast(
        <div>
          <strong>Updated!!</strong>
          <div>Status Updated Successfully!!</div>
        </div>,
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>{err?.message || "Unable to update status"}</div>
        </div>,
      );
    } finally {
      setUpdatingStatusId(null);
      setUpdatingStatusValue(undefined);
    }
  };

  const deleteResponse = async () => {
    if (!responseToDelete) return;
    setDeletingId(responseToDelete.id);
    const { error } = await supabase
      .from("contactResponses")
      .delete()
      .eq("id", String(responseToDelete.id));

    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Unable to delete response</div>
        </div>,
      );
    } else {
      setFilteredResponses((prevResponses) =>
        prevResponses.filter((response) => response.id !== responseToDelete.id),
      );
      setPreviousResponses((prevResponses) =>
        prevResponses.filter((response) => response.id !== responseToDelete.id),
      );
      setResponseToDelete(null);
      toast(
        <div>
          <strong>Deleted!!</strong>
          <div>Response deleted successfully.</div>
        </div>,
      );
    }
    setDeletingId(null);
  };

  const fetchFilteredResponses = async (type) => {
    const { data, error } = await supabase.from("contactResponses").select("*");

    if (error) {
      return [];
    }

    if (type === "responded") {
      return data.filter((response) => response.status === true);
    } else if (type === "on_hold") {
      return data.filter((response) => response.status === false);
    } else if (type === "waiting") {
      return data.filter((response) => response.status === null);
    } else if (type === "all") {
      return data;
    }

    return [];
  };

  const handleExportCSV = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const csvContent = [
      ["Name", "Email", "Subject", "Message", "Status"],
      ...dataToExport.map((response) => [
        response.Name,
        response.Email,
        response.Subject,
        response.Message,
        response.status === null ? "Waiting" : response.status === true ? "Responded" : "On Hold",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contact_responses_${type || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVCF = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const vcfContent = dataToExport
      .map(
        (response) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${response.Name}\nEMAIL:${response.Email}\nEND:VCARD`,
      )
      .join("\n");

    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contact_responses_${type || "all"}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendReply = async () => {
    if (!responseToReply || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setSendingReply(true);

    try {
      await sendContactResponseEmail({
        to: responseToReply.Email,
        recipientName: responseToReply.Name,
        originalSubject: responseToReply.Subject,
        originalMessage: responseToReply.Message,
        responseMessage: replyMessage,
        responderName: "MLSA CFD Team",
      });

      toast.success("Reply sent successfully!");
      setResponseToReply(null);
      setReplyMessage("");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
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
      {access ? (
        canManageEmails(access) ? (
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
                              : statusFilter === "responded"
                                ? "Responded"
                                : statusFilter === "on_hold"
                                  ? "On Hold"
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
                              setStatusFilter("responded");
                              setPage(0);
                            }}
                          >
                            Responded
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusFilter("on_hold");
                              setPage(0);
                            }}
                          >
                            On Hold
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
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportCSV("responded");
                            setExportFilter("responded");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (Responded)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportCSV("on_hold");
                            setExportFilter("on_hold");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (On Hold)
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
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportVCF("responded");
                            setExportFilter("responded");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (Responded)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportVCF("on_hold");
                            setExportFilter("on_hold");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (On Hold)
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
                    {hasPermission(access, "emails", "sendEmail") && (
                      <Button
                        size="lg"
                        className="h-11 gap-2 cursor-pointer"
                        onClick={() => {
                          startTransition(() => {
                            navigateto("/emails/compose");
                          });
                        }}
                      >
                        <Mail className="h-4 w-4" />
                        Compose Email
                      </Button>
                    )}
                  </div>
                </div>

                {}
                <div className="w-full">
                  {filteredResponses.length === 0 ? (
                    <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-xl font-semibold text-muted-foreground mb-2">
                            No responses found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "Try adjusting your search"
                              : error
                                ? "Error loading responses"
                                : "No contact responses available"}
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
                                {response.Name?.charAt(0).toUpperCase() || "?"}
                              </div>
                            </div>

                            {}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                                  {response.Name}
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
                                      ? "Responded"
                                      : "On Hold"}
                                </Badge>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                                {response.Email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">{response.Email}</span>
                                  </div>
                                )}
                                {response.Subject && (
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate max-w-xs">{response.Subject}</span>
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
                                            ? "Responded"
                                            : "On Hold"}
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
                                            Set Responded
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
                                            <Pause className="mr-2 w-4" />
                                            Set On Hold
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
                                            <Hourglass className="mr-2 w-4" />
                                            Set Waiting
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResponseToReply(response);
                                    setReplyMessage("");
                                  }}
                                >
                                  <Reply className="w-3.5 h-3.5 mr-1" />
                                  Reply
                                </Button>

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
                              <div className="text-xs text-muted-foreground">Received</div>
                              <div className="text-sm font-semibold">
                                {response.created_at ? (
                                  <FormatDate dateString={response.created_at} />
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
                          Message Details - {responseToView.Name}
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-start space-y-3">
                          <div>
                            <strong>Subject:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.Subject || "No subject"}
                            </p>
                          </div>
                          <div>
                            <strong>Message:</strong>
                            <p className="wrap-break-word text-foreground mt-1 whitespace-pre-wrap">
                              {responseToView.Message || "No message"}
                            </p>
                          </div>
                          <div>
                            <strong>Email:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.Email || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <strong>Status:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.status === null
                                ? "Waiting"
                                : responseToView.status === true
                                  ? "Responded"
                                  : "On Hold"}
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

                {/* Reply Dialog */}
                <Dialog
                  open={Boolean(responseToReply)}
                  onOpenChange={(open) => {
                    if (!open) {
                      setResponseToReply(null);
                      setReplyMessage("");
                    }
                  }}
                >
                  {responseToReply && (
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Reply to {responseToReply.Name}</DialogTitle>
                        <DialogDescription>
                          Send a response email to this contact form submission
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* Original Message */}
                        <div className="bg-muted/50 p-4 rounded-lg border border-border">
                          <div className="text-sm font-semibold mb-2">Original Message:</div>
                          <div className="text-xs text-muted-foreground mb-1">
                            <strong>Subject:</strong> {responseToReply.Subject}
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-wrap">
                            {responseToReply.Message}
                          </div>
                        </div>

                        {/* Reply Message */}
                        <div>
                          <label className="text-sm font-semibold mb-2 block">Your Response:</label>
                          <Textarea
                            placeholder="Type your response here..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={8}
                            className="resize-none"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResponseToReply(null);
                            setReplyMessage("");
                          }}
                          disabled={sendingReply}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyMessage.trim()}
                        >
                          {sendingReply ? (
                            <>Sending...</>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Reply
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>

                {/* Delete Confirmation Dialog */}
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
                          <strong>{responseToDelete.Name}</strong>. This action cannot be undone.
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
                    Designed & Built with{" "}
                    <Heart className="w-3.5 h-3.5 mx-1 text-red-500 fill-red-500 inline" /> for
                    <span className="text-primary font-semibold ml-1">Socflow</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <Navigate to="/nopermission" replace />
        )
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
      )}
    </>
  );
}

export default Emails;
