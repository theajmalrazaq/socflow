import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { USER_SESSION_QUERY_KEY } from "./useAuth";

export const USERS_QUERY_KEY = ["users"];

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Create User Mutation
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, password, role, permissionMatrix }) => {
      let authData = null;
      let authError = null;

      try {
        const adminRes = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role },
        });
        authData = adminRes.data;
        authError = adminRes.error;
      } catch {
        // Admin API not available on client key, fallback to signUp
      }

      if (authError || !authData?.user) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });
        authData = signUpRes.data;
        authError = signUpRes.error;
      }

      if (authError) throw authError;

      const userId = authData.user?.id;
      const payload = {
        userId: userId,
        user_id: userId,
        email: email,
        name: name,
        permissions: JSON.stringify(permissionMatrix),
        role: role,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data, error: dbError } = await supabase
        .from("users")
        .insert([payload])
        .select()
        .single();
      if (dbError) throw dbError;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`User ${data?.name || "account"} created successfully!`);
    },
    onError: (err) => {
      console.error("Create User Error:", err);
      toast.error(err.message || "Failed to create user");
    },
  });
}

// Update User Permissions / Role Mutation
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissions, role }) => {
      const { data, error } = await supabase
        .from("users")
        .update({
          permissions: typeof permissions === "object" ? JSON.stringify(permissions) : permissions,
          role,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_SESSION_QUERY_KEY });
      toast.success(`Updated permissions for ${data?.name || "user"}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update permissions");
    },
  });
}

// Delete User Mutation
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user) => {
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (error) throw error;
      return user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`Deleted user ${user?.name || ""}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete user");
    },
  });
}
