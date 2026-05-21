import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export interface ScanRecord {
  scan_id: string;
  timestamp: string;
  product_name?: string;
  product_identified?: string;
  product_category?: string;
  category?: string;
  price?: number;
  estimated_price?: number;
  overall_score?: number;
  grade?: string;
  verdict?: string;
  color?: 'green' | 'amber' | 'red';
  financial_insight?: string;
  recommendations?: string[];
  alternatives?: string[];
  analysis_summary?: string;
  image_url?: string;
}

export interface GroupedScans {
  label: string;
  items: ScanRecord[];
}

interface UseScanHistoryOptions {
  baseUrl?: string;
  userId?: string;
  autoFetch?: boolean;
}

interface UseScanHistoryReturn {
  scans: ScanRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function isWithinLastWeek(date: Date): boolean {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

export function groupScansByDate(scans: ScanRecord[]): GroupedScans[] {
  const today: ScanRecord[] = [];
  const yesterday: ScanRecord[] = [];
  const lastWeek: ScanRecord[] = [];
  const older: ScanRecord[] = [];

  for (const scan of scans) {
    const date = new Date(scan.timestamp);
    if (isToday(date)) {
      today.push(scan);
    } else if (isYesterday(date)) {
      yesterday.push(scan);
    } else if (isWithinLastWeek(date)) {
      lastWeek.push(scan);
    } else {
      older.push(scan);
    }
  }

  const groups: GroupedScans[] = [];
  if (today.length > 0) groups.push({ label: 'Today', items: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', items: yesterday });
  if (lastWeek.length > 0) groups.push({ label: 'Last 7 days', items: lastWeek });
  if (older.length > 0) groups.push({ label: 'Older', items: older });

  return groups;
}

export function useScanHistory({
  baseUrl = API_BASE_URL,
  userId,
  autoFetch = true,
}: UseScanHistoryOptions = {}): UseScanHistoryReturn {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    console.log('[useScanHistory] fetchScans called, userId:', userId);
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[useScanHistory] Fetching:', `${baseUrl}/users/${userId}/scans?limit=20`);
      const response = await fetch(`${baseUrl}/users/${userId}/scans?limit=20`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useScanHistory] Response:', data.scans?.length, 'scans');
      setScans(data.scans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scan history');
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    if (autoFetch) {
      fetchScans();
    }
  }, [autoFetch, fetchScans]);

  return {
    scans,
    loading,
    error,
    refresh: fetchScans,
  };
}
