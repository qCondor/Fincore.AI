import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { useProfile } from '../../hooks/useProfile';
import { useUser } from '../../contexts/UserContext';

function WaveBackground() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const wave1Anim = React.useRef(new Animated.Value(0)).current;
  const wave2Anim = React.useRef(new Animated.Value(0)).current;
  const wave3Anim = React.useRef(new Animated.Value(0)).current;
  const wave4Anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createWaveAnimation = (anim: Animated.Value, duration: number, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    };

    createWaveAnimation(wave1Anim, 6000, 0);
    createWaveAnimation(wave2Anim, 7000, 500);
    createWaveAnimation(wave3Anim, 8000, 1000);
    createWaveAnimation(wave4Anim, 5000, 1500);
  }, []);

  const wave1Style = {
    transform: [
      { translateY: wave1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
  };

  const wave2Style = {
    transform: [
      { translateY: wave2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
    ],
  };

  const wave3Style = {
    transform: [
      { translateY: wave3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
    ],
  };

  const wave4Style = {
    transform: [
      { translateY: wave4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
    ],
  };

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 393 852"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="base-gradient-profile" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%" stopColor="#3CB8F0" />
            <Stop offset="50%" stopColor="#0A6FE8" />
            <Stop offset="100%" stopColor="#0035A0" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M0,0 L393,0 L393,852 L0,852 Z" fill="url(#base-gradient-profile)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave1Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-profile-1">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave1-anim-profile" x1="0.8" y1="0" x2="0.2" y2="1">
              <Stop offset="0%" stopColor="#A8EAFF" stopOpacity={0.55} />
              <Stop offset="45%" stopColor="#70D8FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5ED4FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-profile-1)">
            <Path d="M393,-50 C410,250 100,350 0,550 C-30,650 50,800 0,902 L393,902 Z" fill="url(#wave1-anim-profile)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave2Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-profile-2">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave2-anim-profile" x1="0.7" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor="#6DDDFF" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#44BBFF" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#1A90FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-profile-2)">
            <Path d="M393,-150 C400,150 50,250 0,420 C-30,530 30,700 0,902 L393,902 Z" fill="url(#wave2-anim-profile)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave3Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-profile-3">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave3-anim-profile" x1="0.6" y1="0" x2="0.4" y2="1">
              <Stop offset="0%" stopColor="#50C8FF" stopOpacity={0.35} />
              <Stop offset="50%" stopColor="#2AA0F0" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#0A6FE8" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-profile-3)">
            <Path d="M393,-250 C390,80 20,170 0,300 C-30,400 10,580 0,902 L393,902 Z" fill="url(#wave3-anim-profile)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave4Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-profile-4">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave4-anim-profile" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#1A5FAA" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#0D4080" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#003070" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-profile-4)">
            <Path d="M393,400 C350,550 200,750 100,820 C50,860 0,840 0,902 L393,902 Z" fill="url(#wave4-anim-profile)" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

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

function HomeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MicIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
      <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BrainIcon({ active }: { active?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth={2}>
      <Path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function MessageNavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function CameraNavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
    </Svg>
  );
}

function LandmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Line x1={3} y1={22} x2={21} y2={22} />
      <Line x1={6} y1={18} x2={6} y2={11} />
      <Line x1={10} y1={18} x2={10} y2={11} />
      <Line x1={14} y1={18} x2={14} y2={11} />
      <Line x1={18} y1={18} x2={18} y2={11} />
      <Path d="M12 2L2 7h20L12 2z" />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Line x1={18} y1={20} x2={18} y2={10} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={6} y1={20} x2={6} y2={14} />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useUser();
  const { initials, profile } = useProfile({ userId: userId ?? undefined });

  const oceanTraits = React.useMemo(
    () => buildOceanTraits(profile?.big_five ?? null),
    [profile?.big_five]
  );
  const [profilePage, setProfilePage] = useState(0);
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [inputFocused, setInputFocused] = useState(false);
  const [inputText, setInputText] = useState('');
  const [navExpanded, setNavExpanded] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const navSlide = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const toggleNav = (show: boolean) => {
    setNavExpanded(show);
    Animated.timing(navSlide, {
      toValue: show ? 0 : -SCREEN_WIDTH,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const askFaithAboutProfile = (question: string) => {
    if (!question.trim()) return;
    router.push({ pathname: '/faith', params: { profileQuestion: question.trim() } });
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Wave background */}
      <WaveBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              {profilePage === 0 ? 'OCEAN Personality Assessment' : 'Blueprint'}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarButton} onPress={() => {}}>
            <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
              <View style={styles.avatarShine} />
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
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
              {/* Spending Patterns */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Spending Patterns</Text>
                <Text style={styles.cardText}>
                  Your personality profile suggests you spend most on social activities and novelty-driven purchases.
                </Text>
              </View>

              {/* Monthly Impact */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Monthly Impact</Text>
                <View style={styles.impactItems}>
                  {[
                    { label: 'Weekly spend (impulse)', amount: '£42.60', pct: 65, color: '#FF9F0A' },
                    { label: 'Monthly total', amount: '£183.20', pct: 78, color: '#FF3B30' },
                    { label: 'Annual projection', amount: '£2,198.40', pct: 45, color: '#005FCC' },
                  ].map((item) => (
                    <View key={item.label} style={styles.impactItem}>
                      <View style={styles.impactRow}>
                        <Text style={styles.impactLabel}>{item.label}</Text>
                        <Text style={styles.impactAmount}>{item.amount}</Text>
                      </View>
                      <View style={styles.impactBarBg}>
                        <View style={[styles.impactBar, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Plan */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your Action Plan</Text>
                <View style={styles.actionItems}>
                  {[
                    { text: 'Set weekly spending caps', sub: 'Limit impulse spending to £25/week', color: '#34C759' },
                    { text: 'Social spending alerts', sub: 'Get notified when social pressure drives purchases', color: '#005FCC' },
                    { text: 'Novelty budget', sub: 'Channel curiosity into a dedicated exploration fund', color: '#FF9F0A' },
                  ].map((item) => (
                    <View key={item.text} style={styles.actionItem}>
                      <View style={[styles.actionIcon, { backgroundColor: `${item.color}20` }]}>
                        <CheckIcon color={item.color} />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>{item.text}</Text>
                        <Text style={styles.actionSub}>{item.sub}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Blur overlay for locked content */}
            <BlurView intensity={60} tint="light" style={styles.lockOverlay}>
              <View style={styles.lockOverlayGradient} />
              <LockIcon size={48} />
              <Text style={styles.lockTitle}>Blueprint</Text>
              <Text style={styles.lockText}>
                See the full context behind your spending patterns and get a personalised action plan
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => setComingSoonModal({ open: true, feature: 'blueprint' })}
              >
                <Text style={styles.upgradeButtonText}>Join Waitlist</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </ScrollView>
      </View>

      {/* Bottom input bar with sliding navbar */}
      <View style={[styles.inputBarContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputBarWrapper}>
          {/* Sliding navbar */}
          <Animated.View
            style={[
              styles.navBar,
              { transform: [{ translateX: navSlide }] },
              navExpanded && styles.navBarVisible
            ]}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false)}>
              <BrainIcon active />
              <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); router.push('/faith'); }}>
              <MessageNavIcon />
              <Text style={styles.navLabel}>Faith</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); router.push('/'); }}>
              <CameraNavIcon />
              <Text style={styles.navLabel}>Feels Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); setComingSoonModal({ open: true, feature: 'banking' }); }}>
              <LandmarkIcon />
              <Text style={styles.navLabel}>Banking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); setComingSoonModal({ open: true, feature: 'analytics' }); }}>
              <BarChartIcon />
              <Text style={styles.navLabel}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navClose} onPress={() => toggleNav(false)}>
              <ChevronRightIcon />
            </TouchableOpacity>
          </Animated.View>

          {/* Input bar row */}
          <Animated.View
            style={[
              styles.inputBarRow,
              navExpanded && styles.inputBarHidden
            ]}
          >
            {!inputFocused && (
              <TouchableOpacity style={styles.homeButton} onPress={() => toggleNav(true)}>
                <HomeIcon />
              </TouchableOpacity>
            )}
            <View style={styles.inputBar}>
              {inputFocused && (
                <TouchableOpacity style={styles.plusButton} onPress={() => setInputFocused(false)}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M12 5v14M5 12h14" />
                  </Svg>
                </TouchableOpacity>
              )}
              {!inputFocused && <View style={{ width: 8 }} />}
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your profile..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onSubmitEditing={() => askFaithAboutProfile(inputText)}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.micButton}>
                <MicIcon />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => askFaithAboutProfile(inputText)}
              >
                <SendIcon />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>

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
    </KeyboardAvoidingView>
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
    paddingHorizontal: 32,
  },
  lockOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  lockText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 260,
  },
  upgradeButton: {
    height: 50,
    paddingHorizontal: 32,
    backgroundColor: '#005FCC',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,95,204,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBarWrapper: {
    height: 50,
    position: 'relative',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navBarVisible: {
    zIndex: 20,
  },
  navItem: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  navClose: {
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -7,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputBarHidden: {
    opacity: 0,
  },
  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flex: 1,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 6,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  micButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#005FCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
