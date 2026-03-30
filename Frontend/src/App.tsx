import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppShell from "@/layout/AppShell";
import { ProfileProvider } from "@/context/ProfileContext";
import DashboardPage from "@/pages/DashboardPage";
import ProfilesPage from "@/pages/ProfilesPage";
import ChatPage from "@/pages/ChatPage";
import RequestsPage from "@/pages/RequestsPage";
import AlertsPage from "@/pages/AlertsPage";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <ProfileProvider>
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="profiles" element={<ProfilesPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  </ProfileProvider>
);

export default App;
