import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export type TabKey = 'users' | 'profile';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'users', label: 'Utilisateurs', icon: '👥' },
  { key: 'profile', label: 'Profil', icon: '🙂' },
];

/** Barre d'onglets maison : deux écrans ne justifient pas une librairie de navigation. */
export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}>
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    gap: 2,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary,
  },
});
