import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useUser } from '../../contexts/UserContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

const HOME_TAB_ROUTES: Record<string, string> = {
  index: '/',
  faith: '/faith',
  profile: '/profile',
};

function ScanIcon({ focused }: { focused: boolean }) {
  const t = useTheme();
  const color = focused ? t.secondary : t.iconInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2h3a2 2 0 012 2v3zM8 19a2 2 0 01-2 2H3a2 2 0 01-2-2v-3a2 2 0 012-2h3a2 2 0 012 2v3zM23 8a2 2 0 01-2 2h-3a2 2 0 01-2-2V5a2 2 0 012-2h3a2 2 0 012 2v3zM8 8a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h3a2 2 0 012 2v3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FaithIcon({ focused }: { focused: boolean }) {
  const t = useTheme();
  const color = focused ? t.secondary : t.iconInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const t = useTheme();
  const color = focused ? t.secondary : t.iconInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-4 4-6 8-6s8 2 8 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const { userName, userEmail, authProvider, hasCompletedOnboarding, isLoading } = useUser();
  const { prefs, isLoaded: prefsLoaded } = usePreferences();
  const hasAppliedDefaultTab = useRef(false);

  useEffect(() => {
    if (isLoading || !prefsLoaded) return;

    const hasStartedOnboarding = Boolean(userName || userEmail || authProvider !== 'anonymous');

    if (!hasStartedOnboarding) {
      router.replace('/login');
      return;
    }

    if (!hasCompletedOnboarding) {
      router.replace('/info');
      return;
    }

    // Only redirect to the preferred tab once per cold start -- never on
    // later re-renders (e.g. foregrounding the app) once the user may
    // have already navigated elsewhere themselves.
    if (!hasAppliedDefaultTab.current) {
      hasAppliedDefaultTab.current = true;
      const targetRoute = HOME_TAB_ROUTES[prefs.defaultHomeTab];
      if (targetRoute && targetRoute !== '/') {
        router.replace(targetRoute as any);
      }
    }
  }, [isLoading, prefsLoaded, userName, userEmail, authProvider, hasCompletedOnboarding, prefs.defaultHomeTab, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feels Like',
          tabBarIcon: ({ focused }) => <ScanIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="faith"
        options={{
          title: 'Faith',
          tabBarIcon: ({ focused }) => <FaithIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({});
