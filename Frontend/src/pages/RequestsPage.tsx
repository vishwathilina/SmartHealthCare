import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import { PriorityBadge, StatusBadge } from "@/components/common/Badges";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useProfileContext } from "@/context/ProfileContext";
import { RequestStatus, ServiceRequest, ServiceRequestDetail } from "@/types";

const RequestsPage = () => {
  const { profiles } = useProfileContext();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ServiceRequestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const profileNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const profile of profiles) map.set(profile.id, profile.label);
    return map;
  }, [profiles]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ServiceRequest[]>("/requests", {
        params: {
          status: status || undefined,
          priority: priority || undefined,
          category: category || undefined,
        },
      });
      setRequests(data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status, priority, category]);

  const openDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const { data } = await api.get<ServiceRequestDetail>(`/requests/${id}`);
      setDetail(data);
    } catch {
      toast.error("Failed to load request details");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Requests</h2>

      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-3">
        <select className="rounded-md border border-input px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          {(["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"] as RequestStatus[]).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select className="rounded-md border border-input px-3 py-2 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">All priority</option>
          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <input className="rounded-md border border-input px-3 py-2 text-sm" placeholder="Category (e.g. CARDIAC)" value={category} onChange={(event) => setCategory(event.target.value)} />
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Profile</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-6" colSpan={6}><LoadingSpinner small /></td></tr>
            ) : requests.length === 0 ? (
              <tr><td className="px-3 py-6 text-muted-foreground" colSpan={6}>No requests found.</td></tr>
            ) : requests.map((request) => (
              <tr key={request.id} className="cursor-pointer border-b border-border/70 hover:bg-muted/30" onClick={() => openDetail(request.id)}>
                <td className="px-3 py-2">{request.title || "Untitled"}</td>
                <td className="px-3 py-2">{profileNameById.get(request.profile_id) || "Unknown"}</td>
                <td className="px-3 py-2"><PriorityBadge value={request.priority} /></td>
                <td className="px-3 py-2"><StatusBadge value={request.status} /></td>
                <td className="px-3 py-2">{request.severity_score}</td>
                <td className="px-3 py-2">{new Date(request.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="mx-auto max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-border bg-background p-5" onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{detail.title || "Request detail"}</h3>
                  <div className="flex items-center gap-2">
                    <PriorityBadge value={detail.priority} />
                    <StatusBadge value={detail.status} />
                  </div>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{detail.description || "No description"}</p>
                <h4 className="mb-2 text-sm font-semibold">Chat History</h4>
                <div className="space-y-2">
                  {detail.chat_messages.map((msg, idx) => (
                    <div key={`${msg.role}-${idx}`} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RequestsPage;
