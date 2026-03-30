import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { DEMO_USER_ID, useProfileContext } from "@/context/ProfileContext";
import { HealthProfile } from "@/types";

const defaultForm = {
  name: "",
  label: "",
  age: "",
  weight_kg: "",
  height_cm: "",
  blood_type: "",
  daily_sugar: "",
  resting_hr: "",
  allergies: "",
  conditions: "",
  medications: "",
};

const ProfilesPage = () => {
  const { profiles, refreshProfiles, loadingProfiles } = useProfileContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HealthProfile | null>(null);
  const [form, setForm] = useState(defaultForm);

  const title = useMemo(() => (editingProfile ? "Edit Profile" : "Add Profile"), [editingProfile]);

  const openAddModal = () => {
    setEditingProfile(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: HealthProfile) => {
    setEditingProfile(profile);
    setForm({
      name: profile.label,
      label: profile.label || "",
      age: profile.age?.toString() || "",
      weight_kg: profile.weight_kg?.toString() || "",
      height_cm: profile.height_cm?.toString() || "",
      blood_type: profile.blood_type || "",
      daily_sugar: profile.daily_sugar?.toString() || "",
      resting_hr: profile.resting_hr?.toString() || "",
      allergies: profile.allergies || "",
      conditions: profile.conditions || "",
      medications: profile.medications || "",
    });
    setIsModalOpen(true);
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();

    const payload = {
      user_id: DEMO_USER_ID,
      label: form.label || form.name || "My Profile",
      age: toNumber(form.age),
      weight_kg: toNumber(form.weight_kg),
      height_cm: toNumber(form.height_cm),
      blood_type: form.blood_type || null,
      daily_sugar: toNumber(form.daily_sugar),
      resting_hr: toNumber(form.resting_hr),
      allergies: form.allergies || null,
      conditions: form.conditions || null,
      medications: form.medications || null,
    };

    try {
      setSaving(true);
      if (editingProfile) {
        await api.put(`/profiles/${editingProfile.id}`, payload);
        toast.success("Profile updated");
      } else {
        await api.post("/profiles", payload);
        toast.success("Profile created");
      }
      setIsModalOpen(false);
      await refreshProfiles();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this profile?")) return;

    try {
      await api.delete(`/profiles/${id}`);
      toast.success("Profile deleted");
      await refreshProfiles();
    } catch {
      toast.error("Failed to delete profile");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Profiles</h2>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={openAddModal}>
          Add Profile
        </button>
      </div>

      {loadingProfiles ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article key={profile.id} className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-lg font-semibold">{profile.label}</h3>
            <p className="text-sm text-muted-foreground">Age: {profile.age || "N/A"}</p>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {profile.conditions || "No known conditions"}
            </p>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md border border-border px-3 py-1.5 text-sm" onClick={() => openEditModal(profile)}>
                Edit
              </button>
              <button className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => onDelete(profile.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background p-5">
            <h3 className="mb-4 text-lg font-semibold">{title}</h3>
            <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSave}>
              <Input label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
              <Input label="Label" value={form.label} onChange={(value) => setForm((prev) => ({ ...prev, label: value }))} />
              <Input label="Age" value={form.age} onChange={(value) => setForm((prev) => ({ ...prev, age: value }))} />
              <Input label="Weight (kg)" value={form.weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, weight_kg: value }))} />
              <Input label="Height (cm)" value={form.height_cm} onChange={(value) => setForm((prev) => ({ ...prev, height_cm: value }))} />
              <Input label="Blood Type" value={form.blood_type} onChange={(value) => setForm((prev) => ({ ...prev, blood_type: value }))} />
              <Input label="Daily Sugar" value={form.daily_sugar} onChange={(value) => setForm((prev) => ({ ...prev, daily_sugar: value }))} />
              <Input label="Resting HR" value={form.resting_hr} onChange={(value) => setForm((prev) => ({ ...prev, resting_hr: value }))} />
              <TextArea label="Allergies" value={form.allergies} onChange={(value) => setForm((prev) => ({ ...prev, allergies: value }))} />
              <TextArea label="Conditions" value={form.conditions} onChange={(value) => setForm((prev) => ({ ...prev, conditions: value }))} />
              <div className="md:col-span-2">
                <TextArea label="Medications" value={form.medications} onChange={(value) => setForm((prev) => ({ ...prev, medications: value }))} />
              </div>

              <div className="mt-3 flex gap-2 md:col-span-2">
                <button type="button" className="rounded-md border border-border px-4 py-2 text-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  {saving ? <LoadingSpinner small /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input className="rounded-md border border-input bg-background px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <textarea className="min-h-[90px] rounded-md border border-input bg-background px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function toNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default ProfilesPage;
