"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface Profile {
  name: string | null;
  email: string | null;
  big_five: Record<string, number> | null;
  auth_provider: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 404) {
        setProfile(null); // New user, no profile yet
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (data: { name?: string; email?: string }): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: data.name ?? profile?.name,
          email: data.email ?? profile?.email,
          big_five: profile?.big_five ?? {},
        }),
      });

      if (res.ok) {
        await fetchProfile(); // Refetch to sync state
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.id, profile, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
