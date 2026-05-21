import React, { useState } from 'react';
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleContinue = () => {
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
      router.push({ pathname: '/survey', params: { userName: name.trim() } });
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
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
                  stroke="white"
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
                placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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

const styles = StyleSheet.create({
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
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 18,
  },
  continueButton: {
    marginTop: 20,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F80ED',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    shadowOpacity: 0,
  },
  continueButtonTextDisabled: {
    color: 'rgba(47,128,237,0.5)',
  },
});
