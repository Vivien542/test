import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from './src/components/Screen';
import { TabBar, type TabKey } from './src/navigation/TabBar';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SessionProvider, useSession } from './src/session/SessionContext';
import { colors } from './src/theme';

export default function App() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Root />
    </SessionProvider>
  );
}

/** Aiguillage : session en cours de lecture, absente, ou établie. */
function Root() {
  const { status } = useSession();
  const [tab, setTab] = useState<TabKey>('users');

  if (status === 'loading') {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (status === 'signedOut') {
    return <WelcomeScreen />;
  }

  return (
    <Screen>
      <View style={styles.content}>{tab === 'users' ? <UsersScreen /> : <ProfileScreen />}</View>
      <TabBar active={tab} onChange={setTab} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});
