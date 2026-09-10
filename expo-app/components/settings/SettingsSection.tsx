import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface SettingsSectionProps {
  title?: string;
  badge?: React.ReactNode;
  locked?: boolean;
  children: React.ReactNode;
}

export function SettingsSection({ title, badge, locked, children }: SettingsSectionProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.container}>
      {(title || badge) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {badge}
        </View>
      )}
      <View style={[styles.card, locked && styles.cardLocked]}>{children}</View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  title: {
    fontSize: t.type.bodySmall,
    fontWeight: '600',
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: t.overlayHairline,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.overlayFaint,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.6,
  },
});
