import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { API_URL, ApiError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { formatJoinedDate } from '../format';
import { useSession } from '../session/SessionContext';
import { colors, radius, spacing } from '../theme';

/** Profil : nom, date d'inscription, renommage et déconnexion. */
export function ProfileScreen() {
  const { user, rename, signOut } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const trimmed = name.trim();
  const canSave = trimmed.length >= 2 && trimmed !== user.name && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await rename(trimmed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de renommer le compte.');
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Se déconnecter ?',
      "Le compte reste visible dans la liste, mais il faudra créer un nouveau compte pour revenir sur cet appareil.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.identity}>
          <Avatar name={user.name} size={88} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.joined}>Inscrit le {formatJoinedDate(user.createdAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Changer de nom</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Votre nom"
            placeholderTextColor={colors.textMuted}
            maxLength={24}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!saving}
            accessibilityLabel="Votre nom"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Enregistrer" onPress={handleSave} loading={saving} disabled={!canSave} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session</Text>
          <Text style={styles.cardText}>
            Vous restez connecté sur cet appareil, sans mot de passe. La déconnexion est manuelle.
          </Text>
          <Button label="Se déconnecter" variant="ghost" onPress={confirmSignOut} />
        </View>

        <Text style={styles.server}>Serveur : {API_URL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  joined: {
    color: colors.textMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  server: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
