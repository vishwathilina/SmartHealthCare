import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "@/api/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { SeverityBadge } from "@/components/common/Badges";
import { UUID } from "@/types";

type EmergencyContact = { name: string; phone?: string | null; relation?: string | null };
type EmergencyProfileOption = {
  profile_id: UUID;
  label: string;
  hospital_name?: string | null;
  hospital_user_id?: UUID | null;
  contacts: EmergencyContact[];
};
type EmergencyLookupOut = { profiles: EmergencyProfileOption[] };

type EmergencyResponse = {
  request_id: UUID;
  message: string;
  severity_score: number;
  suggested_action: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  alert_sent: boolean;
  category: string;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EmergencyPage() {
  const [pin, setPin] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookup, setLookup] = useState<EmergencyLookupOut | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<UUID | "">("");

  const [message, setMessage] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<EmergencyResponse | null>(null);

  const selectedProfile = useMemo(() => {
    if (!lookup || !selectedProfileId) return null;
    return lookup.profiles.find((p) => p.profile_id === selectedProfileId) || null;
  }, [lookup, selectedProfileId]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canRecord = typeof window !== "undefined" && !!navigator.mediaDevices && typeof MediaRecorder !== "undefined";

  const startRecording = async () => {
    if (!canRecord) {
      toast.error("Voice recording not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType: string | undefined;
      const candidateTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      for (const t of candidateTypes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((MediaRecorder as any).isTypeSupported?.(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setAudioBase64(null);
      setAudioMimeType(mimeType || null);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const dataUrl = await fileToDataUrl(new File([blob], "recording.webm", { type: mimeType || blob.type }));
        setAudioBase64(dataUrl);

        // stop stream tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  const pickImage = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setImageBase64(dataUrl);
  };

  const onLookup = async () => {
    if (!pin.trim()) {
      toast.error("Enter a 6-digit PIN");
      return;
    }
    setLookupLoading(true);
    setResponse(null);
    try {
      const res = await api.post<EmergencyLookupOut>("/emergency/lookup", { pin });
      setLookup(res.data);
      if (res.data.profiles.length > 0) setSelectedProfileId(res.data.profiles[0].profile_id);
    } catch {
      toast.error("Invalid PIN or lookup failed");
      setLookup(null);
      setSelectedProfileId("");
    } finally {
      setLookupLoading(false);
    }
  };

  const sendEmergency = async () => {
    if (!lookup || !selectedProfileId) {
      toast.error("Choose a profile first");
      return;
    }
    if (!message.trim() && !audioBase64) {
      toast.error("Add symptoms text or record voice");
      return;
    }
    setSubmitting(true);
    setResponse(null);
    try {
      const res = await api.post<EmergencyResponse>("/emergency/request", {
        pin,
        profile_id: selectedProfileId,
        message: message || undefined,
        image_base64: imageBase64 || undefined,
        audio_base64: audioBase64 || undefined,
        audio_mime_type: audioMimeType || undefined,
      });
      setResponse(res.data);
      toast.success("Emergency triage created and hospital alerted (if critical)");
    } catch {
      toast.error("Emergency triage failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <div className="mb-1 text-sm font-medium">Emergency PIN (6 digits)</div>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={pin}
              inputMode="numeric"
              onChange={(e) => setPin(e.target.value)}
              placeholder="000000"
            />
          </div>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={onLookup}
            disabled={lookupLoading}
          >
            {lookupLoading ? <LoadingSpinner small /> : "Lookup"}
          </button>
        </div>
      </div>

      {lookupLoading ? null : lookup && lookup.profiles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No profiles found for that PIN.</div>
      ) : null}

      {lookup ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Elderly Profiles</h3>
            <div className="mt-3 space-y-2">
              {lookup.profiles.map((p) => (
                <button
                  key={p.profile_id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    p.profile_id === selectedProfileId ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                  onClick={() => {
                    setSelectedProfileId(p.profile_id);
                    setResponse(null);
                  }}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.hospital_name ? `Hospital: ${p.hospital_name}` : "Hospital not configured"}</div>
                  {p.contacts.length > 0 ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Emergency contacts: {p.contacts.map((c) => c.name).join(", ")}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Describe Symptoms</h3>

            <div className="mt-3">
              <label className="flex flex-col gap-1 text-sm">
                Message
                <textarea
                  className="min-h-[110px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., chest pain and difficulty breathing since 30 minutes..."
                />
              </label>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium">Optional image</div>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                Attach
                <input className="hidden" type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0] || null)} />
              </label>
              {imageBase64 ? <div className="mt-2 text-xs text-muted-foreground">Image attached.</div> : null}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Voice</div>
                  <div className="text-xs text-muted-foreground">{canRecord ? "Record audio and Gemini will transcribe + triage." : "Not supported on this browser."}</div>
                </div>
                {recording ? (
                  <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white" onClick={stopRecording}>
                    Stop
                  </button>
                ) : (
                  <button
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                    onClick={startRecording}
                    disabled={!canRecord}
                  >
                    Record
                  </button>
                )}
              </div>
              {audioBase64 ? <div className="mt-2 text-xs text-muted-foreground">Audio attached.</div> : null}
            </div>

            <div className="mt-4">
              <button
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={sendEmergency}
                disabled={submitting}
              >
                {submitting ? <LoadingSpinner small /> : "Send Emergency Triage"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {response ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SeverityBadge value={response.priority} />
              <div className="text-xs text-muted-foreground">Severity: {response.severity_score}/10</div>
            </div>
            {response.alert_sent ? (
              <div className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Hospital alerted</div>
            ) : (
              <div className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">No auto alert</div>
            )}
          </div>

          <div className="mt-3 text-sm">{response.message}</div>
          <div className="mt-3 rounded-md bg-muted p-3 text-xs text-foreground">
            <div className="font-semibold">Suggested action</div>
            <div className="mt-1">{response.suggested_action}</div>
          </div>

          {selectedProfile?.hospital_name && response.alert_sent ? (
            <div className="mt-3 text-xs text-muted-foreground">Sent to: {selectedProfile.hospital_name}</div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

