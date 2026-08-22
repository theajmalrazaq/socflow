import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Heart,
  Users,
  Search,
  FolderOpen,
  Loader,
} from "lucide-react";
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
import { toast } from "sonner";
import { canManageLeads, hasPermission } from "@/lib/permissions";

export function Leads() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;
  const [leads, setLeads] = useState([]);
  const [setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [title, setTitle] = useState("");
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [isCreatingNewLead, setIsCreatingNewLead] = useState(false);
  const [page, setPage] = useState(0);
  const [leadsPerPage] = useState(10);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [search, setSearch] = useState("");

  // Granular loading states
  const [updatingLeadId, setUpdatingLeadId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [creatingLead, setCreatingLead] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("allLeads")
        .select("*")
        .order("id", { ascending: false })
        .range(page * leadsPerPage, (page + 1) * leadsPerPage - 1);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        (data || []).map(async (lead) => {
          try {
            const { count, error: countError } = await supabase
              .from("leadsData")
              .select("*", { count: "exact" })
              .eq("lead_id", lead.id);

            if (countError) {
              console.warn("lead members count error", countError);
            }
            return { ...lead, memberCount: count || 0 };
          } catch (e) {
            console.error("Error enriching lead", e);
            return { ...lead, memberCount: 0 };
          }
        }),
      );

      setLeads(enriched);
      setFilteredResponses(enriched);
      setLoading(false);
    };

    fetchLeads();
  }, [page, leadsPerPage, setError]);

  const handleUpdate = async () => {
    setUpdatingLeadId(selectedLead.id);
    const { error } = await supabase
      .from("allLeads")
      .update({
        title: title || null,
      })
      .eq("id", String(selectedLead.id));

    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Lead Update Unsuccessful</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === selectedLead.id
            ? {
                ...lead,
                title: title || null,
              }
            : lead,
        ),
      );
      setSelectedLead(null);
      toast(
        <div>
          <strong>Updated!!</strong>
          <div>
            Lead Updated Successfully!!
            <a href="https://mlsacfd.vercel.app/team" target="_blank" rel="noreferrer">
              <button
                alt="view"
                className="underline text-sm ml-2 leading-none hover:opacity-80 transition-opacity"
              >
                View
              </button>
            </a>
          </div>
        </div>,
      );
    }
    setUpdatingLeadId(null);
  };

  const deleteLead = async () => {
    setDeletingId(leadToDelete.id);
    const { error } = await supabase.from("allLeads").delete().eq("id", String(leadToDelete.id));
    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Unable to delete lead</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadToDelete.id));
      setFilteredResponses((prev) => prev.filter((lead) => lead.id !== leadToDelete.id));
      setLeadToDelete(null);
      toast(
        <div>
          <strong>Deleted!!</strong>
          <div>Lead Deleted Successfully!!</div>
        </div>,
      );
    }
    setDeletingId(null);
  };

  const handleCreateNewLead = async () => {
    if (!newLeadTitle.trim()) {
      toast(
        <div>
          <strong>Error</strong>
          <div>Lead title cannot be empty.</div>
        </div>,
      );
      return;
    }

    setCreatingLead(true);
    const { data, error } = await supabase
      .from("allLeads")
      .insert([{ title: newLeadTitle }])
      .select("*");

    if (error) {
      toast(
        <div>
          <strong>Failed!!</strong>
          <div>Failed to create new lead.</div>
        </div>,
      );
    } else {
      setLeads((prevLeads) => [{ ...data[0], memberCount: 0 }, ...prevLeads]);
      setFilteredResponses((prev) => [{ ...data[0], memberCount: 0 }, ...prev]);
      setNewLeadTitle("");
      toast(
        <div>
          <strong>Success!!</strong>
          <div>New lead created successfully.</div>
        </div>,
      );
      setIsCreatingNewLead(false);
    }
    setCreatingLead(false);
  };

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (leads.length === leadsPerPage) setPage(page + 1);
  };

  useEffect(() => {
    if (!search) {
      setFilteredResponses(leads);
      return;
    }
    const q = search.toLowerCase();
    setFilteredResponses(leads.filter((lead) => (lead.title || "").toLowerCase().includes(q)));
  }, [search, leads]);

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
      ) : !canManageLeads(access) ? (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xl font-semibold text-muted-foreground mb-2">No Permission</p>
                <p className="text-sm text-muted-foreground">
                  {"You don't have access to view this page."}
                </p>
                <Button onClick={() => navigate("/")} className="mt-4">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full flex flex-col items-start px-2 py-4">
          {/* Search & Actions Bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:w-80 md:w-96 max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
              />
            </div>

            <Button
              size="lg"
              className="h-11 gap-2 w-full sm:w-auto"
              onClick={() => setIsCreatingNewLead(true)}
            >
              <PlusCircle className="h-4 w-4" />
              New Lead
            </Button>
          </div>

          {}
          <div className="w-full">
            {filteredResponses.length === 0 ? (
              <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <CardContent className="py-16">
                  <div className="text-center">
                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold text-muted-foreground mb-2">
                      No leads found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? "Try adjusting your search"
                        : "Get started by creating your first lead"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <ul className="divide-y divide-border/50">
                  {filteredResponses.map((lead, idx) => (
                    <li
                      key={lead.id}
                      className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                    >
                      {}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-lg bg-white/95 text-black flex items-center justify-center font-bold text-xl border border-border/30">
                          {idx + 1 + page * leadsPerPage}
                        </div>
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                            {lead.title}
                          </h3>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span>{lead.memberCount || 0} members</span>
                          </div>
                        </div>

                        {}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[100px]"
                            onClick={() =>
                              navigate(`/leads/details`, {
                                state: {
                                  lead_id: lead.id,
                                  lead_title: lead.title,
                                  permissions: access,
                                },
                              })
                            }
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Members
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[100px]"
                            onClick={() => {
                              setSelectedLead(lead);
                              setTitle(lead.title || "");
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>

                          {hasPermission(access, "leads", "deleteLead") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[100px] text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setLeadToDelete(lead)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="shrink-0 text-right w-24">
                        <div className="text-xs text-muted-foreground">Members</div>
                        <div className="text-2xl font-bold">{lead.memberCount ?? 0}</div>
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
                      {page * leadsPerPage + 1} - {page * leadsPerPage + leads.length}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground font-semibold">
                      {filteredResponses.length}
                    </strong>{" "}
                    leads
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
                      disabled={leads.length < leadsPerPage}
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
            open={Boolean(selectedLead)}
            onOpenChange={(open) => !open && setSelectedLead(null)}
          >
            {selectedLead && (
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Lead</DialogTitle>
                  <DialogDescription>Update the details of the lead.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lead Title"
                  />
                </div>

                <DialogFooter>
                  <DialogClose>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleUpdate}
                    disabled={updatingLeadId === selectedLead.id}
                    className="bg-green-700 text-white hover:bg-green-800"
                  >
                    {updatingLeadId === selectedLead.id ? (
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
            open={Boolean(leadToDelete)}
            onOpenChange={(open) => !open && setLeadToDelete(null)}
          >
            {leadToDelete && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete!!</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete the lead and its members
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteLead}
                    disabled={deletingId === leadToDelete.id}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deletingId === leadToDelete.id ? (
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
          <Dialog
            open={isCreatingNewLead}
            onOpenChange={(open) => !open && setIsCreatingNewLead(false)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>Enter the title for the new lead.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <Input
                  value={newLeadTitle}
                  onChange={(e) => setNewLeadTitle(e.target.value)}
                  placeholder="Lead Title"
                />
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateNewLead}
                  disabled={creatingLead}
                  className="bg-green-700 text-white hover:bg-green-800"
                >
                  {creatingLead ? (
                    <span className="flex items-center">
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

export default Leads;
