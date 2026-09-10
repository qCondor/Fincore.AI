import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { groupByDate, type DateGroup, type GroupedItems } from '../lib/dateUtils';

export interface ChatSession {
  session_id: string;
  title: string;
  message_count: number;
  last_message_time: string;
  first_message_preview: string;
}

export interface UseChatHistoryOptions {
  userId?: string;
  autoFetch?: boolean;
}

export interface UseChatHistoryReturn {
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export { type DateGroup, type GroupedItems };

export function groupSessionsByDate(sessions: ChatSession[]): GroupedItems<ChatSession>[] {
  const grouped = groupByDate(sessions, (s) => s.last_message_time);

  for (const group of grouped) {
    group.items.sort(
      (a, b) =>
        new Date(b.last_message_time).getTime() -
        new Date(a.last_message_time).getTime()
    );
  }

  return grouped;
}

export function useChatHistory({
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

    const { data, error: fetchError } = await apiFetch<{ sessions: ChatSession[] }>(
      '/users/conversations?sessions=true'
    );

    if (fetchError) {
      setError(fetchError);
      setSessions([]);
    } else if (data?.sessions) {
      setSessions(data.sessions);
    } else {
      setSessions([]);
    }

    setLoading(false);
  }, [userId]);

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
