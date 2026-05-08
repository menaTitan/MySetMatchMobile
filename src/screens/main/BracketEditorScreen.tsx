import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi, type PlayerForMatchRow } from '../../api';
import { useSport } from '../../context/SportContext';
import type { BracketRound, BracketMatch } from '../../types';
import { radii, shadows, spacing, typography } from '../../theme';
import { BottomSheet, Button, Card, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

type EditorTarget = {
  matchId?: string;
  stage: string;
  round: string;
  group?: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
};

export default function BracketEditorScreen({ route, navigation }: any) {
  const { tournamentId, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [available, setAvailable] = useState<PlayerForMatchRow[]>([]);
  const [pickSlot, setPickSlot] = useState<'p1' | 'p2' | null>(null);

  async function load() {
    try {
      const r = await matchesApi.brackets(tournamentId);
      setRounds(r.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, [tournamentId]);

  async function openEditorFor(stage: string, round: string, group: string | undefined, m: BracketMatch | null) {
    const target: EditorTarget = {
      matchId: m?.id,
      stage, round, group,
      player1: m?.player1 ?? undefined,
      player2: m?.player2 ?? undefined,
    };
    setEditor(target);
    try {
      const { data } = await matchesApi.playersForMatch({ stage, round, group, tournamentId });
      setAvailable(data);
    } catch { setAvailable([]); }
  }

  async function pickPlayer(p: PlayerForMatchRow) {
    if (!editor || !pickSlot) return;
    setEditor({ ...editor, [pickSlot]: { id: p.playerId, name: p.name } } as any);
    setPickSlot(null);
  }

  async function saveMatch() {
    if (!editor) return;
    if (!editor.player1 || !editor.player2) {
      Alert.alert('Both players required', 'Pick two players for this match.');
      return;
    }
    try {
      if (editor.matchId) {
        await matchesApi.updateKnockoutPlayers(editor.matchId, {
          player1Id: editor.player1.id,
          player2Id: editor.player2.id,
          round: editor.round,
        });
      } else if (editor.stage === 'Group') {
        await matchesApi.createGroupMatch({
          player1Id: editor.player1.id,
          player2Id: editor.player2.id,
          skillLevel: 'Open',
          groupLetter: editor.group ?? 'A',
          tournamentId,
        });
      } else {
        await matchesApi.createKnockout({
          player1Id: editor.player1.id,
          player2Id: editor.player2.id,
          round: editor.round,
          tournamentId,
        });
      }
      toast('Match saved', 'success');
      setEditor(null);
      load();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not save match.');
    }
  }

  async function resync() {
    try { await matchesApi.resyncBracket({ tournamentId }); toast('Bracket resynced', 'success'); load(); }
    catch {}
  }

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Bracket Editor" subtitle={name ?? 'Edit matches'} compact />

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base }}>
          <Button title="Resync" leftIcon="sync-outline" variant="secondary" size="sm" onPress={resync} style={{ flex: 1 }} />
          <Button title="View" leftIcon="eye-outline" variant="ghost" size="sm" onPress={() => navigation.navigate('Brackets', { tournamentId, name })} style={{ flex: 1 }} />
        </View>

        {rounds.length === 0 ? (
          <EmptyState icon="git-branch-outline" title="No rounds yet" message="Generate group or knockout stage from the Manage screen." />
        ) : rounds.map((round) => (
          <Card key={`${round.stage}-${round.round}`} style={{ marginBottom: spacing.sm }}>
            <View style={styles.roundHead}>
              <Text style={[typography.smallStrong, { color: theme.primary }]}>
                {round.stage.toUpperCase()} · {round.round}
              </Text>
              {round.stage === 'Knockout' && (
                <Pressable
                  onPress={() => openEditorFor(round.stage, round.round, undefined, null)}
                  style={[styles.addBtn, { backgroundColor: theme.featureBg }]}
                >
                  <Ionicons name="add" size={14} color={theme.primary} />
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>ADD MATCH</Text>
                </Pressable>
              )}
            </View>

            {round.matches.map((m) => (
              <Pressable
                key={m.id ?? `${round.round}-${Math.random()}`}
                onPress={() => openEditorFor(round.stage, round.round, undefined, m)}
                style={[styles.matchRow, { borderTopColor: theme.divider }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: theme.textPrimary }]} numberOfLines={1}>
                    {m.player1?.name ?? 'TBD'}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>vs</Text>
                  <Text style={[typography.body, { color: theme.textPrimary }]} numberOfLines={1}>
                    {m.player2?.name ?? 'TBD'}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </Card>
        ))}
      </ScrollView>

      <BottomSheet
        visible={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.matchId ? 'Edit match' : 'New match'}
        subtitle={editor ? `${editor.stage} · ${editor.round}${editor.group ? ` · Group ${editor.group}` : ''}` : undefined}
      >
        <PlayerPick label="Player 1" picked={editor?.player1} onPress={() => setPickSlot('p1')} />
        <PlayerPick label="Player 2" picked={editor?.player2} onPress={() => setPickSlot('p2')} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button title="Cancel" variant="ghost" onPress={() => setEditor(null)} style={{ flex: 1 }} />
          <Button title="Save" variant="primary" onPress={saveMatch} style={{ flex: 1 }} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={!!pickSlot}
        onClose={() => setPickSlot(null)}
        title={`Pick ${pickSlot === 'p1' ? 'Player 1' : 'Player 2'}`}
      >
        {available.length === 0 ? (
          <Text style={[typography.body, { color: theme.textMuted }]}>No available players.</Text>
        ) : available.map((p) => (
          <Pressable
            key={p.playerId}
            onPress={() => pickPlayer(p)}
            style={[styles.pickRow, { borderTopColor: theme.divider }]}
          >
            <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{p.name}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>{p.globalRating}</Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

function PlayerPick({ label, picked, onPress }: { label: string; picked?: { name: string }; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable onPress={onPress} style={[styles.pickerBtn, { borderColor: theme.border }]}>
      <Text style={[typography.caption, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[typography.body, { color: picked ? theme.textPrimary : theme.textMuted, fontWeight: picked ? '700' : '400' }]}>
        {picked?.name ?? 'Tap to pick'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roundHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill,
  },
  matchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  pickerBtn: {
    borderWidth: 1, borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
});
