import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useProfileContext } from "@/context/ProfileContext";
import { AlertLog, ServiceRequest } from "@/types";

const AlertsPage = () => {
  const { profiles } = useProfileContext();
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [criticalRequests, setCriticalRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  const profileNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const profile of profiles) map.set(profile.id, profile.label);
    return map;
  }, [profiles]);

  const load = async () => {
    try {
      setLoading(true);
      const [alertsRes, requestsRes] = await Promise.all([
        api.get<AlertLog[]>("/alerts"),
        api.get<ServiceRequest[]>("/requests", { params: { priority: "CRITICAL" } }),
      ]);
      setAlerts(alertsRes.data);
      setCriticalRequests(requestsRes.data.filter((request) => !request.alert_sent));
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendAlert = async (requestId: string) => {
    try {
      setSendingFor(requestId);
      await api.post("/alerts", { request_id: requestId });
      toast.success("Alert sent");
      await load();
    } catch {
      toast.error("Failed to send alert");
    } finally {
      setSendingFor(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Alerts</h2>

      {loading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : null}

      {criticalRequests.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Critical Requests Needing Alert</h3>
          <div className="space-y-2">
            {criticalRequests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{request.title || "Critical request"}</p>
                  <p className="text-xs text-muted-foreground">Severity: {request.severity_score}</p>
                </div>
                <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white" onClick={() => sendAlert(request.id)}>
                  {sendingFor === request.id ? <LoadingSpinner small /> : "Send Alert"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold">{alert.profile_label || profileNameById.get(alert.profile_id) || "Patient"}</h4>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{alert.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{alert.summary || "No summary"}</p>
            <p className="mt-3 text-xs text-muted-foreground">Sent: {new Date(alert.sent_at).toLocaleString()}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AlertsPage;
