import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const MEMBERS_QUERY_KEY = ["members"];
export const MEMBERS_STATS_KEY = ["membersStats"];

export function useMembersQuery({
  page = 0,
  limit = 10,
  status = "all",
  team = "all",
  search = "",
} = {}) {
  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEY, { page, limit, status, team, search }],
    queryFn: async () => {
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        let searchQuery = supabase
          .from("members")
          .select("*")
          .or(`roll_no.ilike.%${term}%,name.ilike.%${term}%`);

        if (status === "active") searchQuery = searchQuery.eq("active", true);
        else if (status === "inactive") searchQuery = searchQuery.eq("active", false);

        if (team !== "all") searchQuery = searchQuery.eq("team", team);

        const { data, error } = await searchQuery;
        if (error) throw error;
        return { data: data || [], total: data?.length || 0 };
      }

      let query = supabase.from("members").select("*", { count: "exact" });

      if (status === "active") query = query.eq("active", true);
      else if (status === "inactive") query = query.eq("active", false);

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

// Members Stats for Home and dashboard
export function useMembersStatsQuery() {
  return useQuery({
    queryKey: MEMBERS_STATS_KEY,
    queryFn: async () => {
      const [allRes, activeRes] = await Promise.all([
        supabase.from("members").select("id,created_at", { count: "exact" }),
        supabase.from("members").select("id", { count: "exact" }).eq("active", true),
      ]);

      return {
        total: allRes.count || 0,
        active: activeRes.count || 0,
        all: allRes.data || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Update Member Status Mutation
export function useUpdateMemberStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }) => {
      const { data, error } = await supabase
        .from("members")
        .update({ active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_STATS_KEY });
      toast.success("Member status updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update member status");
    },
  });
}

// Delete Member Mutation
export function useDeleteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_STATS_KEY });
      toast.success("Member removed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove member");
    },
  });
}

