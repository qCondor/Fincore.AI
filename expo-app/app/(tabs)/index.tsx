import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { HistoryDrawer } from '../../components/HistoryDrawer';
import { useProfile } from '../../hooks/useProfile';
import { useScan, type AnalysisResult } from '../../hooks/useScan';
import { useUser } from '../../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';

function MenuIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
      <Line x1={4} y1={7} x2={20} y2={7} />
      <Line x1={4} y1={12} x2={20} y2={12} />
      <Line x1={4} y1={17} x2={20} y2={17} />
    </Svg>
  );
}

function FlashIcon({ on }: { on: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={on ? '#FFD60A' : '#fff'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={on ? '#FFD60A' : 'none'}
      />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
        stroke="#005FCC"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
        stroke="#005FCC"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BrainIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function MessageIcon({ active }: { active?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function CameraNavIcon({ active }: { active?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth={2}>
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

function WaveBackground() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;
  const wave4Anim = useRef(new Animated.Value(0)).current;

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
          <SvgLinearGradient id="base-gradient-scan" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%" stopColor="#3CB8F0" />
            <Stop offset="50%" stopColor="#0A6FE8" />
            <Stop offset="100%" stopColor="#0035A0" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M0,0 L393,0 L393,852 L0,852 Z" fill="url(#base-gradient-scan)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave1Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-scan-1">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave1-anim-scan" x1="0.8" y1="0" x2="0.2" y2="1">
              <Stop offset="0%" stopColor="#A8EAFF" stopOpacity={0.55} />
              <Stop offset="45%" stopColor="#70D8FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5ED4FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-scan-1)">
            <Path d="M393,-50 C410,250 100,350 0,550 C-30,650 50,800 0,902 L393,902 Z" fill="url(#wave1-anim-scan)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave2Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-scan-2">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave2-anim-scan" x1="0.7" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor="#6DDDFF" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#44BBFF" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#1A90FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-scan-2)">
            <Path d="M393,-150 C400,150 50,250 0,420 C-30,530 30,700 0,902 L393,902 Z" fill="url(#wave2-anim-scan)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave3Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-scan-3">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave3-anim-scan" x1="0.6" y1="0" x2="0.4" y2="1">
              <Stop offset="0%" stopColor="#50C8FF" stopOpacity={0.35} />
              <Stop offset="50%" stopColor="#2AA0F0" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#0A6FE8" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-scan-3)">
            <Path d="M393,-250 C390,80 20,170 0,300 C-30,400 10,580 0,902 L393,902 Z" fill="url(#wave3-anim-scan)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave4Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-scan-4">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave4-anim-scan" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#1A5FAA" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#0D4080" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#003070" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-scan-4)">
            <Path d="M393,400 C350,550 200,750 100,820 C50,860 0,840 0,902 L393,902 Z" fill="url(#wave4-anim-scan)" />
          </G>
        </Svg>
      </Animated.View>
    </View>
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useUser();
  const { initials } = useProfile({ userId: userId ?? undefined });
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputText, setInputText] = useState('');
  const [navExpanded, setNavExpanded] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const navSlide = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const scan = useScan({ userId: userId ?? undefined });

  const toggleNav = (show: boolean) => {
    setNavExpanded(show);
    Animated.timing(navSlide, {
      toValue: show ? 0 : -SCREEN_WIDTH,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleCapture = async () => {
    console.log('[ScanScreen] handleCapture called, isAnalysing:', scan.isAnalysing);
    if (scan.isAnalysing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[ScanScreen] Calling captureAndAnalyse...');
    const result = await scan.captureAndAnalyse();
    console.log('[ScanScreen] Result:', result ? 'success' : 'null');
    if (result) {
      setIsFromHistory(false);
      setShowResult(true);
    }
  };

  const handleUpload = async () => {
    console.log('[ScanScreen] handleUpload called');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      console.log('[ScanScreen] ImagePicker result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        console.log('[ScanScreen] Analysing image...');
        const analysisResult = await scan.analyseFromUri(result.assets[0].uri);
        console.log('[ScanScreen] Analysis result:', analysisResult ? 'success' : 'null');
        if (analysisResult) {
          setIsFromHistory(false);
          setShowResult(true);
        }
      }
    } catch (e) {
      console.log('[ScanScreen] Upload error:', e);
    }
  };

  const handleBackFromResult = () => {
    scan.clearResult();
    setShowResult(false);
  };

  const handleSelectScan = (historyScan: any) => {
    // Load the scan from history into the result view
    const analysisResult = {
      product_identified: historyScan.product_identified || historyScan.product_name || 'Unknown product',
      product_name: historyScan.product_name,
      product_category: historyScan.product_category || historyScan.category,
      overall_score: historyScan.overall_score || 0,
      grade: historyScan.grade || 'N/A',
      verdict: historyScan.verdict || '',
      color: historyScan.color || 'amber',
      breakdown: historyScan.breakdown || { value_for_money: 50, necessity: 50, budget_impact: 50 },
      recommendations: historyScan.recommendations || [],
      financial_insight: historyScan.financial_insight || '',
      alternatives: historyScan.alternatives || [],
      scan_id: historyScan.scan_id,
      estimated_price: historyScan.estimated_price || historyScan.price,
      image_url: historyScan.image_url,
    };
    scan.loadFromHistory(analysisResult);
    setIsFromHistory(true);
    setShowResult(true);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#56CCF2', '#2F80ED', '#005FCC']} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#56CCF2', '#2F80ED', '#005FCC']} style={StyleSheet.absoluteFill} />
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Camera access is needed to scan products</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show scan result screen
  if (showResult && scan.analysisResult) {
    return (
      <View style={styles.container}>
        <WaveBackground />

        {/* Header */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBarRow}>
            <TouchableOpacity style={styles.menuButton} onPress={handleBackFromResult}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Feels Like</Text>
            <TouchableOpacity style={styles.avatarButton}>
              <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
                <View style={styles.avatarShine} />
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
          {/* Product card */}
          <View style={styles.productCard}>
            <View style={isFromHistory ? styles.productCardInnerNoImage : styles.productCardInner}>
              {!isFromHistory && (
                <View style={styles.productImageContainer}>
                  {scan.previewUri ? (
                    <Image source={{ uri: scan.previewUri }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <CameraIcon />
                    </View>
                  )}
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{scan.analysisResult.product_identified}</Text>
                <Text style={styles.productMeta}>
                  Score {scan.analysisResult.overall_score}/100 · Grade {scan.analysisResult.grade}
                </Text>
              </View>
            </View>
          </View>

          {/* Verdict banner */}
          <View style={[
            styles.verdictBanner,
            scan.analysisResult.color === 'green' && styles.verdictGreen,
            scan.analysisResult.color === 'red' && styles.verdictRed,
            scan.analysisResult.color === 'amber' && styles.verdictAmber,
          ]}>
            <Text style={[
              styles.verdictText,
              scan.analysisResult.color === 'green' && styles.verdictTextGreen,
              scan.analysisResult.color === 'red' && styles.verdictTextRed,
              scan.analysisResult.color === 'amber' && styles.verdictTextAmber,
            ]}>
              {scan.analysisResult.verdict}
            </Text>
          </View>

          {/* Price section */}
          <View style={styles.priceRow}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Actual Price</Text>
              {scan.analysisResult.estimated_price ? (
                <Text style={styles.priceValue}>£{scan.analysisResult.estimated_price.toFixed(2)}</Text>
              ) : isFromHistory ? (
                <Text style={styles.priceLoading}>N/A</Text>
              ) : (
                <Text style={styles.priceLoading}>Researching...</Text>
              )}
            </View>
            <View style={styles.feelsLikeCard}>
              <Text style={styles.feelsLikeLabel}>Feels Like</Text>
              <View style={styles.feelsLikeLocked}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="#005FCC">
                  <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                  <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#005FCC" strokeWidth={2} fill="none" />
                </Svg>
                <Text style={styles.feelsLikeLockedTitle}>Coming Soon</Text>
                <Text style={styles.feelsLikeLockedDesc}>See the psychological cost</Text>
                <TouchableOpacity
                  style={styles.feelsLikeButton}
                  onPress={() => setComingSoonModal({ open: true, feature: 'blueprint' })}
                >
                  <Text style={styles.feelsLikeButtonText}>Join Waitlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Reasoning section */}
          <Text style={styles.reasoningTitle}>Reasoning</Text>

          {/* Financial insight card */}
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Financial Insight</Text>
            <Text style={styles.insightText}>{scan.analysisResult.financial_insight}</Text>
          </View>

          {/* Recommendations */}
          {scan.analysisResult.recommendations.length > 0 && (
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Recommendations</Text>
              {scan.analysisResult.recommendations.map((rec, i) => (
                <View key={i} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>•</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Alternatives */}
          {scan.analysisResult.alternatives.length > 0 && (
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Alternatives</Text>
              {scan.analysisResult.alternatives.map((alt, i) => (
                <View key={i} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>•</Text>
                  <Text style={styles.recommendationText}>{alt}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Chat with Faith button */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              const scanContext = {
                scan_id: scan.analysisResult?.scan_id,
                product_name: scan.analysisResult?.product_name || scan.analysisResult?.product_identified,
                overall_score: scan.analysisResult?.overall_score,
                estimated_price: scan.analysisResult?.estimated_price,
                verdict: scan.analysisResult?.verdict,
                category: scan.analysisResult?.product_category,
              };
              handleBackFromResult();
              router.push({
                pathname: '/faith',
                params: { scanContext: JSON.stringify(scanContext) },
              });
            }}
          >
            <Text style={styles.chatButtonText}>Discuss with Faith</Text>
          </TouchableOpacity>
        </ScrollView>

        <ComingSoonModal
          visible={comingSoonModal.open}
          onClose={() => setComingSoonModal({ open: false, feature: null })}
          feature="Blueprint"
          featureKey="blueprint"
          description="See the full context behind your spending patterns and get a personalised action plan."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Wave background */}
      <WaveBackground />

      {/* TopBar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarRow}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setHistoryDrawerOpen(true)}>
            <MenuIcon />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Feels Like</Text>
          <TouchableOpacity style={styles.avatarButton}>
            <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
              <View style={styles.avatarShine} />
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Scan viewfinder */}
        <View style={styles.viewfinder}>
          {/* Camera area inside */}
          <View style={styles.cameraArea}>
            <CameraView
              ref={scan.cameraRef}
              style={styles.camera}
              facing="back"
              active={true}
            />
          </View>

          {/* Center crosshair */}
          <View style={styles.crosshairContainer}>
            <View style={styles.crosshair} />
          </View>

          {/* Corner brackets */}
          <Svg style={styles.cornerSvg} viewBox="0 0 300 320" fill="none">
            <Path d="M10,60 L10,28 Q10,10 28,10 L60,10" stroke="white" strokeWidth={4} strokeLinecap="round" />
            <Path d="M240,10 L272,10 Q290,10 290,28 L290,60" stroke="white" strokeWidth={4} strokeLinecap="round" />
            <Path d="M10,260 L10,292 Q10,310 28,310 L60,310" stroke="white" strokeWidth={4} strokeLinecap="round" />
            <Path d="M240,310 L272,310 Q290,310 290,292 L290,260" stroke="white" strokeWidth={4} strokeLinecap="round" />
          </Svg>

          {/* Torch toggle */}
          <TouchableOpacity
            style={[styles.torchButton, flashOn && styles.torchButtonActive]}
            onPress={() => setFlashOn(!flashOn)}
          >
            <FlashIcon on={flashOn} />
          </TouchableOpacity>
        </View>

        {/* Capture button and instructions */}
        <View style={styles.captureSection}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={scan.isAnalysing}
            activeOpacity={0.95}
          >
            <View style={styles.captureButtonInner} />
            {scan.isAnalysing ? (
              <View style={styles.captureSpinner} />
            ) : (
              <CameraIcon />
            )}
          </TouchableOpacity>
          <View style={styles.captureTextRow}>
            <Text style={styles.tapToScan}>Tap to scan</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <TouchableOpacity onPress={handleUpload}>
              <Text style={styles.uploadLink}>upload photo</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); router.push('/profile'); }}>
              <BrainIcon />
              <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { toggleNav(false); router.push('/faith'); }}>
              <MessageIcon />
              <Text style={styles.navLabel}>Faith</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false)}>
              <CameraNavIcon active />
              <Text style={[styles.navLabel, styles.navLabelActive]}>Feels Like</Text>
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
            {/* Home button — hides when focused */}
            {!inputFocused && (
              <TouchableOpacity style={styles.homeButton} onPress={() => toggleNav(true)}>
                <HomeIcon />
              </TouchableOpacity>
            )}

            {/* Input bar */}
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
                placeholder="Enter Manually"
                placeholderTextColor="rgba(255,255,255,0.5)"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <TouchableOpacity style={styles.micButton} onPress={handleUpload}>
                <MicIcon />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton}>
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
        featureKey={comingSoonModal.feature || 'banking'}
        description={
          comingSoonModal.feature === 'banking'
            ? 'Connect your bank accounts and see all your transactions in one place, categorised by your spending personality.'
            : comingSoonModal.feature === 'analytics'
            ? 'Deep insights into your spending patterns, with personalised recommendations based on your OCEAN profile.'
            : 'See the full context behind your spending patterns and get a personalised action plan.'
        }
      />

      <HistoryDrawer
        visible={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        onSelectSession={() => {}}
        onSelectScan={handleSelectScan}
        onNewChat={() => setHistoryDrawerOpen(false)}
        source="scan"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005FCC',
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: '#005FCC',
    fontSize: 15,
    fontWeight: '600',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  viewfinder: {
    width: 300,
    height: 320,
    marginBottom: 32,
    position: 'relative',
  },
  cameraArea: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  cornerSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  torchButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchButtonActive: {
    backgroundColor: 'rgba(255,214,10,0.3)',
  },
  captureSection: {
    alignItems: 'center',
    gap: 16,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,95,204,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  captureButtonInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderRadius: 28,
    backgroundColor: 'rgba(0,95,204,0.1)',
  },
  captureSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(0,95,204,0.3)',
    borderTopColor: '#005FCC',
  },
  captureTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tapToScan: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  dotSeparator: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
  uploadLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
  inputBarContainer: {
    paddingHorizontal: 20,
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
  // Scan result styles
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  productCardInner: {
    flexDirection: 'row',
    gap: 16,
  },
  productCardInnerNoImage: {
    flexDirection: 'column',
  },
  productImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  productMeta: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 4,
  },
  verdictBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  verdictGreen: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  verdictRed: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  verdictAmber: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  verdictTextGreen: {
    color: '#166534',
  },
  verdictTextRed: {
    color: '#991B1B',
  },
  verdictTextAmber: {
    color: '#92400E',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#AEAEB2',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 8,
  },
  priceLoading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E6E73',
    marginTop: 16,
  },
  feelsLikeCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  feelsLikeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  feelsLikeLocked: {
    alignItems: 'center',
    marginTop: 8,
  },
  feelsLikeLockedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 8,
  },
  feelsLikeLockedDesc: {
    fontSize: 10,
    color: '#6E6E73',
    textAlign: 'center',
    marginTop: 4,
  },
  feelsLikeButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#005FCC',
    borderRadius: 20,
  },
  feelsLikeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  reasoningTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 20,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    fontSize: 14,
    color: '#005FCC',
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
  chatButton: {
    marginTop: 8,
    height: 50,
    backgroundColor: '#005FCC',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,95,204,0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
