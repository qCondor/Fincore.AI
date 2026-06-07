import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { groupByDate, type GroupedItems } from '../lib/dateUtils';

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

export type GroupedScans = GroupedItems<ScanRecord>;

interface UseScanHistoryOptions {
  userId?: string;
  autoFetch?: boolean;
}

interface UseScanHistoryReturn {
  scans: ScanRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function groupScansByDate(scans: ScanRecord[]): GroupedScans[] {
  return groupByDate(scans, (s) => s.timestamp);
}

export function useScanHistory({
  userId,
  autoFetch = true,
}: UseScanHistoryOptions = {}): UseScanHistoryReturn {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setScans([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await apiFetch<{ scans: ScanRecord[] }>(
      `/users/${userId}/scans?limit=20`
    );

    if (fetchError) {
      setError(fetchError);
      setScans([]);
    } else {
      setScans(data?.scans || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (autoFetch && userId) {
      refresh();
    }
  }, [autoFetch, userId, refresh]);

  return {
    scans,
    loading,
    error,
    refresh,
  };
}
