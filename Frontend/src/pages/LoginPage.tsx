import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

type Role = "caregiver" | "hospital";
type Mode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginCaregiver, loginHospital, registerCaregiver, registerHospital } = useAuth();

  const [role, setRole] = useState<Role>("caregiver");
  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const title = useMemo(() => {
    if (role === "caregiver") return mode === "login" ? "Caregiver Login" : "Caregiver Sign Up";
    return mode === "login" ? "Hospital Login" : "Hospital Sign Up";
  }, [mode, role]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (role === "caregiver") {
        if (mode === "login") await loginCaregiver({ email, password });
        else await registerCaregiver({ name, email, password, pin });
      } else {
        if (mode === "login") await loginHospital({ email, password });
        else await registerHospital({ hospital_name: hospitalName, email, password });
      }
    } catch {
      toast.error("Auth failed");
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For emergencies, use the PIN flow at{" "}
          <button className="text-primary underline" onClick={() => navigate("/emergency")}>
            /emergency
          </button>
          .
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="flex gap-3">
          <label className="flex-1">
            <div className="mb-1 text-sm font-medium">Role</div>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="caregiver">Caregiver</option>
              <option value="hospital">Hospital</option>
            </select>
          </label>
          <label className="flex-1">
            <div className="mb-1 text-sm font-medium">Mode</div>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="login">Login</option>
              <option value="register">Register</option>
            </select>
          </label>
        </div>

        {mode === "register" && role === "caregiver" ? (
          <div className="space-y-2">
            <label className="block">
              <div className="mb-1 text-sm font-medium">Name</div>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium">PIN (6 digits)</div>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" />
            </label>
          </div>
        ) : null}

        {mode === "register" && role === "hospital" ? (
          <label className="block">
            <div className="mb-1 text-sm font-medium">Hospital name</div>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          </label>
        ) : null}

        <label className="block">
          <div className="mb-1 text-sm font-medium">Email</div>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-medium">Password</div>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </label>

        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
          {mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}

