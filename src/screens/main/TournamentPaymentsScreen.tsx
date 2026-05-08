import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, type TournamentPaymentRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, Card, Chip, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

export default function TournamentPaymentsScreen({ route }: any) {
  const { tournamentId, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [target, setTarget] = useState<TournamentPaymentRow | null>(null);
  const [reason, setReason] = useState('');

  const { data, loading, refreshing, refresh, reload } = useFetchData<TournamentPaymentRow[]>(
    async () => (await tournamentsApi.payments(tournamentId)).data,
    [tournamentId],
  );

  async function refund() {
    if (!target || !reason.trim()) { Alert.alert('Reason required', 'Provide a refund reason.'); return; }
    try {
      await tournamentsApi.processRefund(target.paymentId, tournamentId, reason.trim());
      toast('Refund issued', 'success');
      setTarget(null); setReason('');
      reload();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Refund failed.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Payments" subtitle={name ?? 'Tournament payments'} compact />
      {loading ? <LoadingView /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={(p) => p.paymentId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState icon="card-outline" title="No payments yet" />}
          renderItem={({ item: p }) => (
            <Card padding={0}>
              <View style={styles.row}>
                <Avatar name={p.playerName} photoUrl={p.profilePhotoUrl} size={36} playerId={p.playerId} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{p.playerName}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {new Date(p.createdAt).toLocaleDateString()}
                    {p.refundedAmount ? ` · Refunded $${p.refundedAmount.toFixed(2)}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>${p.amount.toFixed(2)}</Text>
                  <Chip label={p.status} color={statusColor(p.status)} variant="soft" size="sm" />
                </View>
              </View>
              {(p.status === 'Succeeded' || p.status === 'PartiallyRefunded') && (
                <Pressable onPress={() => setTarget(p)} style={[styles.refundBtn, { borderTopColor: theme.divider }]}>
                  <Ionicons name="arrow-undo-outline" size={14} color={theme.dangerRed} />
                  <Text style={[typography.smallStrong, { color: theme.dangerRed }]}>Refund</Text>
                </Pressable>
              )}
            </Card>
          )}
        />
      )}

      <BottomSheet
        visible={!!target}
        onClose={() => { setTarget(null); setReason(''); }}
        title="Process refund"
        subtitle={target ? `Refund for ${target.playerName} · $${target.amount.toFixed(2)}` : undefined}
      >
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Reason for refund..."
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button title="Cancel" variant="ghost" onPress={() => { setTarget(null); setReason(''); }} style={{ flex: 1 }} />
          <Button title="Issue refund" variant="danger" onPress={refund} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

function statusColor(s: string): any {
  if (s === 'Succeeded') return 'success';
  if (s === 'Refunded' || s === 'PartiallyRefunded') return 'warning';
  if (s === 'Failed' || s === 'Canceled') return 'danger';
  return 'muted';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 4,
  },
  refundBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: spacing.sm,
    borderTopWidth: 1, justifyContent: 'center',
  },
  input: {
    borderWidth: 1, borderRadius: radii.md,
    padding: spacing.sm + 2, fontSize: 14, minHeight: 80,
    textAlignVertical: 'top',
  },
});
