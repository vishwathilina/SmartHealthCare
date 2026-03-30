import axios from "axios";

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const api = axios.create({
  baseURL: `${base}/api`,
});

export default api;
