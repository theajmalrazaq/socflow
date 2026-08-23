import "./App.css";
import { createPortal } from "react-dom";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Events } from "./pages/Events";
import { EventDetails } from "./pages/EventDetails";
import { NewEvent } from "./pages/NewEvent";
import { Leads } from "./pages/Leads";
import { LeadDetails } from "./pages/LeadDetails";
import { Inductions } from "./pages/Inductions";
import { Members } from "./pages/Members";
import { Emails } from "./pages/Emails";
import { SendEmail } from "./pages/SendEmail";
import { EmailSettings } from "./pages/EmailSettings";
import { Users } from "./pages/Users";
import { ErrorPage } from "./pages/ErrorPage";
import { NoPermission } from "./pages/NoPermission";
import { RootLayout } from "./components/layout/RootLayout";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/lib/theme-provider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="vite-ui-theme">
        <div className="App">
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RootLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/new" element={<NewEvent />} />
                <Route path="/events/details" element={<EventDetails />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/details" element={<LeadDetails />} />
                <Route path="/inductions" element={<Inductions />} />
                <Route path="/members" element={<Members />} />
                <Route path="/emails" element={<Emails />} />
                <Route path="/emails/compose" element={<SendEmail />} />
                <Route path="/emails/settings" element={<EmailSettings />} />
                <Route path="/settings" element={<EmailSettings />} />
                <Route path="/users" element={<Users />} />

                {/* Clean route aliases */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/events/create" element={<Navigate to="/events/new" replace />} />
                <Route path="/emails/send" element={<Navigate to="/emails/compose" replace />} />
                <Route path="/emails/customize" element={<Navigate to="/settings" replace />} />
                <Route path="/settings/email" element={<Navigate to="/settings" replace />} />
                <Route path="/settings/emails" element={<Navigate to="/settings" replace />} />
              </Route>
              <Route path="/no-permission" element={<NoPermission />} />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </BrowserRouter>
        </div>
        {/* Portal Toaster outside #root so dialog backdrop-filters never cover it */}
        {typeof document !== "undefined" &&
          createPortal(<Toaster />, document.getElementById("sonner-root") || document.body)}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
