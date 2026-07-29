import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '../api/client';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { useSession } from '../session/SessionContext';
import { colors, radius, spacing } from '../theme';

const NAME_MAX = 24;

/** Premier écran : un nom suffit pour créer le compte. */
export function WelcomeScreen() {
  const { signUpWithName } = useSession();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUpWithName(trimmed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer le compte.');
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.header}>
            <Text style={styles.badge}>Bienvenue</Text>
            <Text style={styles.title}>Comment vous appelez-vous ?</Text>
            <Text style={styles.subtitle}>
              Votre nom suffit : pas de mot de passe, pas d&apos;e-mail. Vous resterez connecté sur
              cet appareil.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (error) setError(null);
              }}
              placeholder="Votre nom"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, error ? styles.inputError : null]}
              maxLength={NAME_MAX}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!submitting}
              accessibilityLabel="Votre nom"
            />
            <View style={styles.helperRow}>
              <Text style={[styles.helper, error ? styles.helperError : null]}>
                {error ?? 'Entre 2 et 24 caractères.'}
              </Text>
              <Text style={styles.counter}>
                {trimmed.length}/{NAME_MAX}
              </Text>
            </View>

            <Button
              label="Créer mon compte"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              style={styles.submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  badge: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  helper: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
  },
  helperError: {
    color: colors.danger,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 13,
  },
  submit: {
    marginTop: spacing.md,
  },
});
