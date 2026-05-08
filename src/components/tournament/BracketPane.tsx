import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { navigate } from '../../navigation/navigationRef';
import type { BracketMatch, BracketRound } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, EmptyState } from '../ui';

interface Props {
  rounds: BracketRound[] | null;
}

const MATCH_W = 240;
const MATCH_H = 96;
const COL_GAP = 44;
const MATCH_V_GAP = 14;
const HEADER_H = 36;
const TREE_PAD = spacing.base;
const TREE_AVATAR = 24;
const LIST_AVATAR = 32;

/**
 * Tournament bracket — Group Stage section first, then Knockout Stage as a
 * horizontal SVG tree. Player avatars render alongside names in both.
 */
export default function BracketPane({ rounds }: Props) {
  const { theme } = useSport();

  if (!rounds || rounds.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <EmptyState
          icon="git-branch-outline"
          title="Brackets not ready"
          message="The bracket will appear here once the tournament begins."
        />
      </View>
    );
  }

  const isKnockout = (r: BracketRound) => !/group/i.test(r.stage);
  // Group rounds sorted alphabetically by round name → "Group A" before "Group B".
  const groupRounds = rounds
    .filter(r => !isKnockout(r))
    .slice()
    .sort((a, b) => (a.round ?? '').localeCompare(b.round ?? ''));
  const treeRounds = rounds
    .filter(isKnockout)
    .slice()
    .sort((a, b) => b.matches.length - a.matches.length);

  return (
    <View>
      {groupRounds.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <StageBanner
            label="Group Stage"
            subtitle={`${groupRounds.length} ${groupRounds.length === 1 ? 'group' : 'groups'}`}
          />
          {groupRounds.map((round, ri) => (
            <GroupSection key={`group-${ri}`} round={round} />
          ))}
        </View>
      ) : null}

      {treeRounds.length > 0 ? (
        <View>
          <StageBanner
            label="Knockout Stage"
            subtitle={`${treeRounds[0].matches.length * 2} players · ${treeRounds.length} rounds`}
          />
          <BracketTree rounds={treeRounds} />
        </View>
      ) : null}
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────
   Group section — header + standings table + matches
   ────────────────────────────────────────────────────────────── */

interface PlayerStanding {
  id: string;
  name: string;
  photoUrl?: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  /** Site rule: 2 points per win, 1 per loss. Adjust if your site uses another system. */
  points: number;
}

function computeStandings(matches: BracketMatch[]): PlayerStanding[] {
  const map = new Map<string, PlayerStanding>();
  const ensure = (p: BracketMatch['player1']) => {
    if (!p) return null;
    let row = map.get(p.id);
    if (!row) {
      row = {
        id: p.id,
        name: p.name,
        photoUrl: p.profilePhotoUrl,
        played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, points: 0,
      };
      map.set(p.id, row);
    }
    return row;
  };

  for (const m of matches) {
    if (m.status !== 'Completed') continue;
    const a = ensure(m.player1);
    const b = ensure(m.player2);
    if (!a || !b) continue;
    a.played++; b.played++;
    a.setsWon  += m.player1SetsWon; a.setsLost += m.player2SetsWon;
    b.setsWon  += m.player2SetsWon; b.setsLost += m.player1SetsWon;
    if (m.winnerId === a.id) { a.wins++; b.losses++; }
    else if (m.winnerId === b.id) { b.wins++; a.losses++; }
  }

  // Make sure players who haven't played yet still appear in standings.
  for (const m of matches) {
    if (m.player1) ensure(m.player1);
    if (m.player2) ensure(m.player2);
  }

  for (const row of map.values()) {
    row.points = row.wins * 2 + row.losses * 1;
  }

  return Array.from(map.values()).sort((a, b) =>
    b.points - a.points
    || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost)
    || b.setsWon - a.setsWon
    || a.name.localeCompare(b.name),
  );
}

