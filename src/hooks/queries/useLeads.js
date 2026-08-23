import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const LEADS_QUERY_KEY = ["leads"];
export const LEAD_MEMBERS_KEY = (leadId) => ["leadMembers", leadId];

// Fetch all lead categories enriched with member count
export function useLeadsQuery({ page = 0, limit = 10, search = "" } = {}) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, { page, limit, search }],
    queryFn: async () => {
      let query = supabase
        .from("allLeads")
        .select("*", { count: "exact" })
        .order("id", { ascending: false });

      if (page !== undefined && limit !== undefined) {
        query = query.range(page * limit, (page + 1) * limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (lead) => {
          try {
            const { count: memberCount, error: countError } = await supabase
              .from("leadsData")
              .select("*", { count: "exact" })
              .eq("lead_id", lead.id);

            if (countError) console.warn("lead count error", countError);
            return { ...lead, memberCount: memberCount || 0 };
          } catch (e) {
            console.error("Error enriching lead", e);
            return { ...lead, memberCount: 0 };
          }
        }),
      );

      return {
        leads: enriched,
        total: count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Create lead category mutation
export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title) => {
      const { data, error } = await supabase.from("allLeads").insert([{ title }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead created successfully");
    },
    onError: (err) => {
      console.error("Create lead error:", err);
      toast.error(err.message || "Failed to create lead");
    },
  });
}

// Update lead category mutation
export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }) => {
      const { data, error } = await supabase
        .from("allLeads")
        .update({ title })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead updated successfully");
    },
    onError: (err) => {
      console.error("Update lead error:", err);
      toast.error(err.message || "Failed to update lead");
    },
  });
}

// Delete lead category mutation
export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("allLeads").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead deleted successfully");
    },
    onError: (err) => {
      console.error("Delete lead error:", err);
      toast.error(err.message || "Failed to delete lead");
    },
  });
}

// Lead Members Query
export function useLeadMembersQuery({ leadId, page = 0, limit = 10, search = "" }) {
  return useQuery({
    queryKey: [...LEAD_MEMBERS_KEY(leadId), { page, limit, search }],
    queryFn: async () => {
      if (!leadId) return { data: [], total: 0 };

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        const { data, error } = await supabase
          .from("leadsData")
          .select("*")
          .eq("lead_id", leadId)
          .or(`roll_no.ilike.%${term}%,name.ilike.%${term}%`);

        if (error) throw error;
        return { data: data || [], total: data?.length || 0 };
      }

      let query = supabase
        .from("leadsData")
        .select("*", { count: "exact" })
        .eq("lead_id", leadId)
        .order("id", { ascending: false });

      if (page !== undefined && limit !== undefined) {
        query = query.range(page * limit, (page + 1) * limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], total: count || 0 };
    },
    enabled: Boolean(leadId),
    staleTime: 1000 * 60,
  });
}

// Create lead member mutation
export function useCreateLeadMemberMutation(leadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData) => {
      const { data, error } = await supabase
        .from("leadsData")
        .insert([{ ...memberData, lead_id: leadId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_MEMBERS_KEY(leadId) });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead member added successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add lead member");
    },
  });
}

// Update lead member mutation
export function useUpdateLeadMemberMutation(leadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data, error } = await supabase
        .from("leadsData")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_MEMBERS_KEY(leadId) });
      toast.success("Lead member updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update member");
    },
  });
}

// Delete lead member mutation
export function useDeleteLeadMemberMutation(leadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId) => {
      const { error } = await supabase.from("leadsData").delete().eq("id", memberId);
      if (error) throw error;
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_MEMBERS_KEY(leadId) });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead member deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete member");
    },
  });
}
