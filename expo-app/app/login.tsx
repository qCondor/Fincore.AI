import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText, Line } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { useUser } from '../contexts/UserContext';
import { GOOGLE_CLIENT_ID, GOOGLE_IOS_URL_SCHEME, GOOGLE_REDIRECT_URI, MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID } from '../config';
import { useTheme, type Theme } from '../contexts/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const microsoftDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
};

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  if (type === 'brain') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={30} stroke={t.overlayMedium} strokeWidth={1.5} fill="none" />
          <Path
            d="M40 20C40 20 25 32 25 44C25 52 31.5 58 40 58C48.5 58 55 52 55 44C55 32 40 20 40 20Z"
            fill={t.overlayFaint}
            stroke={t.overlayStrong}
            strokeWidth={1.5}
          />
          <Circle cx={40} cy={38} r={5} fill={t.textPrimary} opacity={0.9} />
        </Svg>
      </View>
    );
  }
  if (type === 'chat') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Rect x={12} y={18} width={56} height={44} rx={12} stroke={t.overlayMedium} strokeWidth={1.5} fill={t.overlayHairline} />
          <Circle cx={30} cy={38} r={3} fill={t.textFaint} />
          <Circle cx={42} cy={38} r={3} fill={t.textFaint} />
          <Circle cx={54} cy={38} r={3} fill={t.textFaint} />
        </Svg>
      </View>
    );
  }
  if (type === 'price') {
    return (
      <View style={styles.iconCircle}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={28} stroke={t.overlayMedium} strokeWidth={1.5} fill="none" />
          <SvgText x={40} y={36} textAnchor="middle" fill={t.textPrimary} fontSize={10} fontWeight="600" opacity={0.4}>£180</SvgText>
          <Line x1={24} y1={42} x2={56} y2={42} stroke={t.overlayMedium} strokeWidth={1} />
          <SvgText x={40} y={56} textAnchor="middle" fill={t.textPrimary} fontSize={18} fontWeight="700">£310</SvgText>
        </Svg>
      </View>
    );
  }
  return null;
}

