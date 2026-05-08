import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Card, PageHeader, useToast } from '../../components/ui';

export default function AdminDebugScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<any>, confirm = true) {
    const exec = async () => {
      setBusy(label);
      try { await fn(); toast(`${label} OK`, 'success'); }
      catch (err: any) { Alert.alert('Failed', err?.response?.data?.message ?? `${label} failed`); }
      finally { setBusy(null); }
    };
    if (!confirm) return exec();
    Alert.alert(label, `Run ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Run', onPress: exec },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Debug & QA Tools" subtitle="Admin only" compact />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <Card>
          <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Data ops</Text>
          <Row label="Reload all data" icon="refresh-outline" busy={busy === 'Reload data'} onPress={() => run('Reload data', () => adminApi.reloadAllData())} />
          <Row label="Recalculate ratings" icon="bar-chart-outline" busy={busy === 'Recalc ratings'} onPress={() => run('Recalc ratings', () => adminApi.recalculateRatings())} />
        </Card>
        <Card>
          <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Test data</Text>
          <Row label="Seed test data" icon="cloud-download-outline" busy={busy === 'Seed test data'} onPress={() => run('Seed test data', () => adminApi.seedTestData())} />
          <Row label="Clear test data" icon="trash-outline" color={theme.dangerRed} busy={busy === 'Clear test data'} onPress={() => run('Clear test data', () => adminApi.clearTestData())} />
          <Row label="Run full tournament test" icon="rocket-outline" busy={busy === 'Run test'} onPress={() => run('Run test', async () => {
            const { data } = await adminApi.runFullTournamentTest();
            Alert.alert('Test complete', data.report ?? 'Done.');
          })} />
          <Row label="Create 15-player tournament" icon="people-outline" busy={busy === 'Create 15p'} onPress={() => run('Create 15p', () => adminApi.createTournamentWith15Players())} />
        </Card>
      </ScrollView>
    </View>
  );
}

function Row({ label, icon, color, busy, onPress }: any) {
  const { theme } = useSport();
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.row, { borderColor: theme.divider, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.featureBg }]}>
        <Ionicons name={icon} size={16} color={color ?? theme.primary} />
      </View>
      <Text style={[typography.body, { color: color ?? theme.textPrimary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, borderTopWidth: 1 },
  iconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
