import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { MatchDetail } from '../../types';
import { radii, shadows, spacing, typography } from '../../theme';
import { Button, Card, KeyboardAware, LoadingView } from '../../components/ui';

export default function ScoreEntryScreen({ route, navigation }: any) {
  const { matchId } = route.params;
  const { theme } = useSport();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [sets, setSets] = useState<{ p1: string; p2: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMatch(); }, [matchId]);

  async function loadMatch() {
    try {
      const { data } = await matchesApi.get(matchId);
      setMatch(data);
      const bestOf = data.defaultBestOf ?? 5;
      const existingSets = data.sets ?? [];
      const initial = Array.from({ length: bestOf }, (_, i) => {
        const s = existingSets.find((e) => e.setNumber === i + 1);
        return { p1: s ? String(s.player1Score) : '', p2: s ? String(s.player2Score) : '' };
      });
      setSets(initial);
    } catch {
      Alert.alert('Error', 'Could not load match');
    } finally { setLoading(false); }
  }

  function updateScore(setIdx: number, side: 'p1' | 'p2', val: string) {
    setSets((prev) => prev.map((s, i) => i === setIdx ? { ...s, [side]: val.replace(/[^0-9]/g, '') } : s));
  }

  async function submit() {
    const payload = sets
      .map((s, i) => ({
        setNumber: i + 1,
        player1Score: parseInt(s.p1) || 0,
        player2Score: parseInt(s.p2) || 0,
      }))
      .filter((s) => s.player1Score > 0 || s.player2Score > 0);

    if (payload.length === 0) { Alert.alert('Error', 'Enter at least one set score'); return; }

    setSaving(true);
    try {
      const { data } = await matchesApi.submitScore(matchId, payload);
      if (data.completed) {
        Alert.alert('Match Complete!', `Final: ${data.player1Sets} – ${data.player2Sets}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Scores Saved', 'Match is in progress.', [{ text: 'OK' }]);
        loadMatch();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save scores');
    } finally { setSaving(false); }
  }

  if (loading) return <LoadingView />;
  if (!match) return null;

  // Live totals
  const liveP1 = sets.reduce((acc, s) => acc + (parseInt(s.p1) > parseInt(s.p2) ? 1 : 0), 0);
  const liveP2 = sets.reduce((acc, s) => acc + (parseInt(s.p2) > parseInt(s.p1) ? 1 : 0), 0);

  return (
    <KeyboardAware
      style={[styles.container, { backgroundColor: theme.pageBg }]}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
    >
        {/* Gradient match header */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View pointerEvents="none" style={[styles.orb, { backgroundColor: theme.accentLight }]} />
          <Text style={styles.tournamentName}>{match.tournamentName}</Text>
          <Text style={styles.stage}>{match.stage}{match.round ? ` · ${match.round}` : ''}</Text>

          <View style={styles.matchupRow}>
            <View style={styles.pSide}>
              <Text style={styles.pName} numberOfLines={1}>{match.player1?.name}</Text>
              <Text style={[styles.pSets, { color: theme.accent }]}>{liveP1}</Text>
            </View>
            <Text style={[styles.vs, { color: theme.accent }]}>VS</Text>
            <View style={styles.pSide}>
              <Text style={styles.pName} numberOfLines={1}>{match.player2?.name}</Text>
              <Text style={[styles.pSets, { color: theme.accent }]}>{liveP2}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.base }}>
          {/* Rules banner */}
          <View style={[styles.rulesBanner, { backgroundColor: theme.accentLight, borderColor: theme.accent }]}>
            <Ionicons name="information-circle" size={16} color={theme.accentDark} />
            <Text style={[typography.smallStrong, { color: theme.accentDark, flex: 1 }]}>
              First to {match.winningScore} · Win by {match.winByPoints} · Best of {match.defaultBestOf}
            </Text>
          </View>

          {/* Set scores */}
          <Card style={{ marginTop: spacing.base }}>
            <View style={styles.scoreHeader}>
              <Text style={[typography.smallStrong, { color: theme.primary, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
                {match.player1?.name}
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, width: 40, textAlign: 'center' }]}>SET</Text>
              <Text style={[typography.smallStrong, { color: theme.primary, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
                {match.player2?.name}
              </Text>
            </View>

            {sets.map((s, i) => {
              const p1 = parseInt(s.p1) || 0;
              const p2 = parseInt(s.p2) || 0;
              const hasScore = p1 > 0 || p2 > 0;
              const p1Won = hasScore && p1 > p2;
              const p2Won = hasScore && p2 > p1;
              return (
                <View key={i} style={[styles.setRow, i > 0 && { borderTopColor: theme.divider, borderTopWidth: 1 }]}>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      {
                        borderColor: p1Won ? theme.successGreen : theme.border,
                        backgroundColor: p1Won ? 'rgba(34,197,94,0.05)' : theme.pageBg,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={s.p1}
                    onChangeText={(v) => updateScore(i, 'p1', v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    maxLength={3}
                  />
                  <View style={[styles.setBubble, { backgroundColor: theme.featureBg }]}>
                    <Text style={[typography.smallStrong, { color: theme.secondary, fontSize: 11 }]}>S{i + 1}</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      {
                        borderColor: p2Won ? theme.successGreen : theme.border,
                        backgroundColor: p2Won ? 'rgba(34,197,94,0.05)' : theme.pageBg,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={s.p2}
                    onChangeText={(v) => updateScore(i, 'p2', v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    maxLength={3}
                  />
                </View>
              );
            })}
          </Card>

          <Button
            title="Submit Score"
            onPress={submit}
            loading={saving}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="checkmark-circle-outline"
            style={{ marginTop: spacing.base }}
          />
        </View>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -80, right: -60, opacity: 0.8 },
  tournamentName: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  stage: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: spacing.base, marginTop: 2 },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pSide: { flex: 1, alignItems: 'center' },
  pName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  pSets: { fontSize: 44, fontWeight: '900', letterSpacing: -1, marginTop: 2 },
  vs: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  rulesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12,
    borderRadius: radii.md, borderWidth: 1,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, gap: spacing.sm },
  scoreInput: {
    flex: 1, borderWidth: 2, borderRadius: radii.md,
    padding: 12, fontSize: 26, fontWeight: '800',
    textAlign: 'center',
  },
  setBubble: {
    width: 40, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
});
