import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { useProfile } from '../../hooks/useProfile';
import { useUser } from '../../contexts/UserContext';
import {
  PersonalDetails,
  SecurityPrivacy,
  Notifications,
  Preferences,
  HelpSupport,
} from '../../components/settings';
import {
  XIcon,
  UserIcon,
  ShieldIcon,
  BellIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
} from '../../components/icons';
import { WaveBackground } from '../../components/WaveBackground';
import { BottomInputBar } from '../../components/BottomInputBar';
import { AnimatedScreen } from '../../components/AnimatedScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const traitColors: Record<string, { from: string; to: string }> = {
  Openness: { from: '#005FCC', to: '#00C2FF' },
  Conscientiousness: { from: '#34C759', to: '#30D158' },
  Extraversion: { from: '#FF9F0A', to: '#FECA57' },
  Agreeableness: { from: '#FF3B30', to: '#FF6B6B' },
  Neuroticism: { from: '#5AC8FA', to: '#007AFF' },
};

const traitMetadata: Record<string, {
  letter: string;
  definition: string;
  subtraits: { name: string; highInsight: string; lowInsight: string }[];
  highProfile: string;
  lowProfile: string;
  highFaith: string;
  lowFaith: string;
}> = {
  openness: {
    letter: 'O',
    definition: 'How curious and open you are to new ideas, experiences, and unconventional thinking.',
    subtraits: [
      { name: 'Intellectual Curiosity', highInsight: 'You research before buying but get drawn into new finds', lowInsight: 'You stick with familiar brands and products' },
      { name: 'Aesthetic Sensitivity', highInsight: 'Visual appeal strongly influences your purchases', lowInsight: 'Function matters more than form to you' },
      { name: 'Creative Imagination', highInsight: 'You gravitate toward novel products and experiences', lowInsight: 'You prefer tried-and-tested options' },
    ],
    highProfile: 'Novelty drives your spending. New releases and unique finds bypass your rational filters.',
    lowProfile: 'You prefer the familiar and proven. Trendy products rarely tempt you.',
    highFaith: 'Faith will flag novelty-driven impulse buys and suggest free alternatives.',
    lowFaith: 'Faith will occasionally introduce new options that might genuinely serve you better.',
  },
  conscientiousness: {
    letter: 'C',
    definition: 'How structured, disciplined, and goal-oriented you are in daily life.',
    subtraits: [
      { name: 'Organisation', highInsight: 'You meticulously track every expense', lowInsight: 'You loosely track finances but miss recurring costs' },
      { name: 'Productiveness', highInsight: 'You follow through on financial plans', lowInsight: 'You can stick to plans but often choose not to' },
      { name: 'Responsibility', highInsight: 'Long-term goals guide your spending', lowInsight: 'Short-term wants sometimes override long-term commitments' },
    ],
    highProfile: 'You thrive with structure. Budgets and plans keep you on track.',
    lowProfile: 'You default to spontaneity. Subscriptions and unreviewed spending drift unchecked.',
    highFaith: 'Faith will help optimise your already solid financial habits.',
    lowFaith: 'Faith will nudge you when spending drifts from your goals.',
  },
  extraversion: {
    letter: 'E',
    definition: 'How energised and motivated you are by social interaction and group activity.',
    subtraits: [
      { name: 'Sociability', highInsight: 'You spend more in groups than when alone', lowInsight: 'You spend consistently whether alone or with others' },
      { name: 'Assertiveness', highInsight: "You're quick to suggest plans, often costly ones", lowInsight: 'You rarely initiate expensive social plans' },
      { name: 'Energy Level', highInsight: 'A busy social calendar means frequent spending', lowInsight: 'Your quieter lifestyle keeps social spending low' },
    ],
    highProfile: 'Social situations are your biggest financial blind spot. Rounds and spontaneous nights out add up fast.',
    lowProfile: 'You make independent financial decisions without social pressure.',
    highFaith: 'Faith will track social spending and suggest lower-cost alternatives.',
    lowFaith: 'Faith will help you find value in occasional social experiences.',
  },
  agreeableness: {
    letter: 'A',
    definition: 'How cooperative, trusting, and conflict-averse you are in social situations.',
    subtraits: [
      { name: 'Compassion', highInsight: 'You over-tip and over-gift to avoid seeming tight', lowInsight: 'You tip and gift based on merit, not guilt' },
      { name: 'Respectfulness', highInsight: 'You split bills evenly even when you spent less', lowInsight: 'You confidently pay only for what you ordered' },
      { name: 'Trust', highInsight: 'You lend money without expecting it back', lowInsight: 'You set clear terms when lending money' },
    ],
    highProfile: 'Saying no feels harder than overspending. You absorb costs to keep the peace.',
    lowProfile: 'You set firm boundaries with money and rarely overspend to please others.',
    highFaith: 'Faith will help you set boundaries without straining relationships.',
    lowFaith: 'Faith will remind you when generosity might strengthen key relationships.',
  },
  neuroticism: {
    letter: 'N',
    definition: 'How sensitive you are to stress, worry, and emotional fluctuations.',
    subtraits: [
      { name: 'Anxiety', highInsight: 'Money stress keeps you up at night', lowInsight: "Money stress rarely keeps you up at night" },
      { name: 'Depression', highInsight: 'Low mood triggers comfort spending', lowInsight: "Low mood doesn't trigger comfort spending for you" },
      { name: 'Emotional Volatility', highInsight: 'Your spending fluctuates with your mood', lowInsight: 'You stay steady but overlook small financial leaks' },
    ],
    highProfile: 'Stress and anxiety drive emotional spending. You need calm reassurance around money.',
    lowProfile: "Your calm is a strength, but financial red flags don't trigger alarm bells.",
    highFaith: 'Faith will provide calm, concrete guidance when money feels overwhelming.',
    lowFaith: "Faith will schedule check-ins to surface patterns you'd naturally overlook.",
  },
};

