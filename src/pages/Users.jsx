import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Search,
  Shield,
  Trash2,
  Mail,
  UserCheck,
  Loader,
  Users as UsersIcon,
  ShieldAlert,
  Check,
  Calendar,
  UserCog,
  SlidersHorizontal,
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
  PlusCircle,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loading from "@/components/layout/Loading";
import { supabase } from "@/lib/supabase";
import {
  isAdmin,
  DEFAULT_PERMISSIONS,
  parsePermissions,
  canManageUsers,
  hasPermission,
} from "@/lib/permissions";
import { toast } from "sonner";

// Page metadata & readable titles for List & Sublist toggles
const PERMISSION_CONFIG = [
  {
    key: "dashboard",
    title: "Dashboard & Home",
    icon: UsersIcon,
    subPermissions: [
      { key: "viewStats", label: "View Analytics & Statistics" },
      { key: "quickSettings", label: "Change Global Settings Toggles" },
    ],
  },
  {
    key: "events",
    title: "Events Management",
    icon: Calendar,
    subPermissions: [
      { key: "viewRegistrations", label: "View Registrations & Participants" },
      { key: "createEvent", label: "Create & Schedule New Events" },
      { key: "editEvent", label: "Edit Existing Event Details" },
      { key: "deleteEvent", label: "Delete Events" },
      { key: "selectWinners", label: "Select Competition Winners" },
      { key: "generateCertificates", label: "Generate & Email Certificates" },
    ],
  },
  {
    key: "leads",
    title: "Leads Management",
    icon: UserCog,
    subPermissions: [
      { key: "readOnly", label: "Read Only / View Leads List" },
      { key: "changeStatus", label: "Change / Update Lead Status" },
      { key: "addMember", label: "Add New Lead Team Member" },
      { key: "deleteLead", label: "Delete Lead / Team Member" },
      { key: "exportData", label: "Export Leads Data (CSV / VCF)" },
    ],
  },
  {
    key: "inductions",
    title: "Inductions Management",
    icon: UserCheck,
    subPermissions: [
      { key: "readOnly", label: "Read Only / View Candidates" },
      { key: "changeStatus", label: "Change Candidate Status (Select/Reject)" },
      { key: "sendEmails", label: "Send Interview & Selection Emails" },
      { key: "deleteResponse", label: "Delete Candidate Response" },
    ],
  },
  {
    key: "members",
    title: "Society Members",
    icon: UsersIcon,
    subPermissions: [
      { key: "readOnly", label: "Read Only / View Members Directory" },
      { key: "changeStatus", label: "Toggle Active / Inactive Status" },
      { key: "deleteMember", label: "Delete Society Member" },
      { key: "exportData", label: "Export Members List (CSV)" },
    ],
  },
  {
    key: "emails",
    title: "Emails & Contact Responses",
    icon: Mail,
    subPermissions: [
      { key: "viewResponses", label: "View Contact Form Submissions" },
      { key: "changeStatus", label: "Update Response Status" },
      { key: "sendEmail", label: "Send Direct & Bulk Emails" },
      { key: "deleteEmail", label: "Delete Email Entry" },
      { key: "manageSettings", label: "Customize Email Template Settings" },
    ],
  },
  {
    key: "users",
    title: "User & Role Management (Admin)",
    icon: Shield,
    subPermissions: [
      { key: "createUser", label: "Create New User Accounts" },
      { key: "editRole", label: "Modify User Role & Toggles" },
      { key: "deleteUser", label: "Delete User Accounts" },
    ],
  },
];

