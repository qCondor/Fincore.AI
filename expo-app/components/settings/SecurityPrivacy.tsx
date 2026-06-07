import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';
import { useSecurity } from '../../contexts/SecurityContext';
import { useUser } from '../../contexts/UserContext';
import { apiPost, apiFetch } from '../../lib/api';

interface SecurityPrivacyProps {
  onBack: () => void;
  onDeleteAccount?: () => Promise<{ success: boolean; error?: string }>;
  onDeleteSuccess?: () => void;
}

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

interface Session {
  session_id: string;
  device_name: string;
  last_active: string;
  is_current: boolean;
}

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

function ChangePasswordModal({ visible, onClose, userId }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: apiError } = await apiPost('/change-password', {
      user_id: userId,
      current_password: currentPassword,
      new_password: newPassword,
    });
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Your password has been changed.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Change Password</Text>

          <TextInput
            style={modalStyles.input}
            placeholder="Current Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <TextInput
            style={modalStyles.input}
            placeholder="New Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TextInput
            style={modalStyles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error ? <Text style={modalStyles.error}>{error}</Text> : null}

          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, loading && modalStyles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Change</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface TwoFactorModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onEnabled: () => void;
}

function TwoFactorModal({ visible, onClose, userId, onEnabled }: TwoFactorModalProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    const { error: apiError } = await apiPost('/2fa/send-code', {
      user_id: userId,
      phone_number: phone,
    });

    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    setStep('verify');
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    const { error: apiError } = await apiPost('/2fa/verify', {
      user_id: userId,
      code,
    });

    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Two-factor authentication has been enabled.');
    onEnabled();
    onClose();
    setStep('phone');
    setPhone('');
    setCode('');
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>
            {step === 'phone' ? 'Set Up Two-Factor Auth' : 'Enter Verification Code'}
          </Text>

          {step === 'phone' ? (
            <>
              <Text style={modalStyles.description}>
                We'll send a verification code to your phone number each time you sign in.
              </Text>
              <TextInput
                style={modalStyles.input}
                placeholder="Phone Number (e.g. +44 7700 900000)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </>
          ) : (
            <>
              <Text style={modalStyles.description}>
                Enter the 6-digit code we sent to {phone}
              </Text>
              <TextInput
                style={[modalStyles.input, modalStyles.codeInput]}
                placeholder="000000"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </>
          )}

          {error ? <Text style={modalStyles.error}>{error}</Text> : null}

          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.cancelButton} onPress={handleClose}>
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, loading && modalStyles.submitButtonDisabled]}
              onPress={step === 'phone' ? handleSendCode : handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>
                  {step === 'phone' ? 'Send Code' : 'Verify'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ActiveSessionsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

function ActiveSessionsModal({ visible, onClose, userId }: ActiveSessionsModalProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible]);

  const loadSessions = async () => {
    setLoading(true);
    const { data } = await apiFetch<{ sessions: Session[] }>(`/users/${userId}/sessions`);
    if (data?.sessions) {
      setSessions(data.sessions);
    }
    setLoading(false);
  };

  const handleRevoke = async (sessionId: string) => {
    Alert.alert(
      'Revoke Session',
      'This will sign out the device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await apiPost(`/users/${userId}/sessions/${sessionId}/revoke`, {});
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadSessions();
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { maxHeight: '70%' }]}>
          <Text style={modalStyles.title}>Active Sessions</Text>

          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 40 }} />
          ) : sessions.length === 0 ? (
            <Text style={modalStyles.description}>No active sessions found.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {sessions.map((session) => (
                <View key={session.session_id} style={sessionStyles.item}>
                  <View style={sessionStyles.info}>
                    <Text style={sessionStyles.device}>
                      {session.device_name}
                      {session.is_current && (
                        <Text style={sessionStyles.current}> (This device)</Text>
                      )}
                    </Text>
                    <Text style={sessionStyles.lastActive}>
                      Last active: {formatDate(session.last_active)}
                    </Text>
                  </View>
                  {!session.is_current && (
                    <TouchableOpacity
                      style={sessionStyles.revokeButton}
                      onPress={() => handleRevoke(session.session_id)}
                    >
                      <Text style={sessionStyles.revokeText}>Revoke</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function SecurityPrivacy({ onBack, onDeleteAccount, onDeleteSuccess }: SecurityPrivacyProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { prefs, updatePref, biometricAvailable, refreshPrefs } = useSecurity();
  const { userId } = useUser();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSessionCount();
    }
  }, [userId]);

  const loadSessionCount = async () => {
    const { data } = await apiFetch<{ sessions: Session[] }>(`/users/${userId}/sessions`);
    if (data?.sessions) {
      setSessionCount(data.sessions.length);
    }
  };

  const handleFaceIdToggle = async (value: boolean) => {
    if (value && biometricAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Face ID',
        fallbackLabel: 'Use passcode',
      });
      if (!result.success) return;
    }
    await updatePref('faceId', value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    await updatePref(key, value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTwoFactorToggle = async (value: boolean) => {
    if (value) {
      setShowTwoFactorModal(true);
    } else {
      Alert.alert(
        'Disable Two-Factor Auth',
        'This will make your account less secure. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await apiPost('/2fa/disable', { user_id: userId });
              await updatePref('twoFactor', false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ]
      );
    }
  };

  const handleDownloadData = async () => {
    Alert.alert(
      'Download My Data',
      'We\'ll prepare an export of all your data and send it to your registered email address. This may take up to 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: async () => {
            setDownloadLoading(true);
            const { error } = await apiPost('/users/data-export', { user_id: userId });
            setDownloadLoading(false);

            if (error) {
              Alert.alert('Error', error);
              return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'Export Requested',
              'You\'ll receive an email with a download link within 48 hours.'
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!onDeleteAccount) {
              onDeleteSuccess?.();
              return;
            }

            setIsDeleting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            const result = await onDeleteAccount();

            setIsDeleting(false);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onDeleteSuccess?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SettingsPage title="Security & Privacy" onBack={onBack}>
      <SettingsSection title="Sign-in">
        <SettingsToggle
          icon={<FaceIdIcon />}
          label={biometricAvailable ? 'Face ID' : 'Biometrics (Not Available)'}
          value={prefs.faceId && biometricAvailable}
          onValueChange={handleFaceIdToggle}
          disabled={!biometricAvailable}
        />
        <SettingsRow
          icon={<KeyIcon />}
          label="Change Password"
          onPress={() => setShowPasswordModal(true)}
        />
        <SettingsToggle
          icon={<ShieldIcon />}
          label="Two-Factor Authentication"
          value={prefs.twoFactor}
          onValueChange={handleTwoFactorToggle}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="App Protection">
        <SettingsToggle
          icon={<LockIcon />}
          label="App Lock"
          value={prefs.appLock}
          onValueChange={(v) => handleToggle('appLock', v)}
          disabled={!biometricAvailable}
        />
        <SettingsToggle
          icon={<EyeOffIcon />}
          label="Hide Balances"
          value={prefs.hideBalances}
          onValueChange={(v) => handleToggle('hideBalances', v)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Privacy">
        <SettingsToggle
          icon={<SparklesIcon />}
          label="Personalised Insights"
          value={prefs.personalizedInsights}
          onValueChange={(v) => handleToggle('personalizedInsights', v)}
        />
        <SettingsToggle
          icon={<ShareIcon />}
          label="Share Usage Data"
          value={prefs.shareUsageData}
          onValueChange={(v) => handleToggle('shareUsageData', v)}
        />
        <SettingsToggle
          icon={<TargetIcon />}
          label="Personalised Ads"
          value={prefs.personalizedAds}
          onValueChange={(v) => handleToggle('personalizedAds', v)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          icon={<DownloadIcon />}
          label="Download My Data"
          onPress={handleDownloadData}
          loading={downloadLoading}
        />
        <SettingsRow
          icon={<MonitorIcon />}
          label="Active Sessions"
          value={sessionCount !== null ? `${sessionCount} device${sessionCount !== 1 ? 's' : ''}` : undefined}
          onPress={() => setShowSessionsModal(true)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <SettingsRow
          icon={<TrashIcon />}
          label="Delete Account"
          danger
          onPress={handleDeleteAccount}
          isLast
        />
      </SettingsSection>

      {userId && (
        <>
          <ChangePasswordModal
            visible={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            userId={userId}
          />
          <TwoFactorModal
            visible={showTwoFactorModal}
            onClose={() => setShowTwoFactorModal(false)}
            userId={userId}
            onEnabled={() => updatePref('twoFactor', true)}
          />
          <ActiveSessionsModal
            visible={showSessionsModal}
            onClose={() => {
              setShowSessionsModal(false);
              loadSessionCount();
            }}
            userId={userId}
          />
        </>
      )}
    </SettingsPage>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  error: {
    color: '#FF453A',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#005FCC',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

const sessionStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  info: {
    flex: 1,
  },
  device: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  current: {
    color: '#34C759',
    fontWeight: '400',
  },
  lastActive: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  revokeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,69,58,0.2)',
    borderRadius: 8,
  },
  revokeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF453A',
  },
});
