import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';

interface SettingsToggleProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

export function SettingsToggle({ icon, label, value, onValueChange, isLast = false, disabled = false }: SettingsToggleProps) {
  return (
    <View style={[styles.container, !isLast && styles.border, disabled && styles.disabled]}>
      <View style={[styles.iconContainer, disabled && styles.iconDisabled]}>{icon}</View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#34C759' }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(255,255,255,0.2)"
        disabled={disabled}
      />
    </View>
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
  disabled: {
    opacity: 0.5,
  },
  iconDisabled: {
    opacity: 0.5,
  },
  labelDisabled: {
    opacity: 0.7,
  },
});
