"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { SecureStorage } from "@/lib/secure-storage";

interface User {
  id: string;
  hasCompletedOnboarding: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keys used in SecureStorage (migrated from legacy fincore_* keys)
const USER_ID_KEY = "user_id";
const ONBOARDING_KEY = "onboarding_completed";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check for existing user ID in SecureStorage (handles migration from legacy keys)
        let userId = await SecureStorage.getItem(USER_ID_KEY);

        // If none exists, generate a new UUID
        if (!userId) {
          userId = crypto.randomUUID();
          await SecureStorage.setItem(USER_ID_KEY, userId);
        }

        // Check onboarding status from SecureStorage (fast) or API (authoritative)
        const storedOnboarding = await SecureStorage.getItem(ONBOARDING_KEY);
        let hasCompletedOnboarding = storedOnboarding === "true";

        // Try to fetch onboarding status from API for authoritative state
        try {
          const response = await fetch(`/api/profile/${userId}`);
          if (response.ok) {
            const profileData = await response.json();
            hasCompletedOnboarding = profileData.hasCompletedOnboarding || false;
            // Sync SecureStorage with API state
            await SecureStorage.setItem(ONBOARDING_KEY, String(hasCompletedOnboarding));
          }
        } catch {
          // API error, rely on SecureStorage value
        }

        setUser({
          id: userId,
          hasCompletedOnboarding,
        });
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const setHasCompletedOnboarding = useCallback((completed: boolean) => {
    setUser((current) => {
      if (!current) return current;
      // Fire and forget - we don't need to await this
      SecureStorage.setItem(ONBOARDING_KEY, String(completed));
      return { ...current, hasCompletedOnboarding: completed };
    });
  }, []);

  const logout = useCallback(async () => {
    await SecureStorage.removeItem(USER_ID_KEY);
    await SecureStorage.removeItem(ONBOARDING_KEY);
    const newUserId = crypto.randomUUID();
    await SecureStorage.setItem(USER_ID_KEY, newUserId);
    setUser({
      id: newUserId,
      hasCompletedOnboarding: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setHasCompletedOnboarding, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
