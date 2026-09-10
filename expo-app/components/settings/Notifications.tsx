import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsToggle } from './SettingsToggle';
import { ComingSoonModal } from '../ComingSoonModal';
import { useNotifications, scheduleWeeklyInsight } from '../../contexts/NotificationContext';
import { useHaptics } from '../../lib/haptics';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface NotificationsProps {
  onBack: () => void;
}

function BellIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

function DownloadIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Svg>
  );
}

function TrendingUpIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M23 6l-9.5 9.5-5-5L1 18" />
      <Path d="M17 6h6v6" />
    </Svg>
  );
}

function CalendarIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function ShieldIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function SparklesIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function BarChartIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M18 20V10M12 20V4M6 20v-6" />
    </Svg>
  );
}

function LightbulbIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
    </Svg>
  );
}

function RefreshIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M23 4v6h-6M1 20v-6h6" />
      <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </Svg>
  );
}

function AlertCircleIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 8v4M12 16h.01" />
    </Svg>
  );
}

function CreditCardIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
      <Path d="M1 10h22" />
    </Svg>
  );
}

function LockIcon() {
  const t = useTheme();
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2.5}>
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" />
    </Svg>
  );
}

function PaidBadge() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.paidBadge}>
      <LockIcon />
      <Text style={styles.paidBadgeText}>PAID</Text>
    </View>
  );
}

export function Notifications({ onBack }: NotificationsProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const { prefs, isLoaded, updatePref, permissionStatus, requestPermission } = useNotifications();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const haptics = useHaptics();

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    if (key === 'pushNotifications' && value && permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (key === 'weeklyInsight') {
      await scheduleWeeklyInsight(value);
    }

    await updatePref(key, value);
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePaidToggle = () => {
    haptics.impact();
    setUpgradeModal(true);
  };

  if (!isLoaded) return null;

  return (
    <SettingsPage title="Notifications" onBack={onBack}>
      <SettingsSection>
        <SettingsToggle
          icon={<BellIcon />}
          label="Push Notifications"
          value={prefs.pushNotifications}
          onValueChange={(v) => handleToggle('pushNotifications', v)}
        />
        <SettingsToggle
          icon={<DownloadIcon />}
          label="App Updates"
          value={prefs.appUpdates}
          onValueChange={(v) => handleToggle('appUpdates', v)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Account" badge={<PaidBadge />} locked>
        <SettingsToggle
          icon={<TrendingUpIcon />}
          label="Spending Alerts"
          value={prefs.spendingAlerts}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<CalendarIcon />}
          label="Payment Reminders"
          value={prefs.paymentReminders}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<ShieldIcon />}
          label="Security Alerts"
          value={prefs.securityAlerts}
          onValueChange={handlePaidToggle}
          disabled
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Faith" badge={<PaidBadge />} locked>
        <SettingsToggle
          icon={<SparklesIcon />}
          label="Faith Nudges"
          value={prefs.faithNudges}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<BarChartIcon />}
          label="Weekly Insight"
          value={prefs.weeklyInsight}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<LightbulbIcon />}
          label="Personality Tips"
          value={prefs.personalityTips}
          onValueChange={handlePaidToggle}
          disabled
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Banking" badge={<PaidBadge />} locked>
        <SettingsToggle
          icon={<RefreshIcon />}
          label="Large Transactions"
          value={prefs.largeTransactions}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<AlertCircleIcon />}
          label="Low Balance"
          value={prefs.lowBalance}
          onValueChange={handlePaidToggle}
          disabled
        />
        <SettingsToggle
          icon={<CreditCardIcon />}
          label="Bank Sync Updates"
          value={prefs.bankSyncUpdates}
          onValueChange={handlePaidToggle}
          disabled
          isLast
        />
      </SettingsSection>

      <TouchableOpacity style={styles.upgradeButton} onPress={() => setUpgradeModal(true)}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.primaryOnSurface} strokeWidth={2}>
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </Svg>
        <Text style={styles.upgradeButtonText}>Upgrade to Unlock</Text>
      </TouchableOpacity>

      <ComingSoonModal
        visible={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        feature="Premium"
        featureKey="premium"
        description="Unlock all notification features, advanced insights, and banking integrations with Fincore Premium."
      />
    </SettingsPage>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryTintBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paidBadgeText: {
    fontSize: t.type.tiny,
    fontWeight: '700',
    color: t.textPrimary,
    letterSpacing: 0.5,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.textPrimary,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.primaryOnSurface,
  },
});
