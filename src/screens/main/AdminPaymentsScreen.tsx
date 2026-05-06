import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type AdminPayment } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, shadows, spacing, typography } from '../../theme';
import { Button, Card, Chip, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

export default function AdminPaymentsScreen() {
  const { theme } = useSport();
  const toast = useToast();
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);

  const { data, loading, refreshing, refresh, reload } = useFetchData<{ items: AdminPayment[] }>(
    async () => (await adminApi.payments({ pageSize: 50 })).data,
    [],
  );

  async function processRefund(p: AdminPayment, reason: string, amount?: number) {
    try {
      await adminApi.refund(p.paymentId, reason, amount);
      toast('Refund processed', 'success');
      setRefundTarget(null);
      reload();
    } catch {}
  }

  const items = data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Payments" subtitle="Recent transactions & refunds" compact />

      {loading ? <LoadingView /> : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.paymentId}
          renderItem={({ item }) => <PaymentRow p={item} onRefund={() => setRefundTarget(item)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          ListEmptyComponent={<EmptyState icon="card-outline" title="No payments" />}
        />
      )}

      <RefundModal
        visible={!!refundTarget}
        payment={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSubmit={(reason, amount) => refundTarget && processRefund(refundTarget, reason, amount)}
      />
    </View>
  );
}

function PaymentRow({ p, onRefund }: { p: AdminPayment; onRefund: () => void }) {
  const { theme } = useSport();
  const statusColor = statusToColor(p.status);
  const canRefund = p.status === 'Succeeded' || p.status === 'PartiallyRefunded';
  return (
    <Card padding={0}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
            {p.tournamentName ?? 'Tournament'}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
            {p.playerName ?? 'Player'} · {new Date(p.createdAt).toLocaleDateString()}
          </Text>
          <View style={styles.chips}>
            <Chip label={p.status} color={statusColor as any} variant="soft" size="sm" />
            {p.refundedAmount ? (
              <Chip label={`Refunded $${p.refundedAmount.toFixed(2)}`} color="warning" variant="soft" size="sm" />
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
      {canRefund ? (
        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <Pressable
            onPress={onRefund}
            style={({ pressed }) => [
              styles.refundBtn,
              { backgroundColor: 'rgba(239,68,68,0.12)' },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="return-down-back-outline" size={14} color={theme.dangerRed} />
            <Text style={[typography.smallStrong, { color: theme.dangerRed }]}>Refund</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

function statusToColor(status: string) {
  switch (status) {
    case 'Succeeded': return 'success';
    case 'Refunded':
    case 'PartiallyRefunded': return 'warning';
    case 'Failed':
    case 'Canceled': return 'danger';
    default: return 'primary';
  }
}

function RefundModal({
  visible, payment, onClose, onSubmit,
}: {
  visible: boolean;
  payment: AdminPayment | null;
  onClose: () => void;
  onSubmit: (reason: string, amount?: number) => void;
}) {
  const { theme } = useSport();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  function handleSubmit() {
    if (!reason.trim()) return;
    const amt = amount ? parseFloat(amount) : undefined;
    onSubmit(reason.trim(), amt);
    setReason(''); setAmount('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: theme.primary }]}>Process Refund</Text>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.divider }]}>
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {payment ? (
              <View style={{ paddingHorizontal: spacing.lg }}>
                <Text style={[typography.small, { color: theme.textMuted }]}>
                  Refund for {payment.playerName} · ${payment.amount.toFixed(2)}
                </Text>
              </View>
            ) : null}

            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Text style={[typography.smallStrong, { color: theme.textSecondary }]}>Reason *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Tournament canceled, duplicate charge…"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
                multiline
              />
              <Text style={[typography.smallStrong, { color: theme.textSecondary, marginTop: 4 }]}>
                Amount (leave blank to refund the full amount)
              </Text>
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                placeholder={payment ? `Max $${payment.amount.toFixed(2)}` : '0.00'}
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary, minHeight: 44 }]}
              />
              <Button
                title="Issue Refund"
                variant="danger"
                size="lg"
                fullWidth
                disabled={!reason.trim()}
                leftIcon="return-down-back-outline"
                onPress={handleSubmit}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm + 2, padding: spacing.base,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  footer: {
    borderTopWidth: 1, flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  refundBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radii.pill,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    paddingBottom: spacing.xl,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginTop: 8 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1, borderRadius: radii.md,
    padding: 12, fontSize: 14, minHeight: 60,
    textAlignVertical: 'top',
  },
});
