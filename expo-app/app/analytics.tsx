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
  'Trend spotting that matches your spending personality',
  'Clear recommendations based on behaviour, not just numbers',
  'Insights that help you act with confidence and calm',
];

const bullets = [
  { title: 'Behavioural analytics', detail: 'See the patterns behind every purchase and how your personality influences them.' },
  { title: 'Monthly summaries', detail: 'Get monthly health checks that are easy to understand and personalised for you.' },
  { title: 'Actionable guidance', detail: 'Move from awareness to better habits with clear, behaviour-driven suggestions.' },
];

export default function AnalyticsScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AnimatedScreen style={styles.container}>
      <WaveBackground prefix="analytics" />

      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackArrowIcon color={t.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <View style={styles.heroCard}>
          <Text style={styles.heroHeadline}>Insights that feel personal.</Text>
          <Text style={styles.heroSubtext}>
            Understand your spending patterns with clear analytics that reflect how you think, feel, and act.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you'll learn</Text>
          {highlights.map((item) => (
            <View key={item} style={styles.highlightRow}>
              <View style={styles.highlightDot} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}> 
          <Text style={styles.sectionTitle}>Why it helps</Text>
          {bullets.map((item) => (
            <View key={item.title} style={styles.bulletRow}>
              <Text style={styles.bulletTitle}>{item.title}</Text>
              <Text style={styles.bulletText}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={() => setModalOpen(true)}>
          <Text style={styles.ctaText}>Join Analytics Waitlist</Text>
        </TouchableOpacity>
      </ScrollView>

      <ComingSoonModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        feature="Analytics"
        featureKey="analytics"
        description="Deep insights into your spending patterns, with personalised recommendations based on your OCEAN profile."
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
