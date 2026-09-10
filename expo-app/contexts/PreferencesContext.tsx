import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, apiPatch } from '../lib/api';
import { setCurrencyPreference, setDateFormatPreference } from '../lib/format';
import type { TextScale } from '../styles/theme';

const PREFS_KEY = 'fincore_preferences';

export type ThemeMode = 'Light' | 'Dark' | 'System';
export type DefaultHomeTab = 'index' | 'faith' | 'profile';
export type CurrencyCode = 'GBP' | 'USD' | 'EUR';
export type DateFormatPref = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type { TextScale };

export interface AppPreferences {
  theme: ThemeMode;
  textScale: TextScale;
  hapticFeedback: boolean;
  soundEffects: boolean;
  defaultHomeTab: DefaultHomeTab;
  currency: CurrencyCode;
  dateFormat: DateFormatPref;
}

export const defaultPreferences: AppPreferences = {
  theme: 'Light',
  textScale: 'Medium',
  hapticFeedback: true,
  soundEffects: true,
  defaultHomeTab: 'index',
  currency: 'GBP',
  dateFormat: 'DD/MM/YYYY',
};

interface PreferencesContextValue {
  prefs: AppPreferences;
  isLoaded: boolean;
  updatePref: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

interface PreferencesProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function PreferencesProvider({ children, userId }: PreferencesProviderProps) {
  const [prefs, setPrefs] = useState<AppPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep lib/format.ts's synchronous cache in sync with the live prefs so
  // formatCurrency/formatDate work outside React (e.g. NotificationContext).
  useEffect(() => {
    setCurrencyPreference(prefs.currency);
    setDateFormatPreference(prefs.dateFormat);
  }, [prefs.currency, prefs.dateFormat]);

  // Hydrate from AsyncStorage first (instant, offline-safe), then
  // reconcile against the backend profile once we know who the user is.
  useEffect(() => {
    const hydrate = async () => {
      let localPrefs = defaultPreferences;

      try {
        const stored = await AsyncStorage.getItem(PREFS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          localPrefs = { ...defaultPreferences, ...parsed };
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }

      setPrefs(localPrefs);
      setIsLoaded(true);

      if (!userId) return;

      try {
        const { data } = await apiFetch<{ app_preferences?: Partial<AppPreferences> }>('/profile');
        if (data?.app_preferences) {
          const reconciled: AppPreferences = {
            ...defaultPreferences,
            ...localPrefs,
            ...data.app_preferences,
          };
          setPrefs(reconciled);
          await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(reconciled));
        }
      } catch (e) {
        console.error('Failed to reconcile preferences from backend:', e);
      }
    };

    hydrate();
  }, [userId]);

  const updatePref = useCallback(async <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));

      if (userId) {
        await apiPatch('/profile', { app_preferences: newPrefs });
      }
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  }, [prefs, userId]);

  return (
    <PreferencesContext.Provider value={{ prefs, isLoaded, updatePref }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