function buildOceanTraits(bigFive: Record<string, number> | null) {
  const defaultScores: Record<string, number> = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
  const scores: Record<string, number> = bigFive || defaultScores;

  return Object.entries(traitMetadata).map(([key, meta]) => {
    const score = scores[key] ?? scores[key.charAt(0).toUpperCase() + key.slice(1)] ?? 50;
    const isHigh = score >= 50;

    return {
      trait: key.charAt(0).toUpperCase() + key.slice(1),
      letter: meta.letter,
      score,
      definition: meta.definition,
      subtraits: meta.subtraits.map(s => ({
        name: s.name,
        insight: isHigh ? s.highInsight : s.lowInsight,
      })),
      profile: isHigh ? meta.highProfile : meta.lowProfile,
      faith: isHigh ? meta.highFaith : meta.lowFaith,
    };
  });
}

function ChevronDownIcon({ rotated }: { rotated: boolean }) {
  return (
    <Svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: rotated ? '180deg' : '0deg' }] }}
    >
      <Path d="M6 9l6 6 6-6" stroke="#005FCC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#005FCC">
      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#005FCC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ openSettings?: string }>();
  const { userId, authProvider } = useUser();
  const { initials, profile, refetch, deleteAccount } = useProfile({ userId: userId ?? undefined });

  const oceanTraits = React.useMemo(
    () => buildOceanTraits(profile?.big_five ?? null),
    [profile?.big_five]
  );
  const [profilePage, setProfilePage] = useState(0);
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsPage, setSettingsPage] = useState<'personal' | 'security' | 'notifications' | 'preferences' | 'help' | null>(null);
  const settingsSlide = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const hasOpenedSettings = React.useRef(false);

  const openSettingsMenu = () => {
    setSettingsMenuOpen(true);
    Animated.timing(settingsSlide, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // Auto-open settings menu if navigated with openSettings param
  useEffect(() => {
    if (params.openSettings === 'true' && !hasOpenedSettings.current) {
      hasOpenedSettings.current = true;
      // Small delay to ensure animation works after navigation
      setTimeout(() => {
        openSettingsMenu();
      }, 100);
    }
  }, [params.openSettings]);

  const closeSettingsMenu = () => {
    hasOpenedSettings.current = false;
    Animated.timing(settingsSlide, {
      toValue: SCREEN_WIDTH,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setSettingsMenuOpen(false);
    });
  };

  const handleSignOut = async () => {
    closeSettingsMenu();
    await clearUser();
    router.replace('/login');
  };

  const { clearUser } = useUser();

  const authProviderLabel = authProvider === 'google'
    ? 'Signed in with Google'
    : authProvider === 'apple'
    ? 'Signed in with Apple'
    : authProvider === 'microsoft'
    ? 'Signed in with Microsoft'
    : 'Guest access';

  const askFaithAboutProfile = () => {
    if (!inputText.trim()) return;
    router.push({ pathname: '/faith', params: { profileQuestion: inputText.trim() } });
    setInputText('');
  };

  const toggleTrait = (trait: string) => {
    setExpandedTraits((prev) => {
      const next = new Set(prev);
      if (next.has(trait)) {
        next.delete(trait);
      } else {
        next.add(trait);
      }
      return next;
    });
  };

  return (
    <AnimatedScreen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      {/* Wave background */}
      <WaveBackground prefix="profile" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              {profilePage === 0 ? 'OCEAN Personality Assessment' : 'Blueprint'}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarButton} onPress={openSettingsMenu}>
            {profile?.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
                <View style={styles.avatarShine} />
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Page indicators */}
        <View style={styles.pageIndicators}>
          {[0, 1].map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setProfilePage(i)}
              style={[styles.indicator, profilePage === i && styles.indicatorActive]}
            />
          ))}
        </View>
      </View>

      {/* Swipeable content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setProfilePage(page);
          }}
          contentOffset={{ x: profilePage * SCREEN_WIDTH, y: 0 }}
        >
          {/* Page 1 — OCEAN Assessment */}
          <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
            {/* What is OCEAN card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What is OCEAN?</Text>
              <Text style={styles.cardText}>
                OCEAN is the gold-standard Big Five personality model used by psychologists worldwide. It measures five core traits — <Text style={styles.boldText}>O</Text>penness, <Text style={styles.boldText}>C</Text>onscientiousness, <Text style={styles.boldText}>E</Text>xtraversion, <Text style={styles.boldText}>A</Text>greeableness, and <Text style={styles.boldText}>N</Text>euroticism — to understand how your personality shapes your financial decisions.
              </Text>
            </View>

            {/* OCEAN Traits card */}
            <View style={styles.card}>
              {oceanTraits.map((t, index) => {
                const colors = traitColors[t.trait];
                const isExpanded = expandedTraits.has(t.trait);
                const isLast = index === oceanTraits.length - 1;

                return (
                  <TouchableOpacity
                    key={t.trait}
                    onPress={() => toggleTrait(t.trait)}
                    style={[styles.traitItem, !isLast && { marginBottom: 18 }]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.traitHeader}>
                      <View style={styles.traitLabelRow}>
                        <LinearGradient
                          colors={[colors.from, colors.to]}
                          style={styles.traitBadge}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.traitLetter}>{t.letter}</Text>
                        </LinearGradient>
                        <Text style={styles.traitName}>{t.trait}</Text>
                      </View>
                      <Text style={styles.traitScore}>{t.score}th</Text>
                    </View>

                    <View style={styles.traitBarBg}>
                      <LinearGradient
                        colors={[colors.from, colors.to]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.traitBar, { width: `${t.score}%` }]}
                      />
                    </View>

                    <View style={styles.seeMoreRow}>
                      <Text style={styles.seeMoreText}>See more</Text>
                      <ChevronDownIcon rotated={isExpanded} />
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.expandedSection}>
                          <Text style={styles.expandedSectionTitle}>{t.trait} — {t.score}/100</Text>
                          <Text style={styles.expandedText}>{t.definition}</Text>
                        </View>
                        <View style={styles.expandedSection}>
                          {t.subtraits.map((s) => (
                            <View key={s.name} style={styles.subtraitRow}>
                              <View style={[styles.subtraitDot, { backgroundColor: colors.from }]} />
                              <Text style={styles.expandedText}>
                                <Text style={styles.boldText}>{s.name}</Text> — {s.insight}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.expandedSection}>
                          <Text style={styles.expandedSectionTitle}>Your Profile</Text>
                          <Text style={styles.expandedText}>{t.profile}</Text>
                        </View>
                        <View style={styles.expandedFaith}>
                          <Text style={styles.faithHelpText}>
                            <Text style={styles.boldText}>How Faith Can Help</Text> — {t.faith}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* How Faith Will Help card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How Faith Will Help You</Text>
              <View style={styles.faithHelpCard}>
                <Text style={styles.faithHelpCardText}>
                  Faith will adapt to your communication style, provide guardrails around social spending, and channel your openness into smarter choices.
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Page 2 — Blueprint (locked) */}
          <View style={{ width: SCREEN_WIDTH, position: 'relative' }}>
            <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
              <View style={styles.heroCard}>
                <Text style={styles.heroHeadline}>Blueprint</Text>
                <Text style={styles.heroSubtext}>
                  Unlock your personalised spending blueprint and see the habits, triggers, and guidance tailored to your personality.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What you'll discover</Text>
                {[
                  'Why your spending trends happen and what they mean for you',
                  'How your personality shapes impulse, planning, and risk tolerance',
                  'A concrete action plan you can use today',
                ].map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <View style={styles.highlightDot} />
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why Blueprint matters</Text>
                {[
                  { title: 'Personal clarity', detail: 'See your spending through the lens of your own personality.' },
                  { title: 'Better decisions', detail: 'Use insights that fit how you actually behave.' },
                  { title: 'Smart support', detail: 'Get guidance that feels relevant, not generic.' },
                ].map((item) => (
                  <View key={item.title} style={styles.bulletRow}>
                    <Text style={styles.bulletTitle}>{item.title}</Text>
                    <Text style={styles.bulletText}>{item.detail}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Locked today</Text>
                <Text style={styles.cardText}>
                  Blueprint is still on the way, but you can join the waitlist now to get early access and first-look updates.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => setComingSoonModal({ open: true, feature: 'blueprint' })}
              >
                <Text style={styles.ctaText}>Join Blueprint Waitlist</Text>
              </TouchableOpacity>

              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <BottomInputBar
        activeScreen="profile"
        placeholder="Ask about your profile..."
        value={inputText}
        onChangeText={setInputText}
        onSend={askFaithAboutProfile}
        onNavigate={(screen) => {
          if (screen === 'faith') router.push('/faith');
          else if (screen === 'scan') router.push('/');
        }}
        onComingSoon={(feature) => {
          if (feature === 'banking') router.push('/banking');
          else if (feature === 'analytics') router.push('/analytics');
          else setComingSoonModal({ open: true, feature });
        }}
        bottomInset={insets.bottom}
        showMic={false}
      />

      <ComingSoonModal
        visible={comingSoonModal.open}
        onClose={() => setComingSoonModal({ open: false, feature: null })}
        feature={comingSoonModal.feature === 'banking' ? 'Banking' : comingSoonModal.feature === 'analytics' ? 'Analytics' : 'Blueprint'}
        featureKey={comingSoonModal.feature || 'blueprint'}
        description={
          comingSoonModal.feature === 'banking'
            ? 'Connect your bank accounts and see all your transactions in one place, categorised by your spending personality.'
            : comingSoonModal.feature === 'analytics'
            ? 'Deep insights into your spending patterns, with personalised recommendations based on your OCEAN profile.'
            : 'See the full context behind your spending patterns and get a personalised action plan.'
        }
      />

      {/* Settings Menu Overlay */}
      {settingsMenuOpen && (
        <View style={styles.settingsOverlay}>
          <TouchableOpacity style={styles.settingsBackdrop} activeOpacity={1} onPress={closeSettingsMenu} />
          <View
            style={[
              styles.settingsMenu,
              { paddingTop: insets.top + 16, transform: [{ translateX: settingsSlide }] },
            ]}
          >
            <View style={styles.settingsHeader}>
              <TouchableOpacity style={styles.settingsCloseButton} onPress={closeSettingsMenu}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.settingsTitle}>Settings</Text>
              <View style={{ width: 42 }} />
            </View>

            <View style={styles.settingsAvatarSection}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.settingsAvatarImage} />
              ) : (
                <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.settingsAvatar}>
                  <Text style={styles.settingsAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
              <Text style={styles.settingsName}>{profile?.name || 'User'}</Text>
              <Text style={styles.settingsEmail}>{profile?.email || 'user@fincore.one'}</Text>
              <View style={styles.providerBadge}>
                <Text style={styles.providerBadgeText}>{authProviderLabel}</Text>
              </View>
            </View>

            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.08)']}
              style={styles.settingsSummaryCard}
            >
              <View style={styles.settingsSummaryHeader}>
                <View style={styles.settingsSummaryPill}>
                  <Text style={styles.settingsSummaryPillText}>Synced</Text>
                </View>
                <Text style={styles.settingsSummaryCaption}>Coach ready</Text>
              </View>
              <Text style={styles.settingsSummaryTitle}>Your profile is set up</Text>
              <Text style={styles.settingsSummaryText}>
                Fincore is using your latest personality profile to shape helpful guidance and better nudges.
              </Text>
            </LinearGradient>

            <View style={styles.settingsMenuItems}>
              <SettingsMenuItem
                icon={<UserIcon size={18} />}
                label="Personal Details"
                onPress={() => setSettingsPage('personal')}
              />
              <SettingsMenuItem
                icon={<ShieldIcon size={18} />}
                label="Security & Privacy"
                onPress={() => setSettingsPage('security')}
              />
              <SettingsMenuItem
                icon={<BellIcon size={18} />}
                label="Notifications"
                onPress={() => setSettingsPage('notifications')}
              />
              <SettingsMenuItem
                icon={<SettingsIcon size={18} />}
                label="Preferences"
                onPress={() => setSettingsPage('preferences')}
              />
              <SettingsMenuItem
                icon={<HelpCircleIcon size={18} />}
                label="Help & Support"
                onPress={() => setSettingsPage('help')}
              />
              <SettingsMenuItem
                icon={<LogOutIcon size={18} />}
                label="Sign Out"
                onPress={handleSignOut}
                danger
                isLast
              />
            </View>
          </View>
        </View>
      )}

      {/* Settings Pages */}
      <Modal visible={settingsPage === 'personal'} animationType="slide" presentationStyle="fullScreen">
        <PersonalDetails
          onBack={() => setSettingsPage(null)}
          initials={initials}
          userId={userId ?? undefined}
          profile={profile}
          onProfileUpdate={refetch}
        />
      </Modal>
      <Modal visible={settingsPage === 'security'} animationType="slide" presentationStyle="fullScreen">
        <SecurityPrivacy
          onBack={() => setSettingsPage(null)}
          onDeleteAccount={deleteAccount}
          onDeleteSuccess={() => {
            setSettingsPage(null);
            closeSettingsMenu();
            clearUser();
            router.replace('/login');
          }}
        />
      </Modal>
      <Modal visible={settingsPage === 'notifications'} animationType="slide" presentationStyle="fullScreen">
        <Notifications onBack={() => setSettingsPage(null)} />
      </Modal>
      <Modal visible={settingsPage === 'preferences'} animationType="slide" presentationStyle="fullScreen">
        <Preferences onBack={() => setSettingsPage(null)} />
      </Modal>
      <Modal visible={settingsPage === 'help'} animationType="slide" presentationStyle="fullScreen">
        <HelpSupport
          onBack={() => setSettingsPage(null)}
          onTalkToFaith={() => {
            setSettingsPage(null);
            closeSettingsMenu();
            router.push('/(tabs)/faith');
          }}
        />
      </Modal>
      </KeyboardAvoidingView>
    </AnimatedScreen>
  );
}


