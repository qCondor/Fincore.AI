import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config';

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers?: string; userName?: string }>();
  const { userId, userName, setUserName } = useUser();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Submit answers to backend and get scores
    const submitAnswers = async () => {
      if (hasSubmitted.current || !userId) return;
      hasSubmitted.current = true;

      // Save user name if provided
      if (params.userName) {
        await setUserName(params.userName);
      }

      try {
        if (params.answers) {
          const answers = JSON.parse(params.answers) as Array<{
            itemId: number; facet: string; domain: string; reverse: boolean; rating: number;
          }>;
          const response = await fetch(`${API_BASE_URL}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              name: params.userName || userName || 'User',
              answers,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Pass scores to results screen
            router.replace({ pathname: '/results', params: { scores: JSON.stringify(data.big_five) } });
            return;
          }
        }
      } catch (error) {
        console.error('Failed to submit answers:', error);
      }

      // Fallback to results without scores after delay
      setTimeout(() => router.replace('/results'), 2000);
    };

    submitAnswers();
  }, [params.answers, params.userName, userId, userName, setUserName]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.spinnerOuter,
            {
              transform: [{ rotate: spin }, { scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.spinnerInner} />
        </Animated.View>

        <Text style={styles.title}>Analysing your personality...</Text>
        <Text style={styles.subtitle}>
          Building your unique financial profile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
