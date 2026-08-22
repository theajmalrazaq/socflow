import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const EVENTS_QUERY_KEY = ["events"];
export const EVENT_DETAILS_KEY = (id) => ["event", id];
export const EVENT_REGISTRATIONS_KEY = (eventId, isCompetition) => [
  "eventRegistrations",
  eventId,
  Boolean(isCompetition),
];
export const EVENT_WINNERS_KEY = (eventId) => ["eventWinners", eventId];

// Fetch events with pagination & enrichment
export function useEventsQuery({ page = 0, limit = 10, search = "", status = "all" } = {}) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, { page, limit, search, status }],
    queryFn: async () => {
      let query = supabase.from("events").select("*", { count: "exact" }).order("id", { ascending: false });

      if (page !== undefined && limit !== undefined) {
        query = query.range(page * limit, (page + 1) * limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (event) => {
          try {
            const table = event.is_competition ? "competitionsResponses" : "eventsResponses";
            const { count: respCount, error: countError } = await supabase
              .from(table)
              .select("*", { count: "exact" })
              .eq("event_id", event.id);

            if (countError) console.warn("event response count error", countError);
            return { ...event, responseCount: respCount || 0 };
          } catch (e) {
            console.error("Error enriching event", e);
            return { ...event, responseCount: 0 };
          }
        }),
      );

      return {
        events: enriched,
        total: count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Fetch all events (e.g. for Home dashboard stats)
export function useAllEventsQuery() {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (event) => {
          try {
            const table = event.is_competition ? "competitionsResponses" : "eventsResponses";
            const { count: respCount } = await supabase
              .from(table)
              .select("*", { count: "exact" })
              .eq("event_id", event.id);
            return { ...event, responseCount: respCount || 0 };
          } catch {
            return { ...event, responseCount: 0 };
          }
        }),
      );

      return enriched || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Fetch single event details
export function useEventDetailsQuery(eventId) {
  return useQuery({
    queryKey: EVENT_DETAILS_KEY(eventId),
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 5,
  });
}

// Create event mutation
export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventPayload) => {
      const { data, error } = await supabase
        .from("events")
        .insert([eventPayload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      toast.success("Event created successfully!");
    },
    onError: (err) => {
      console.error("Create event error:", err);
      toast.error(err.message || "Failed to create event");
    },
  });
}

// Update event mutation
export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data, error } = await supabase
        .from("events")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: EVENT_DETAILS_KEY(data.id) });
      }
      toast.success("Event updated successfully!");
    },
    onError: (err) => {
      console.error("Update event error:", err);
      toast.error(err.message || "Failed to update event");
    },
  });
}

// Delete event mutation
export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      toast.success("Event deleted successfully!");
    },
    onError: (err) => {
      console.error("Delete event error:", err);
      toast.error(err.message || "Failed to delete event");
    },
  });
}

// Event Registrations Query
export function useEventRegistrationsQuery({
  eventId,
  isCompetition,
  page = 0,
  limit = 10,
  status = "all",
  attendance = "all",
  search = "",
}) {
  return useQuery({
    queryKey: [
      ...EVENT_REGISTRATIONS_KEY(eventId, isCompetition),
      { page, limit, status, attendance, search },
    ],
    queryFn: async () => {
      if (!eventId) return { data: [], total: 0 };
      const table = isCompetition ? "competitionsResponses" : "eventsResponses";

      if (search && search.trim()) {
        const checkField = !isCompetition ? "name" : "team_name";
        const term = search.trim().toLowerCase();
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("event_id", eventId)
          .or(`roll_no.ilike.%${term}%,${checkField}.ilike.%${term}%`);

        if (error) throw error;
        return { data: data || [], total: data?.length || 0 };
      }

      let query = supabase
        .from(table)
        .select("*", { count: "exact" })
        .eq("event_id", eventId)
        .order("id", { ascending: false });

      if (status !== "all" && isCompetition) {
        query = query.eq("status", status === "verified" ? true : status === "rejected" ? false : null);
      }

      if (attendance !== "all") {
        query = query.eq("attendance", attendance === "present" ? true : attendance === "absent" ? false : null);
      }

      query = query.range(page * limit, (page + 1) * limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], total: count || 0 };
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 30,
  });
}

// Winners Query
export function useWinnersQuery(eventId) {
  return useQuery({
    queryKey: EVENT_WINNERS_KEY(eventId),
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("competitionWinners")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 2,
  });
}

// Add winner mutation
export function useAddWinnerMutation(eventId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (winnerPayload) => {
      const { data, error } = await supabase
        .from("competitionWinners")
        .insert([winnerPayload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_WINNERS_KEY(eventId) });
      toast.success("Winner added successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add winner");
    },
  });
}

// Delete winner mutation
export function useDeleteWinnerMutation(eventId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (winnerId) => {
      const { error } = await supabase
        .from("competitionWinners")
        .delete()
        .eq("id", winnerId);
      if (error) throw error;
      return winnerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_WINNERS_KEY(eventId) });
      toast.success("Winner removed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove winner");
    },
  });
}

// Update registration status / attendance
export function useUpdateRegistrationMutation(eventId, isCompetition) {
  const queryClient = useQueryClient();
  const table = isCompetition ? "competitionsResponses" : "eventsResponses";

  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from(table)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["eventRegistrations", eventId],
      });
      toast.success("Updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Update failed");
    },
  });
}

// Delete registration mutation
export function useDeleteRegistrationMutation(eventId, isCompetition) {
  const queryClient = useQueryClient();
  const table = isCompetition ? "competitionsResponses" : "eventsResponses";

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["eventRegistrations", eventId],
      });
      toast.success("Registration deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete registration");
    },
  });
}

