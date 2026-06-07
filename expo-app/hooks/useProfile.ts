import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

export interface Profile {
  name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  address: string | null;
  occupation: string | null;
  nationality: string | null;
  photo_url: string | null;
  big_five: Record<string, number> | null;
}

interface UseProfileOptions {
  userId?: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  initials: string;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function useProfile({
  userId,
}: UseProfileOptions = {}): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await apiFetch<Profile>(`/profile/${userId}`);

    if (fetchError) {
      setError(fetchError);
    } else {
      setProfile(data);
    }

    setIsLoading(false);
  }, [userId]);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID' };
    }

    const { error: deleteError } = await apiFetch(`/users/${userId}`, { method: 'DELETE' });

    if (deleteError) {
      return { success: false, error: deleteError };
    }

    setProfile(null);
    return { success: true };
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const initials = getInitials(profile?.name ?? null);

  return {
    profile,
    isLoading,
    error,
    refetch,
    deleteAccount,
    initials,
  };
}
