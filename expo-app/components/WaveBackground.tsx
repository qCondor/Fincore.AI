import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';

interface WaveBackgroundProps {
  prefix?: string;
}

export function WaveBackground({ prefix = 'wave' }: WaveBackgroundProps) {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;
  const wave4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
          <LinearGradient id={`base-gradient-${prefix}`} x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%" stopColor="#3CB8F0" />
            <Stop offset="50%" stopColor="#0A6FE8" />
            <Stop offset="100%" stopColor="#0035A0" />
          </LinearGradient>
        </Defs>
        <Path d="M0,0 L393,0 L393,852 L0,852 Z" fill={`url(#base-gradient-${prefix})`} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave1Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id={`clip-${prefix}-1`}>
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <LinearGradient id={`wave1-anim-${prefix}`} x1="0.8" y1="0" x2="0.2" y2="1">
              <Stop offset="0%" stopColor="#A8EAFF" stopOpacity={0.55} />
              <Stop offset="45%" stopColor="#70D8FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5ED4FF" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#clip-${prefix}-1)`}>
            <Path d="M393,-50 C410,250 100,350 0,550 C-30,650 50,800 0,902 L393,902 Z" fill={`url(#wave1-anim-${prefix})`} />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave2Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id={`clip-${prefix}-2`}>
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <LinearGradient id={`wave2-anim-${prefix}`} x1="0.7" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor="#6DDDFF" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#44BBFF" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#1A90FF" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#clip-${prefix}-2)`}>
            <Path d="M393,-150 C400,150 50,250 0,420 C-30,530 30,700 0,902 L393,902 Z" fill={`url(#wave2-anim-${prefix})`} />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave3Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id={`clip-${prefix}-3`}>
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <LinearGradient id={`wave3-anim-${prefix}`} x1="0.6" y1="0" x2="0.4" y2="1">
              <Stop offset="0%" stopColor="#50C8FF" stopOpacity={0.35} />
              <Stop offset="50%" stopColor="#2AA0F0" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#0A6FE8" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#clip-${prefix}-3)`}>
            <Path d="M393,-250 C390,80 20,170 0,300 C-30,400 10,580 0,902 L393,902 Z" fill={`url(#wave3-anim-${prefix})`} />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave4Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id={`clip-${prefix}-4`}>
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <LinearGradient id={`wave4-anim-${prefix}`} x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#1A5FAA" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#0D4080" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#003070" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#clip-${prefix}-4)`}>
            <Path d="M393,400 C350,550 200,750 100,820 C50,860 0,840 0,902 L393,902 Z" fill={`url(#wave4-anim-${prefix})`} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
