import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

type Role = "caregiver" | "hospital";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerCaregiver, registerHospital } = useAuth();

  const [role, setRole] = useState<Role>("caregiver");

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const title = useMemo(
    () => (role === "caregiver" ? "Caregiver Registration" : "Hospital Registration"),
    [role],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (role === "caregiver") {
        if (!/^\d{6}$/.test(pin.trim())) {
          toast.error("PIN must be exactly 6 digits");
          return;
        }
        await registerCaregiver({ name, email, password, pin });
      } else {
        await registerHospital({ hospital_name: hospitalName, email, password });
      }
    } catch {
      // AuthContext already shows a precise toast.
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For emergency help, use the public PIN flow at{" "}
          <button className="text-primary underline" type="button" onClick={() => navigate("/emergency")}>
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
        </div>

        {role === "caregiver" ? (
          <>
            <label className="block">
              <div className="mb-1 text-sm font-medium">Full name</div>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium">Unique emergency PIN (6 digits)</div>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="123456" />
            </label>
          </>
        ) : (
          <label className="block">
            <div className="mb-1 text-sm font-medium">Hospital name</div>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          </label>
        )}

        <label className="block">
          <div className="mb-1 text-sm font-medium">Email</div>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-medium">Password</div>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </label>

        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
          Create account
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button className="text-primary underline" type="button" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

