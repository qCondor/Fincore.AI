import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { HistoryDrawer } from '../../components/HistoryDrawer';
import { useProfile } from '../../hooks/useProfile';
import { useScan } from '../../hooks/useScan';
import { useUser } from '../../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import {
  MenuIcon,
  FlashIcon,
  CameraIcon,
  BackArrowIcon,
  LockIcon,
} from '../../components/icons';
import { WaveBackground } from '../../components/WaveBackground';
import { BottomInputBar } from '../../components/BottomInputBar';
import { MaskedAmount } from '../../components/MaskedText';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useUser();
  const { initials, profile } = useProfile({ userId: userId ?? undefined });
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [inputText, setInputText] = useState('');
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isFromHistory, setIsFromHistory] = useState(false);

  const scan = useScan({ userId: userId ?? undefined });

  const handleCapture = async () => {
    if (scan.isAnalysing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await scan.captureAndAnalyse();
    if (result) {
      setIsFromHistory(false);
      setShowResult(true);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const analysisResult = await scan.analyseFromUri(result.assets[0].uri);
        if (analysisResult) {
          setIsFromHistory(false);
          setShowResult(true);
        }
      }
    } catch (e) {
      // Silently handle upload errors
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
        <WaveBackground prefix="scan" />

        {/* Header */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBarRow}>
            <TouchableOpacity style={styles.menuButton} onPress={handleBackFromResult}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Feels Like</Text>
            <TouchableOpacity style={styles.avatarButton} onPress={() => router.push({ pathname: '/profile', params: { openSettings: 'true' } })}>
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
                <MaskedAmount amount={scan.analysisResult.estimated_price} style={styles.priceValue} />
              ) : isFromHistory ? (
                <Text style={styles.priceLoading}>N/A</Text>
              ) : (
                <Text style={styles.priceLoading}>Researching...</Text>
              )}
            </View>
            <View style={styles.feelsLikeCard}>
              <Text style={styles.feelsLikeLabel}>Feels Like</Text>
              <View style={styles.feelsLikeLocked}>
                <LockIcon />
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
      <WaveBackground prefix="scan" />

      {/* TopBar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarRow}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setHistoryDrawerOpen(true)}>
            <MenuIcon />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Feels Like</Text>
          <TouchableOpacity style={styles.avatarButton} onPress={() => router.push({ pathname: '/profile', params: { openSettings: 'true' } })}>
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

      <BottomInputBar
        activeScreen="scan"
        placeholder="Enter Manually"
        value={inputText}
        onChangeText={setInputText}
        onSend={async () => {
          if (inputText.trim() && !scan.isAnalysing) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const result = await scan.analyseFromText(inputText.trim());
            if (result) {
              setInputText('');
              setIsFromHistory(false);
              setShowResult(true);
            }
          }
        }}
        onMicPress={handleUpload}
        onNavigate={(screen) => {
          if (screen === 'profile') router.push('/profile');
          else if (screen === 'faith') router.push('/faith');
        }}
        onComingSoon={(feature) => setComingSoonModal({ open: true, feature })}
        bottomInset={insets.bottom}
        disabled={scan.isAnalysing}
      />

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
