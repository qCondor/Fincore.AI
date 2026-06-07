import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, AppStateStatus } from 'react-native';
import { apiPatch } from '../lib/api';

const SECURITY_KEY = 'fincore_security';

export interface SecurityPrefs {
  faceId: boolean;
  twoFactor: boolean;
  appLock: boolean;
  hideBalances: boolean;
  personalizedInsights: boolean;
  shareUsageData: boolean;
  personalizedAds: boolean;
}

const defaultSecurity: SecurityPrefs = {
  faceId: true,
  twoFactor: false,
  appLock: false,
  hideBalances: false,
  personalizedInsights: true,
  shareUsageData: false,
  personalizedAds: false,
};

interface SecurityContextValue {
  prefs: SecurityPrefs;
  isLoaded: boolean;
  biometricAvailable: boolean;
  isLocked: boolean;
  updatePref: (key: keyof SecurityPrefs, value: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  refreshPrefs: () => Promise<void>;
  setUserId: (userId: string | null) => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<SecurityPrefs>(defaultSecurity);
  const [isLoaded, setIsLoaded] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const lastBackground = useRef<number | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_KEY);
      if (stored) {
        setPrefs({ ...defaultSecurity, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load security prefs:', e);
    }
  }, []);

  const refreshPrefs = useCallback(async () => {
    await loadPrefs();
  }, [loadPrefs]);

  useEffect(() => {
    const init = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
      await loadPrefs();
      setIsLoaded(true);
    };
    init();
  }, [loadPrefs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        lastBackground.current = Date.now();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        prefs.appLock &&
        biometricAvailable
      ) {
        const elapsed = lastBackground.current ? Date.now() - lastBackground.current : 0;
        if (elapsed > 3000) {
          setIsLocked(true);
        }
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [prefs.appLock, biometricAvailable]);

  const updatePref = useCallback(async (key: keyof SecurityPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(newPrefs));

      // Sync privacy-related prefs to backend for server-side use
      if (userId && (key === 'personalizedInsights' || key === 'shareUsageData' || key === 'personalizedAds')) {
        apiPatch(`/profile/${userId}`, {
          user_id: userId,
          security_prefs: {
            personalizedInsights: newPrefs.personalizedInsights,
            shareUsageData: newPrefs.shareUsageData,
            personalizedAds: newPrefs.personalizedAds,
          },
        }).catch((e) => console.error('Failed to sync security prefs to backend:', e));
      }
    } catch (e) {
      console.error('Failed to save security prefs:', e);
    }
  }, [prefs, userId]);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable) {
      setIsLocked(false);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Fincore',
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [biometricAvailable]);

  return (
    <SecurityContext.Provider
      value={{
        prefs,
        isLoaded,
        biometricAvailable,
        isLocked,
        updatePref,
        unlock,
        refreshPrefs,
        setUserId,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
