import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';

interface PaymentMethodsProps {
  onBack: () => void;
}

function VisaLogo() {
  return (
    <View style={styles.cardLogo}>
      <Text style={styles.cardLogoText}>VISA</Text>
    </View>
  );
}

function MastercardLogo() {
  return (
    <View style={styles.mcLogo}>
      <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
      <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
    </View>
  );
}

function BankIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#005FCC" strokeWidth={2}>
      <Path d="M3 22h18M6 18v-4M10 18v-4M14 18v-4M18 18v-4M2 10l10-8 10 8" />
    </Svg>
  );
}

function ApplePayIcon() {
  return (
    <View style={styles.applePayIcon}>
      <Text style={styles.applePayText}> Pay</Text>
    </View>
  );
}

function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#005FCC" strokeWidth={2}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

interface PaymentRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  isLast?: boolean;
}

function PaymentRow({ icon, title, subtitle, onPress, isLast }: PaymentRowProps) {
  return (
    <TouchableOpacity style={[styles.paymentRow, !isLast && styles.paymentRowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.paymentIcon}>{icon}</View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <ChevronIcon />
    </TouchableOpacity>
  );
}

export function PaymentMethods({ onBack }: PaymentMethodsProps) {
  return (
    <SettingsPage title="Payment Methods" onBack={onBack}>
      <View style={styles.heroCard}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCardGradient}
        >
          <View style={styles.heroCardHeader}>
            <VisaLogo />
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          </View>
          <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
          <View style={styles.heroCardFooter}>
            <View>
              <Text style={styles.cardLabel}>Card Holder</Text>
              <Text style={styles.cardValue}>John Smith</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>Expires</Text>
              <Text style={styles.cardValue}>09/27</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <SettingsSection title="Other Payment Methods">
        <PaymentRow
          icon={<MastercardLogo />}
          title="Mastercard"
          subtitle="•••• 8871"
          onPress={() => {}}
        />
        <PaymentRow
          icon={<BankIcon />}
          title="Monzo Current Account"
          subtitle="Bank account"
          onPress={() => {}}
        />
        <PaymentRow
          icon={<ApplePayIcon />}
          title="Apple Pay"
          subtitle="Connected"
          onPress={() => {}}
          isLast
        />
      </SettingsSection>

      <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
        <PlusIcon />
        <Text style={styles.addButtonText}>Add Card or Bank</Text>
      </TouchableOpacity>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardGradient: {
    padding: 20,
    aspectRatio: 1.6,
    justifyContent: 'space-between',
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLogo: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 2,
  },
  heroCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  paymentIcon: {
    width: 40,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mcLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  applePayIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applePayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  paymentSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
});
