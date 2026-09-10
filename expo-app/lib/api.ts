import { API_BASE_URL } from '../config';
import { getCachedSessionToken } from './session';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;
  const sessionToken = getCachedSessionToken();

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: null };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Request failed';
    return { data: null, error };
  }
}

export async function apiPost<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'POST', body });
}

export async function apiPatch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'PATCH', body });
}
