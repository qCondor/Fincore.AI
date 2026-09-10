import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiPost } from '../lib/api';
import { loadSessionToken, setSessionToken, clearSessionToken } from '../lib/session';

const USER_ID_KEY = 'fincore_user_id';
const USER_NAME_KEY = 'fincore_user_name';
const AUTH_PROVIDER_KEY = 'fincore_auth_provider';
const USER_EMAIL_KEY = 'fincore_user_email';
const ONBOARDING_COMPLETED_KEY = 'fincore_onboarding_completed';

type AuthProvider = 'anonymous' | 'google' | 'apple' | 'microsoft';

interface ProviderAuthResponse {
  user_id: string;
  session_token: string;
}

interface UserContextValue {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  authProvider: AuthProvider;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  setUserName: (name: string) => Promise<void>;
  setUserEmail: (email: string) => Promise<void>;
  setAuthProvider: (provider: AuthProvider) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearUser: () => Promise<void>;
  /**
   * Verifies a Sign-In-with-{provider} identity token server-side and
   * establishes a real session. userId is derived entirely from the
   * provider's verified subject claim -- the client never picks it.
   */
  authenticateWithProvider: (
    provider: 'apple' | 'google' | 'microsoft',
    identityToken?: string | null,
    authorizationCode?: string | null
  ) => Promise<boolean>;
  /**
   * TEMP (2026-09-10): dev-only bypass. Obtains a real server-signed session
   * for a fixed test user from the backend's /auth/dev endpoint, which only
   * exists when the server runs with ENVIRONMENT=development. Guarded by
   * __DEV__ so it is a no-op in release/TestFlight builds.
   */
  authenticateAsDevUser: () => Promise<boolean>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [authProvider, setAuthProviderState] = useState<AuthProvider>('anonymous');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Load the session token first -- apiFetch reads it synchronously
        // from the in-memory cache, so it must be hydrated before any
        // authenticated request can go out.
        const storedSessionToken = await loadSessionToken();
        const storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
        const storedUserName = await SecureStore.getItemAsync(USER_NAME_KEY);
        const storedEmail = await SecureStore.getItemAsync(USER_EMAIL_KEY);
        const storedProvider = await SecureStore.getItemAsync(AUTH_PROVIDER_KEY);
        const storedOnboarding = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);

        // Only trust a stored userId if it has a session token to back it --
        // a userId with no verified session is not a logged-in user.
        setUserId(storedSessionToken ? storedUserId : null);
        setUserNameState(storedUserName);
        setUserEmailState(storedEmail);
        setHasCompletedOnboarding(storedOnboarding === 'true');
        if (storedProvider) {
          setAuthProviderState(storedProvider as AuthProvider);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const setUserName = async (name: string) => {
    try {
      await SecureStore.setItemAsync(USER_NAME_KEY, name);
      setUserNameState(name);
    } catch (error) {
      console.error('Failed to save user name:', error);
    }
  };

  const setUserEmail = async (email: string) => {
    try {
      await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
      setUserEmailState(email);
    } catch (error) {
      console.error('Failed to save user email:', error);
    }
  };

  const setAuthProvider = async (provider: AuthProvider) => {
    try {
      await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, provider);
      setAuthProviderState(provider);
    } catch (error) {
      console.error('Failed to save auth provider:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  const clearUser = async () => {
    try {
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      await SecureStore.deleteItemAsync(USER_NAME_KEY);
      await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(ONBOARDING_COMPLETED_KEY);
      await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, 'anonymous');
      await clearSessionToken();
      setUserId(null);
      setUserNameState(null);
      setUserEmailState(null);
      setHasCompletedOnboarding(false);
      setAuthProviderState('anonymous');
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  };

  const authenticateWithProvider = async (
    provider: 'apple' | 'google' | 'microsoft',
    identityToken?: string | null,
    authorizationCode?: string | null
  ): Promise<boolean> => {
    try {
      const { data, error } = await apiPost<ProviderAuthResponse>(`/auth/${provider}`, {
        identity_token: identityToken ?? null,
        authorization_code: authorizationCode ?? null,
      });

      if (error || !data) {
        console.error('Provider authentication failed:', error);
        return false;
      }

      await SecureStore.setItemAsync(USER_ID_KEY, data.user_id);
      await setSessionToken(data.session_token);
      setUserId(data.user_id);
      return true;
    } catch (error) {
      console.error('Provider authentication failed:', error);
      return false;
    }
  };

  const authenticateAsDevUser = async (): Promise<boolean> => {
    if (!__DEV__) return false;
    try {
      const { data, error } = await apiPost<ProviderAuthResponse>('/auth/dev', {});
      if (error || !data) {
        console.error('Dev authentication failed:', error);
        return false;
      }
      await SecureStore.setItemAsync(USER_ID_KEY, data.user_id);
      await setSessionToken(data.session_token);
      setUserId(data.user_id);
      return true;
    } catch (error) {
      console.error('Dev authentication failed:', error);
      return false;
    }
  };

  return (
    <UserContext.Provider value={{
      userId,
      userName,
      userEmail,
      authProvider,
      hasCompletedOnboarding,
      isLoading,
      setUserName,
      setUserEmail,
      setAuthProvider,
      authenticateWithProvider,
      authenticateAsDevUser,
      completeOnboarding,
      clearUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
