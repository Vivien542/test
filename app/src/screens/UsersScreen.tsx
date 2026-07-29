import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ApiError, fetchUsers, type User } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { formatJoinedDate, pluralizeMembers } from '../format';
import { useSession } from '../session/SessionContext';
import { colors, radius, spacing } from '../theme';

/** Liste de tous les utilisateurs inscrits sur l'application. */
export function UsersScreen() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const list = await fetchUsers(signal);
      if (signal?.aborted) return;
      setUsers(list);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les utilisateurs.');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      await load(controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, users.length === 0 && styles.listEmpty]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Utilisateurs</Text>
          <Text style={styles.subtitle}>{pluralizeMembers(users.length)} sur l&apos;application</Text>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Button label="Réessayer" variant="ghost" onPress={handleRefresh} />
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        error ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Personne pour le moment</Text>
            <Text style={styles.emptyText}>
              Les comptes créés sur cette application apparaîtront ici.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => <UserRow user={item} isMe={item.id === me?.id} />}
    />
  );
}

function UserRow({ user, isMe }: { user: User; isMe: boolean }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Avatar name={user.name} />
      <View style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {isMe ? <Text style={styles.meBadge}>vous</Text> : null}
        </View>
        <Text style={styles.joined}>Inscrit le {formatJoinedDate(user.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listEmpty: {
    flexGrow: 1,
  },
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowMe: {
    borderColor: colors.primary,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  meBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  joined: {
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
