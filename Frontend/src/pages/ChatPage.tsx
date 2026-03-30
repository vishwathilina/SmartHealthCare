import { Mic, Paperclip, Send } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import { SeverityBadge } from "@/components/common/Badges";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useProfileContext } from "@/context/ProfileContext";
import { ChatMessage, Priority, UUID } from "@/types";

interface ChatResponse {
  request_id: UUID;
  message: string;
  severity_score: number;
  suggested_action: string;
  priority: Priority;
  alert_sent: boolean;
  category: string;
}

const ChatPage = () => {
  const { profiles, activeProfileId, setActiveProfileId } = useProfileContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requestId, setRequestId] = useState<UUID | undefined>();
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const onPickImage = async (file: File | null) => {
    if (!file) return;

    const b64 = await toBase64(file);
    setImageBase64(b64);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const sendMessage = async () => {
    if (!activeProfileId) {
      toast.error("Please choose a profile first");
      return;
    }
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      media_url: previewUrl,
    };

    setMessages((prev) => [...prev, userMessage]);
    const outboundMessage = input;
    setInput("");

    try {
      setLoading(true);
      const { data } = await api.post<ChatResponse>("/chat", {
        profile_id: activeProfileId,
        request_id: requestId,
        message: outboundMessage,
        image_base64: imageBase64 || undefined,
      });
      setRequestId(data.request_id);

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        severity_score: data.severity_score,
        priority: data.priority,
        suggested_action: data.suggested_action,
        category: data.category,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setImageBase64(null);
      setPreviewUrl(null);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const startVoice = async () => {
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
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
      setAudioMimeType(mimeType || null);

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const audioFile = new File([blob], "voice-recording.webm", { type: mimeType || blob.type });
        const audioB64 = await toBase64(audioFile);

        try {
          const { data } = await api.post<{ transcript: string }>(`/voice/transcribe`, {
            audio_base64: audioB64,
            audio_mime_type: mimeType || undefined,
          });
          if (data.transcript) setInput(data.transcript);
        } catch {
          toast.error("Failed to transcribe voice");
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopVoice = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Profile</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={activeProfileId}
            onChange={(event) => setActiveProfileId(event.target.value)}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
              {message.role === "assistant" && message.priority ? (
                <div className="mb-2 flex items-center gap-2">
                  <SeverityBadge value={message.priority} />
                  <span className="text-xs text-muted-foreground">Severity: {message.severity_score}/10</span>
                </div>
              ) : null}

              <p>{message.content}</p>

              {message.suggested_action ? (
                <div className="mt-3 rounded-md bg-muted p-2 text-xs text-foreground">
                  <p className="font-semibold">Suggested action</p>
                  <p>{message.suggested_action}</p>
                </div>
              ) : null}

              {message.media_url ? (
                <img src={message.media_url} alt="Attached" className="mt-3 h-24 w-24 rounded-md object-cover" />
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner small /> AI is typing...
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        {previewUrl ? (
          <div className="mb-2 flex items-center gap-2">
            <img src={previewUrl} alt="preview" className="h-14 w-14 rounded-md object-cover" />
            <button className="text-xs text-red-600" onClick={() => { setPreviewUrl(null); setImageBase64(null); }}>
              Remove image
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={input}
            placeholder="Describe symptoms..."
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
          />

          <label className="cursor-pointer rounded-md border border-border p-2" title="Upload image">
            <Paperclip className="h-4 w-4" />
            <input className="hidden" type="file" accept="image/*" onChange={(event) => onPickImage(event.target.files?.[0] || null)} />
          </label>

          <button
            className={`rounded-md border px-2 py-2 ${isRecording ? "border-red-300 bg-red-50 text-red-700" : "border-border"}`}
            title="Hold to record"
            onMouseDown={startVoice}
            onMouseUp={stopVoice}
            onMouseLeave={stopVoice}
            onTouchStart={startVoice}
            onTouchEnd={stopVoice}
          >
            <Mic className="h-4 w-4" />
          </button>

          <button className="rounded-md bg-primary p-2 text-primary-foreground" onClick={sendMessage} disabled={loading}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      resolve(raw.includes(",") ? raw.split(",", 2)[1] : raw);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default ChatPage;
