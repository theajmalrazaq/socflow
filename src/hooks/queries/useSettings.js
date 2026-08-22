import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getEmailConfig, fetchSmtpConfigFromDB, saveSmtpConfig } from "@/lib/emailConfig";
import { toast } from "sonner";

export const SOCIETY_PROFILE_KEY = ["societyProfile"];
export const SMTP_CONFIG_KEY = ["smtpConfig"];

export function useSocietyProfileQuery() {
  return useQuery({
    queryKey: SOCIETY_PROFILE_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: userRecords } = await supabase
        .from("users")
        .select("*")
        .or(`user_id.eq.${user.id},userId.eq.${user.id},email.eq.${user.email}`);

      const currentU = userRecords && userRecords[0] ? userRecords[0] : null;

      let currentSoc = null;
      if (currentU?.society_id) {
        const { data: soc } = await supabase
          .from("societies")
          .select("*")
          .eq("id", currentU.society_id)
          .single();
        currentSoc = soc;
      } else if (currentU?.society_username) {
        const { data: soc } = await supabase
          .from("societies")
          .select("*")
          .eq("username", currentU.society_username)
          .single();
        currentSoc = soc;
      } else {
        const { data: socList } = await supabase
          .from("societies")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);
        if (socList && socList.length > 0) currentSoc = socList[0];
      }

      const cfg = getEmailConfig();

      return {
        id: currentSoc?.id || null,
        name: currentSoc?.name || cfg.brandName || user.user_metadata?.society_name || "",
        username:
          currentSoc?.username ||
          currentU?.society_username ||
          user.user_metadata?.society_username ||
          "",
        email: currentSoc?.email || user.email || cfg.supportEmail || "",
        adminName: currentU?.name || user.user_metadata?.name || user.email?.split("@")[0] || "",
        logoUrl: currentSoc?.logo_url || cfg.logoUrl || "",
        coverUrl: currentSoc?.cover_url || cfg.bannerUrl || "",
        brandingColor: currentSoc?.branding_color || cfg.primaryColor || "#2A43F8",
        instagramUrl: currentSoc?.instagram_url || cfg.instagramUrl || "",
        linkedinUrl: currentSoc?.linkedin_url || cfg.linkedinUrl || "",
        websiteUrl: currentSoc?.website_url || cfg.websiteUrl || "",
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSmtpConfigQuery() {
  return useQuery({
    queryKey: SMTP_CONFIG_KEY,
    queryFn: async () => {
      const loadedSmtp = await fetchSmtpConfigFromDB();
      return (
        loadedSmtp || {
          user: "",
          pass: "",
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          fromName: "",
        }
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSmtpConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (smtpData) => {
      await saveSmtpConfig(smtpData);
      return smtpData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SMTP_CONFIG_KEY, data);
      toast.success("SMTP Configuration saved successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save SMTP credentials");
    },
  });
}

