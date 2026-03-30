import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import api from "@/api/client";
import { HealthProfile, UUID } from "@/types";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

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

  const refreshProfiles = async () => {
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
    refreshProfiles();
  }, []);

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

export { DEMO_USER_ID };
