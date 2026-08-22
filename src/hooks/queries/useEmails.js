import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const EMAILS_QUERY_KEY = ["emails"];

export function useEmailsQuery({
  page = 0,
  limit = 10,
  status = "all",
  search = "",
} = {}) {
  return useQuery({
    queryKey: [...EMAILS_QUERY_KEY, { page, limit, status, search }],
    queryFn: async () => {
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        let searchQuery = supabase
          .from("contactResponses")
          .select("*")
          .or(`Name.ilike.%${term}%,Email.ilike.%${term}%,Subject.ilike.%${term}%`);

        if (status === "responded") searchQuery = searchQuery.eq("status", true);
        else if (status === "on_hold") searchQuery = searchQuery.eq("status", false);
        else if (status === "waiting") searchQuery = searchQuery.is("status", null);

        const { data, error } = await searchQuery;
        if (error) throw error;
        return { data: data || [], total: data?.length || 0 };
      }

      let query = supabase.from("contactResponses").select("*", { count: "exact" });

      if (status === "responded") query = query.eq("status", true);
      else if (status === "on_hold") query = query.eq("status", false);
      else if (status === "waiting") query = query.is("status", null);

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

// Update Email Status Mutation
export function useUpdateEmailStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from("contactResponses")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
      toast.success("Status updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    },
  });
}

// Delete Email Mutation
export function useDeleteEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("contactResponses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
      toast.success("Message deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete message");
    },
  });
}

