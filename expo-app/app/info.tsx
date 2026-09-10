import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useUser } from '../contexts/UserContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

const formatDOB = (text: string): string => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
};

const validateDOB = (dob: string): boolean => {
  const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;
  return true;
};

export default function InfoScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUserName, setUserEmail } = useUser();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDOBChange = (text: string) => {
    const formatted = formatDOB(text);
    if (formatted.length <= 10) {
      setDob(formatted);
      if (errors.dob) setErrors({ ...errors, dob: '' });
    }
  };

  // Check if all fields are valid for enabling the button
  const isFormValid =
    name.trim().length > 0 &&
    validateDOB(dob) &&
    validateEmail(email) &&
    validatePhone(phone);

  const handleContinue = async () => {
    if (!isFormValid) return;

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!validateDOB(dob)) {
      newErrors.dob = 'Enter valid date (DD/MM/YYYY)';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!validatePhone(phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await setUserName(name.trim());
      await setUserEmail(email.trim());
      router.replace({ pathname: '/survey', params: { userName: name.trim() } });
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={t.gradients.main}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke={t.textPrimary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>About You</Text>
              <Text style={styles.subtitle}>We just need a few details</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(t) => { setName(t); if (errors.name) setErrors({ ...errors, name: '' }); }}
                placeholder="e.g. Jordan Smith"
                placeholderTextColor={t.textOnSurfaceSubtle}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={[styles.input, errors.dob && styles.inputError]}
                value={dob}
                onChangeText={handleDOBChange}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={t.textOnSurfaceSubtle}
                keyboardType="number-pad"
                maxLength={10}
              />
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }); }}
                placeholder="you@email.com"
                placeholderTextColor={t.textOnSurfaceSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={phone}
                onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors({ ...errors, phone: '' }); }}
                placeholder="+44 7XXX XXXXXX"
                placeholderTextColor={t.textOnSurfaceSubtle}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid}
          >
            <Text style={[styles.continueButtonText, !isFormValid && styles.continueButtonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: t.type.caption,
    color: t.textFaint,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: t.surfaceCard,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: t.overlayBorder,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.textOnSurfaceSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: t.surfaceNeutralAlt,
    borderWidth: 1,
    borderColor: t.shadowSoft,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: t.type.bodyLarge,
    color: t.textOnSurface,
  },
  inputError: {
    borderColor: t.dangerStrong,
    borderWidth: 1.5,
  },
  errorText: {
    color: t.dangerStrong,
    fontSize: t.type.caption,
    marginTop: 4,
    marginLeft: 18,
  },
  continueButton: {
    marginTop: 20,
    height: 50,
    backgroundColor: t.textPrimary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.shadowBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.secondary,
  },
  continueButtonDisabled: {
    backgroundColor: t.textGhost,
    shadowOpacity: 0,
  },
  continueButtonTextDisabled: {
    color: t.secondaryTintStrong,
  },
});
