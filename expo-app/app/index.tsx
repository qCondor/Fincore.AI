import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';

export default function SplashScreen() {
  const router = useRouter();
  const { userName, userEmail, authProvider, hasCompletedOnboarding, isLoading } = useUser();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Navigate after animation completes AND user state is loaded
  useEffect(() => {
    if (isLoading) return;

    const hasStartedOnboarding = Boolean(userName || userEmail || authProvider !== 'anonymous');

    const timer = setTimeout(() => {
      if (!hasStartedOnboarding) {
        router.replace('/login');
      } else if (hasCompletedOnboarding) {
        router.replace('/(tabs)/faith');
      } else {
        router.replace('/info');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [isLoading, userName, userEmail, authProvider, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.fincoreText}>FINCORE</Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        Reframe your financial decisions
      </Animated.Text>

      <Animated.View
        style={[
          styles.divider,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      />

      <Animated.Text
        style={[
          styles.slogan,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        MAKE IT COUNT
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fincoreText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  aiText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#004FB0',
    letterSpacing: -0.5,
    marginLeft: 6,
    textShadowColor: 'rgba(0, 60, 160, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    marginTop: 12,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 16,
  },
  slogan: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 3,
  },
});
