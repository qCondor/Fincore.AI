import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

interface Profile {
  name: string | null;
  email: string | null;
  big_five: Record<string, number> | null;
}

interface UseProfileOptions {
  baseUrl?: string;
  userId?: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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
  baseUrl = API_BASE_URL,
  userId,
}: UseProfileOptions = {}): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 404) {
        setProfile(null);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const initials = getInitials(profile?.name ?? null);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    initials,
  };
}