function GroupSection({ round }: { round: BracketRound }) {
  const { theme } = useSport();
  const standings = useMemo(() => computeStandings(round.matches), [round.matches]);
  return (
    <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.base }}>
      <View style={[
        groupStyles.banner,
        { backgroundColor: theme.featureBg, borderColor: `${theme.accent}40` },
      ]}>
        <View style={[groupStyles.bannerBar, { backgroundColor: theme.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.overline, { color: theme.accent, fontSize: 10 }]}>
            {round.stage.toUpperCase()}
          </Text>
          <Text style={[
            typography.display,
            { color: theme.textPrimary, fontSize: 24, lineHeight: 26, letterSpacing: 1 },
          ]}>
            {round.round.toUpperCase()}
          </Text>
        </View>
        <View style={[groupStyles.count, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="people" size={11} color={theme.textSecondary} />
          <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '700' }]}>
            {standings.length}
          </Text>
        </View>
      </View>

      {standings.length > 0 ? (
        <View style={[groupStyles.table, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={[groupStyles.tableHeader, { borderBottomColor: theme.border }]}>
            <Text style={[groupStyles.col, groupStyles.colRank, { color: theme.textMuted }]}>#</Text>
            <Text style={[groupStyles.col, groupStyles.colPlayer, { color: theme.textMuted }]}>PLAYER</Text>
            <Text style={[groupStyles.col, groupStyles.colNum, { color: theme.textMuted }]}>P</Text>
            <Text style={[groupStyles.col, groupStyles.colNum, { color: theme.textMuted }]}>W</Text>
            <Text style={[groupStyles.col, groupStyles.colNum, { color: theme.textMuted }]}>L</Text>
            <Text style={[groupStyles.col, groupStyles.colSets, { color: theme.textMuted }]}>SETS</Text>
            <Text style={[groupStyles.col, groupStyles.colNum, { color: theme.textMuted }]}>PTS</Text>
          </View>
          {standings.map((row, i) => (
            <Pressable
              key={row.id}
              onPress={() => navigate('PlayerProfile', { playerId: row.id })}
              style={({ pressed }) => [
                groupStyles.tableRow,
                {
                  borderBottomColor: theme.divider,
                  borderBottomWidth: i === standings.length - 1 ? 0 : 1,
                },
                pressed && { backgroundColor: theme.pageBgTint },
              ]}
            >
              <Text style={[
                groupStyles.col, groupStyles.colRank,
                {
                  color: i === 0 ? theme.accent : theme.textMuted,
                  fontFamily: typography.display.fontFamily,
                  fontSize: 14,
                },
              ]}>
                {i + 1}
              </Text>
              <Text
                style={[
                  groupStyles.col, groupStyles.colPlayer,
                  typography.bodyStrong,
                  { color: theme.textPrimary, fontSize: 13 },
                ]}
                numberOfLines={1}
              >
                {row.name}
              </Text>
              <NumCell value={row.played} color={theme.textSecondary} />
              <NumCell value={row.wins}   color={theme.successGreen} bold />
              <NumCell value={row.losses} color={theme.dangerRed} />
              <Text style={[
                groupStyles.col, groupStyles.colSets,
                { color: theme.textPrimary, fontFamily: typography.display.fontFamily, fontSize: 13 },
              ]}>
                {row.setsWon}–{row.setsLost}
              </Text>
              <Text style={[
                groupStyles.col, groupStyles.colNum,
                {
                  color: theme.accent,
                  fontFamily: typography.display.fontFamily,
                  fontSize: 16,
                  letterSpacing: 0.4,
                },
              ]}>
                {row.points}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={[typography.overline, { color: theme.textMuted, marginTop: spacing.md, marginBottom: spacing.sm, fontSize: 10 }]}>
        MATCHES · {round.matches.length}
      </Text>
      {round.matches.map((m, mi) => (
        <ListMatchCard key={m.id ?? mi} match={m} />
      ))}
    </View>
  );
}

function NumCell({ value, color, bold }: { value: number; color: string; bold?: boolean }) {
  return (
    <Text style={[
      groupStyles.col, groupStyles.colNum,
      { color, fontWeight: bold ? '800' : '600', fontSize: 13 },
    ]}>
      {value}
    </Text>
  );
}

const groupStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  bannerBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  count: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  table: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
  },
  col: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  colRank: { width: 22, textAlign: 'left' },
  colPlayer: { flex: 1, paddingRight: spacing.xs },
  colNum: { width: 22, textAlign: 'center' },
  colSets: { width: 44, textAlign: 'center' },
});

/* ──────────────────────────────────────────────────────────────
   Stage banner — used at the top of Group Stage / Knockout Stage
   ────────────────────────────────────────────────────────────── */

function StageBanner({ label, subtitle }: { label: string; subtitle?: string }) {
  const { theme } = useSport();
  return (
    <View style={[bannerStyles.wrap, { borderColor: theme.border }]}>
      <View style={[bannerStyles.dot, { backgroundColor: theme.accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={[
          typography.display,
          { color: theme.textPrimary, fontSize: 22, lineHeight: 26, letterSpacing: 1 },
        ]}>
          {label.toUpperCase()}
        </Text>
        {subtitle ? (
          <Text style={[typography.overline, { color: theme.textMuted, fontSize: 10 }]}>
            {subtitle.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  dot: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
});

/* ──────────────────────────────────────────────────────────────
   Horizontal bracket tree with SVG connectors + avatars
   ────────────────────────────────────────────────────────────── */

function BracketTree({ rounds }: { rounds: BracketRound[] }) {
  const { theme } = useSport();

  const positions = useMemo(() => {
    const grid: number[][] = [];
    for (let r = 0; r < rounds.length; r++) {
      const arr: number[] = [];
      for (let i = 0; i < rounds[r].matches.length; i++) {
        if (r === 0) {
          arr.push(i * (MATCH_H + MATCH_V_GAP));
        } else {
          const prev = grid[r - 1];
          const a = prev[2 * i];
          const b = prev[2 * i + 1] ?? a;
          arr.push(a !== undefined ? (a + (b ?? a)) / 2 : i * (MATCH_H + MATCH_V_GAP));
        }
      }
      grid.push(arr);
    }
    return grid;
  }, [rounds]);

  const totalW = rounds.length * MATCH_W + (rounds.length - 1) * COL_GAP;
  const round0 = positions[0] ?? [];
  const totalH = round0.length > 0
    ? round0[round0.length - 1] + MATCH_H
    : MATCH_H;

  const connectors: string[] = [];
  for (let r = 1; r < rounds.length; r++) {
    const colXRight = (r - 1) * (MATCH_W + COL_GAP) + MATCH_W;
    const colXLeft  = r * (MATCH_W + COL_GAP);
    const midX      = colXRight + COL_GAP / 2;
    for (let i = 0; i < rounds[r].matches.length; i++) {
      const a = positions[r - 1][2 * i];
      const b = positions[r - 1][2 * i + 1];
      const c = positions[r][i];
      if (c === undefined) continue;
      const childCY = c + MATCH_H / 2;
      if (a !== undefined) {
        const aCY = a + MATCH_H / 2;
        connectors.push(`M${colXRight} ${aCY} H${midX} V${childCY} H${colXLeft}`);
      }
      if (b !== undefined && b !== a) {
        const bCY = b + MATCH_H / 2;
        connectors.push(`M${colXRight} ${bCY} H${midX} V${childCY} H${colXLeft}`);
      }
    }
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: TREE_PAD, paddingBottom: spacing.sm }}
    >
      <View style={{ width: totalW }}>
        {/* Round name header strip */}
        <View style={{ flexDirection: 'row', height: HEADER_H }}>
          {rounds.map((round, r) => (
            <View
              key={`label-${r}`}
              style={{
                width: MATCH_W,
                marginLeft: r === 0 ? 0 : COL_GAP,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[typography.overline, { color: theme.accent, fontSize: 11 }]} numberOfLines={1}>
                {round.round}
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>
                {round.matches.length} {round.matches.length === 1 ? 'MATCH' : 'MATCHES'}
              </Text>
            </View>
          ))}
        </View>

        {/* Tree area: SVG connectors + absolutely-positioned match cards */}
        <View style={{ width: totalW, height: totalH }}>
          <Svg
            width={totalW}
            height={totalH}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          >
            {connectors.map((d, i) => (
              <Path key={i} d={d} stroke={theme.borderStrong} strokeWidth={1.5} fill="none" />
            ))}
          </Svg>
          {rounds.map((round, r) =>
            round.matches.map((match, i) => (
              <View
                key={match.id ?? `${r}-${i}`}
                style={{
                  position: 'absolute',
                  left: r * (MATCH_W + COL_GAP),
                  top: positions[r][i],
                  width: MATCH_W,
                  height: MATCH_H,
                }}
              >
                <TreeMatchCard match={match} />
              </View>
            )),
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/* ──────────────────────────────────────────────────────────────
   Match cards
   ────────────────────────────────────────────────────────────── */

function TreeMatchCard({ match }: { match: BracketMatch }) {
  const { theme } = useSport();
  const p1Won = !!(match.winnerId && match.player1 && match.winnerId === match.player1.id);
  const p2Won = !!(match.winnerId && match.player2 && match.winnerId === match.player2.id);
  const statusColor =
    match.status === 'Completed' ? theme.successGreen
    : match.status === 'InProgress' ? theme.warning
    : theme.borderStrong;

  return (
    <View style={[
      treeStyles.card,
      { backgroundColor: theme.cardBg, borderColor: theme.border, borderLeftColor: statusColor },
    ]}>
      <PlayerLine
        player={match.player1}
        sets={match.player1SetsWon}
        won={p1Won}
        avatarSize={TREE_AVATAR}
      />
      <View style={[treeStyles.divider, { backgroundColor: theme.divider }]} />
      <PlayerLine
        player={match.player2}
        sets={match.player2SetsWon}
        won={p2Won}
        avatarSize={TREE_AVATAR}
      />
    </View>
  );
}

function ListMatchCard({ match }: { match: BracketMatch }) {
  const { theme } = useSport();
  const p1Won = !!(match.winnerId && match.player1 && match.winnerId === match.player1.id);
  const p2Won = !!(match.winnerId && match.player2 && match.winnerId === match.player2.id);
  const statusColor =
    match.status === 'Completed' ? theme.successGreen
    : match.status === 'InProgress' ? theme.warning
    : theme.border;

  return (
    <View style={[
      listStyles.card,
      { backgroundColor: theme.cardBg, borderColor: theme.border, borderLeftColor: statusColor },
    ]}>
      <PlayerLine
        player={match.player1}
        sets={match.player1SetsWon}
        won={p1Won}
        avatarSize={LIST_AVATAR}
      />
      <View style={[treeStyles.divider, { backgroundColor: theme.divider }]} />
      <PlayerLine
        player={match.player2}
        sets={match.player2SetsWon}
        won={p2Won}
        avatarSize={LIST_AVATAR}
      />
      {match.sets.length > 0 ? (
        <View style={[listStyles.setsRow, { borderTopColor: theme.divider }]}>
          {match.sets.map((s) => (
            <View key={s.setNumber} style={[listStyles.setCell, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>S{s.setNumber}</Text>
              <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>
                {s.player1Score}–{s.player2Score}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* Shared player row used by both the tree cards and group-list cards. */
function PlayerLine({
  player, sets, won, avatarSize,
}: {
  player: BracketMatch['player1'];
  sets: number;
  won: boolean;
  avatarSize: number;
}) {
  const { theme } = useSport();
  const name = player?.name ?? 'TBD';
  const playerId = player?.id;
  const photoUrl = player?.profilePhotoUrl;

  const nameNode = (
    <Text
      style={[
        { flex: 1, fontSize: 13 },
        won ? { color: theme.accent, fontWeight: '800' } : { color: theme.textPrimary, fontWeight: '500' },
      ]}
      numberOfLines={1}
    >
      {name}
    </Text>
  );

  return (
    <View style={treeStyles.playerRow}>
      <Avatar
        name={name}
        photoUrl={photoUrl}
        size={avatarSize}
        playerId={playerId}
        borderColor={won ? theme.accent : undefined}
      />
      {playerId ? (
        <Pressable
          onPress={() => navigate('PlayerProfile', { playerId })}
          hitSlop={4}
          style={{ flex: 1 }}
        >
          {nameNode}
        </Pressable>
      ) : nameNode}
      <Text
        style={[
          treeStyles.sets,
          won ? { color: theme.accent } : { color: theme.textMuted },
        ]}
      >
        {sets}
      </Text>
    </View>
  );
}

const treeStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  sets: {
    fontSize: 18,
    width: 24,
    textAlign: 'right',
    fontFamily: typography.display.fontFamily,
    letterSpacing: 0.4,
  },
  divider: { height: 1 },
});

const listStyles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  setsRow: {
    flexDirection: 'row', gap: spacing.xs,
    paddingTop: spacing.sm, marginTop: spacing.xs,
    borderTopWidth: 1, flexWrap: 'wrap',
  },
  setCell: {
    alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
});

/* ──────────────────────────────────────────────────────────────
   Group-stage round header
   ────────────────────────────────────────────────────────────── */

function RoundHeader({ stage, round, count }: { stage: string; round: string; count: number }) {
  const { theme } = useSport();
  return (
    <View style={[
      headerStyles.wrap,
      { backgroundColor: theme.featureBg, borderColor: theme.border },
    ]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.overline, { color: theme.accent, fontSize: 10 }]}>
          {stage.toUpperCase()}
        </Text>
        <Text style={[
          typography.h3,
          { color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 },
        ]}>
          {round}
        </Text>
      </View>
      <View style={[headerStyles.count, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Ionicons name="people" size={11} color={theme.textSecondary} />
        <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '700' }]}>{count}</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  count: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
});
