import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export interface ChatSession {
  session_id: string;
  title: string;
  message_count: number;
  last_message_time: string;
  first_message_preview: string;
}

export interface UseChatHistoryOptions {
  baseUrl?: string;
  userId?: string;
  autoFetch?: boolean;
}

export interface UseChatHistoryReturn {
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export type DateGroup = 'Today' | 'Yesterday' | 'Last 7 days' | 'Older';

export function groupSessionsByDate(
  sessions: ChatSession[]
): { label: DateGroup; items: ChatSession[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: Record<DateGroup, ChatSession[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    Older: [],
  };

  for (const session of sessions) {
    const sessionDate = new Date(session.last_message_time);
    const sessionDay = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate()
    );

    if (sessionDay >= today) {
      groups['Today'].push(session);
    } else if (sessionDay >= yesterday) {
      groups['Yesterday'].push(session);
    } else if (sessionDay >= lastWeek) {
      groups['Last 7 days'].push(session);
    } else {
      groups['Older'].push(session);
    }
  }

  const result: { label: DateGroup; items: ChatSession[] }[] = [];
  const order: DateGroup[] = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  for (const label of order) {
    if (groups[label].length > 0) {
      groups[label].sort(
        (a, b) =>
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
      );
      result.push({ label, items: groups[label] });
    }
  }

  return result;
}

export function useChatHistory({
  baseUrl = API_BASE_URL,
  userId,
  autoFetch = true,
}: UseChatHistoryOptions = {}): UseChatHistoryReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${baseUrl}/users/${userId}/conversations?sessions=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setSessions([]);
          return;
        }
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();

      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    if (autoFetch && userId) {
      refresh();
    }
  }, [autoFetch, userId, refresh]);

  return {
    sessions,
    loading,
    error,
    refresh,
  };
}
