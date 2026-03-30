import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import { HealthProfile, UUID } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ProfileContextValue {
  profiles: HealthProfile[];
  activeProfile: HealthProfile | null;
  activeProfileId: UUID | "";
  setActiveProfileId: (id: UUID) => void;
  refreshProfiles: () => Promise<void>;
  loadingProfiles: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<UUID | "">("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const { role, token } = useAuth();

  const refreshProfiles = async () => {
    if (!role) {
      setLoadingProfiles(false);
      setProfiles([]);
      return;
    }
    if (role !== "caregiver") {
      setLoadingProfiles(false);
      setProfiles([]);
      return;
    }
    try {
      setLoadingProfiles(true);
      const { data } = await api.get<HealthProfile[]>("/profiles");
      setProfiles(data);

      if (!activeProfileId && data.length > 0) {
        setActiveProfileIdState(data[0].id);
      }
      if (activeProfileId && !data.find((p) => p.id === activeProfileId)) {
        setActiveProfileIdState(data[0]?.id || "");
      }
    } catch {
      toast.error("Failed to load profiles");
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    // Refresh when caregiver auth changes (login/logout).
    if (!token) {
      setProfiles([]);
      setActiveProfileIdState("");
      setLoadingProfiles(false);
      return;
    }
    refreshProfiles();
  }, [role, token]);

  const setActiveProfileId = (id: UUID) => setActiveProfileIdState(id);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) || null,
    [profiles, activeProfileId],
  );

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        setActiveProfileId,
        refreshProfiles,
        loadingProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used inside ProfileProvider");
  }
  return context;
}
