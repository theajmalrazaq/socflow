import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "./Navbar";

export function RootLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("user-permissions") || "RnVsbA=="
      : "RnVsbA==";
  });

  useEffect(() => {
    async function checkUserSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        const { data: users } = await supabase
          .from("users")
          .select("*")
          .or(`user_id.eq.${user.id},userId.eq.${user.id},email.eq.${user.email}`);

        if (users && users.length > 0) {
          const u = users[0];
          setCurrentUser({
            name: u.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email || u.email || "",
          });
          const rawPerm = u.permissions || u.role;
          const permStr = typeof rawPerm === "object" ? JSON.stringify(rawPerm) : String(rawPerm);
          setPermissions(permStr);
          localStorage.setItem("user-permissions", permStr);
        } else {
          setCurrentUser({
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email || "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkUserSession();
  }, [navigate]);

  return (
    <Navbar access={permissions} user={currentUser}>
      <Outlet context={{ permissions, user: currentUser }} />
    </Navbar>
  );
}

export default RootLayout;
