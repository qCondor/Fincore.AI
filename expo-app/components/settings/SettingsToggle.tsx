import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useSounds } from '../../lib/sounds';

interface SettingsToggleProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

export function SettingsToggle({ icon, label, value, onValueChange, isLast = false, disabled = false }: SettingsToggleProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sounds = useSounds();

  const handleValueChange = (next: boolean) => {
    sounds.playToggle();
    onValueChange(next);
  };

  return (
    <View style={[styles.container, !isLast && styles.border, disabled && styles.disabled]}>
      <View style={[styles.iconContainer, disabled && styles.iconDisabled]}>{icon}</View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        trackColor={{ false: t.overlayMedium, true: t.success }}
        thumbColor={t.textPrimary}
        ios_backgroundColor={t.overlayMedium}
        disabled={disabled}
      />
    </View>
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
