import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingsSectionProps {
  title?: string;
  badge?: React.ReactNode;
  locked?: boolean;
  children: React.ReactNode;
}

export function SettingsSection({ title, badge, locked, children }: SettingsSectionProps) {
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

const styles = StyleSheet.create({
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
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.6,
  },
});
