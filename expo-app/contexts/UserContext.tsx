import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'fincore_user_id';
const USER_NAME_KEY = 'fincore_user_name';

interface UserContextValue {
  userId: string | null;
  userName: string | null;
  isLoading: boolean;
  setUserName: (name: string) => Promise<void>;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
        const storedUserName = await SecureStore.getItemAsync(USER_NAME_KEY);

        if (!storedUserId) {
          storedUserId = generateUserId();
          await SecureStore.setItemAsync(USER_ID_KEY, storedUserId);
        }

        setUserId(storedUserId);
        setUserNameState(storedUserName);
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

  const clearUser = async () => {
    try {
      const newUserId = generateUserId();
      await SecureStore.setItemAsync(USER_ID_KEY, newUserId);
      await SecureStore.setItemAsync(USER_NAME_KEY, '');
      setUserId(newUserId);
      setUserNameState(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userId, userName, isLoading, setUserName, clearUser }}>
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
