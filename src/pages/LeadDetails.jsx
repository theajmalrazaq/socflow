import { useState, useEffect } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  Mail,
  File,
  MessageCircle,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PlusCircle,
  Search,
  Check,
  X,
  Edit,
  Heart,
  Users,
  Phone,
  Linkedin,
  User,
  ChevronDown,
  Loader,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Loading from "@/components/layout/Loading";
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
import { canManageLeads, hasPermission } from "@/lib/permissions";

export function LeadDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutletContext();
  const permissions =
    location.state?.permissions || location.state?.Permissions || outlet?.permissions;
  const { lead_id, lead_title } = location.state || {};

  useEffect(() => {
    if (permissions && !canManageLeads(permissions)) {
      navigate("/nopermission");
    }
  }, [permissions, navigate]);

  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [_fetchError, setFetchError] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [newLeadMember, setNewLeadMember] = useState({
    name: "",
    roll_no: "",
    nu_email: "",
    whatsapp_no: "",
    designation: "",
    linkedin: "",
    avatar: "",
  });
  const [idtoupdate, setidtoupdate] = useState(null);
  const [isCreatingNewMember, setIsCreatingNewMember] = useState(false);
  const [isupdating, setIsUpdating] = useState(false);
  const [exportFilter, setExportFilter] = useState("all");

  // Granular loading states
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingStatusValue, setUpdatingStatusValue] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [updatingMember, setUpdatingMember] = useState(false);

  const leadsPerPage = 10;

  useEffect(() => {
    if (isupdating && idtoupdate) {
      setNewLeadMember({
        name: idtoupdate.name || "",
        roll_no: idtoupdate.roll_no || "",
        nu_email: idtoupdate.nu_email || "",
        whatsapp_no: idtoupdate.whatsapp_no || "",
        designation: idtoupdate.designation || "",
        linkedin: idtoupdate.linkedin || "",
        avatar: idtoupdate.avatar || "",
      });
    }
  }, [isupdating, idtoupdate]);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);

      const { data, error, count } = await supabase
        .from("leadsData")
        .select("*", { count: "exact" })
        .range(page * leadsPerPage, (page + 1) * leadsPerPage - 1)
        .eq("lead_id", lead_id)
        .order("id", { ascending: true });

      if (error) {
        setFetchError(error);
        console.error(error);
      } else {
        setLeads(data || []);
        setFilteredLeads(data || []);
        setTotalLeads(count || 0);
      }
      setLoading(false);
    };

    if (lead_id) {
      fetchLeads();
    }
  }, [page, leadsPerPage, lead_id]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    setFilteredLeads(
      leads.filter((lead) =>
        Object.values(lead).some(
          (value) => typeof value === "string" && value.toLowerCase().includes(lowerCaseSearchTerm),
        ),
      ),
    );
  }, [searchTerm, leads]);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingStatusId(id);
    setUpdatingStatusValue(status);
    const { error } = await supabase.from("leadsData").update({ status }).eq("id", String(id));
    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Unable to update status</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
      );
      setFilteredLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
      );
      toast(
        <div>
          <strong>Updated!!</strong>
          <div>Status Updated Successfully!!</div>
        </div>,
      );
    }
    setUpdatingStatusId(null);
    setUpdatingStatusValue(undefined);
  };

  const deleteLead = async () => {
    if (!leadToDelete) return;
    setDeletingId(leadToDelete.id);
    const { error } = await supabase.from("leadsData").delete().eq("id", String(leadToDelete.id));
    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Unable to delete lead</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadToDelete.id));
      setFilteredLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadToDelete.id));
      setLeadToDelete(null);
      toast(
        <div>
          <strong>Deleted!!</strong>
          <div>Lead deleted successfully.</div>
        </div>,
      );
    }
    setDeletingId(null);
  };

  const handleCreateNewLead = async () => {
    if (!newLeadMember.name) {
      toast(
        <div>
          <strong>Error</strong>
          <div>Name cannot be empty.</div>
        </div>,
      );
      return;
    }

    setCreatingMember(true);
    const { data, error } = await supabase
      .from("leadsData")
      .insert([{ ...newLeadMember, lead_id }])
      .select("*");

    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Failed to create new member.</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) => [...prevLeads, data[0]]);
      setFilteredLeads((prev) => [...prev, data[0]]);
      setNewLeadMember({
        name: "",
        roll_no: "",
        nu_email: "",
        whatsapp_no: "",
        designation: "",
        linkedin: "",
        avatar: "",
      });
      toast(
        <div>
          <strong>Success!!</strong>
          <div>New member created successfully.</div>
        </div>,
      );
      setIsCreatingNewMember(false);
    }
    setCreatingMember(false);
  };

  const handleUpdateLead = async () => {
    setUpdatingMember(true);
    const { data, error } = await supabase
      .from("leadsData")
      .update({ ...newLeadMember })
      .eq("id", String(idtoupdate.id))
      .select("*");

    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Failed to update member.</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === idtoupdate.id ? { ...lead, ...data[0] } : lead)),
      );
      setFilteredLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === idtoupdate.id ? { ...lead, ...data[0] } : lead)),
      );
      toast(
        <div>
          <strong>Success!!</strong>
          <div>Member updated successfully.</div>
        </div>,
      );
      setIsUpdating(false);
      setidtoupdate(null);
    }
    setUpdatingMember(false);
  };

  const handleExportCSV = async (statusFilter) => {
    setLoading(true);
    const { data: dataToExport, error } = await supabase
      .from("leadsData")
      .select("*")
      .eq("lead_id", lead_id);

    if (error) {
      toast(
        <div>
          <strong>Error</strong>
          <div>Failed to fetch data.</div>
        </div>,
      );
      setLoading(false);
      return;
    }

    let filtered = dataToExport;

    if (statusFilter) {
      filtered = dataToExport.filter(
        (lead) =>
          (statusFilter === "active" && lead.status === true) ||
          (statusFilter === "inactive" && lead.status !== true),
      );
    }

    const csvContent = [
      ["Name", "Roll No", "Email", "Whatsapp", "Designation", "LinkedIn", "Avatar", "Status"],
      ...filtered.map((lead) => [
        lead.name,
        lead.roll_no,
        lead.nu_email,
        lead.whatsapp_no,
        lead.designation,
        lead.linkedin,
        lead.avatar,
        lead.status === true ? "Active" : "Inactive",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lead_title}_${statusFilter || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setLoading(false);
  };

  const handleExportVCF = async (statusFilter) => {
    setLoading(true);
    const { data: dataToExport, error } = await supabase
      .from("leadsData")
      .select("*")
      .eq("lead_id", lead_id);

    if (error) {
      toast(
        <div>
          <strong>Error</strong>
          <div>Failed to fetch data.</div>
        </div>,
      );
      setLoading(false);
      return;
    }

    let filtered = dataToExport;

    if (statusFilter) {
      filtered = dataToExport.filter(
        (lead) =>
          (statusFilter === "active" && lead.status === true) ||
          (statusFilter === "inactive" && lead.status !== true),
      );
    }

    const vcfContent = filtered
      .map(
        (lead) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${lead.name}\nTEL:${lead.whatsapp_no}\nEMAIL:${lead.nu_email}\nEND:VCARD`,
      )
      .join("\n");

    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lead_title}_${statusFilter || "all"}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setLoading(false);
  };

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (filteredLeads.length === leadsPerPage) setPage(page + 1);
  };

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

            <div className="flex gap-2 w-full md:w-auto">
              {hasPermission(permissions, "leads", "exportData") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" variant="outline" className="h-11 gap-2 flex-1 md:flex-none">
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        handleExportCSV();
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
                    {}
                    <DropdownMenuItem
                      onClick={() => {
                        handleExportVCF();
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
                    {}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {hasPermission(permissions, "leads", "addMember") && (
                <Button
                  size="lg"
                  className="h-11 gap-2 flex-1 md:flex-none"
                  onClick={() => setIsCreatingNewMember(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Member
                </Button>
              )}
            </div>
          </div>

          {}
          <div className="w-full">
            {filteredLeads.length === 0 ? (
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
                        : "Get started by adding your first member"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <ul className="divide-y divide-border/50">
                  {filteredLeads.map((lead) => (
                    <li
                      key={lead.id}
                      className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                    >
                      {}
                      <div className="shrink-0">
                        <Avatar className="size-14 rounded-full border border-border/60 shadow-xs">
                          {lead.avatar && lead.avatar.startsWith("http") && (
                            <AvatarImage
                              src={lead.avatar}
                              alt={lead.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {lead.name
                              ? lead.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "ML"}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                            {lead.name}
                          </h3>
                          <Badge
                            className={
                              lead.status === true
                                ? "bg-green-700 text-white border-none"
                                : "bg-red-600 text-white border-none"
                            }
                          >
                            {lead.status === true ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                          {lead.designation && (
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate">{lead.designation}</span>
                            </div>
                          )}
                          {lead.roll_no && (
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-primary" />
                              <span>{lead.roll_no}</span>
                            </div>
                          )}
                          {lead.nu_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate">{lead.nu_email}</span>
                            </div>
                          )}
                          {lead.whatsapp_no && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-primary" />
                              <span>{lead.whatsapp_no}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {hasPermission(permissions, "leads", "changeStatus") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {lead.status === true
                                    ? "Active"
                                    : lead.status === false
                                      ? "Inactive"
                                      : "Status"}
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleStatusUpdate(lead.id, true);
                                  }}
                                >
                                  {updatingStatusId === lead.id && updatingStatusValue === true ? (
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
                                    handleStatusUpdate(lead.id, false);
                                  }}
                                >
                                  {updatingStatusId === lead.id && updatingStatusValue === false ? (
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
                                {}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {lead.whatsapp_no && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://wa.me/${lead.whatsapp_no}`)}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              Message
                            </Button>
                          )}

                          {lead.linkedin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(lead.linkedin)}
                            >
                              <Linkedin className="w-3.5 h-3.5 mr-1" />
                              LinkedIn
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsUpdating(true);
                              setidtoupdate(lead);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>

                          {hasPermission(permissions, "leads", "deleteLead") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setLeadToDelete(lead)}
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
              </div>
            )}

            {}
            {filteredLeads.length > 0 && (
              <div className="fixed bottom-6 right-8 z-30 pointer-events-auto">
                <div className="inline-flex items-center gap-3 rounded-full bg-background/85 backdrop-blur-2xl border border-border/80 px-4 py-2.5 shadow-xl text-xs text-muted-foreground transition-all duration-200 hover:shadow-2xl">
                  <span>
                    Showing{" "}
                    <strong className="text-foreground font-semibold">
                      {page * leadsPerPage + 1} - {Math.min((page + 1) * leadsPerPage, totalLeads)}
                    </strong>{" "}
                    of <strong className="text-foreground font-semibold">{totalLeads}</strong>{" "}
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
                      disabled={filteredLeads.length < leadsPerPage}
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
            open={isCreatingNewMember}
            onOpenChange={(open) => !open && setIsCreatingNewMember(false)}
          >
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>Enter the details for the new team member.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Full Name *"
                  value={newLeadMember.name}
                  onChange={(e) => setNewLeadMember({ ...newLeadMember, name: e.target.value })}
                />
                <Input
                  placeholder="Roll Number"
                  value={newLeadMember.roll_no}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      roll_no: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newLeadMember.nu_email}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      nu_email: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="WhatsApp Number"
                  value={newLeadMember.whatsapp_no}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      whatsapp_no: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Designation"
                  value={newLeadMember.designation}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      designation: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="LinkedIn Profile URL"
                  value={newLeadMember.linkedin}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      linkedin: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Avatar URL"
                  value={newLeadMember.avatar}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      avatar: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateNewLead}
                  disabled={creatingMember}
                  className="bg-green-700 text-white hover:bg-green-800"
                >
                  {creatingMember ? (
                    <span className="flex items-center">
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Member"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {}
          <Dialog open={isupdating} onOpenChange={(open) => !open && setIsUpdating(false)}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Update Member</DialogTitle>
                <DialogDescription>Update the details for this team member.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Full Name *"
                  value={newLeadMember.name}
                  onChange={(e) => setNewLeadMember({ ...newLeadMember, name: e.target.value })}
                />
                <Input
                  placeholder="Roll Number"
                  value={newLeadMember.roll_no}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      roll_no: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newLeadMember.nu_email}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      nu_email: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="WhatsApp Number"
                  value={newLeadMember.whatsapp_no}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      whatsapp_no: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Designation"
                  value={newLeadMember.designation}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      designation: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="LinkedIn Profile URL"
                  value={newLeadMember.linkedin}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      linkedin: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Avatar URL"
                  value={newLeadMember.avatar}
                  onChange={(e) =>
                    setNewLeadMember({
                      ...newLeadMember,
                      avatar: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleUpdateLead}
                  disabled={updatingMember}
                  className="bg-green-700 text-white hover:bg-green-800"
                >
                  {updatingMember ? (
                    <span className="flex items-center">
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Member"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {}
          <AlertDialog
            open={Boolean(leadToDelete)}
            onOpenChange={(open) => !open && setLeadToDelete(null)}
          >
            {leadToDelete && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete <strong>{leadToDelete.name}</strong> from
                    this lead team. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteLead}
                    disabled={deletingId === leadToDelete?.id}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deletingId === leadToDelete?.id ? (
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
        </motion.div>
      )}
    </>
  );
}

export default LeadDetails;
