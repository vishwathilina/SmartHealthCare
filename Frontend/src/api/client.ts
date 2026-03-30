import axios from "axios";

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const api = axios.create({
  baseURL: `${base}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
