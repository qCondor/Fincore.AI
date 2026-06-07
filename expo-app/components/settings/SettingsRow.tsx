import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function SettingsRow({ icon, label, value, onPress, showChevron = true, danger = false, isLast = false, loading = false }: SettingsRowProps) {
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
        <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
      ) : (
        <>
          {value && <Text style={styles.value}>{value}</Text>}
          {showChevron && <ChevronIcon />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  dangerLabel: {
    color: '#FF453A',
  },
  value: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 8,
  },
});
