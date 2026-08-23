import { useState, useMemo, useCallback, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  UserCog,
  Mail,
  LogOut,
  PanelLeft,
  Sun,
  Moon,
  Loader2,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useUserSession, useLogoutMutation } from "@/hooks/queries/useAuth";
import {
  canManageLeads,
  canManageEvents,
  canManageInductions,
  canManageMembers,
  canManageEmails,
  canManageEmailSettings,
  canManageUsers,
} from "@/lib/permissions";

export function Navbar({ access, user, children }) {
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: session } = useUserSession();
  const logoutMutation = useLogoutMutation();

  const userInfo = user || session?.user || null;
  const effectiveAccess = access || session?.permissions || session?.role || null;

  const userInitials = useMemo(() => {
    if (userInfo?.name && userInfo.name.trim()) {
      const parts = userInfo.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (userInfo?.email && userInfo.email.trim()) {
      return userInfo.email.slice(0, 2).toUpperCase();
    }
    return "SF";
  }, [userInfo]);

  // Vercel Rule: rerender-lazy-state-init
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true",
  );

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar-collapsed", String(newVal));
      return newVal;
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      await logoutMutation.mutateAsync();
      navigate("/login");
    } catch (error) {
      console.error("An error occurred during sign-out:", error);
    } finally {
      setLoading(false);
    }
  }, [logoutMutation, navigate]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const navItems = useMemo(() => {
    const items = [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        id: "/",
      },
    ];

    if (canManageEvents(effectiveAccess)) {
      items.push({
        label: "Events",
        path: "/events",
        icon: Calendar,
        id: "/events",
      });
    }

    if (canManageLeads(effectiveAccess)) {
      items.push({
        label: "Leads",
        path: "/leads",
        icon: UserCog,
        id: "/leads",
      });
    }

    if (canManageInductions(effectiveAccess)) {
      items.push({
        label: "Inductions",
        path: "/inductions",
        icon: UserCheck,
        id: "/inductions",
      });
    }

    if (canManageMembers(effectiveAccess)) {
      items.push({
        label: "Members",
        path: "/members",
        icon: Users,
        id: "/members",
      });
    }

    if (canManageEmails(effectiveAccess)) {
      items.push({
        label: "Emails",
        path: "/emails",
        icon: Mail,
        id: "/emails",
      });
    }

    if (canManageUsers(effectiveAccess)) {
      items.push({
        label: "Users",
        path: "/users",
        icon: Shield,
        id: "/users",
      });
    }

    if (canManageEmailSettings(effectiveAccess) || canManageUsers(effectiveAccess)) {
      items.push({
        label: "Settings",
        path: "/settings",
        icon: SettingsIcon,
        id: "/settings",
      });
    }

    return items;
  }, [effectiveAccess]);

  const currentHeader = useMemo(() => {
    const path = location.pathname;
    const PAGE_HEADERS = {
      "/": {
        title: "Dashboard",
        description: "Your command center for managing everything in one place",
      },
      "/events": {
        title: "Manage Events",
        description: "Organize, track, and manage all your events in one place",
      },
      "/events/details": {
        title: "Event Details",
        description: "Manage event registrations, attendance, and competition winners",
      },
      "/events/new": {
        title: "Create New Event",
        description: "Add a new workshop, webinar, or competition to the lineup",
      },
      "/leads": {
        title: "Manage Leads",
        description: "Organize and track all your team leads in one place",
      },
      "/leads/details": {
        title: "Lead Details",
        description: "Manage team members and details under this lead domain",
      },
      "/inductions": {
        title: "Manage Inductions",
        description: "Review recruitment applications and interview candidates",
      },
      "/members": {
        title: "Manage Members",
        description: "View and manage society team members across all domains",
      },
      "/emails": {
        title: "Emails & Messages",
        description: "Contact responses, incoming inquiries, and broadcast emails",
      },
      "/emails/compose": {
        title: "Send Email",
        description: "Compose and broadcast emails to society members or applicants",
      },
      "/emails/send": {
        title: "Send Email",
        description: "Compose and broadcast emails to society members or applicants",
      },
      "/settings": {
        title: "Settings",
        description: "Manage system preferences, email template branding, and configurations",
      },
      "/emails/settings": {
        title: "Settings",
        description: "Manage system preferences, email template branding, and configurations",
      },
      "/emails/customize": {
        title: "Settings",
        description: "Manage system preferences, email template branding, and configurations",
      },
      "/users": {
        title: "Users & Access",
        description: "Manage admin dashboard users and access permissions",
      },
    };

    if (PAGE_HEADERS[path]) return PAGE_HEADERS[path];
    if (path.startsWith("/events/details")) return PAGE_HEADERS["/events/details"];
    if (path.startsWith("/events/new") || path.startsWith("/events/create"))
      return PAGE_HEADERS["/events/new"];
    if (path.startsWith("/events")) return PAGE_HEADERS["/events"];
    if (path.startsWith("/leads/details")) return PAGE_HEADERS["/leads/details"];
    if (path.startsWith("/leads")) return PAGE_HEADERS["/leads"];
    if (
      path.startsWith("/settings") ||
      path.startsWith("/emails/settings") ||
      path.startsWith("/emails/customize")
    )
      return PAGE_HEADERS["/settings"];
    if (path.startsWith("/emails/compose") || path.startsWith("/emails/send"))
      return PAGE_HEADERS["/emails/compose"];
    if (path.startsWith("/emails/send")) return PAGE_HEADERS["/emails/send"];
    if (path.startsWith("/emails")) return PAGE_HEADERS["/emails"];
    return PAGE_HEADERS["/"];
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Truly Fixed Floating Sidebar (Fixed position to screen, never scrolls with page) */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 76 : 240,
          paddingLeft: isCollapsed ? 12 : 16,
          paddingRight: isCollapsed ? 12 : 16,
        }}
        transition={{
          duration: 0.22,
          ease: [0.2, 0, 0, 1],
        }}
        className="fixed top-5 left-5 z-40 flex h-[calc(100vh-40px)] flex-col rounded-[18px] border border-border/80 bg-card/95 backdrop-blur-md py-4 shadow-sm shrink-0 overflow-hidden"
      >
        {/* Header Container */}
        <div className="group relative mb-6 flex h-10 w-full items-center justify-between">
          <div
            className={`flex items-center gap-2.5 font-bold text-base transition-all ${
              isCollapsed ? "w-full justify-center pl-0" : "pl-1"
            }`}
          >
            <svg
              className="size-6 shrink-0 text-foreground"
              viewBox="0 0 3200 3200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="3200" height="3200" rx="800" fill="currentColor" />
              <path
                d="M592 729L1092.22 1004.82L1593.33 729L2102.33 1025.79L2609 729V1309.67L2102.33 1600L1593.33 1311.28L1092.22 1600L592 1311.28V729Z"
                fill="var(--color-background, #09090b)"
              />
              <path
                d="M592 1600L1092.22 1875.82L1593.33 1600L2102.33 1896.79L2609 1600V2180.67L2102.33 2471L1593.33 2182.28L1092.22 2471L592 2182.28V1600Z"
                fill="var(--color-background, #09090b)"
              />
            </svg>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate tracking-tight font-extrabold text-base font-recoleta bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"
                >
                  Socflow
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleToggleCollapse}
            className={`flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-accent hover:text-foreground cursor-pointer ${
              isCollapsed
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-accent border-border text-foreground cursor-pointer"
                : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <PanelLeft className="size-4 shrink-0" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSettingsPath =
              location.pathname.startsWith("/settings") ||
              location.pathname.startsWith("/emails/settings") ||
              location.pathname.startsWith("/emails/customize");

            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : item.path === "/settings"
                  ? isSettingsPath
                  : item.path === "/emails"
                    ? !isSettingsPath && location.pathname.startsWith("/emails")
                    : location.pathname.startsWith(item.path);

            return (
              <Link key={item.id} to={item.path} className="w-full cursor-pointer">
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isCollapsed ? "justify-center px-0 size-10 mx-auto" : "justify-start"
                  } ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div className="mt-auto flex flex-col gap-3 border-t border-border/80 pt-4">
          {/* Theme Switcher Pill */}
          <div className="w-full flex justify-center">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-full border border-border/80 bg-background/60 text-xs font-medium transition-all hover:bg-accent hover:text-foreground cursor-pointer ${
                isCollapsed ? "size-9 justify-center p-0 rounded-full" : "w-full px-3 py-1.5"
              }`}
              title={isCollapsed ? (theme === "dark" ? "Dark Mode" : "Light Mode") : undefined}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <>
                  <Moon className="size-3.5 shrink-0 text-yellow-400" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      Dark Mode
                    </motion.span>
                  )}
                </>
              ) : (
                <>
                  <Sun className="size-3.5 shrink-0 text-amber-500" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      Light Mode
                    </motion.span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Profile Card */}
          <div
            className={`flex items-center gap-2.5 rounded-lg py-1 ${
              isCollapsed ? "justify-center" : "px-1"
            }`}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-foreground uppercase">
              {userInitials}
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col min-w-0"
                >
                  <span
                    className="truncate text-xs font-semibold leading-tight text-foreground"
                    title={userInfo?.name}
                  >
                    {userInfo?.name || "User"}
                  </span>
                  <span
                    className="truncate text-[11px] text-muted-foreground leading-tight"
                    title={userInfo?.email}
                  >
                    {userInfo?.email || ""}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={loading}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-500/10 cursor-pointer disabled:cursor-not-allowed ${
              isCollapsed ? "justify-center px-0 size-9 mx-auto" : "justify-start"
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin shrink-0 text-red-500" />
            ) : (
              <LogOut className="size-4 shrink-0 text-red-500" />
            )}
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Instant Page Container (Zero Flicker on Page Navigation) */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isCollapsed ? 104 : 268,
        }}
        transition={{
          duration: 0.22,
          ease: [0.2, 0, 0, 1],
        }}
        className="flex-1 min-w-0 p-6 overflow-x-hidden"
      >
        {/* Persistent Static Header */}
        <div className="relative w-full flex flex-col mb-6 pt-2">
          <div
            className="absolute -top-10 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(45deg, #2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
            }}
          />

          <div className="w-full relative flex items-start flex-col justify-start z-10">
            <h2
              className="text-3xl sm:text-4xl font-extrabold font-recoleta tracking-tight mb-1 text-left"
              style={{
                backgroundImage: "linear-gradient(45deg,#2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {currentHeader.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-left">
              {currentHeader.description}
            </p>
          </div>
        </div>

        {children}
      </motion.main>
    </div>
  );
}

Navbar.propTypes = {
  activetab: PropTypes.string,
  access: PropTypes.string,
  children: PropTypes.node,
};

export default memo(Navbar);
