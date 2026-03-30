import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { AlertLog, Priority, RequestStatus } from "@/types";

type HospitalAlert = AlertLog & {
  request_title?: string;
  profile_label?: string;
};

export default function HospitalAlertsPage() {
  const [alerts, setAlerts] = useState<HospitalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get<HospitalAlert[]>("/hospitals/me/alerts");
      setAlerts(res.data);
    } catch {
      toast.error("Failed to load hospital alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Hospital Alerts</h2>
        <button className="rounded-md border border-border bg-card px-3 py-2 text-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {alerts.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{a.profile_label || "Patient"}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {a.request_title ? `Request: ${a.request_title}` : "Emergency request"}
                </div>
              </div>
              <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{a.status}</div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{a.summary || "No summary"}</p>
            <p className="mt-3 text-xs text-muted-foreground">Sent: {new Date(a.sent_at).toLocaleString()}</p>

            {a.image_url ? (
              <img src={a.image_url} alt="alert" className="mt-3 h-28 w-full rounded-md object-cover" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

