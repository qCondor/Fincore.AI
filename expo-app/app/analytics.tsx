import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { BackArrowIcon } from '../components/icons';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#005FCC', '#34C759']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackArrowIcon color="white" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005FCC',
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
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  heroSubtext: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: '#00E0FF',
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
  },
  bulletRow: {
    marginBottom: 16,
  },
  bulletTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  bulletText: {
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#005FCC',
  },
});
