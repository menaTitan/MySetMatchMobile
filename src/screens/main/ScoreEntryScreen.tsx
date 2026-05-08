import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi } from '../../api';
import { useSport } from '../../context/SportContext';
import { getHub } from '../../realtime/signalR';
import type { MatchDetail } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, HeroHeader, KeyboardAware, LoadingView, useToast } from '../../components/ui';

interface CommittedSet {
  p1: number;
  p2: number;
}

export default function ScoreEntryScreen({ route, navigation }: any) {
  const { matchId } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [committed, setCommitted] = useState<CommittedSet[]>([]);
  const [currentP1, setCurrentP1] = useState('');
  const [currentP2, setCurrentP2] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const p1InputRef = useRef<TextInput>(null);

  useEffect(() => { loadMatch(); }, [matchId]);

  // Subscribe to per-match score broadcasts so two scorekeepers stay in sync.
  useEffect(() => {
    let off: (() => void) | undefined;
    (async () => {
      try {
        const hub = await getHub('liveScore');
        await hub.invoke('JoinMatchGroup', matchId).catch(() => {});
        const handler = () => { loadMatch(); };
        hub.on('MatchScoreUpdated', handler);
        off = () => {
          hub.off('MatchScoreUpdated', handler);
          hub.invoke('LeaveMatchGroup', matchId).catch(() => {});
        };
      } catch {}
    })();
    return () => { if (off) off(); };
  }, [matchId]);

  async function loadMatch() {
    try {
      const { data } = await matchesApi.get(matchId);
      setMatch(data);
      // Pre-populate committed sets from any scores already on the match.
      const recorded: CommittedSet[] = (data.sets ?? [])
        .slice()
        .sort((a, b) => a.setNumber - b.setNumber)
        .filter((s) => s.player1Score > 0 || s.player2Score > 0)
        .map((s) => ({ p1: s.player1Score, p2: s.player2Score }));
      setCommitted(recorded);
      setCurrentP1('');
      setCurrentP2('');
    } catch {
      Alert.alert('Error', 'Could not load match');
    } finally { setLoading(false); }
  }

  // Derived values
  const bestOf = match?.defaultBestOf ?? 5;
  const setsToWin = Math.ceil(bestOf / 2);
  const p1Wins = useMemo(() => committed.filter((s) => s.p1 > s.p2).length, [committed]);
  const p2Wins = useMemo(() => committed.filter((s) => s.p2 > s.p1).length, [committed]);
  const matchDecided = p1Wins >= setsToWin || p2Wins >= setsToWin;
  const allSetsPlayed = committed.length >= bestOf;
  const showActiveSet = !matchDecided && !allSetsPlayed;
  const currentSetNumber = committed.length + 1;

  async function persist(allSets: CommittedSet[]) {
    const payload = allSets.map((s, i) => ({
      setNumber: i + 1,
      player1Score: s.p1,
      player2Score: s.p2,
    }));
    if (payload.length === 0) return;
    return matchesApi.submitScore(matchId, payload);
  }

  async function saveCurrentSet() {
    const p1 = parseInt(currentP1) || 0;
    const p2 = parseInt(currentP2) || 0;
    if (p1 === 0 && p2 === 0) {
      Alert.alert('Enter scores', 'Add a score for at least one player.');
      return;
    }
    if (p1 === p2) {
      Alert.alert('Tie not allowed', 'A set must have a winner.');
      return;
    }
    const next = [...committed, { p1, p2 }];
    setSaving(true);
    try {
      const res = await persist(next);
      setCommitted(next);
      setCurrentP1('');
      setCurrentP2('');
      // If saving this set decided the match, the server flips it to Completed.
      if (res?.data.completed) {
        Alert.alert(
          'Match Complete!',
          `Final: ${res.data.player1Sets} – ${res.data.player2Sets}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        // Auto-focus the first input of the next set.
        setTimeout(() => p1InputRef.current?.focus(), 50);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save set');
    } finally {
      setSaving(false);
    }
  }

  // Tap a saved set tile to bring it back into the active editor.
  function editSet(idx: number) {
    const target = committed[idx];
    if (!target) return;
    // Drop this set + all later sets, push the chosen one back into the editor.
    setCommitted((prev) => prev.slice(0, idx));
    setCurrentP1(String(target.p1));
    setCurrentP2(String(target.p2));
    setTimeout(() => p1InputRef.current?.focus(), 50);
  }

  if (loading) return <LoadingView />;
  if (!match) return null;

  return (
    <KeyboardAware
      style={[styles.container, { backgroundColor: theme.pageBg }]}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
    >
      <HeroHeader variant="standard">
        <Text style={[typography.overline, { color: theme.accent, fontSize: 11 }]}>
          {match.tournamentName}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: spacing.base }]}>
          {match.stage}{match.round ? ` · ${match.round}` : ''}
        </Text>

        <View style={styles.matchupRow}>
          <PlayerHero player={match.player1} setsWon={p1Wins} />
          <Text style={[styles.vs, { color: theme.accent }]}>VS</Text>
          <PlayerHero player={match.player2} setsWon={p2Wins} />
        </View>
      </HeroHeader>

      <View style={{ padding: spacing.base }}>
        {/* Rules banner */}
        <View style={[styles.rulesBanner, { backgroundColor: theme.featureBg, borderColor: `${theme.accent}40` }]}>
          <Ionicons name="information-circle" size={16} color={theme.accent} />
          <Text style={[
            typography.smallStrong,
            { color: theme.textPrimary, flex: 1 },
          ]}>
            First to {match.winningScore} · Win by {match.winByPoints} · Best of {bestOf} (first to {setsToWin})
          </Text>
        </View>

        {/* Saved sets — pill row, tap to edit */}
        {committed.length > 0 ? (
          <View style={{ marginTop: spacing.base }}>
            <Text style={[
              typography.overline,
              { color: theme.textMuted, marginBottom: spacing.sm, fontSize: 10 },
            ]}>
              SAVED SETS · TAP TO EDIT
            </Text>
            <View style={styles.pillRow}>
              {committed.map((s, i) => (
                <SavedSetPill
                  key={i}
                  setNumber={i + 1}
                  p1={s.p1}
                  p2={s.p2}
                  onEdit={() => editSet(i)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Active set entry */}
        {showActiveSet ? (
          <Card style={{ marginTop: spacing.base }}>
            <Text style={[
              typography.display,
              { color: theme.accent, fontSize: 28, lineHeight: 32, textAlign: 'center', marginBottom: 4 },
            ]}>
              SET {currentSetNumber}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginBottom: spacing.base }]}>
              Enter the final score for this set
            </Text>

            <View style={styles.setEntryRow}>
              <PlayerScoreColumn
                player={match.player1}
                value={currentP1}
                onChange={(v) => setCurrentP1(v.replace(/[^0-9]/g, ''))}
                inputRef={p1InputRef}
                isWinning={(parseInt(currentP1) || 0) > (parseInt(currentP2) || 0)}
              />
              <Text style={[styles.dash, { color: theme.textMuted }]}>–</Text>
              <PlayerScoreColumn
                player={match.player2}
                value={currentP2}
                onChange={(v) => setCurrentP2(v.replace(/[^0-9]/g, ''))}
                isWinning={(parseInt(currentP2) || 0) > (parseInt(currentP1) || 0)}
              />
            </View>

            <Button
              title={`Save Set ${currentSetNumber}`}
              onPress={saveCurrentSet}
              loading={saving}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="checkmark-circle-outline"
              style={{ marginTop: spacing.base }}
            />
          </Card>
        ) : (
          // Match decided — show summary card with reset hint.
          <Card style={{ marginTop: spacing.base }}>
            <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
              <Ionicons name="trophy" size={32} color={theme.accent} />
              <Text style={[
                typography.display,
                { color: theme.textPrimary, fontSize: 22, lineHeight: 26, marginTop: spacing.sm, textAlign: 'center' },
              ]}>
                {p1Wins > p2Wins ? match.player1?.name : match.player2?.name} WINS
              </Text>
              <Text style={[
                typography.scoreboard,
                { color: theme.accent, fontSize: 48, lineHeight: 52, textShadowColor: theme.accentGlow, textShadowRadius: 18, marginTop: spacing.xs },
              ]}>
                {p1Wins}–{p2Wins}
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
                Tap any saved set above to revise the score.
              </Text>
            </View>
          </Card>
        )}

        {/* Live broadcast helpers — kept from the previous flow. */}
        <Button
          title="Broadcast Current Set"
          onPress={async () => {
            const idx = committed.length;
            const p1 = parseInt(currentP1) || 0;
            const p2 = parseInt(currentP2) || 0;
            try {
              await matchesApi.updateLiveScore(matchId, idx + 1, p1, p2, false, false);
              toast('Live score sent to viewers.', 'info');
            } catch (e: any) {
              Alert.alert('Failed', e?.response?.data?.message ?? 'Broadcast failed.');
            }
          }}
          variant="ghost" size="md" fullWidth uppercase={false}
          leftIcon="radio-outline"
          style={{ marginTop: spacing.base }}
        />

        <Button
          title="Show in Live Games"
          onPress={async () => {
            try {
              await matchesApi.registerAsLiveGame(matchId);
              toast('Listed in Live Games', 'success');
            } catch (e: any) {
              Alert.alert('Failed', e?.response?.data?.message ?? 'Could not list as live.');
            }
          }}
          variant="ghost" size="md" fullWidth uppercase={false}
          leftIcon="megaphone-outline"
          style={{ marginTop: spacing.xs }}
        />
      </View>
    </KeyboardAware>
  );
}

/* ──────────────────────────────────────────────────────────── */

function PlayerHero({ player, setsWon }: { player: MatchDetail['player1']; setsWon: number }) {
  const { theme } = useSport();
  return (
    <View style={styles.pSide}>
      <Avatar
        name={player?.name}
        photoUrl={player?.profilePhotoUrl}
        size={64}
        borderColor={theme.accent}
        playerId={player?.id}
      />
      <Text style={styles.pName} numberOfLines={1}>
        {player?.name}
      </Text>
      <Text style={[
        typography.scoreboard,
        { color: theme.accent, fontSize: 44, lineHeight: 48, textShadowColor: theme.accentGlow, textShadowRadius: 16 },
      ]}>
        {setsWon}
      </Text>
    </View>
  );
}

function PlayerScoreColumn({
  player, value, onChange, inputRef, isWinning,
}: {
  player: MatchDetail['player1'];
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  isWinning: boolean;
}) {
  const { theme } = useSport();
  return (
    <View style={styles.scoreCol}>
      <Avatar
        name={player?.name}
        photoUrl={player?.profilePhotoUrl}
        size={56}
        borderColor={isWinning ? theme.accent : theme.border}
        playerId={player?.id}
      />
      <Text style={[
        typography.smallStrong,
        { color: theme.textPrimary, marginTop: spacing.xs, textAlign: 'center' },
      ]} numberOfLines={1}>
        {player?.name}
      </Text>
      <TextInput
        ref={inputRef}
        style={[
          styles.bigInput,
          {
            backgroundColor: theme.cardBg,
            borderColor: isWinning && value ? theme.accent : theme.border,
            color: isWinning && value ? theme.accent : theme.textPrimary,
          },
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.textMuted}
        maxLength={3}
        textAlign="center"
        selectTextOnFocus
      />
    </View>
  );
}

function SavedSetPill({
  setNumber, p1, p2, onEdit,
}: { setNumber: number; p1: number; p2: number; onEdit: () => void }) {
  const { theme } = useSport();
  const p1Won = p1 > p2;
  return (
    <Pressable onPress={onEdit} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <View style={[styles.savedPill, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[typography.overline, { color: theme.textMuted, fontSize: 9 }]}>SET {setNumber}</Text>
        <View style={styles.pillScores}>
          <Text style={[
            typography.h3,
            { fontFamily: typography.display.fontFamily, fontSize: 20, color: p1Won ? theme.accent : theme.textPrimary },
          ]}>
            {p1}
          </Text>
          <Text style={[typography.body, { color: theme.textMuted, marginHorizontal: 4 }]}>–</Text>
          <Text style={[
            typography.h3,
            { fontFamily: typography.display.fontFamily, fontSize: 20, color: !p1Won ? theme.accent : theme.textPrimary },
          ]}>
            {p2}
          </Text>
        </View>
        <Ionicons name="create-outline" size={11} color={theme.textMuted} style={{ position: 'absolute', top: 4, right: 4 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  pSide: { flex: 1, alignItems: 'center', gap: 6 },
  pName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  vs: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.4,
    fontFamily: typography.display.fontFamily,
  },

  rulesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  savedPill: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 84,
    alignItems: 'center',
  },
  pillScores: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },

  setEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dash: {
    fontSize: 32,
    fontFamily: typography.display.fontFamily,
    paddingTop: 60,
  },
  bigInput: {
    borderWidth: 2,
    borderRadius: radii.md,
    width: 92,
    height: 76,
    fontSize: 42,
    fontWeight: '800',
    fontFamily: typography.display.fontFamily,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
});
