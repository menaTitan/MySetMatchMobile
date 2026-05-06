import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentApi, type PaymentRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function PaymentHistoryScreen({ navigation }: any) {
  const { theme } = useSport();
  const { data, loading, refreshing, refresh } = useFetchData<PaymentRow[]>(
    async () => (await paymentApi.myPayments()).data,
    [],
  );

  const items = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Payments" subtitle="Tournament fees & refunds" compact />

      {loading ? <LoadingView /> : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.paymentId}
          renderItem={({ item }) => (
            <Row
              p={item}
              onPress={() => navigation.getParent()?.navigate('Play', {
                screen: 'TournamentDetail', params: { id: item.tournamentId },
              })}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No payments yet"
              message="Tournament fees and refunds will appear here."
            />
          }
        />
      )}
    </View>
  );
}

function Row({ p, onPress }: { p: PaymentRow; onPress: () => void }) {
  const { theme } = useSport();
  const colorMap: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'muted'> = {
    Succeeded: 'success',
    Refunded: 'warning',
    PartiallyRefunded: 'warning',
    Failed: 'danger',
    Canceled: 'muted',
    Pending: 'primary',
    Processing: 'primary',
  };
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      <Card padding={0}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: theme.featureBg }]}>
            <Ionicons name="card" size={18} color={theme.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
              {p.tournamentName ?? 'Tournament fee'}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              {new Date(p.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.chips}>
              <Chip label={p.status} color={colorMap[p.status] ?? 'primary'} variant="soft" size="sm" />
              {p.refundedAmount ? (
                <Chip label={`-$${p.refundedAmount.toFixed(2)} refunded`} color="warning" variant="soft" size="sm" />
              ) : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[typography.h2, { color: theme.primary, fontSize: 18 }]}>
              ${p.amount.toFixed(2)}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>{p.currency}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm + 2, padding: spacing.base,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
});
