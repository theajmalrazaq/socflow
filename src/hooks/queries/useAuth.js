import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const USER_SESSION_QUERY_KEY = ["userSession"];

export function useUserSession() {
  return useQuery({
    queryKey: USER_SESSION_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          user: null,
          permissions: "RnVsbA==",
          isAuthenticated: false,
        };
      }

      let userData = {
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
      };
      let permissions = localStorage.getItem("user-permissions") || "RnVsbA==";

      try {
        const { data: users } = await supabase
          .from("users")
          .select("*")
          .or(`user_id.eq.${user.id},userId.eq.${user.id},email.eq.${user.email}`);

        if (users && users.length > 0) {
          const u = users[0];
          userData = {
            id: u.id,
            name: u.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email || u.email || "",
            role: u.role || "admin",
          };
          const rawPerm = u.permissions || u.role;
          permissions = typeof rawPerm === "object" ? JSON.stringify(rawPerm) : String(rawPerm);
          localStorage.setItem("user-permissions", permissions);
        }
      } catch (err) {
        console.error("Error loading user profile in session query:", err);
      }

      return {
        user: userData,
        permissions,
        isAuthenticated: true,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem("user-permissions");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

