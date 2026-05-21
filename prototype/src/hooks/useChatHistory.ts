"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatSession {
  session_id: string;
  title: string;
  message_count: number;
  last_message_time: string;
  first_message_preview: string;
}

export interface UseChatHistoryOptions {
  /** API base URL — defaults to /api (Next.js API routes) */
  baseUrl?: string;
  /** Fincore user ID */
  userId?: string;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseChatHistoryReturn {
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ─── Helper: Group sessions by date ───────────────────────────────────────────

export type DateGroup = "Today" | "Yesterday" | "Last 7 days" | "Older";

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
    "Last 7 days": [],
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
      groups["Today"].push(session);
    } else if (sessionDay >= yesterday) {
      groups["Yesterday"].push(session);
    } else if (sessionDay >= lastWeek) {
      groups["Last 7 days"].push(session);
    } else {
      groups["Older"].push(session);
    }
  }

  // Return only non-empty groups, in order
  const result: { label: DateGroup; items: ChatSession[] }[] = [];
  const order: DateGroup[] = ["Today", "Yesterday", "Last 7 days", "Older"];

  for (const label of order) {
    if (groups[label].length > 0) {
      // Sort items within each group by last_message_time descending
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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChatHistory({
  baseUrl = "/api",
  userId,
  autoFetch = true,
}: UseChatHistoryOptions = {}): UseChatHistoryReturn {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id ?? "";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!effectiveUserId) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${baseUrl}/chat/history?user_id=${effectiveUserId}&sessions=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No sessions yet is fine
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
      console.error("[useChatHistory] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, effectiveUserId]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && effectiveUserId) {
      refresh();
    }
  }, [autoFetch, effectiveUserId, refresh]);

  return {
    sessions,
    loading,
    error,
    refresh,
  };
}
