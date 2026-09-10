import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  isLast?: boolean;
  loading?: boolean;
}

function ChevronIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.overlayStrong} strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function SettingsRow({ icon, label, value, onPress, showChevron = true, danger = false, isLast = false, loading = false }: SettingsRowProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <TouchableOpacity
      style={[styles.container, !isLast && styles.border]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={loading}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={t.textFaint} style={{ marginRight: 8 }} />
      ) : (
        <>
          {value && <Text style={styles.value}>{value}</Text>}
          {showChevron && <ChevronIcon />}
        </>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayHairline,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: t.type.body,
    color: t.textPrimary,
  },
  dangerLabel: {
    color: t.danger,
  },
  value: {
    fontSize: t.type.bodyCompact,
    color: t.textFaint,
    marginRight: 8,
  },
});
