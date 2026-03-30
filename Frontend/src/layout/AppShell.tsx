import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";

import { useProfileContext } from "@/context/ProfileContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/profiles", label: "Profiles" },
  { to: "/chat", label: "New Request" },
  { to: "/requests", label: "Requests" },
  { to: "/alerts", label: "Alerts" },
];

const AppShell = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profiles, activeProfileId, setActiveProfileId } = useProfileContext();

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[260px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-4 transition-transform md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 text-lg font-bold">Smart Healthcare</div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-border p-2 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-semibold">AI Smart Healthcare Assistant</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">Active profile</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={activeProfileId}
              onChange={(event) => setActiveProfileId(event.target.value)}
            >
              {profiles.length === 0 ? <option value="">No profiles</option> : null}
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
