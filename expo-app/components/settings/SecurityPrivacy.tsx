import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';

interface SecurityPrivacyProps {
  onBack: () => void;
  onDeleteAccount?: () => void;
}

const SECURITY_KEY = 'fincore_security';

interface SecurityPrefs {
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
  twoFactor: true,
  appLock: false,
  hideBalances: false,
  personalizedInsights: true,
  shareUsageData: false,
  personalizedAds: false,
};

function FaceIdIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M7 3H5a2 2 0 00-2 2v2M17 3h2a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2v-2M17 21h2a2 2 0 002-2v-2" />
      <Circle cx={9} cy={9} r={1} fill="white" />
      <Circle cx={15} cy={9} r={1} fill="white" />
      <Path d="M9 15s1.5 2 3 2 3-2 3-2" />
    </Svg>
  );
}

function KeyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
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

function ShareIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={18} cy={5} r={3} />
      <Circle cx={6} cy={12} r={3} />
      <Circle cx={18} cy={19} r={3} />
      <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </Svg>
  );
}

function TargetIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={12} r={6} />
      <Circle cx={12} cy={12} r={2} />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Svg>
  );
}

function MonitorIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <Path d="M8 21h8M12 17v4" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth={2}>
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </Svg>
  );
}

export function SecurityPrivacy({ onBack, onDeleteAccount }: SecurityPrivacyProps) {
  const [prefs, setPrefs] = useState<SecurityPrefs>(defaultSecurity);
  const [isLoaded, setIsLoaded] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check biometric availability
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);

      // Load prefs
      try {
        const stored = await AsyncStorage.getItem(SECURITY_KEY);
        if (stored) {
          setPrefs({ ...defaultSecurity, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.error('Failed to load security prefs:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updatePref = async (key: keyof SecurityPrefs, value: boolean) => {
    // Special handling for Face ID
    if (key === 'faceId' && value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Face ID',
        fallbackLabel: 'Use passcode',
      });
      if (!result.success) return;
    }

    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(newPrefs));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error('Failed to save security prefs:', e);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDeleteAccount?.();
          }
        },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'Your data export will be prepared and sent to your registered email address within 48 hours.',
      [{ text: 'OK' }]
    );
  };

  if (!isLoaded) return null;

  return (
    <SettingsPage title="Security & Privacy" onBack={onBack}>
      <SettingsSection title="Sign-in">
        <SettingsToggle
          icon={<FaceIdIcon />}
          label={biometricAvailable ? 'Face ID' : 'Biometrics (Not Available)'}
          value={prefs.faceId && biometricAvailable}
          onValueChange={(v) => updatePref('faceId', v)}
        />
        <SettingsRow icon={<KeyIcon />} label="Change Password" onPress={() => Alert.alert('Change Password', 'Password change feature coming soon.')} />
        <SettingsToggle icon={<ShieldIcon />} label="Two-Factor Authentication" value={prefs.twoFactor} onValueChange={(v) => updatePref('twoFactor', v)} isLast />
      </SettingsSection>

      <SettingsSection title="App Protection">
        <SettingsToggle icon={<LockIcon />} label="App Lock" value={prefs.appLock} onValueChange={(v) => updatePref('appLock', v)} />
        <SettingsToggle icon={<EyeOffIcon />} label="Hide Balances" value={prefs.hideBalances} onValueChange={(v) => updatePref('hideBalances', v)} isLast />
      </SettingsSection>

      <SettingsSection title="Privacy">
        <SettingsToggle icon={<SparklesIcon />} label="Personalised Insights" value={prefs.personalizedInsights} onValueChange={(v) => updatePref('personalizedInsights', v)} />
        <SettingsToggle icon={<ShareIcon />} label="Share Usage Data" value={prefs.shareUsageData} onValueChange={(v) => updatePref('shareUsageData', v)} />
        <SettingsToggle icon={<TargetIcon />} label="Personalised Ads" value={prefs.personalizedAds} onValueChange={(v) => updatePref('personalizedAds', v)} isLast />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow icon={<DownloadIcon />} label="Download My Data" onPress={handleDownloadData} />
        <SettingsRow icon={<MonitorIcon />} label="Active Sessions" value="3 devices" onPress={() => Alert.alert('Active Sessions', 'Session management coming soon.')} isLast />
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <SettingsRow icon={<TrashIcon />} label="Delete Account" danger onPress={handleDeleteAccount} isLast />
      </SettingsSection>
    </SettingsPage>
  );
}
