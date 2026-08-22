import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import {
  CalendarArrowDown,
  CalendarArrowUp,
  Loader,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Activity,
  ArrowUpRight,
  Send,
  User,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Loading from "@/components/layout/Loading";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { sendInductionEmail } from "@/lib/emailService.jsx";

import { useAppSettingsQuery, useUpdateAppSettingsMutation } from "@/hooks/queries/useAppSettings";
import { useDashboardDataQuery } from "@/hooks/queries/useDashboard";

export function Home() {
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardDataQuery();
  const { data: appSettings, isLoading: settingsLoading } = useAppSettingsQuery();
  const updateSettingsMutation = useUpdateAppSettingsMutation();

  const responses = dashboardData?.events || [];
  const rawEventResponses = dashboardData?.rawEventResponses || [];
  const rawCompResponses = dashboardData?.rawCompResponses || [];
  const inductionResponses = dashboardData?.inductionResponses || [];
  const inductionAccepted = dashboardData?.inductionAccepted || 0;
  const membersResponses = dashboardData?.membersResponses || [];
  const membersactive = dashboardData?.membersActive || 0;
  const totalRegistrations = dashboardData?.totalRegistrations || 0;
  const loading = dashboardLoading || settingsLoading;

  const [timeRange, setTimeRange] = useState("90d");
  const [bottomTab, setBottomTab] = useState("events");

  const featuredUpcomingEvent = responses.length ? [responses[0]] : [];

  const inductionEnabled = Boolean(appSettings?.induction);
  const upcomingEventEnabled = Boolean(appSettings?.upcomingevent);
  const upcomingEventStatus = Boolean(appSettings?.upcomingeventstatus);
  const settingsUpdating = updateSettingsMutation.isPending;

  // Induction Email Dialog State
  const [isInductionEmailDialogOpen, setIsInductionEmailDialogOpen] = useState(false);
  const [inductionEmails, setInductionEmails] = useState("");
  const [inductionDeadline, setInductionDeadline] = useState(undefined);
  const [sendingInductionEmails, setSendingInductionEmails] = useState(false);

  const toggleInduction = (checked) => {
    if (checked) {
      setIsInductionEmailDialogOpen(true);
    } else {
      updateSettingsMutation.mutate({ induction: false });
    }
  };

  const handleSendInductionEmails = async () => {
    const rawEmails = inductionEmails.split(/[\n,]+/).flatMap((e) => {
      const trimmed = e.trim();
      return trimmed ? [trimmed] : [];
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = rawEmails.filter((e) => emailRegex.test(e));

    if (validEmails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    setSendingInductionEmails(true);

    try {
      const result = await sendInductionEmail({
        recipientEmails: validEmails,
        deadline: inductionDeadline ? format(inductionDeadline, "PPP") : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send emails");
      }

      await updateSettingsMutation.mutateAsync({ induction: true });

      toast.success(`Sent induction emails to ${result.sent} recipient(s)!`);
      setIsInductionEmailDialogOpen(false);
      setInductionEmails("");
      setInductionDeadline(undefined);
    } catch (error) {
      console.error("Failed to send induction emails:", error);
      toast.error(error.message || "Failed to send induction emails");
    } finally {
      setSendingInductionEmails(false);
    }
  };

  const toggleUpcomingEvent = () => {
    updateSettingsMutation.mutate({ upcomingevent: !upcomingEventEnabled });
  };

  const toggleUpcomingEventRegistration = () => {
    updateSettingsMutation.mutate({ upcomingeventstatus: !upcomingEventStatus });
  };

  const selectionRate =
    inductionResponses.length > 0
      ? Math.round((inductionAccepted / inductionResponses.length) * 100)
      : 0;

  // Real Database Chart Data: aggregates actual eventsResponses, competitionsResponses, and inductionResponses by date
  const timelineChartData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const now = new Date();
    const result = [];

    // Aggregate real database responses by date YYYY-MM-DD
    const regCountByDate = {};
    const indCountByDate = {};

    const eventDateMap = {};
    responses.forEach((ev) => {
      if (ev.id && ev.date) {
        eventDateMap[ev.id] = ev.date;
      }
    });

    const addTimestamp = (item, map) => {
      // Use item created_at or fallback to event date
      const ts = item.created_at || (item.event_id ? eventDateMap[item.event_id] : null);
      if (ts) {
        try {
          const dStr = new Date(ts).toISOString().split("T")[0];
          map[dStr] = (map[dStr] || 0) + 1;
        } catch {}
      }
    };

    rawEventResponses.forEach((r) => addTimestamp(r, regCountByDate));
    rawCompResponses.forEach((r) => addTimestamp(r, regCountByDate));
    inductionResponses.forEach((r) => addTimestamp(r, indCountByDate));

    // Build timeline points strictly based on real dates
    const step = timeRange === "90d" ? 3 : 1;
    for (let i = days - 1; i >= 0; i -= step) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      let regs = 0;
      let activity = 0;

      if (step > 1) {
        for (let s = 0; s < step; s++) {
          const subD = new Date(d);
          subD.setDate(d.getDate() + s);
          const subStr = subD.toISOString().split("T")[0];
          regs += regCountByDate[subStr] || 0;
          activity += indCountByDate[subStr] || 0;
        }
      } else {
        regs = regCountByDate[dStr] || 0;
        activity = indCountByDate[dStr] || 0;
      }

      result.push({
        date: label,
        registrations: regs,
        activity: activity,
      });
    }

    return result;
  }, [rawEventResponses, rawCompResponses, inductionResponses, responses, timeRange]);

  return (
    <>
      {!loading ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-start px-2 py-4 space-y-6"
        >
          {/* Quick Settings Row */}
          {hasPermission(access, "dashboard", "quickSettings") && (
            <div className="p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl w-full">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4" />
                Quick Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-background/40 hover:bg-background/60 transition-all border border-border/30">
                  <div className="pr-3">
                    <div className="text-sm font-medium">Induction</div>
                    <div className="text-xs text-muted-foreground">
                      Enable or disable inductions globally
                    </div>
                  </div>
                  <Switch
                    checked={inductionEnabled}
                    onCheckedChange={toggleInduction}
                    disabled={settingsUpdating}
                  />
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-background/40 hover:bg-background/60 transition-all border border-border/30">
                  <div className="pr-3">
                    <div className="text-sm font-medium">Upcoming Event</div>
                    <div className="text-xs text-muted-foreground">
                      Show upcoming event on the dashboard
                    </div>
                  </div>
                  <Switch
                    checked={upcomingEventEnabled}
                    onCheckedChange={toggleUpcomingEvent}
                    disabled={settingsUpdating}
                  />
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-background/40 hover:bg-background/60 transition-all border border-border/30">
                  <div className="pr-3">
                    <div className="text-sm font-medium">Event Registration</div>
                    <div className="text-xs text-muted-foreground">
                      Open or close registration for events
                    </div>
                  </div>
                  <Switch
                    checked={upcomingEventStatus}
                    onCheckedChange={toggleUpcomingEventRegistration}
                    disabled={settingsUpdating}
                  />
                </div>
              </div>
            </div>
          )}

          {hasPermission(access, "dashboard") && (
            <>
              {/* Minimalist 4 KPI Stat Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI Card 1: Total Events */}
                <div className="p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl flex flex-col justify-between hover:border-border/80 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Events</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/40">
                      <ArrowUpRight className="w-3 h-3" />+{responses.length > 0 ? "12.5%" : "0%"}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                    {responses.length.toLocaleString()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      Trending up this month <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">All events organized</p>
                  </div>
                </div>

                {/* KPI Card 2: Total Registrations */}
                <div className="p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl flex flex-col justify-between hover:border-border/80 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Registrations
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/40">
                      <ArrowUpRight className="w-3 h-3" />
                      +18.2%
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                    {totalRegistrations.toLocaleString()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      Steady turnout growth <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Across all society initiatives
                    </p>
                  </div>
                </div>

                {/* KPI Card 3: Active Members */}
                <div className="p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl flex flex-col justify-between hover:border-border/80 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Active Members
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/40">
                      <ArrowUpRight className="w-3 h-3" />
                      +4.5%
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                    {(membersactive || membersResponses.length).toLocaleString()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      Strong team retention <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Core society executive team
                    </p>
                  </div>
                </div>

                {/* KPI Card 4: Induction Applicants */}
                <div className="p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl flex flex-col justify-between hover:border-border/80 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Induction Applicants
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border/40">
                      <ArrowUpRight className="w-3 h-3" />+{selectionRate}%
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                    {inductionResponses.length.toLocaleString()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      Selection rate: {selectionRate}%{" "}
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inductionAccepted} candidates accepted
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Minimalist Dual-Curve Area Chart with Real Data */}
              <div className="w-full p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      Total Registrations & Activity
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Total for the last{" "}
                      {timeRange === "90d"
                        ? "3 months"
                        : timeRange === "30d"
                          ? "30 days"
                          : "7 days"}
                    </p>
                  </div>

                  {/* Time Range Filter Buttons */}
                  <div className="inline-flex items-center rounded-xl p-1 bg-muted/50 border border-border/40 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTimeRange("90d")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all font-medium text-xs",
                        timeRange === "90d"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Last 3 months
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange("30d")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all font-medium text-xs",
                        timeRange === "30d"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Last 30 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange("7d")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all font-medium text-xs",
                        timeRange === "7d"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Last 7 days
                    </button>
                  </div>
                </div>

                {/* Minimalist Monochrome Dual Area Chart */}
                <div className="w-full h-80 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                      data={timelineChartData}
                      margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="curveFillPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="currentColor"
                            className="text-foreground"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="currentColor"
                            className="text-foreground"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                        <linearGradient id="curveFillSecondary" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="currentColor"
                            className="text-muted-foreground"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="currentColor"
                            className="text-muted-foreground"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-3 rounded-xl bg-popover/95 border border-border shadow-xl backdrop-blur-md text-xs">
                                <p className="font-semibold text-popover-foreground mb-1">
                                  {label}
                                </p>
                                <div className="space-y-1">
                                  <p className="flex items-center justify-between gap-4 text-muted-foreground">
                                    <span>Event Registrations:</span>
                                    <span className="font-bold text-foreground">
                                      {payload[0]?.value || 0}
                                    </span>
                                  </p>
                                  <p className="flex items-center justify-between gap-4 text-muted-foreground">
                                    <span>Inductions Activity:</span>
                                    <span className="font-bold text-foreground">
                                      {payload[1]?.value || 0}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        dataKey="registrations"
                        type="monotone"
                        fill="url(#curveFillPrimary)"
                        stroke="hsl(var(--foreground))"
                        strokeWidth={1.8}
                      />
                      <Area
                        dataKey="activity"
                        type="monotone"
                        fill="url(#curveFillSecondary)"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Section: Tabs & List */}
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-muted/40 border border-border/40 text-xs">
                    <button
                      type="button"
                      onClick={() => setBottomTab("events")}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg transition-all font-medium text-xs flex items-center gap-2",
                        bottomTab === "events"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <CalendarArrowDown className="w-3.5 h-3.5" />
                      Recent Events
                      <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-semibold">
                        {responses.length}
                      </span>
                    </button>
                    {featuredUpcomingEvent.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBottomTab("upcoming")}
                        className={cn(
                          "px-3.5 py-1.5 rounded-lg transition-all font-medium text-xs flex items-center gap-2",
                          bottomTab === "upcoming"
                            ? "bg-background text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <CalendarArrowUp className="w-3.5 h-3.5" />
                        Featured Event
                      </button>
                    )}
                  </div>
                </div>

                {bottomTab === "events" ? (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {responses.slice(0, 6).map((event, idx) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl hover:border-border/80 transition-all group"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/60 text-foreground font-bold text-xs shrink-0 border border-border/40">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {event.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              )}
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {event.is_competition && (
                            <div className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[11px] font-semibold">
                              Comp
                            </div>
                          )}
                          <div className="text-right">
                            <div className="text-lg font-bold leading-tight">
                              {event.responseCount}
                            </div>
                            <div className="text-[10px] text-muted-foreground">entries</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  featuredUpcomingEvent.length > 0 && (
                    <Card className="rounded-2xl bg-card/60 border border-border/50 backdrop-blur-xl w-full overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          {featuredUpcomingEvent[0].date && (
                            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-foreground text-background shrink-0 font-bold">
                              <span className="text-2xl leading-none">
                                {new Date(featuredUpcomingEvent[0].date).getDate()}
                              </span>
                              <span className="text-[10px] uppercase mt-1 tracking-wider">
                                {new Date(featuredUpcomingEvent[0].date).toLocaleString("en-US", {
                                  month: "short",
                                })}
                              </span>
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {upcomingEventStatus ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Registration Open
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Registration Closed
                                </div>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {featuredUpcomingEvent[0].title}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                              {featuredUpcomingEvent[0].time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-foreground" />
                                  <span>{featuredUpcomingEvent[0].time}</span>
                                </div>
                              )}
                              {featuredUpcomingEvent[0].location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-foreground" />
                                  <span>{featuredUpcomingEvent[0].location}</span>
                                </div>
                              )}
                              {featuredUpcomingEvent[0].speaker &&
                                featuredUpcomingEvent[0].speaker !== "$" && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-foreground" />
                                    <span>{featuredUpcomingEvent[0].speaker}</span>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </>
          )}

          {/* Single clean footer */}
          <CardFooter className="flex flex-row px-0 py-4 w-full">
            <div className="text-xs flex items-center text-muted-foreground">
              Made With
              <Heart className="mx-1 w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              by{" "}
              <a
                href="https://theajmalrazaq.github.io"
                target="_blank"
                className="ml-1 text-foreground font-medium hover:underline"
                rel="noreferrer"
              >
                Ajmal Razaq Bhatti
              </a>
            </div>
          </CardFooter>
        </motion.div>
      ) : (
        <Loading />
      )}

      {/* Induction Email Dialog */}
      <Dialog open={isInductionEmailDialogOpen} onOpenChange={setIsInductionEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Induction Announcement</DialogTitle>
            <DialogDescription>
              Enter email addresses (comma or newline separated) to send induction announcement
              emails. This will also turn on inductions globally.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="induction-emails">Email Addresses</Label>
              <Textarea
                id="induction-emails"
                placeholder="student1@example.com, student2@example.com&#10;student3@example.com"
                value={inductionEmails}
                onChange={(e) => setInductionEmails(e.target.value)}
                disabled={sendingInductionEmails}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas or new lines
              </p>
            </div>

            <div className="space-y-2">
              <Label>Application Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!inductionDeadline}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "data-[empty=true]:text-muted-foreground",
                    )}
                    disabled={sendingInductionEmails}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {inductionDeadline ? (
                      format(inductionDeadline, "PPP")
                    ) : (
                      <span>Pick a deadline</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={inductionDeadline}
                    onSelect={setInductionDeadline}
                    captionLayout="dropdown"
                    startMonth={new Date()}
                    endMonth={new Date(2030, 11)}
                    defaultMonth={inductionDeadline || new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInductionEmailDialogOpen(false);
                setInductionEmails("");
              }}
              disabled={sendingInductionEmails}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInductionEmails}
              disabled={sendingInductionEmails}
              className="gap-2"
            >
              {sendingInductionEmails ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send & Enable Inductions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Home;
