import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi, tournamentsApi, sportsApi, type PlayerSearchRow } from '../../api';
import { useSport } from '../../context/SportContext';
import type { Sport } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, Chip, Input, KeyboardAware, PageHeader, useToast } from '../../components/ui';

export default function StartNewGameScreen({ navigation }: any) {
  const { theme, currentSport } = useSport();
  const toast = useToast();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState<string | null>(currentSport?.id ?? null);

  const [q1, setQ1] = useState(''); const [q2, setQ2] = useState('');
  const [opts1, setOpts1] = useState<PlayerSearchRow[]>([]);
  const [opts2, setOpts2] = useState<PlayerSearchRow[]>([]);
  const [p1, setP1] = useState<PlayerSearchRow | null>(null);
  const [p2, setP2] = useState<PlayerSearchRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sportsApi.list().then((r) => setSports(r.data)).catch(() => {});
  }, []);

  useEffect(() => { searchFor(q1, setOpts1); }, [q1]);
  useEffect(() => { searchFor(q2, setOpts2); }, [q2]);

  function searchFor(q: string, setter: (rows: PlayerSearchRow[]) => void) {
    if (q.length < 2) { setter([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await tournamentsApi.searchPlayers(q.trim()); setter(data); }
      catch { setter([]); }
    }, 250);
    return () => clearTimeout(t);
  }

  async function start() {
    if (!sportId) { Alert.alert('Sport required', 'Choose a sport.'); return; }
    if (!p1 || !p2) { Alert.alert('Players required', 'Pick two players.'); return; }
    if (p1.playerId === p2.playerId) { Alert.alert('Same player', 'Players must be different.'); return; }
    setBusy(true);
    try {
      const { data } = await matchesApi.startNewGame({
        player1Id: p1.playerId, player2Id: p2.playerId,
        sportId,
      });
      toast('Live game started', 'success');
      navigation.replace('LiveScore');
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not start game.');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Start New Game" subtitle="Quick live game outside a tournament" compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <Card>
          <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Sport</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }}>
            {sports.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                color={sportId === s.id ? 'primary' : 'muted'}
                variant={sportId === s.id ? 'solid' : 'soft'}
                onPress={() => setSportId(s.id)}
              />
            ))}
          </View>
        </Card>

        <PlayerPicker
          label="Player 1"
          q={q1} setQ={setQ1}
          options={opts1}
          picked={p1}
          onPick={setP1}
          theme={theme}
        />
        <PlayerPicker
          label="Player 2"
          q={q2} setQ={setQ2}
          options={opts2}
          picked={p2}
          onPick={setP2}
          theme={theme}
        />

        <Button
          title="Start Live Game"
          onPress={start}
          loading={busy}
          variant="primary" size="lg" fullWidth
          leftIcon="play-circle-outline"
        />
      </KeyboardAware>
    </View>
  );
}

function PlayerPicker({
  label, q, setQ, options, picked, onPick, theme,
}: {
  label: string; q: string; setQ: (v: string) => void;
  options: PlayerSearchRow[]; picked: PlayerSearchRow | null;
  onPick: (p: PlayerSearchRow | null) => void; theme: any;
}) {
  return (
    <Card>
      <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>{label}</Text>
      {picked ? (
        <Pressable onPress={() => onPick(null)} style={[styles.pickedRow, { backgroundColor: theme.featureBg }]}>
          <Avatar name={picked.name} photoUrl={picked.profilePhotoUrl} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{picked.name}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Rating {picked.globalRating}</Text>
          </View>
          <Ionicons name="close" size={18} color={theme.dangerRed} />
        </Pressable>
      ) : (
        <>
          <Input
            value={q}
            onChangeText={setQ}
            placeholder="Search by name..."
            leftIcon="search-outline"
          />
          {options.slice(0, 5).map((p) => (
            <Pressable
              key={p.playerId}
              onPress={() => { onPick(p); setQ(''); }}
              style={[styles.optionRow, { borderTopColor: theme.divider }]}
            >
              <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{p.name}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>{p.globalRating}</Text>
            </Pressable>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  pickedRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2, borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
});
