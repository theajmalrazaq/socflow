import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserSession } from "@/hooks/queries/useAuth";
import { Navbar } from "./Navbar";

export function RootLayout() {
  const navigate = useNavigate();
  const { data: session, isLoading } = useUserSession();

  const currentUser = session?.user || null;
  const permissions = session?.permissions || session?.role || null;
  const role = session?.role || "read_only";

  useEffect(() => {
    if (!isLoading && session && !session.isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, session, navigate]);

  return (
    <Navbar access={permissions} user={currentUser} role={role}>
      <Outlet context={{ permissions, role, user: currentUser }} />
    </Navbar>
  );
}

export default RootLayout;
