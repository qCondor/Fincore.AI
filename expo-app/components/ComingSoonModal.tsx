import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import { API_BASE_URL } from '../config';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  featureKey: 'banking' | 'analytics' | 'blueprint' | 'premium';
  description: string;
}

function XIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth={2}>
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

const featureHighlights: Record<string, string[]> = {
  banking: ['Live transaction summaries', 'Spending categories by personality', 'Helpful nudges before overspending'],
  analytics: ['Trend spotting across your month', 'Tailored money insights', 'Clear next-step recommendations'],
  blueprint: ['A personalised financial action plan', 'Milestones that match your habits', 'Guidance for long-term goals'],
  premium: ['Priority feature access', 'Exclusive coaching insights', 'Early beta perks'],
};

export function ComingSoonModal({
  visible,
  onClose,
  feature,
  featureKey,
  description,
}: ComingSoonModalProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, feature: featureKey }),
      });
    } catch {
      // Silent fail - still show success for UX
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backdrop} />
        </View>
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalCardOuter}>
            <BlurView intensity={80} tint="dark" style={styles.modalCardBlur} />
            <View style={styles.modalCardInner}>
              <View style={styles.decorativeOrb} />

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <XIcon />
              </TouchableOpacity>

              <View style={styles.heroHeader}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['rgba(0,95,204,0.2)', 'rgba(0,194,255,0.2)']}
                    style={styles.iconGradient}
                  >
                    <SparklesIcon />
                  </LinearGradient>
                </View>

                <View style={styles.pillContainer}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Early access · Beta soon</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.title}>{feature}</Text>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.highlightsContainer}>
                {featureHighlights[featureKey]?.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <View style={styles.highlightDot} />
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>

              {submitted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <BellIcon />
                </View>
                <Text style={styles.successTitle}>You're on the list!</Text>
                <Text style={styles.successSubtitle}>We'll notify you when it's ready.</Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.emailInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(15, 42, 74, 0.45)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={['#005FCC', '#00C2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>
                      {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

              <Text style={styles.comingDate}>Coming Q3 2026</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 24, 51, 0.72)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCardOuter: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalCardBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCardInner: {
    padding: 24,
    paddingTop: 28,
    backgroundColor: 'rgba(248, 251, 255, 0.98)',
  },
  decorativeOrb: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,194,255,0.15)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    color: '#0F2A4A',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4F627A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  pillContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 95, 204, 0.08)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#005FCC',
  },
  highlightsContainer: {
    marginBottom: 20,
    gap: 8,
    paddingHorizontal: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C2FF',
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: '#34506F',
    lineHeight: 18,
  },
  formContainer: {
    gap: 12,
  },
  emailInput: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 95, 204, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 204, 0.16)',
    color: '#0F2A4A',
    fontSize: 15,
  },
  submitButton: {
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52,199,89,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F2A4A',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#4F627A',
    marginTop: 4,
  },
  comingDate: {
    fontSize: 11,
    color: 'rgba(15, 42, 74, 0.45)',
    textAlign: 'center',
    marginTop: 16,
  },
});
