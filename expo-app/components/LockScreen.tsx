import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSecurity } from '../contexts/SecurityContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';

function FaceIdIcon() {
  const t = useTheme();
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={1.5}>
      <Path d="M7 3H5a2 2 0 00-2 2v2M17 3h2a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2v-2M17 21h2a2 2 0 002-2v-2" />
      <Circle cx={9} cy={9} r={1} fill={t.textPrimary} />
      <Circle cx={15} cy={9} r={1} fill={t.textPrimary} />
      <Path d="M9 15s1.5 2 3 2 3-2 3-2" />
    </Svg>
  );
}

export function LockScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const insets = useSafeAreaInsets();
  const { unlock } = useSecurity();

  const handleUnlock = async () => {
    await unlock();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={t.gradients.main}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <FaceIdIcon />
        </View>

        <Text style={styles.title}>Fincore is Locked</Text>
        <Text style={styles.subtitle}>Use Face ID or passcode to unlock</Text>

        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockButtonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: t.type.heading,
    fontWeight: '700',
    color: t.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: t.type.body,
    color: t.textTertiary,
    textAlign: 'center',
    marginBottom: 48,
  },
  unlockButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: t.overlayMedium,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: t.overlayStrong,
  },
  unlockButtonText: {
    fontSize: t.type.subtitle,
    fontWeight: '600',
    color: t.textPrimary,
  },
});
