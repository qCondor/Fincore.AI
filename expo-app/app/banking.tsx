import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { BackArrowIcon } from '../components/icons';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#005FCC', '#00C2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackArrowIcon color="white" />
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