export default function LoginScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUserName, setAuthProvider, setUserEmail, authenticateWithProvider, authenticateAsDevUser } = useUser();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'fincore',
  });

  // Google's iOS client only accepts the reversed-client-ID scheme, so it gets
  // its own redirect. `native` is used in dev-client/standalone builds so the
  // URI is stable (no Metro host appended) and matches what the token
  // exchange sends below.
  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: GOOGLE_IOS_URL_SCHEME,
    path: 'oauthredirect',
    native: GOOGLE_REDIRECT_URI,
  });

  // TEMP: disabled for local testing, re-enable before TestFlight — see 2026-09-10
  /*
  const [msRequest, msResponse, msPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MICROSOFT_CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri,
    },
    microsoftDiscovery
  );

  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: googleRedirectUri,
    },
    googleDiscovery
  );
  */

  const handleAuthSuccess = async (
    provider: 'google' | 'apple' | 'microsoft',
    identityToken: string | null,
    name?: string,
    email?: string,
    authorizationCode?: string | null
  ) => {
    const authenticated = await authenticateWithProvider(provider, identityToken, authorizationCode);
    if (!authenticated) {
      setIsLoading(null);
      Alert.alert('Authentication Failed', 'Could not verify your sign-in. Please try again.');
      return;
    }
    await setAuthProvider(provider);
    if (name) await setUserName(name);
    if (email) await setUserEmail(email);
    setIsLoading(null);
    router.replace('/info');
  };

  // TEMP: disabled for local testing, re-enable before TestFlight — see 2026-09-10
  /*
  const handleGoogleAuth = async () => {
    if (!termsAccepted || !googleRequest) return;
    setIsLoading('google');

    try {
      const result = await googlePromptAsync();

      if (result.type === 'success' && result.params?.code) {
        // Exchange code for token
        const tokenResponse = await fetch(googleDiscovery.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirect_uri: googleRedirectUri,
            grant_type: 'authorization_code',
            code_verifier: googleRequest.codeVerifier || '',
          }).toString(),
        });

        const tokens = await tokenResponse.json();

        if (tokens.access_token) {
          // Fetch user profile from Google
          const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profile = await profileResponse.json();

          await handleAuthSuccess(
            'google',
            tokens.id_token ?? null,
            profile.name,
            profile.email
          );
          return;
        }
      }

      setIsLoading(null);
      if (result.type !== 'cancel') {
        Alert.alert('Authentication Failed', 'Could not sign in with Google. Please try again.');
      }
    } catch (e) {
      setIsLoading(null);
      Alert.alert('Authentication Failed', 'Could not sign in with Google. Please try again.');
    }
  };

  const handleMicrosoftAuth = async () => {
    if (!termsAccepted || !msRequest) return;
    setIsLoading('microsoft');

    try {
      const result = await msPromptAsync();

      if (result.type === 'success' && result.params?.code) {
        // Exchange code for token
        const tokenResponse = await fetch(microsoftDiscovery.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            code: result.params.code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: msRequest.codeVerifier || '',
          }).toString(),
        });

        const tokens = await tokenResponse.json();

        if (tokens.access_token) {
          // Fetch user profile from Microsoft Graph
          const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profile = await profileResponse.json();

          await handleAuthSuccess(
            'microsoft',
            tokens.id_token ?? null,
            profile.displayName || profile.givenName,
            profile.mail || profile.userPrincipalName
          );
          return;
        }
      }

      setIsLoading(null);
      if (result.type !== 'cancel') {
        Alert.alert('Authentication Failed', 'Could not sign in with Microsoft. Please try again.');
      }
    } catch (e) {
      setIsLoading(null);
      Alert.alert('Authentication Failed', 'Could not sign in with Microsoft. Please try again.');
    }
  };

  const handleAppleAuth = async () => {
    if (!termsAccepted) return;
    setIsLoading('apple');

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      await handleAuthSuccess(
        'apple',
        credential.identityToken,
        fullName || undefined,
        credential.email || undefined,
        credential.authorizationCode
      );
    } catch (e: any) {
      setIsLoading(null);
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Authentication Failed', 'Could not sign in with Apple. Please try again.');
      }
    }
  };

  */

  // TEMP: dev-only bypass. Only rendered when __DEV__ is true (never in a
  // release/TestFlight build). Mints a real server-signed session via the
  // backend's ENVIRONMENT=development-gated /auth/dev endpoint.
  const handleDevSkip = async () => {
    if (!__DEV__ || !termsAccepted) return;
    setIsLoading('dev');
    const ok = await authenticateAsDevUser();
    if (!ok) {
      setIsLoading(null);
      Alert.alert(
        'Dev sign-in failed',
        'Backend rejected /auth/dev. Is the server running with ENVIRONMENT=development?'
      );
      return;
    }
    await setUserName('Dev Tester');
    await setUserEmail('dev@fincore.local');
    setIsLoading(null);
    router.replace('/info');
  };

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={t.gradients.main}
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
                  <BlurView intensity={20} tint={t.blurTint} style={styles.authCardBlur}>
                    {/* TEMP: disabled for local testing, re-enable before TestFlight — see 2026-09-10
                        Google / Microsoft / Apple sign-in buttons are commented out below.
                        Remove the __DEV__ "Skip Sign-In" block when re-enabling. */}
                    {__DEV__ && (
                      <TouchableOpacity
                        style={[styles.authButton, styles.devSkipButton, (!termsAccepted || isLoading) && styles.authButtonDisabled]}
                        onPress={handleDevSkip}
                        disabled={!termsAccepted || !!isLoading}
                      >
                        <View style={styles.authIconContainer}>
                          {isLoading === 'dev' ? (
                            <ActivityIndicator size="small" color={t.textOnSurface} />
                          ) : (
                            <Text style={styles.devSkipIcon}>⚙</Text>
                          )}
                        </View>
                        <Text style={[styles.authButtonText, (!termsAccepted || isLoading) && styles.authButtonTextDisabled]}>
                          Skip Sign-In (dev only)
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* TEMP: disabled for local testing, re-enable before TestFlight — see 2026-09-10
                    <TouchableOpacity
                      style={[styles.authButton, (!termsAccepted || isLoading) && styles.authButtonDisabled]}
                      onPress={handleGoogleAuth}
                      disabled={!termsAccepted || !!isLoading}
                    >
                      <View style={styles.authIconContainer}>
                        {isLoading === 'google' ? (
                          <ActivityIndicator size="small" color="#4285F4" />
                        ) : (
                          <Svg width={20} height={20} viewBox="0 0 20 20">
                            <Path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 2.9-4.3 2.9-7.1z" fill="#4285F4" />
                            <Path d="M10 20c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H1.1v2.6C2.7 17.8 6.1 20 10 20z" fill="#34A853" />
                            <Path d="M4.4 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.4H1.1C.4 6.8 0 8.4 0 10s.4 3.2 1.1 4.6L4.4 12z" fill="#FBBC05" />
                            <Path d="M10 4c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 .9 12.7 0 10 0 6.1 0 2.7 2.2 1.1 5.4L4.4 8c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335" />
                          </Svg>
                        )}
                      </View>
                      <Text style={[styles.authButtonText, (!termsAccepted || isLoading) && styles.authButtonTextDisabled]}>
                        Continue with Google
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.authButton, (!termsAccepted || isLoading) && styles.authButtonDisabled]}
                      onPress={handleMicrosoftAuth}
                      disabled={!termsAccepted || !!isLoading}
                    >
                      <View style={styles.authIconContainer}>
                        {isLoading === 'microsoft' ? (
                          <ActivityIndicator size="small" color="#00A4EF" />
                        ) : (
                          <Svg width={20} height={20} viewBox="0 0 20 20">
                            <Rect width={9} height={9} fill="#F25022" />
                            <Rect x={10.5} width={9} height={9} fill="#7FBA00" />
                            <Rect y={10.5} width={9} height={9} fill="#00A4EF" />
                            <Rect x={10.5} y={10.5} width={9} height={9} fill="#FFB900" />
                          </Svg>
                        )}
                      </View>
                      <Text style={[styles.authButtonText, (!termsAccepted || isLoading) && styles.authButtonTextDisabled]}>
                        Continue with Microsoft
                      </Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={[styles.authButton, (!termsAccepted || isLoading) && styles.authButtonDisabled]}
                        onPress={handleAppleAuth}
                        disabled={!termsAccepted || !!isLoading}
                      >
                        <View style={styles.authIconContainer}>
                          {isLoading === 'apple' ? (
                            <ActivityIndicator size="small" color="#000" />
                          ) : (
                            <Svg width={20} height={20} viewBox="0 0 20 20">
                              <Path
                                d="M17.05 13.78c-.32.7-.47 1.01-.88 1.63-.57.87-1.37 1.95-2.37 1.96-.88.01-1.11-.58-2.31-.57-1.19.01-1.44.58-2.33.57-1-.01-1.76-1-2.33-1.86-1.6-2.43-1.77-5.28-.78-6.8.7-1.08 1.81-1.71 2.84-1.71 1.06 0 1.72.58 2.6.58.85 0 1.37-.58 2.6-.58.92 0 1.9.5 2.6 1.36-2.29 1.26-1.92 4.53.36 5.42zM12.98 5.15c.44-.57.78-1.37.66-2.19-.72.05-1.57.51-2.06 1.11-.44.54-.81 1.35-.67 2.14.79.02 1.61-.44 2.07-1.06z"
                                fill="#000"
                              />
                            </Svg>
                          )}
                        </View>
                        <Text style={[styles.authButtonText, (!termsAccepted || isLoading) && styles.authButtonTextDisabled]}>
                          Continue with Apple
                        </Text>
                      </TouchableOpacity>
                    )}
                    */}

                    <View style={styles.termsRow}>
                      <TouchableOpacity
                        onPress={() => setTermsAccepted(!termsAccepted)}
                        style={styles.checkboxTouchable}
                      >
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                          {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text
                          style={styles.termsLink}
                          onPress={() => WebBrowser.openBrowserAsync('https://fincore.one/terms')}
                        >
                          Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text
                          style={styles.termsLink}
                          onPress={() => WebBrowser.openBrowserAsync('https://fincore.one/privacy')}
                        >
                          Privacy Policy
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.securityBadge}>
                      <Text style={styles.securityText}>🔒 Secure sign-in with encryption</Text>
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