function PermissionForm({
  currentMatrix,
  matrixSetter,
  togglePageMaster,
  toggleSubPermission,
  applyPreset,
}) {
  const [expanded, setExpanded] = useState({
    dashboard: true,
    events: true,
    leads: true,
    inductions: true,
    members: true,
    emails: true,
    users: true,
  });

  const toggleExpandSection = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 py-1">
      {/* Quick Presets Bar */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-md mb-4">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">
          Quick Permission Presets
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 rounded-lg border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
            onClick={() => applyPreset(matrixSetter, "admin")}
          >
            <Shield className="w-3.5 h-3.5" /> Admin (All ON)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 rounded-lg border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
            onClick={() => applyPreset(matrixSetter, "event_manager")}
          >
            <Calendar className="w-3.5 h-3.5" /> Event Manager
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 rounded-lg border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
            onClick={() => applyPreset(matrixSetter, "read_only")}
          >
            <Eye className="w-3.5 h-3.5" /> Read Only
          </Button>
        </div>
      </div>

      {/* Nested Permission Cards */}
      <div className="space-y-3.5">
        {PERMISSION_CONFIG.map((config) => {
          const IconObj = config.icon;
          const pageState = currentMatrix[config.key] || {
            enabled: false,
            sub: {},
          };
          const isExpanded = Boolean(expanded[config.key]);

          return (
            <div
              key={config.key}
              className={`rounded-2xl border transition-all ${
                pageState.enabled
                  ? "border-primary/40 bg-background/70 shadow-xs"
                  : "border-border/50 bg-background/30"
              }`}
            >
              {/* Header Row */}
              <div className="p-4 flex items-center justify-between select-none">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleExpandSection(config.key)}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      pageState.enabled
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/60 text-muted-foreground border border-border/40"
                    }`}
                  >
                    <IconObj className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-foreground">{config.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {pageState.enabled ? "Page enabled for this user" : "Page access disabled"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={Boolean(pageState.enabled)}
                    onCheckedChange={(checked) =>
                      togglePageMaster(matrixSetter, config.key, checked)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleExpandSection(config.key)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Sublist Items with Rounded Branch Lines */}
              {isExpanded && config.subPermissions.length > 0 && (
                <div className="px-5 pb-4 pt-1 relative space-y-2.5">
                  {config.subPermissions.map((sub, idx) => {
                    const isSubChecked = Boolean(pageState.sub?.[sub.key]);
                    const isFirst = idx === 0;

                    return (
                      <div key={sub.key} className="relative flex items-center pl-8">
                        {/* Rounded SVG Branch Line */}
                        <svg
                          className={`absolute left-[22px] text-border/80 stroke-current fill-none pointer-events-none z-0 ${
                            isFirst ? "-top-6 w-8 h-11" : "-top-8 w-8 h-13"
                          }`}
                          viewBox={isFirst ? "0 0 32 44" : "0 0 32 52"}
                        >
                          <path
                            d={
                              isFirst
                                ? "M 2 0 V 24 Q 2 32 12 32 H 26"
                                : "M 2 0 V 32 Q 2 40 12 40 H 26"
                            }
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="relative z-10 flex-1 flex items-center justify-between p-3 rounded-xl bg-background/80 border border-border/50 backdrop-blur-md hover:bg-background/95 transition-all">
                          <span className="text-xs font-medium text-foreground pr-3">
                            {sub.label}
                          </span>
                          <Switch
                            checked={isSubChecked}
                            onCheckedChange={(checked) =>
                              toggleSubPermission(matrixSetter, config.key, sub.key, checked)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Users() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create User State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "custom",
  });
  const [permissionMatrix, setPermissionMatrix] = useState(DEFAULT_PERMISSIONS);

  // Helper to open create modal and reset step
  const handleOpenCreateModal = () => {
    setCreateStep(1);
    setIsCreateOpen(true);
  };

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editPermissions, setEditPermissions] = useState(DEFAULT_PERMISSIONS);
  const [updating, setUpdating] = useState(false);

  // Delete User State
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect users without user management permission
  useEffect(() => {
    if (access && !canManageUsers(access)) {
      navigate("/nopermission");
    }
  }, [access, navigate]);

  // Fetch Users List
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Master page toggle
  const togglePageMaster = (matrixSetter, pageKey, enabled) => {
    matrixSetter((prev) => {
      const pageObj = prev[pageKey] || { enabled: false, sub: {} };
      const updatedSub = { ...pageObj.sub };

      Object.keys(updatedSub).forEach((k) => {
        updatedSub[k] = enabled;
      });

      return {
        ...prev,
        [pageKey]: {
          enabled,
          sub: updatedSub,
        },
      };
    });
  };

  // Sub-permission toggle
  const toggleSubPermission = (matrixSetter, pageKey, subKey, val) => {
    matrixSetter((prev) => {
      const pageObj = prev[pageKey] || { enabled: false, sub: {} };
      const updatedSub = {
        ...pageObj.sub,
        [subKey]: val,
      };

      const isAnySubEnabled = Object.values(updatedSub).some(Boolean);

      return {
        ...prev,
        [pageKey]: {
          enabled: isAnySubEnabled,
          sub: updatedSub,
        },
      };
    });
  };

  // Presets
  const applyPreset = (matrixSetter, presetType) => {
    if (presetType === "admin") {
      matrixSetter(DEFAULT_PERMISSIONS);
    } else if (presetType === "event_manager") {
      matrixSetter({
        dashboard: { enabled: true, sub: { viewStats: true, quickSettings: false } },
        events: DEFAULT_PERMISSIONS.events,
        leads: {
          enabled: false,
          sub: {
            readOnly: false,
            changeStatus: false,
            addMember: false,
            deleteLead: false,
            exportData: false,
          },
        },
        inductions: {
          enabled: false,
          sub: { readOnly: false, changeStatus: false, sendEmails: false, deleteResponse: false },
        },
        members: {
          enabled: false,
          sub: { readOnly: false, changeStatus: false, deleteMember: false, exportData: false },
        },
        emails: DEFAULT_PERMISSIONS.emails,
        users: { enabled: false, sub: { createUser: false, editRole: false, deleteUser: false } },
      });
    } else if (presetType === "read_only") {
      matrixSetter({
        dashboard: { enabled: true, sub: { viewStats: true, quickSettings: false } },
        events: {
          enabled: true,
          sub: {
            viewRegistrations: true,
            createEvent: false,
            editEvent: false,
            deleteEvent: false,
            selectWinners: false,
            generateCertificates: false,
          },
        },
        leads: {
          enabled: true,
          sub: {
            readOnly: true,
            changeStatus: false,
            addMember: false,
            deleteLead: false,
            exportData: false,
          },
        },
        inductions: {
          enabled: true,
          sub: { readOnly: true, changeStatus: false, sendEmails: false, deleteResponse: false },
        },
        members: {
          enabled: true,
          sub: { readOnly: true, changeStatus: false, deleteMember: false, exportData: false },
        },
        emails: {
          enabled: true,
          sub: {
            viewResponses: true,
            changeStatus: false,
            sendEmail: false,
            deleteEmail: false,
            manageSettings: false,
          },
        },
        users: { enabled: false, sub: { createUser: false, editRole: false, deleteUser: false } },
      });
    }
  };

  // Step Navigation for Create User Modal
  const handleNextStep = () => {
    if (!newUser.name?.trim() || !newUser.email?.trim() || !newUser.password?.trim()) {
      toast.error("Please fill in name, email, and password before proceeding.");
      return;
    }
    setCreateStep(2);
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill in name, email, and password");
      return;
    }

    setCreating(true);
    try {
      let authData = null;
      let authError = null;

      // Try Admin API to auto-confirm user without sending confirmation email
      try {
        const adminRes = await supabase.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
          email_confirm: true,
          user_metadata: {
            name: newUser.name,
            role: newUser.role,
          },
        });
        authData = adminRes.data;
        authError = adminRes.error;
      } catch (_e) {
        // Admin API not available on client key, fallback to signUp
      }

      if (authError || !authData?.user) {
        const signUpRes = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              name: newUser.name,
              role: newUser.role,
            },
          },
        });
        authData = signUpRes.data;
        authError = signUpRes.error;
      }

      if (authError) throw authError;

      const userId = authData.user?.id;
      const payload = {
        userId: userId,
        user_id: userId,
        email: newUser.email,
        name: newUser.name,
        permissions: JSON.stringify(permissionMatrix),
        role: newUser.role,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from("users").insert([payload]);
      if (dbError) throw dbError;

      toast.success(`User ${newUser.name} created successfully!`);
      setIsCreateOpen(false);
      setCreateStep(1);
      setNewUser({ name: "", email: "", password: "", role: "custom" });
      setPermissionMatrix(DEFAULT_PERMISSIONS);
      fetchUsers();
    } catch (err) {
      console.error("Create User Error:", err);
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit User
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    const existingMatrix = parsePermissions(user.permissions || user.role);
    setEditPermissions(existingMatrix);
  };

  const handleUpdateUserPermissions = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          permissions: JSON.stringify(editPermissions),
          role: editingUser.role || "custom",
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success(`Updated permissions for ${editingUser.name}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update permissions");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("users").delete().eq("id", deletingUser.id);
      if (error) throw error;

      toast.success(`Deleted user ${deletingUser.name}`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);

    const userIsAdmin = isAdmin(u.permissions || u.role);
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && userIsAdmin) ||
      (roleFilter === "custom" && !userIsAdmin);

    return matchesSearch && matchesRole;
  });

  const getInitials = (nameStr) => {
    if (!nameStr) return "U";
    return nameStr
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start px-2 py-4">
      {/* Search & Actions Bar matching Events.jsx */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80 md:w-96 max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" variant="outline" className="h-11 gap-2 inline-flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {roleFilter === "all"
                  ? "Filter Roles"
                  : roleFilter === "admin"
                    ? "Admin Only"
                    : "Custom Roles"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setRoleFilter("all")}>All Users</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("admin")}>Admins</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("custom")}>
                Custom Permissions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasPermission(access, "users", "createUser") && (
            <Button
              size="lg"
              className="h-11 gap-2 w-full md:w-auto"
              onClick={handleOpenCreateModal}
            >
              <PlusCircle className="h-4 w-4" />
              Create New User
            </Button>
          )}
        </div>
      </div>

      {/* Users List Container matching Events.jsx & Leads.jsx UI */}
      <div className="w-full">
        {filteredUsers.length === 0 ? (
          <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
            <CardContent className="py-16">
              <div className="text-center">
                <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold text-muted-foreground mb-2">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Try adjusting your search query"
                    : "Get started by creating your first system user"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
            <ul className="divide-y divide-border/50">
              {filteredUsers.map((user) => {
                const userIsAdmin = isAdmin(user.permissions || user.role);

                return (
                  <li
                    key={user.id || user.email}
                    className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                  >
                    {/* Left Badge - Avatar Initials */}
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-white/95 text-black flex items-center justify-center font-bold text-xl border border-border/30 shadow-xs">
                        {getInitials(user.name)}
                      </div>
                    </div>

                    {/* Main User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                          {user.name || "Unnamed User"}
                        </h3>
                        {userIsAdmin ? (
                          <div className="ml-1 px-2.5 py-0.5 rounded-full bg-purple-600/10 text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-600/20">
                            <Shield className="w-3 h-3" />
                            Admin
                          </div>
                        ) : (
                          <div className="ml-1 px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-300 text-xs font-semibold flex items-center gap-1 border border-blue-600/20">
                            <SlidersHorizontal className="w-3 h-3" />
                            Custom Permissions
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-primary" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.created_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>Added {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons matching Events.jsx style */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {hasPermission(access, "users", "editRole") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[140px]"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-primary" />
                            Configure Toggles
                          </Button>
                        )}

                        {hasPermission(access, "users", "deleteUser") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[100px] text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* MULTI-STEP CREATE USER DIALOG MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="pr-12">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Create User Account
              </DialogTitle>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
                Step {createStep} of 2
              </span>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Configure member details and assign access privileges.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-6 border-b border-border/40 pb-4 mb-3 overflow-x-auto">
            {[
              { step: 1, label: "Account Credentials" },
              { step: 2, label: "Access Permissions" },
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

          <form onSubmit={handleCreateUser} className="space-y-5 pt-2">
            {createStep === 1 ? (
              /* STEP 1: Account Info Form */
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <Input
                      id="name"
                      placeholder="e.g. Sarah Ahmed"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="sarah@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Initial Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 2: Page List & Sub-Permission Toggles */
              <div className="space-y-3 pt-1">
                <PermissionForm
                  currentMatrix={permissionMatrix}
                  matrixSetter={setPermissionMatrix}
                  togglePageMaster={togglePageMaster}
                  toggleSubPermission={toggleSubPermission}
                  applyPreset={applyPreset}
                />
              </div>
            )}

            <DialogFooter className="pt-4 gap-2 border-t border-border/40">
              {createStep === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" className="h-11 gap-2" onClick={handleNextStep}>
                    Continue to Permissions <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setCreateStep(1)}
                  >
                    ← Back to Account Info
                  </Button>
                  <Button type="submit" disabled={creating} className="h-11 gap-2">
                    {creating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save & Create Account
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT USER PERMISSIONS DIALOG MODAL */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl border border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2.5 font-recoleta">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              Configure User Toggles
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modify page list & sub-permission toggles for {editingUser?.name} (
              {editingUser?.email})
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 pt-2">
              <PermissionForm
                currentMatrix={editPermissions}
                matrixSetter={setEditPermissions}
                togglePageMaster={togglePageMaster}
                toggleSubPermission={toggleSubPermission}
                applyPreset={applyPreset}
              />
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUserPermissions}
              disabled={updating}
              className="h-11 gap-2"
            >
              {updating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Permission Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE USER CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-recoleta">
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingUser?.name} ({deletingUser?.email})? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Users;
