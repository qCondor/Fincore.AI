import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { BackArrowIcon } from '../components/icons';
import { WaveBackground } from '../components/WaveBackground';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const highlights = [
  'Live transaction summaries tailored to your spending style',
  'Automatic spending categories based on your personality',
  'Smart alerts when your balance or habits drift',
];

const bullets = [
  { title: 'Connected view', detail: 'See every account in one place, filtered through your financial personality.' },
  { title: 'Smart categorisation', detail: 'Spend categories that match how you actually behave.' },
  { title: 'Nudge-driven insights', detail: 'Receive suggestions right when a purchase feels risky for you.' },
];

export default function BankingScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AnimatedScreen style={styles.container}>
      <WaveBackground prefix="banking" />

      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackArrowIcon color={t.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Banking</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <View style={styles.heroCard}>
          <Text style={styles.heroHeadline}>Banking made personal.</Text>
          <Text style={styles.heroSubtext}>
            Connect accounts, track every transaction, and see how your financial personality changes the way you spend.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why it matters</Text>
          {highlights.map((item) => (
            <View key={item} style={styles.highlightRow}>
              <View style={styles.highlightDot} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}> 
          <Text style={styles.sectionTitle}>What you’ll get</Text>
          {bullets.map((item) => (
            <View key={item.title} style={styles.bulletRow}>
              <Text style={styles.bulletTitle}>{item.title}</Text>
              <Text style={styles.bulletText}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={() => setModalOpen(true)}>
          <Text style={styles.ctaText}>Join Banking Waitlist</Text>
        </TouchableOpacity>
      </ScrollView>

      <ComingSoonModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        feature="Banking"
        featureKey="banking"
        description="Connect your bank accounts and see all your transactions in one place, categorised by your spending personality."
      />
    </AnimatedScreen>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: t.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: t.type.heading,
    fontWeight: '700',
    color: t.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: t.overlayFaint,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
  },
  heroHeadline: {
    fontSize: t.type.headingLarge,
    fontWeight: '800',
    color: t.textPrimary,
    marginBottom: 12,
  },
  heroSubtext: {
    fontSize: t.type.body,
    lineHeight: t.line.relaxed,
    color: t.textNear,
  },
  section: {
    marginBottom: 20,
    backgroundColor: t.overlayHairline,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
  },
  sectionTitle: {
    fontSize: t.type.bodyLarge,
    fontWeight: '700',
    color: t.textPrimary,
    marginBottom: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.accentBright,
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    color: t.surfaceRaised,
    fontSize: t.type.bodyCompact,
    lineHeight: t.line.body,
  },
  bulletRow: {
    marginBottom: 16,
  },
  bulletTitle: {
    color: t.textPrimary,
    fontWeight: '700',
    fontSize: t.type.body,
    marginBottom: 6,
  },
  bulletText: {
    color: t.textTertiary,
    lineHeight: t.line.body,
  },
  ctaButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 28,
    backgroundColor: t.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  ctaText: {
    fontSize: t.type.body,
    fontWeight: '700',
    color: t.primaryOnSurface,
  },
});
