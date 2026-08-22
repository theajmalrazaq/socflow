import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserSession } from "@/hooks/queries/useAuth";
import { Navbar } from "./Navbar";

export function RootLayout() {
  const navigate = useNavigate();
  const { data: session, isLoading } = useUserSession();

  const currentUser = session?.user || null;
  const permissions = session?.permissions || "RnVsbA==";

  useEffect(() => {
    if (!isLoading && session && !session.isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, session, navigate]);

  return (
    <Navbar access={permissions} user={currentUser}>
      <Outlet context={{ permissions, user: currentUser }} />
    </Navbar>
  );
}

export default RootLayout;
