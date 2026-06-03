import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { API_BASE_URL } from '../../config';

interface PersonalDetailsProps {
  onBack: () => void;
  initials: string;
  userId?: string;
  profile?: {
    name: string | null;
    email: string | null;
  } | null;
  onProfileUpdate?: () => void;
}

function UserIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
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

function PhoneIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function MapPinIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}

function BriefcaseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <Path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="white">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Circle cx={12} cy={13} r={4} fill="#005FCC" />
    </Svg>
  );
}

interface EditableRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isLast?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  editable?: boolean;
}

function EditableRow({ icon, label, value, onChangeText, isLast = false, keyboardType = 'default', editable = true }: EditableRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <TextInput
          style={[styles.rowInput, !editable && styles.rowInputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );
}

export function PersonalDetails({ onBack, initials, userId, profile, onProfileUpdate }: PersonalDetailsProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [nationality, setNationality] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    if (profile) {
      setFullName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  // Track changes
  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!userId || !hasChanges) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: fullName,
          email: email,
          // Additional fields would need backend support
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setHasChanges(false);
        onProfileUpdate?.();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setSaveStatus('error');
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsPage title="Personal Details" onBack={onBack}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.cameraBadge}>
            <CameraIcon />
          </TouchableOpacity>
        </View>
      </View>

      <SettingsSection>
        <EditableRow
          icon={<UserIcon />}
          label="Full Name"
          value={fullName}
          onChangeText={handleFieldChange(setFullName)}
        />
        <EditableRow
          icon={<MailIcon />}
          label="Email"
          value={email}
          onChangeText={handleFieldChange(setEmail)}
          keyboardType="email-address"
        />
        <EditableRow
          icon={<PhoneIcon />}
          label="Phone"
          value={phone || '+44 7700 900 123'}
          onChangeText={handleFieldChange(setPhone)}
          keyboardType="phone-pad"
        />
        <EditableRow
          icon={<CalendarIcon />}
          label="Date of Birth"
          value={dob || '14 March 1991'}
          onChangeText={handleFieldChange(setDob)}
        />
        <EditableRow
          icon={<MapPinIcon />}
          label="Address"
          value={address || '22 Kings Road, London SW3'}
          onChangeText={handleFieldChange(setAddress)}
        />
        <EditableRow
          icon={<BriefcaseIcon />}
          label="Occupation"
          value={occupation || 'Product Designer'}
          onChangeText={handleFieldChange(setOccupation)}
        />
        <EditableRow
          icon={<FlagIcon />}
          label="Nationality"
          value={nationality || 'British'}
          onChangeText={handleFieldChange(setNationality)}
          isLast
        />
      </SettingsSection>

      <TouchableOpacity
        style={[
          styles.saveButton,
          !hasChanges && styles.saveButtonDisabled,
          saveStatus === 'saved' && styles.saveButtonSuccess,
          saveStatus === 'error' && styles.saveButtonError,
        ]}
        onPress={handleSave}
        activeOpacity={0.9}
        disabled={isSaving || !hasChanges}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Try Again' : 'Save Changes'}
          </Text>
        )}
      </TouchableOpacity>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#005FCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  rowInput: {
    fontSize: 15,
    color: '#fff',
    padding: 0,
  },
  rowInputDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    height: 54,
    backgroundColor: '#005FCC',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: 'rgba(0,95,204,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(0,95,204,0.5)',
  },
  saveButtonSuccess: {
    backgroundColor: '#34C759',
  },
  saveButtonError: {
    backgroundColor: '#FF453A',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
