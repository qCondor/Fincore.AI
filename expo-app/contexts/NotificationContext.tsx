import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiFetch } from '../lib/api';
import { formatCurrency } from '../lib/format';

const NOTIFICATIONS_KEY = 'fincore_notifications';

export interface NotificationPrefs {
  pushNotifications: boolean;
  appUpdates: boolean;
  spendingAlerts: boolean;
  paymentReminders: boolean;
  securityAlerts: boolean;
  faithNudges: boolean;
  weeklyInsight: boolean;
  personalityTips: boolean;
  largeTransactions: boolean;
  lowBalance: boolean;
  bankSyncUpdates: boolean;
}

export const defaultNotificationPrefs: NotificationPrefs = {
  pushNotifications: true,
  appUpdates: true,
  spendingAlerts: true,
  paymentReminders: true,
  securityAlerts: true,
  faithNudges: false,
  weeklyInsight: false,
  personalityTips: false,
  largeTransactions: false,
  lowBalance: false,
  bankSyncUpdates: false,
};

interface NotificationContextValue {
  prefs: NotificationPrefs;
  isLoaded: boolean;
  pushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  updatePref: (key: keyof NotificationPrefs, value: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleLocalNotification: (title: string, body: string, trigger?: Notifications.NotificationTriggerInput) => Promise<string | null>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        setPrefs({ ...defaultNotificationPrefs, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load notification prefs:', e);
    }
  }, []);

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const existingSettings = await Notifications.getPermissionsAsync();
    setPermissionStatus(existingSettings.status);

    let finalStatus = existingSettings.status;

    if (existingSettings.status !== 'granted') {
      const settings = await Notifications.requestPermissionsAsync();
      finalStatus = settings.status;
      setPermissionStatus(settings.status);
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;
      setPushToken(token);

      if (userId && token) {
        await apiPost('/users/push-token', {
          push_token: token,
          platform: Platform.OS,
          device_name: Device.modelName || 'Unknown',
        });
      }

      return token;
    } catch (e) {
      console.error('Failed to get push token:', e);
      return null;
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      await loadPrefs();

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#005FCC',
        });

        await Notifications.setNotificationChannelAsync('faith', {
          name: 'Faith AI',
          description: 'Personalised financial insights from Faith',
          importance: Notifications.AndroidImportance.HIGH,
        });

        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Alerts',
          description: 'Spending alerts and security notifications',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        await registerForPushNotifications();
      }

      setIsLoaded(true);
    };

    init();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [loadPrefs, registerForPushNotifications]);

  const updatePref = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    if (key === 'pushNotifications' && value) {
      const token = await registerForPushNotifications();
      if (!token) {
        return;
      }
    }

    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newPrefs));

      if (userId) {
        await apiPost('/users/notification-prefs', {
          prefs: newPrefs,
        });
      }
    } catch (e) {
      console.error('Failed to save notification prefs:', e);
    }
  }, [prefs, userId, registerForPushNotifications]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const token = await registerForPushNotifications();
    return token !== null;
  }, [registerForPushNotifications]);

  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> => {
    if (!prefs.pushNotifications) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || null,
      });
      return id;
    } catch (e) {
      console.error('Failed to schedule notification:', e);
      return null;
    }
  }, [prefs.pushNotifications]);

  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        prefs,
        isLoaded,
        pushToken,
        permissionStatus,
        updatePref,
        requestPermission,
        scheduleLocalNotification,
        cancelNotification,
        cancelAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export async function scheduleWeeklyInsight(enabled: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Your Weekly Insight is Ready',
      body: 'Faith has analysed your spending patterns. Tap to see your personalised insights.',
      data: { screen: 'faith', type: 'weekly_insight' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 9,
      minute: 0,
    },
  });
}

export async function scheduleFaithNudge(message: string, delaySeconds: number = 3600) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '💡 Faith has a tip for you',
      body: message,
      data: { screen: 'faith', type: 'nudge' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}

export async function sendSpendingAlert(amount: number, category: string) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Spending Alert',
      body: `You've spent ${formatCurrency(amount)} on ${category} today. Want to review with Faith?`,
      data: { screen: 'faith', type: 'spending_alert', amount, category },
    },
    trigger: null,
  });
}

export async function sendSecurityAlert(message: string) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔒 Security Alert',
      body: message,
      data: { screen: 'settings/security', type: 'security_alert' },
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
}
