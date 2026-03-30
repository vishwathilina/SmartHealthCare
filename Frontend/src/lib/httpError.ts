import axios from "axios";

type ErrorPayload = {
  detail?: string;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as ErrorPayload | undefined;
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof error.message === "string" && error.message.trim()) return error.message;

  return fallback;
}