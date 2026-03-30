import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "@/api/client";
import { getApiErrorMessage } from "@/lib/httpError";

type Role = "caregiver" | "hospital";

type AuthContextValue = {
  token: string | null;
  role: Role | null;
  loginCaregiver: (payload: { email: string; password: string }) => Promise<void>;
  registerCaregiver: (payload: { name: string; email: string; password: string; pin: string }) => Promise<void>;
  loginHospital: (payload: { email: string; password: string }) => Promise<void>;
  registerHospital: (payload: { hospital_name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "access_token";
const ROLE_KEY = "access_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<Role | null>(() => {
    const r = localStorage.getItem(ROLE_KEY);
    if (r === "caregiver" || r === "hospital") return r;
    return null;
  });

  const persist = (nextToken: string | null, nextRole: Role | null) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextRole) localStorage.setItem(ROLE_KEY, nextRole);
    else localStorage.removeItem(ROLE_KEY);
    setToken(nextToken);
    setRole(nextRole);
  };

  const loginCaregiver = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await api.post<{ access_token: string }>("/auth/caregiver/login", { email, password });
      persist(res.data.access_token, "caregiver");
      navigate("/app");
    } catch (error) {
      const message = getApiErrorMessage(error, "Caregiver login failed");
      toast.error(message);
      throw new Error(message);
    }
  };

  const registerCaregiver = async ({
    name,
    email,
    password,
    pin,
  }: {
    name: string;
    email: string;
    password: string;
    pin: string;
  }) => {
    try {
      const res = await api.post<{ access_token: string }>("/auth/caregiver/register", { name, email, password, pin });
      persist(res.data.access_token, "caregiver");
      navigate("/app");
    } catch (error) {
      const message = getApiErrorMessage(error, "Caregiver registration failed");
      toast.error(message);
      throw new Error(message);
    }
  };

  const loginHospital = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await api.post<{ access_token: string }>("/auth/hospital/login", { email, password });
      persist(res.data.access_token, "hospital");
      navigate("/hospital/alerts");
    } catch (error) {
      const message = getApiErrorMessage(error, "Hospital login failed");
      toast.error(message);
      throw new Error(message);
    }
  };

  const registerHospital = async ({
    hospital_name,
    email,
    password,
  }: {
    hospital_name: string;
    email: string;
    password: string;
  }) => {
    try {
      const res = await api.post<{ access_token: string }>("/auth/hospital/register", {
        hospital_name,
        email,
        password,
      });
      persist(res.data.access_token, "hospital");
      navigate("/hospital/alerts");
    } catch (error) {
      const message = getApiErrorMessage(error, "Hospital registration failed");
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    persist(null, null);
    navigate("/login");
  };

  const value = useMemo(
    () => ({
      token,
      role,
      loginCaregiver,
      registerCaregiver,
      loginHospital,
      registerHospital,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

