import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const APP_SETTINGS_QUERY_KEY = ["appSettings"];

export function useAppSettingsQuery() {
  return useQuery({
    queryKey: APP_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("appSettings").select("*").limit(1).maybeSingle();
      if (error) {
        console.warn("Failed to fetch appSettings:", error);
        return {
          id: null,
          induction: true,
          upcomingevent: false,
          upcomingeventstatus: true,
        };
      }
      return (
        data || {
          id: null,
          induction: true,
          upcomingevent: false,
          upcomingeventstatus: true,
        }
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateAppSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch) => {
      const { data: existing } = await supabase.from("appSettings").select("id").limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from("appSettings")
          .update(patch)
          .eq("id", existing[0].id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("appSettings")
          .insert([patch])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, (oldData) => ({
        ...oldData,
        ...data,
      }));
      queryClient.invalidateQueries({ queryKey: APP_SETTINGS_QUERY_KEY });
      toast.success("Settings updated successfully");
    },
    onError: (err) => {
      console.error("Error updating appSettings:", err);
      toast.error("Failed to update settings");
    },
  });
}
