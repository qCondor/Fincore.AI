import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as MailComposer from 'expo-mail-composer';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';

interface HelpSupportProps {
  onBack: () => void;
  onTalkToFaith?: () => void;
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2}>
      <Circle cx={11} cy={11} r={8} />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M10 8l6 4-6 4V8z" />
    </Svg>
  );
}

function BrainIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function CreditCardIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
      <Path d="M1 10h22" />
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

function MessageIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
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

function FileTextIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
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

const HELP_TOPICS = {
  gettingStarted: {
    title: 'Getting Started',
    content: 'Welcome to Fincore! Start by completing your personality survey to unlock personalized financial insights from Faith, your AI financial coach.',
  },
  ocean: {
    title: 'Your OCEAN Profile',
    content: 'OCEAN stands for Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism. These five traits shape how you interact with money and make financial decisions.',
  },
  feelsLike: {
    title: 'Feels Like Scan',
    content: 'Point your camera at any product to see how it "feels" financially based on your personality. Faith calculates a personalized "emotional tax" to help you make better spending decisions.',
  },
  payments: {
    title: 'Payments & Billing',
    content: 'Manage your payment methods and view your billing history in Settings > Payment Methods.',
  },
  security: {
    title: 'Account & Security',
    content: 'Enable Face ID, two-factor authentication, and manage your privacy settings in Settings > Security & Privacy.',
  },
};

export function HelpSupport({ onBack, onTalkToFaith }: HelpSupportProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const showTopic = (topicKey: keyof typeof HELP_TOPICS) => {
    const topic = HELP_TOPICS[topicKey];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(topic.title, topic.content);
  };

  const handleContactUs = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ['support@fincore.one'],
        subject: 'Fincore Support Request',
        body: '\n\n---\nFincore v3.0 · Build 2026.05',
      });
    } else {
      Linking.openURL('mailto:support@fincore.one?subject=Fincore%20Support%20Request');
    }
  };

  const handleReportProblem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ['bugs@fincore.one'],
        subject: 'Bug Report - Fincore App',
        body: 'Please describe the issue:\n\n\nSteps to reproduce:\n1. \n2. \n3. \n\n---\nFincore v3.0 · Build 2026.05',
      });
    } else {
      Linking.openURL('mailto:bugs@fincore.one?subject=Bug%20Report%20-%20Fincore%20App');
    }
  };

  const handleLegalLink = (type: 'terms' | 'privacy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = type === 'terms'
      ? 'https://fincore.one/terms'
      : 'https://fincore.one/privacy';
    Linking.openURL(url);
  };

  const handleTalkToFaith = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTalkToFaith?.();
  };

  return (
    <SettingsPage title="Help & Support" onBack={onBack}>
      <View style={styles.searchContainer}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder="Search help"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity style={styles.faithCard} activeOpacity={0.9} onPress={handleTalkToFaith}>
        <LinearGradient
          colors={['#00C2FF', '#005FCC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.faithCardGradient}
        >
          <View style={styles.faithIconContainer}>
            <SparklesIcon />
          </View>
          <View style={styles.faithCardContent}>
            <Text style={styles.faithCardTitle}>Talk to Faith</Text>
            <Text style={styles.faithCardSubtitle}>Get instant help from your AI assistant</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </LinearGradient>
      </TouchableOpacity>

      <SettingsSection title="Common Topics">
        <SettingsRow icon={<PlayIcon />} label="Getting started" onPress={() => showTopic('gettingStarted')} />
        <SettingsRow icon={<BrainIcon />} label="Understanding your OCEAN profile" onPress={() => showTopic('ocean')} />
        <SettingsRow icon={<CameraIcon />} label="Feels Like Scan" onPress={() => showTopic('feelsLike')} />
        <SettingsRow icon={<CreditCardIcon />} label="Payments & billing" onPress={() => showTopic('payments')} />
        <SettingsRow icon={<ShieldIcon />} label="Account & security" onPress={() => showTopic('security')} isLast />
      </SettingsSection>

      <SettingsSection title="Contact">
        <SettingsRow icon={<MessageIcon />} label="Contact us" onPress={handleContactUs} />
        <SettingsRow icon={<AlertCircleIcon />} label="Report a problem" onPress={handleReportProblem} isLast />
      </SettingsSection>

      <SettingsSection title="Legal">
        <SettingsRow icon={<FileTextIcon />} label="Terms of Service" onPress={() => handleLegalLink('terms')} />
        <SettingsRow icon={<LockIcon />} label="Privacy Policy" onPress={() => handleLegalLink('privacy')} isLast />
      </SettingsSection>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Fincore v3.0 · Build 2026.05</Text>
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginLeft: 10,
  },
  faithCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#005FCC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  faithCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faithIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  faithCardContent: {
    flex: 1,
  },
  faithCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  faithCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
