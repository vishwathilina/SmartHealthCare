export type UUID = string;

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RequestStatus = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

export interface HealthProfile {
  id: UUID;
  user_id: UUID;
  label: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  blood_type?: string;
  daily_sugar?: number;
  resting_hr?: number;
  allergies?: string;
  conditions?: string;
  medications?: string;
  updated_at: string;
  hospital_user_id?: UUID | null;
}

export interface ChatMessage {
  id?: UUID;
  request_id?: UUID;
  role: "user" | "assistant";
  content: string;
  media_url?: string | null;
  created_at?: string;
  severity_score?: number;
  priority?: Priority;
  suggested_action?: string;
  category?: string;
}

export interface ServiceRequest {
  id: UUID;
  profile_id: UUID;
  title?: string;
  description?: string;
  category: string;
  priority: Priority;
  status: RequestStatus;
  severity_score: number;
  ai_response?: string;
  suggested_action?: string;
  alert_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestDetail extends ServiceRequest {
  chat_messages: ChatMessage[];
}

export interface AlertLog {
  id: UUID;
  request_id: UUID;
  hospital_name: string;
  summary?: string;
  image_url?: string;
  status: string;
  sent_at: string;
  request_title?: string;
  profile_id: UUID;
  profile_label?: string;
}

export interface DashboardResponse {
  total_requests: number;
  critical_today: number;
  alerts_sent: number;
  active_profiles: number;
  recent_requests: {
    request_id: UUID;
    title?: string;
    priority: Priority;
    status: RequestStatus;
    profile_name?: string;
    created_at: string;
  }[];
}

export interface HospitalOut {
  hospital_user_id: UUID;
  hospital_name: string;
  email?: string | null;
}
