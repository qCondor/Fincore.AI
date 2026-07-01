import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiPost } from '../lib/api';

const USER_ID_KEY = 'fincore_user_id';
const USER_NAME_KEY = 'fincore_user_name';
const AUTH_PROVIDER_KEY = 'fincore_auth_provider';
const USER_EMAIL_KEY = 'fincore_user_email';

type AuthProvider = 'anonymous' | 'google' | 'apple' | 'microsoft';

interface UserContextValue {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  authProvider: AuthProvider;
  isLoading: boolean;
  setUserName: (name: string) => Promise<void>;
  setUserEmail: (email: string) => Promise<void>;
  setAuthProvider: (provider: AuthProvider) => Promise<void>;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [authProvider, setAuthProviderState] = useState<AuthProvider>('anonymous');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
        let storedUserName = await SecureStore.getItemAsync(USER_NAME_KEY);
        let storedEmail = await SecureStore.getItemAsync(USER_EMAIL_KEY);
        const storedProvider = await SecureStore.getItemAsync(AUTH_PROVIDER_KEY);

        if (!storedUserId) {
          storedUserId = generateUserId();
          await SecureStore.setItemAsync(USER_ID_KEY, storedUserId);
        }

        setUserId(storedUserId);
        setUserNameState(storedUserName);
        setUserEmailState(storedEmail);
        if (storedProvider) {
          setAuthProviderState(storedProvider as AuthProvider);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        const fallbackId = generateUserId();
        setUserId(fallbackId);
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

  const clearUser = async () => {
    try {
      const newUserId = generateUserId();
      await SecureStore.setItemAsync(USER_ID_KEY, newUserId);
      await SecureStore.deleteItemAsync(USER_NAME_KEY);
      await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
      await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, 'anonymous');
      setUserId(newUserId);
      setUserNameState(null);
      setUserEmailState(null);
      setAuthProviderState('anonymous');
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      userId,
      userName,
      userEmail,
      authProvider,
      isLoading,
      setUserName,
      setUserEmail,
      setAuthProvider,
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
