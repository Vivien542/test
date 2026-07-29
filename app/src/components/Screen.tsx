import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../theme';

/** Conteneur plein écran qui évite l'encoche iOS et la barre de statut Android. */
export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
});
