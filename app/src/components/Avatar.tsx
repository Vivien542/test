import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, colors, radius } from '../theme';

type Props = {
  name: string;
  size?: number;
};

/** Pastille colorée avec l'initiale, faute d'avoir des photos de profil. */
export function Avatar({ name, size = 44 }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: avatarColor(name),
        },
      ]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.background,
    fontWeight: '700',
  },
});
