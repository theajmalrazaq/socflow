import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const INDUCTIONS_QUERY_KEY = ["inductions"];
export const INDUCTIONS_STATS_KEY = ["inductionsStats"];

// Inductions Query with filters and pagination
export function useInductionsQuery({
  page = 0,
  limit = 10,
  status = "all",
  team = "all",
  search = "",
} = {}) {
  return useQuery({
    queryKey: [...INDUCTIONS_QUERY_KEY, { page, limit, status, team, search }],
    queryFn: async () => {
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        let searchQuery = supabase
          .from("inductionResponses")
          .select("*")
          .or(`roll_no.ilike.%${term}%,name.ilike.%${term}%`);

        if (status === "selected") searchQuery = searchQuery.eq("status", true);
        else if (status === "rejected") searchQuery = searchQuery.eq("status", false);
        else if (status === "waiting") searchQuery = searchQuery.is("status", null);

        if (team !== "all") searchQuery = searchQuery.eq("team", team);

        const { data, error } = await searchQuery;
        if (error) throw error;
        return { data: data || [], total: data?.length || 0 };
      }

      let query = supabase.from("inductionResponses").select("*", { count: "exact" });

      if (status === "selected") query = query.eq("status", true);
      else if (status === "rejected") query = query.eq("status", false);
      else if (status === "waiting") query = query.is("status", null);

      if (team !== "all") query = query.eq("team", team);

      query = query.order("id", { ascending: false }).range(page * limit, (page + 1) * limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
      };
    },
    staleTime: 1000 * 60,
  });
}

// Inductions Stats Query for Dashboard / Home
export function useInductionsStatsQuery() {
  return useQuery({
    queryKey: INDUCTIONS_STATS_KEY,
    queryFn: async () => {
      const [allRes, acceptedRes] = await Promise.all([
        supabase.from("inductionResponses").select("id,created_at", { count: "exact" }),
        supabase.from("inductionResponses").select("id", { count: "exact" }).eq("status", true),
      ]);

      return {
        total: allRes.count || 0,
        accepted: acceptedRes.count || 0,
        all: allRes.data || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Update single induction status mutation
export function useUpdateInductionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from("inductionResponses")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      toast.success("Candidate status updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    },
  });
}

// Delete induction response mutation
export function useDeleteInductionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("inductionResponses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      toast.success("Response deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete response");
    },
  });
}

// Bulk update induction status
export function useBulkUpdateInductionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }) => {
      const { data, error } = await supabase
        .from("inductionResponses")
        .update({ status })
        .in("id", ids)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      toast.success("Bulk status updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Bulk update failed");
    },
  });
}
