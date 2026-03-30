import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { PriorityBadge, StatusBadge } from "@/components/common/Badges";
import { DashboardResponse, ServiceRequest } from "@/types";

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [dashRes, reqRes] = await Promise.all([api.get<DashboardResponse>("/dashboard"), api.get<ServiceRequest[]>("/requests")]);
        setDashboard(dashRes.data);
        setRequests(reqRes.data);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const severityCounts = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const request of requests) {
      counts[request.priority] += 1;
    }
    return counts;
  }, [requests]);

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Requests" value={dashboard?.total_requests || 0} />
        <StatCard title="Critical Today" value={dashboard?.critical_today || 0} />
        <StatCard title="Alerts Sent" value={dashboard?.alerts_sent || 0} />
        <StatCard title="Active Profiles" value={dashboard?.active_profiles || 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Recent Requests</h2>
          <div className="space-y-3">
            {(dashboard?.recent_requests || []).map((item) => (
              <div key={item.request_id} className="rounded-lg border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.title || "Untitled request"}</p>
                  <PriorityBadge value={item.priority} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.profile_name || "Unknown profile"}</span>
                  <StatusBadge value={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Severity Distribution</h2>
          <div className="space-y-3">
            {Object.entries(severityCounts).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${label === "LOW" ? "bg-green-500" : ""}${label === "MEDIUM" ? " bg-amber-500" : ""}${label === "HIGH" ? " bg-orange-500" : ""}${label === "CRITICAL" ? " bg-red-500" : ""}`}
                    style={{ width: `${requests.length === 0 ? 0 : (value / requests.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default DashboardPage;
