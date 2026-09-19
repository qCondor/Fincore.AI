import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'fincore_session_token';

// In-memory cache so apiFetch can attach the Authorization header
// synchronously without awaiting SecureStore on every request.
let cachedToken: string | null = null;

export async function loadSessionToken(): Promise<string | null> {
  cachedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  return cachedToken;
}

export async function setSessionToken(token: string): Promise<void> {
  cachedToken = token;
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export function getCachedSessionToken(): string | null {
  return cachedToken;
}

// Lets apiFetch tell UserContext a session died without importing React state.
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export async function handleSessionExpired(): Promise<void> {
  await clearSessionToken();
  sessionExpiredHandler?.();
}
