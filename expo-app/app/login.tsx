import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    title: 'Psychological\nProfile',
    subtitle: 'Discover the psychology behind every financial decision you make.',
    icon: 'brain',
  },
  {
    title: 'Meet Faith',
    subtitle: 'Your AI companion that adapts to your personality and helps you make better money decisions.',
    icon: 'chat',
  },
  {
    title: 'Feels Like\nPricing',
    subtitle: 'See what purchases really cost you – personalised to your psychology and finances.',
    icon: 'price',
  },
  {
    title: 'sign-in',
    subtitle: '',
    icon: '',
  },
];

function SlideIcon({ type }: { type: string }) {
  if (type === 'brain') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={30} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} fill="none" />
          <Path
            d="M40 20C40 20 25 32 25 44C25 52 31.5 58 40 58C48.5 58 55 52 55 44C55 32 40 20 40 20Z"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
          />
          <Circle cx={40} cy={38} r={5} fill="white" opacity={0.9} />
        </Svg>
      </View>
    );
  }
  if (type === 'chat') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Rect x={12} y={18} width={56} height={44} rx={12} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} fill="rgba(255,255,255,0.05)" />
          <Circle cx={30} cy={38} r={3} fill="rgba(255,255,255,0.5)" />
          <Circle cx={42} cy={38} r={3} fill="rgba(255,255,255,0.5)" />
          <Circle cx={54} cy={38} r={3} fill="rgba(255,255,255,0.5)" />
        </Svg>
      </View>
    );
  }
  if (type === 'price') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={28} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} fill="none" />
          <SvgText x={40} y={36} textAnchor="middle" fill="white" fontSize={10} fontWeight="600" opacity={0.4}>£180</SvgText>
          <Line x1={24} y1={42} x2={56} y2={42} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
          <SvgText x={40} y={56} textAnchor="middle" fill="white" fontSize={18} fontWeight="700">£310</SvgText>
        </Svg>
      </View>
    );
  }
  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  const goToSlide = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(3);
    }
  };

  const handleSignIn = () => {
    goToSlide(3);
  };

  const handleSocialAuth = () => {
    if (termsAccepted) {
      router.push('/info');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, idx) => (
          <View key={idx} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {idx < 3 ? (
              <View style={[styles.slideContent, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 24 }]}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

                <View style={styles.iconContainer}>
                  <SlideIcon type={slide.icon} />
                </View>

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                    <Text style={styles.primaryButtonText}>
                      {idx < 2 ? 'Next' : 'Get Started'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
                    <Text style={styles.secondaryButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.slideContent, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 24 }]}>
                <Text style={styles.slideTitle}>Welcome to Fincore</Text>
                <Text style={styles.slideSubtitle}>Sign in to get started</Text>

                <View style={styles.authCard}>
                  <BlurView intensity={20} tint="dark" style={styles.authCardBlur}>
                    <TouchableOpacity
                      style={[styles.authButton, !termsAccepted && styles.authButtonDisabled]}
                      onPress={handleSocialAuth}
                      disabled={!termsAccepted}
                    >
                      <View style={styles.authIconContainer}>
                        <Svg width={20} height={20} viewBox="0 0 20 20">
                          <Path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 2.9-4.3 2.9-7.1z" fill="#4285F4" />
                          <Path d="M10 20c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H1.1v2.6C2.7 17.8 6.1 20 10 20z" fill="#34A853" />
                          <Path d="M4.4 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.4H1.1C.4 6.8 0 8.4 0 10s.4 3.2 1.1 4.6L4.4 12z" fill="#FBBC05" />
                          <Path d="M10 4c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 .9 12.7 0 10 0 6.1 0 2.7 2.2 1.1 5.4L4.4 8c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335" />
                        </Svg>
                      </View>
                      <Text style={[styles.authButtonText, !termsAccepted && styles.authButtonTextDisabled]}>
                        Continue with Google
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.authButton, !termsAccepted && styles.authButtonDisabled]}
                      onPress={handleSocialAuth}
                      disabled={!termsAccepted}
                    >
                      <View style={styles.authIconContainer}>
                        <Svg width={20} height={20} viewBox="0 0 20 20">
                          <Rect width={9} height={9} fill="#F25022" />
                          <Rect x={10.5} width={9} height={9} fill="#7FBA00" />
                          <Rect y={10.5} width={9} height={9} fill="#00A4EF" />
                          <Rect x={10.5} y={10.5} width={9} height={9} fill="#FFB900" />
                        </Svg>
                      </View>
                      <Text style={[styles.authButtonText, !termsAccepted && styles.authButtonTextDisabled]}>
                        Continue with Microsoft
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.authButton, !termsAccepted && styles.authButtonDisabled]}
                      onPress={handleSocialAuth}
                      disabled={!termsAccepted}
                    >
                      <View style={styles.authIconContainer}>
                        <Svg width={20} height={20} viewBox="0 0 20 20">
                          <Path
                            d="M17.05 13.78c-.32.7-.47 1.01-.88 1.63-.57.87-1.37 1.95-2.37 1.96-.88.01-1.11-.58-2.31-.57-1.19.01-1.44.58-2.33.57-1-.01-1.76-1-2.33-1.86-1.6-2.43-1.77-5.28-.78-6.8.7-1.08 1.81-1.71 2.84-1.71 1.06 0 1.72.58 2.6.58.85 0 1.37-.58 2.6-.58.92 0 1.9.5 2.6 1.36-2.29 1.26-1.92 4.53.36 5.42zM12.98 5.15c.44-.57.78-1.37.66-2.19-.72.05-1.57.51-2.06 1.11-.44.54-.81 1.35-.67 2.14.79.02 1.61-.44 2.07-1.06z"
                            fill="#000"
                          />
                        </Svg>
                      </View>
                      <Text style={[styles.authButtonText, !termsAccepted && styles.authButtonTextDisabled]}>
                        Continue with Apple
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.termsRow}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                      <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                        {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.securityBadge}>
                      <Text style={styles.securityText}>🔒 Two-factor verification required</Text>
                    </View>
                  </BlurView>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
    marginBottom: 28,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    gap: 10,
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F80ED',
  },
  secondaryButton: {
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  authCard: {
    flex: 1,
    marginTop: 20,
  },
  authCardBlur: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  authButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  authIconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  authButtonTextDisabled: {
    color: '#666',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  securityBadge: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
