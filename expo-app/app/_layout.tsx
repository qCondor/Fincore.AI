import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider, useUser } from '../contexts/UserContext';
import { SecurityProvider, useSecurity } from '../contexts/SecurityContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LockScreen } from '../components/LockScreen';

function AppContent() {
  const { isLocked, isLoaded, setUserId } = useSecurity();
  const { userId } = useUser();
  const t = useTheme();

  useEffect(() => {
    setUserId(userId);
  }, [userId, setUserId]);

  if (!isLoaded) return null;

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <NotificationProvider userId={userId}>
      <StatusBar style={t.statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="info" />
        <Stack.Screen name="survey" />
        <Stack.Screen name="processing" />
        <Stack.Screen name="results" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NotificationProvider>
  );
}

/**
 * Preferences must resolve before the theme (it holds the Light/Dark/System
 * choice), and the theme must be available to everything below it including
 * the lock screen — hence this ordering.
 */
function Providers() {
  const { userId } = useUser();

  return (
    <PreferencesProvider userId={userId}>
      <ThemeProvider>
        <SecurityProvider>
          <AppContent />
        </SecurityProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <Providers />
    </UserProvider>
  );
}