const makeStyles = (t: Theme) => StyleSheet.create({
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
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
    lineHeight: t.line.headline,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: t.type.subtitle,
    color: t.textMuted,
    lineHeight: t.line.loose,
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
    backgroundColor: t.overlayFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    gap: 10,
  },
  primaryButton: {
    height: 50,
    backgroundColor: t.textPrimary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.secondary,
  },
  secondaryButton: {
    height: 50,
    backgroundColor: t.overlaySubtle,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.textPrimary,
  },
  authCard: {
    flex: 1,
    marginTop: 20,
  },
  authCardBlur: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: t.overlayFaint,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: t.surfaceRaised,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: t.textNear,
  },
  // TEMP: dev-only "Skip Sign-In" styling — remove with the __DEV__ block above.
  devSkipButton: {
    borderStyle: 'dashed',
  },
  devSkipIcon: {
    fontSize: 16,
    color: t.textOnSurface,
  },
  authButtonDisabled: {
    backgroundColor: t.textGhost,
    borderColor: t.textFaint,
  },
  authIconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authButtonText: {
    fontSize: t.type.bodyCompact,
    fontWeight: '500',
    color: t.textOnSurface,
  },
  authButtonTextDisabled: {
    color: t.textOnSurfaceSecondary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  checkboxTouchable: {
    padding: 4,
    marginTop: -2,
    marginLeft: -4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: t.textFaint,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: t.secondary,
    borderColor: t.secondary,
  },
  checkmark: {
    color: t.textPrimary,
    fontSize: t.type.tiny,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: t.type.caption,
    color: t.textTertiary,
    lineHeight: t.line.compact,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  securityBadge: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: t.overlayFaint,
    borderRadius: 20,
    alignItems: 'center',
  },
  securityText: {
    fontSize: t.type.caption,
    color: t.textMuted,
    fontWeight: '500',
  },
});
