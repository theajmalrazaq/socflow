import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const USER_SESSION_QUERY_KEY = ["userSession"];
const SESSION_CACHE_KEY = "socflow_cached_session";

function getCachedSession() {
  try {
    if (typeof window === "undefined") return undefined;
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return undefined;
    const parsed = JSON.parse(cached);
    if (parsed && parsed.isAuthenticated && parsed.user) {
      return parsed;
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return undefined;
}

function setCachedSession(data) {
  try {
    if (typeof window === "undefined") return;
    if (data && data.isAuthenticated) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useUserSession() {
  return useQuery({
    queryKey: USER_SESSION_QUERY_KEY,
    initialData: getCachedSession,
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setCachedSession(null);
        return {
          user: null,
          role: null,
          permissions: null,
          isAuthenticated: false,
        };
      }

      let userData = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: user.user_metadata?.role || "Member",
      };

      let permissions = null;

      try {
        const { data: users, error: dbError } = await supabase
          .from("users")
          .select("*")
          .or(`user_id.eq.${user.id},userId.eq.${user.id},email.eq.${user.email}`);

        if (dbError) {
          console.warn("Could not fetch user record from db:", dbError);
        }

        if (users && users.length > 0) {
          const u = users[0];
          const userRole = u.role || user.user_metadata?.role || "Member";
          userData = {
            id: u.id,
            userId: u.user_id || u.userId || user.id,
            name: u.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email || u.email || "",
            role: userRole,
            society_id: u.society_id || null,
          };
          permissions = u.permissions || null;
        }
      } catch (err) {
        console.error("Error loading user profile in session query:", err);
      }

      const sessionResult = {
        user: userData,
        role: userData.role,
        permissions,
        isAuthenticated: true,
      };

      setCachedSession(sessionResult);
      return sessionResult;
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
    },
    onSuccess: () => {
      setCachedSession(null);
      queryClient.clear();
    },
  });
}
