import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider, useUser } from '../contexts/UserContext';
import { SecurityProvider, useSecurity } from '../contexts/SecurityContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { LockScreen } from '../components/LockScreen';

function AppContent() {
  const { isLocked, isLoaded, setUserId } = useSecurity();
  const { userId } = useUser();

  useEffect(() => {
    setUserId(userId);
  }, [userId, setUserId]);

  if (!isLoaded) return null;

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <NotificationProvider userId={userId}>
      <StatusBar style="light" />
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

export default function RootLayout() {
  return (
    <UserProvider>
      <SecurityProvider>
        <AppContent />
      </SecurityProvider>
    </UserProvider>
  );
}
