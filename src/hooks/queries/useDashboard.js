import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const DASHBOARD_QUERY_KEY = ["dashboardHome"];

export function useDashboardDataQuery() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [eventsRes, evResponsesRes, compResponsesRes, inductionsRes, membersRes] =
        await Promise.all([
          supabase
            .from("events")
            .select("*")
            .lt("date", today)
            .order("date", { ascending: false })
            .limit(10),
          supabase.from("eventsResponses").select("id, event_id, created_at"),
          supabase.from("competitionsResponses").select("id, event_id, created_at"),
          supabase
            .from("inductionResponses")
            .select("id, created_at, status, domain")
            .order("id", { ascending: false }),
          supabase.from("members").select("id, status, active").order("id", { ascending: false }),
        ]);

      const fetchEvents = eventsRes.data || [];
      const evResponses = evResponsesRes.data || [];
      const compResponses = compResponsesRes.data || [];
      const inductionResponses = inductionsRes.data || [];
      const membersResponses = membersRes.data || [];

      // Count registrations per event
      const responsesWithCount = fetchEvents.map((event) => {
        const count = event.is_competition
          ? compResponses.filter((r) => r.event_id === event.id).length
          : evResponses.filter((r) => r.event_id === event.id).length;

        return {
          ...event,
          responseCount: count,
        };
      });

      const inductionAccepted = inductionResponses.filter((r) => r.status === true).length;
      const membersActive = membersResponses.filter((m) => m.active || m.status).length;

      return {
        events: responsesWithCount,
        rawEventResponses: evResponses,
        rawCompResponses: compResponses,
        inductionResponses,
        inductionAccepted,
        membersResponses,
        membersActive,
        totalRegistrations: evResponses.length + compResponses.length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}
