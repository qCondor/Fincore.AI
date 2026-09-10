import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { WaveBackground } from '../WaveBackground';

interface SettingsPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function SettingsPage({ title, onBack, children }: SettingsPageProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <WaveBackground prefix="settings" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    // Screen ground, not a button fill. Identical to `primary` in light
    // (#005FCC), which is why this only became visible in dark mode.
    backgroundColor: t.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
    textAlign: 'center',
    marginRight: 42,
  },
  placeholder: {
    width: 42,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
});
