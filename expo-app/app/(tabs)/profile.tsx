import React, { useState, useEffect, useMemo } from 'react';
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
import { traitMetadata } from '../../lib/traits';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const t = useTheme();
  return (
    <Svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: rotated ? '180deg' : '0deg' }] }}
    >
      <Path d="M6 9l6 6 6-6" stroke={t.primaryOnSurface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 48 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={t.primaryOnSurface}>
      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={t.primaryOnSurface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
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
              <LinearGradient colors={t.gradients.avatar} style={styles.avatarGradient}>
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
              {oceanTraits.map((trait, index) => {
                const colors = t.traitGradients[trait.trait];
                const isExpanded = expandedTraits.has(trait.trait);
                const isLast = index === oceanTraits.length - 1;

                return (
                  <TouchableOpacity
                    key={trait.trait}
                    onPress={() => toggleTrait(trait.trait)}
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
                          <Text style={styles.traitLetter}>{trait.letter}</Text>
                        </LinearGradient>
                        <Text style={styles.traitName}>{trait.trait}</Text>
                      </View>
                      <Text style={styles.traitScore}>{trait.score}th</Text>
                    </View>

                    <View style={styles.traitBarBg}>
                      <LinearGradient
                        colors={[colors.from, colors.to]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.traitBar, { width: `${trait.score}%` }]}
                      />
                    </View>

                    <View style={styles.seeMoreRow}>
                      <Text style={styles.seeMoreText}>See more</Text>
                      <ChevronDownIcon rotated={isExpanded} />
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.expandedSection}>
                          <Text style={styles.expandedSectionTitle}>{trait.trait} — {trait.score}/100</Text>
                          <Text style={styles.expandedText}>{trait.definition}</Text>
                        </View>
                        <View style={styles.expandedSection}>
                          {trait.subtraits.map((s) => (
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
                          <Text style={styles.expandedText}>{trait.profile}</Text>
                        </View>
                        <View style={styles.expandedFaith}>
                          <Text style={styles.faithHelpText}>
                            <Text style={styles.boldText}>How Faith Can Help</Text> — {trait.faith}
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
          <Animated.View
            style={[
              styles.settingsMenu,
              { paddingTop: insets.top + 16, transform: [{ translateX: settingsSlide }] },
            ]}
          >
            <View style={styles.settingsHeader}>
              <TouchableOpacity style={styles.settingsCloseButton} onPress={closeSettingsMenu}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.settingsTitle}>Settings</Text>
              <View style={{ width: 42 }} />
            </View>

            <ScrollView
              style={styles.settingsScroll}
              contentContainerStyle={[styles.settingsScrollContent, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.settingsAvatarSection}>
                {profile?.photo_url ? (
                  <Image source={{ uri: profile.photo_url }} style={styles.settingsAvatarImage} />
                ) : (
                  <LinearGradient colors={t.gradients.avatar} style={styles.settingsAvatar}>
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
                colors={t.gradients.glassSheen}
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
            </ScrollView>
          </Animated.View>
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <TouchableOpacity
      style={[styles.settingsMenuItem, !isLast && styles.settingsMenuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsMenuItemIcon}>{icon}</View>
      <Text style={[styles.settingsMenuItemLabel, danger && styles.settingsMenuItemDanger]}>{label}</Text>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.overlayStrong} strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
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
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: t.type.caption,
    color: t.textFaint,
    marginTop: 4,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: t.textMuted,
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
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.textPrimary,
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
    backgroundColor: t.overlayStrong,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: t.textPrimary,
  },
  contentWrapper: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 14,
  },
  bulletTitle: {
    fontSize: t.type.body,
    fontWeight: '700',
    color: t.textPrimary,
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
  card: {
    backgroundColor: t.surfaceCard,
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: t.overlayBorder,
    shadowColor: t.shadowSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: t.type.body,
    fontWeight: '700',
    color: t.textOnSurface,
    marginBottom: 8,
  },
  cardText: {
    fontSize: t.type.bodySmall,
    color: t.textOnSurfaceSecondary,
    lineHeight: t.line.body,
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
    fontSize: t.type.bodySmall,
    fontWeight: '700',
    color: t.textPrimary,
  },
  traitName: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  traitScore: {
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.primaryOnSurface,
  },
  traitBarBg: {
    height: 8,
    backgroundColor: t.surfaceNeutral,
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
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.primaryOnSurface,
  },
  expandedContent: {
    marginTop: 12,
    backgroundColor: t.surfaceNeutralAlt,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandedSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.textMuted,
  },
  expandedSectionTitle: {
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.textOnSurface,
    marginBottom: 4,
  },
  expandedText: {
    fontSize: t.type.caption,
    color: t.textOnSurfaceSecondary,
    lineHeight: t.line.compact,
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
    backgroundColor: t.primaryTintFaint,
  },
  faithHelpText: {
    fontSize: t.type.caption,
    color: t.primaryOnSurface,
  },
  faithHelpCard: {
    padding: 16,
    backgroundColor: t.primaryTintFaint,
    borderLeftWidth: 3,
    borderLeftColor: t.primary,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  faithHelpCardText: {
    fontSize: t.type.bodySmall,
    color: t.textOnSurfaceSecondary,
    lineHeight: t.line.body,
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
    fontSize: t.type.bodySmall,
    color: t.textOnSurfaceSecondary,
  },
  impactAmount: {
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  impactBarBg: {
    height: 6,
    backgroundColor: t.surfaceNeutral,
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
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  actionSub: {
    fontSize: t.type.caption,
    color: t.textOnSurfaceSecondary,
    marginTop: 2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: t.shadowMedium,
  },
  lockOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.primaryTintMedium,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
    backgroundColor: t.overlayFaint,
  },
  lockTitle: {
    fontSize: t.type.heading,
    fontWeight: '800',
    color: t.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  lockText: {
    fontSize: t.type.body,
    color: t.textNear,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
    lineHeight: t.line.relaxed,
  },
  upgradeButton: {
    height: 52,
    paddingHorizontal: 32,
    backgroundColor: t.textPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.shadowMedium,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  upgradeButtonText: {
    fontSize: t.type.body,
    fontWeight: '700',
    color: t.primaryOnSurface,
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
  },
  settingsMenu: {
    flex: 1,
    backgroundColor: t.background,
    paddingHorizontal: 20,
    width: '100%',
  },
  settingsScroll: {
    flex: 1,
  },
  settingsScrollContent: {
    flexGrow: 1,
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.shadowStrong,
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
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
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
    borderColor: t.overlaySubtle,
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
    backgroundColor: t.successTint,
  },
  settingsSummaryPillText: {
    fontSize: t.type.captionSmall,
    fontWeight: '700',
    color: t.successOnDark,
  },
  settingsSummaryCaption: {
    fontSize: t.type.caption,
    color: t.textTertiary,
  },
  settingsSummaryTitle: {
    fontSize: t.type.bodyLarge,
    fontWeight: '700',
    color: t.textPrimary,
    marginBottom: 4,
  },
  settingsSummaryText: {
    fontSize: t.type.bodySmall,
    color: t.textTertiary,
    lineHeight: t.line.compact,
  },
  settingsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: t.overlayStrong,
    marginBottom: 12,
  },
  settingsAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: t.overlayStrong,
    marginBottom: 12,
  },
  settingsAvatarText: {
    fontSize: t.type.headingLarge,
    fontWeight: '700',
    color: t.textPrimary,
  },
  settingsName: {
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
  },
  settingsEmail: {
    fontSize: t.type.bodyCompact,
    color: t.textMuted,
    marginTop: 4,
  },
  providerBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: t.overlaySubtle,
    borderWidth: 1,
    borderColor: t.overlayMedium,
  },
  providerBadgeText: {
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.textPrimary,
  },
  settingsMenuItems: {
    backgroundColor: t.overlayHairline,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.overlayFaint,
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
    borderBottomColor: t.overlayHairline,
  },
  settingsMenuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsMenuItemLabel: {
    flex: 1,
    fontSize: t.type.bodyLarge,
    color: t.textPrimary,
  },
  settingsMenuItemDanger: {
    color: t.danger,
  },
});
