import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, type RegistrationRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Card, Chip, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

export default function ManageTournamentScreen({ route }: any) {
  const { id, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const { data, loading, refreshing, refresh, reload } = useFetchData<RegistrationRow[]>(
    async () => (await tournamentsApi.registrations(id)).data,
    [id],
  );

  async function approve(regId: string) {
    try { await tournamentsApi.approveRegistration(id, regId); toast('Approved', 'success'); reload(); }
    catch {}
  }

  async function reject(regId: string, playerName: string) {
    Alert.alert('Reject registration', `Reject ${playerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try { await tournamentsApi.rejectRegistration(id, regId); reload(); }
        catch {}
      } },
    ]);
  }

  const regs = data ?? [];
  const pending = regs.filter((r) => r.status === 'Pending');
  const confirmed = regs.filter((r) => r.status === 'Confirmed');
  const withdrawn = regs.filter((r) => r.status === 'Withdrawn');

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Manage" subtitle={name ?? 'Registrations'} compact />

      {loading ? <LoadingView /> : (
        <FlatList
          data={[
            { kind: 'header' as const, title: 'Pending approval', count: pending.length },
            ...pending.map((r) => ({ kind: 'pending' as const, reg: r })),
            { kind: 'header' as const, title: 'Confirmed', count: confirmed.length },
            ...confirmed.map((r) => ({ kind: 'confirmed' as const, reg: r })),
            ...(withdrawn.length ? [{ kind: 'header' as const, title: 'Withdrawn', count: withdrawn.length }] : []),
            ...withdrawn.map((r) => ({ kind: 'withdrawn' as const, reg: r })),
          ]}
          keyExtractor={(item, i) => (item.kind === 'header' ? `h-${item.title}` : `${item.reg.registrationId}`)}
          renderItem={({ item }) => {
            if (item.kind === 'header')
              return (
                <View style={styles.sectionHead}>
                  <Text style={[typography.overline, { color: theme.secondary }]}>{item.title}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>{item.count}</Text>
                </View>
              );
            const r = item.reg;
            return (
              <Card padding={0}>
                <View style={styles.row}>
                  <Avatar name={r.playerName} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                      {r.playerName}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                      Rating {r.globalRating}{r.city ? ` · ${r.city}` : ''}{r.country ? `, ${r.country}` : ''}
                    </Text>
                  </View>
                  {item.kind === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable onPress={() => approve(r.registrationId)} style={[styles.btn, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                        <Ionicons name="checkmark" size={16} color={theme.successGreen} />
                      </Pressable>
                      <Pressable onPress={() => reject(r.registrationId, r.playerName)} style={[styles.btn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                        <Ionicons name="close" size={16} color={theme.dangerRed} />
                      </Pressable>
                    </View>
                  ) : item.kind === 'confirmed' ? (
                    <Chip label="IN" color="success" variant="soft" size="sm" />
                  ) : (
                    <Chip label="OUT" color="muted" variant="soft" size="sm" />
                  )}
                </View>
              </Card>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No registrations yet" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: spacing.sm, paddingBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
  },
  btn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
});
