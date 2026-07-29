import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Session } from '../api/client';

const KEY = 'session.v1';

/** Session persistée sur l'appareil : c'est elle qui garde l'utilisateur connecté a vie. */
export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
