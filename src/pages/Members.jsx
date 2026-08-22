import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  File,
  Mail,
  MessageCircle,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  Phone,
  Eye,
  Check,
  X,
  Heart,
  Filter,
  ChevronDown,
  Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Loading from "@/components/layout/Loading";
import { FormatDate } from "@/components/subcomponents/FormatDate";
import { supabase } from "@/lib/supabase";
import { useOutletContext } from "react-router-dom";
import { canManageMembers } from "@/lib/permissions";

import {
  useMembersQuery,
  useUpdateMemberStatusMutation,
  useDeleteMemberMutation,
} from "@/hooks/queries/useMembers";

export function Members() {
  const navigateto = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  useEffect(() => {
    if (access && !canManageMembers(access)) {
      navigateto("/no-permission");
    }
  }, [access, navigateto]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [exportFilter, setExportFilter] = useState("all");
  const [responseToView, setResponseToView] = useState(null);
  const [responseToDelete, setResponseToDelete] = useState(null);
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

  const {
    data: membersData,
    isLoading: loading,
    isError: error,
  } = useMembersQuery({
    page,
    limit: responsesPerPage,
    status: statusFilter,
    team: teamFilter,
    search: debouncedSearchTerm,
  });

  const updateMemberStatusMutation = useUpdateMemberStatusMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const filteredResponses = membersData?.data || [];
  const totalResponses = membersData?.total || 0;

  const teamsList = useMemo(() => {
    const found = filteredResponses.flatMap((d) => (d && d.team ? [String(d.team)] : []));
    return Array.from(new Set(found));
  }, [filteredResponses]);

  // Granular loading states
  const updatingStatusId = updateMemberStatusMutation.isPending
    ? updateMemberStatusMutation.variables?.id
    : null;
  const updatingStatusValue = updateMemberStatusMutation.isPending
    ? updateMemberStatusMutation.variables?.active
    : undefined;
  const deletingId = deleteMemberMutation.isPending ? responseToDelete?.id : null;

  const updateResponseStatus = async (responseupdate, status) => {
    try {
      await updateMemberStatusMutation.mutateAsync({
        id: responseupdate.id,
        active: Boolean(status),
      });
      setResponseToView((prev) => (prev?.id === responseupdate.id ? { ...prev, status } : prev));
    } catch {}
  };

  const deleteResponse = async () => {
    if (!responseToDelete) return;
    try {
      await deleteMemberMutation.mutateAsync(String(responseToDelete.id));
      setResponseToDelete(null);
    } catch {}
  };

  const fetchFilteredResponses = async (type) => {
    const { data, error } = await supabase.from("members").select("*");

    if (error || !Array.isArray(data)) {
      return [];
    }

    let results = data;
    if (type === "active") {
      results = results.filter((response) => response.status === true);
    } else if (type === "inactive") {
      results = results.filter((response) => response.status === false);
    }

    if (teamFilter && teamFilter !== "all") {
      results = results.filter((r) => r.team === teamFilter);
    }

    return results;
  };

  const handleExportCSV = async (type) => {
    const dataToExport = await fetchFilteredResponses(type);

    const csvContent = [
      ["name", "roll_no", "nu_email", "whatsapp_no", "team", "status"],
      ...dataToExport.map((response) => [
        response.name,
        response.roll_no,
        response.nu_email,
        response.whatsapp_no,
        response.team,
        response.status === true ? "Active" : "Inactive",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `members_${type || "all"}.csv`;
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
    link.download = `members_${type || "all"}.vcf`;
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
                      placeholder="Search members..."
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
                              : statusFilter === "active"
                                ? "Active"
                                : "Inactive"}
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Filter Members</DropdownMenuLabel>
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
                              setStatusFilter("active");
                              setPage(0);
                            }}
                          >
                            Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusFilter("inactive");
                              setPage(0);
                            }}
                          >
                            Inactive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {}
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
                              ({exportFilter[0].toUpperCase() + exportFilter.slice(1)})
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
                            handleExportCSV("active");
                            setExportFilter("active");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (Active)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportCSV("inactive");
                            setExportFilter("inactive");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          CSV (Inactive)
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
                            handleExportVCF("active");
                            setExportFilter("active");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (Active)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleExportVCF("inactive");
                            setExportFilter("inactive");
                          }}
                        >
                          <FileDown className="w-4 mr-2" />
                          VCF (Inactive)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                            No members found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "Try adjusting your search"
                              : error
                                ? "Error loading members"
                                : "No members available"}
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
                                    response.status === true
                                      ? "bg-green-700 text-white border-none"
                                      : "bg-red-600 text-white border-none"
                                  }`}
                                >
                                  {response.status === true ? "Active" : "Inactive"}
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
                                        {response.status === true
                                          ? "Active"
                                          : response.status === false
                                            ? "Inactive"
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
                                            <Check className="mr-2 w-4" />
                                            Set Active
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
                                            Set Inactive
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
                                    {response.nu_email ? (
                                      <DropdownMenuItem
                                        onClick={() => handleSendEmail(response.nu_email)}
                                      >
                                        <Mail className="mr-2 w-4" />
                                        Email
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="opacity-70 pointer-events-none">
                                        <Mail className="mr-2 w-4" />
                                        Email (no address)
                                      </DropdownMenuItem>
                                    )}

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
                              <div className="text-xs text-muted-foreground">Joined</div>
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
                          members
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
                          Member Details - {responseToView.name}
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-start space-y-3">
                          <div>
                            <strong>Roll No:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.roll_no || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <strong>Email:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.nu_email || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <strong>WhatsApp:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.whatsapp_no || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <strong>Team:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.team || "Not assigned"}
                            </p>
                          </div>
                          <div>
                            <strong>Status:</strong>
                            <p className="wrap-break-word text-foreground mt-1">
                              {responseToView.status ? "Active" : "Inactive"}
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
                          This action will permanently delete{" "}
                          <strong>{responseToDelete.name}</strong> from members. This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteResponse}
                          disabled={deletingId === responseToDelete?.id}
                          className="bg-red-600 text-white hover:bg-red-700"
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
    </>
  );
}

export default Members;