interface SettingsMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  isLast?: boolean;
}

function SettingsMenuItem({ icon, label, onPress, danger = false, isLast = false }: SettingsMenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsMenuItem, !isLast && styles.settingsMenuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsMenuItemIcon}>{icon}</View>
      <Text style={[styles.settingsMenuItemLabel, danger && styles.settingsMenuItemDanger]}>{label}</Text>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005FCC',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    opacity: 0.3,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 14,
  },
  bulletTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  traitItem: {
    // No background, just spacing
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traitBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  traitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  traitScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#005FCC',
  },
  traitBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  traitBar: {
    height: '100%',
    borderRadius: 4,
  },
  seeMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#005FCC',
  },
  expandedContent: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandedSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  expandedSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  expandedText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  subtraitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  subtraitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  expandedFaith: {
    padding: 12,
    backgroundColor: 'rgba(0,95,204,0.08)',
  },
  faithHelpText: {
    fontSize: 12,
    color: '#005FCC',
  },
  faithHelpCard: {
    padding: 16,
    backgroundColor: 'rgba(0,95,204,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#005FCC',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  faithHelpCardText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  impactItems: {
    gap: 12,
  },
  impactItem: {
    gap: 4,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactLabel: {
    fontSize: 13,
    color: '#666',
  },
  impactAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  impactBarBg: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  impactBar: {
    height: '100%',
    borderRadius: 3,
  },
  actionItems: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  lockOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,95,204,0.18)',
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 10,
  },
  lockText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
    lineHeight: 22,
  },
  upgradeButton: {
    height: 52,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#005FCC',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
  },
  settingsMenu: {
    flex: 1,
    backgroundColor: '#005FCC',
    paddingHorizontal: 20,
    width: '100%',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginRight: 42,
  },
  settingsAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsSummaryCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  settingsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingsSummaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(52,199,89,0.18)',
  },
  settingsSummaryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B7F6C4',
  },
  settingsSummaryCaption: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  settingsSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  settingsSummaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.74)',
    lineHeight: 18,
  },
  settingsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  settingsAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  settingsAvatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  settingsName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  settingsEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  providerBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  providerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  settingsMenuItems: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  settingsMenuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsMenuItemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  settingsMenuItemDanger: {
    color: '#FF453A',
  },
});
