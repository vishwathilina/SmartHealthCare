import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppShell from "@/layout/AppShell";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import ProfilesPage from "@/pages/ProfilesPage";
import ChatPage from "@/pages/ChatPage";
import RequestsPage from "@/pages/RequestsPage";
import AlertsPage from "@/pages/AlertsPage";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage";
import EmergencyPage from "./pages/EmergencyPage";
import HospitalAlertsPage from "./pages/HospitalAlertsPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";

function RequireRole({
  role,
  children,
}: {
  role: "caregiver" | "hospital";
  children: JSX.Element;
}) {
  const { token, role: authRole } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (authRole !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route
              path="/hospital/alerts"
              element={<RequireRole role="hospital"><HospitalAlertsPage /></RequireRole>}
            />
            <Route
              path="/app"
              element={
                <RequireRole role="caregiver">
                  <AppShell />
                </RequireRole>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="profiles" element={<ProfilesPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
