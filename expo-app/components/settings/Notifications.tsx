import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';

interface NotificationsProps {
  onBack: () => void;
}

const NOTIFICATIONS_KEY = 'fincore_notifications';

interface NotificationPrefs {
  pushNotifications: boolean;
  spendingAlerts: boolean;
  largeTransactions: boolean;
  lowBalance: boolean;
  paymentReminders: boolean;
  faithNudges: boolean;
  feelsLikeReminders: boolean;
  weeklyInsight: boolean;
  productUpdates: boolean;
  tipsOffers: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const defaultNotifications: NotificationPrefs = {
  pushNotifications: true,
  spendingAlerts: true,
  largeTransactions: true,
  lowBalance: true,
  paymentReminders: true,
  faithNudges: true,
  feelsLikeReminders: true,
  weeklyInsight: true,
  productUpdates: true,
  tipsOffers: true,
  emailNotifications: true,
  smsNotifications: false,
};

function BellIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

function DollarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </Svg>
  );
}

function TrendingUpIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M23 6l-9.5 9.5-5-5L1 18" />
      <Path d="M17 6h6v6" />
    </Svg>
  );
}

function AlertCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 8v4M12 16h.01" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M18 20V10M12 20V4M6 20v-6" />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </Svg>
  );
}

function LightbulbIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

function MessageIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

export function Notifications({ onBack }: NotificationsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotifications);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        if (stored) {
          setPrefs({ ...defaultNotifications, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.error('Failed to load notification prefs:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPrefs();
  }, []);

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newPrefs));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error('Failed to save notification prefs:', e);
    }
  };

  if (!isLoaded) return null;

  return (
    <SettingsPage title="Notifications" onBack={onBack}>
      <SettingsSection>
        <SettingsToggle icon={<BellIcon />} label="Push Notifications" value={prefs.pushNotifications} onValueChange={(v) => updatePref('pushNotifications', v)} isLast />
      </SettingsSection>

      <SettingsSection title="Money">
        <SettingsToggle icon={<DollarIcon />} label="Spending Alerts" value={prefs.spendingAlerts} onValueChange={(v) => updatePref('spendingAlerts', v)} />
        <SettingsToggle icon={<TrendingUpIcon />} label="Large Transactions" value={prefs.largeTransactions} onValueChange={(v) => updatePref('largeTransactions', v)} />
        <SettingsToggle icon={<AlertCircleIcon />} label="Low Balance" value={prefs.lowBalance} onValueChange={(v) => updatePref('lowBalance', v)} />
        <SettingsToggle icon={<CalendarIcon />} label="Payment Reminders" value={prefs.paymentReminders} onValueChange={(v) => updatePref('paymentReminders', v)} isLast />
      </SettingsSection>

      <SettingsSection title="Fincore AI">
        <SettingsToggle icon={<SparklesIcon />} label="Faith Nudges" value={prefs.faithNudges} onValueChange={(v) => updatePref('faithNudges', v)} />
        <SettingsToggle icon={<HeartIcon />} label="Feels Like Reminders" value={prefs.feelsLikeReminders} onValueChange={(v) => updatePref('feelsLikeReminders', v)} />
        <SettingsToggle icon={<BarChartIcon />} label="Weekly Insight" value={prefs.weeklyInsight} onValueChange={(v) => updatePref('weeklyInsight', v)} isLast />
      </SettingsSection>

      <SettingsSection title="General">
        <SettingsToggle icon={<GiftIcon />} label="Product Updates" value={prefs.productUpdates} onValueChange={(v) => updatePref('productUpdates', v)} />
        <SettingsToggle icon={<LightbulbIcon />} label="Tips & Offers" value={prefs.tipsOffers} onValueChange={(v) => updatePref('tipsOffers', v)} isLast />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow icon={<MoonIcon />} label="Quiet Hours" value="22:00 – 07:00" onPress={() => {}} isLast />
      </SettingsSection>

      <SettingsSection title="Delivery">
        <SettingsToggle icon={<MailIcon />} label="Email" value={prefs.emailNotifications} onValueChange={(v) => updatePref('emailNotifications', v)} />
        <SettingsToggle icon={<MessageIcon />} label="SMS" value={prefs.smsNotifications} onValueChange={(v) => updatePref('smsNotifications', v)} isLast />
      </SettingsSection>
    </SettingsPage>
  );
}
