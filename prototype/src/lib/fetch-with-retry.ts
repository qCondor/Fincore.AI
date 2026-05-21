/**
 * Enhanced fetch with timeout and retry logic for Fincore API calls.
 *
 * PURPOSE: Provides resilient HTTP requests for mobile environments where
 * network conditions are unpredictable (3G, WiFi transitions, etc.).
 *
 * FEATURES:
 * - Configurable timeout (default: 15s, image analysis: 30s, chat SSE: 90s)
 * - Exponential backoff retry (1s, 2s, 4s delays)
 * - Automatic retry on 502/503/504 gateway errors
 * - Custom error types for precise error handling
 *
 * USAGE:
 *   const res = await fetchWithRetry('/api/analyze', {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *     timeout: 30000,  // 30s for image analysis
 *     retries: 2,      // 3 total attempts
 *   });
 *
 * ERROR HANDLING:
 *   try { ... } catch (e) {
 *     const message = getUserFriendlyError(e); // Human-readable message
 *   }
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;        // Default: 15000ms
  retries?: number;        // Default: 3
  retryDelay?: number;     // Default: 1000ms (exponential backoff)
  retryOn?: number[];      // HTTP status codes to retry on, default: [502, 503, 504]
}

export class FetchTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

export class FetchRetryError extends Error {
  public attempts: number;
  public lastStatus?: number;

  constructor(message: string, attempts: number, lastStatus?: number) {
    super(message);
    this.name = 'FetchRetryError';
    this.attempts = attempts;
    this.lastStatus = lastStatus;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 15000,
    retries = 3,
    retryDelay = 1000,
    retryOn = [502, 503, 504],
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // Check if we should retry this status code
      if (retryOn.includes(response.status) && attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        lastError = new FetchTimeoutError();
        if (attempt < retries) {
          await delay(retryDelay * Math.pow(2, attempt));
          continue;
        }
      } else {
        lastError = error as Error;
        // Network errors should retry
        if (attempt < retries) {
          await delay(retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }
  }

  throw lastError || new FetchRetryError(
    `Failed after ${retries + 1} attempts`,
    retries + 1,
    lastStatus
  );
}

// User-friendly error messages
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof FetchTimeoutError) {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (error instanceof FetchRetryError) {
    if (error.lastStatus === 502) return 'Server temporarily unavailable. Please try again.';
    if (error.lastStatus === 503) return 'Service is busy. Please wait a moment and retry.';
    if (error.lastStatus === 504) return 'Server took too long to respond. Try again.';
    return 'Connection failed. Please check your internet and retry.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
