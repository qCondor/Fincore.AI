import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { apiPost, apiPatch } from '../../lib/api';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface PersonalDetailsProps {
  onBack: () => void;
  initials: string;
  userId?: string;
  profile?: {
    name: string | null;
    email: string | null;
    phone: string | null;
    dob: string | null;
    address: string | null;
    occupation: string | null;
    nationality: string | null;
    photo_url: string | null;
  } | null;
  onProfileUpdate?: () => void;
}

function UserIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function MailIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

function PhoneIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </Svg>
  );
}

function CalendarIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function MapPinIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}

function BriefcaseIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <Path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </Svg>
  );
}

function FlagIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </Svg>
  );
}

function CameraIcon() {
  const t = useTheme();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={t.textPrimary}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Circle cx={12} cy={13} r={4} fill={t.primaryOnSurface} />
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <TextInput
          style={[styles.rowInput, !editable && styles.rowInputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={t.overlayStrong}
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );
}

export function PersonalDetails({ onBack, initials, userId, profile, onProfileUpdate }: PersonalDetailsProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [nationality, setNationality] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data on mount - blank when not yet set, never a hardcoded fallback
  useEffect(() => {
    setFullName(profile?.name ?? '');
    setEmail(profile?.email ?? '');
    setPhone(profile?.phone ?? '');
    setDob(profile?.dob ?? '');
    setAddress(profile?.address ?? '');
    setOccupation(profile?.occupation ?? '');
    setNationality(profile?.nationality ?? '');
    setPhotoUrl(profile?.photo_url ?? null);
  }, [profile]);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && userId) {
        setIsUploadingPhoto(true);

        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        const { data, error } = await apiPost<{ photo_url: string }>('/profile/photo', {
          image_base64: manipulated.base64,
          media_type: 'image/jpeg',
        });

        if (!error && data) {
          setPhotoUrl(data.photo_url);
          onProfileUpdate?.();
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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
      const { error } = await apiPatch('/profile', {
        name: fullName,
        email: email,
        phone: phone,
        dob: dob,
        address: address,
        occupation: occupation,
        nationality: nationality,
      });

      if (!error) {
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
        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickPhoto} disabled={isUploadingPhoto}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={t.gradients.avatar} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.cameraBadge}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={t.textPrimary} />
            ) : (
              <CameraIcon />
            )}
          </View>
        </TouchableOpacity>
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
          <ActivityIndicator color={t.textPrimary} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Try Again' : 'Save Changes'}
          </Text>
        )}
      </TouchableOpacity>
    </SettingsPage>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
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
    borderColor: t.overlayStrong,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: t.overlayStrong,
  },
  avatarText: {
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: t.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayHairline,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: t.type.captionSmall,
    color: t.textFaint,
    marginBottom: 2,
  },
  rowInput: {
    fontSize: t.type.body,
    color: t.textPrimary,
    padding: 0,
  },
  rowInputDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    height: 54,
    backgroundColor: t.primary,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: t.primaryTintStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  saveButtonDisabled: {
    backgroundColor: t.primaryTintStronger,
  },
  saveButtonSuccess: {
    backgroundColor: t.success,
  },
  saveButtonError: {
    backgroundColor: t.danger,
  },
  saveButtonText: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textPrimary,
  },
});
