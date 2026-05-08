import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, type SearchResults } from '../../api';
import { useSport } from '../../context/SportContext';
import { navigate as navRoot } from '../../navigation/navigationRef';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, EmptyState } from '../../components/ui';

const RECENT_KEY = 'mysetmatch.recentSearches';
const MAX_RECENT = 6;

type ResultRow =
  | { kind: 'header'; title: string; count: number }
  | { kind: 'player'; item: SearchResults['players'][number] }
  | { kind: 'tournament'; item: SearchResults['tournaments'][number] }
  | { kind: 'group'; item: SearchResults['groups'][number] }
  | { kind: 'listing'; item: SearchResults['listings'][number] };

export default function SearchScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Autofocus on mount
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await searchApi.search(query.trim(), currentSport?.id);
        setResults(data);
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, currentSport?.id]);

  const rows: ResultRow[] = useMemo(() => {
    if (!results) return [];
    // Each list is optional on the wire — fall back to [] so a partial response
    // can never blow up the render.
    const players     = results.players     ?? [];
    const tournaments = results.tournaments ?? [];
    const groups      = results.groups      ?? [];
    const listings    = results.listings    ?? [];

    const out: ResultRow[] = [];
    if (players.length) {
      out.push({ kind: 'header', title: 'Players', count: players.length });
      out.push(...players.map((p) => ({ kind: 'player', item: p } as const)));
    }
    if (tournaments.length) {
      out.push({ kind: 'header', title: 'Tournaments', count: tournaments.length });
      out.push(...tournaments.map((t) => ({ kind: 'tournament', item: t } as const)));
    }
    if (groups.length) {
      out.push({ kind: 'header', title: 'My Groups', count: groups.length });
      out.push(...groups.map((g) => ({ kind: 'group', item: g } as const)));
    }
    if (listings.length) {
      out.push({ kind: 'header', title: 'Marketplace', count: listings.length });
      out.push(...listings.map((l) => ({ kind: 'listing', item: l } as const)));
    }
    return out;
  }, [results]);

  const hasResults = rows.some((r) => r.kind !== 'header');

  // Modal sits on the root stack. Use the global navigationRef so the call
  // doesn't rely on this screen's instance — which is unmounted by the time
  // setTimeout fires after a goBack().
  function openPlayer(playerId: string) {
    // PlayerProfile is a sibling on the root stack — replace ourselves with it.
    navigation.replace('PlayerProfile', { playerId });
  }
  function openTournament(id: string) {
    navRoot('Main', { screen: 'Play', params: { screen: 'TournamentDetail', params: { id } } });
    navigation.goBack();
  }
  function openGroup(id: string, name: string) {
    navRoot('Main', {
      screen: 'Community',
      params: { screen: 'GroupDetail', params: { groupId: id, groupName: name } },
    });
    navigation.goBack();
  }
  function openListing(id: string) {
    navRoot('Main', {
      screen: 'Market',
      params: { screen: 'ListingDetail', params: { id } },
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.pageBg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.85)" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search everything…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Results */}
      {query.trim().length < 2 ? (
        <EmptyPrompt />
      ) : loading && !results ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : !hasResults ? (
        <EmptyState
          icon="search-outline"
          title="No matches"
          message={`Nothing found for "${query.trim()}". Try a different term.`}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => {
            if (item.kind === 'header') return <SectionHead title={item.title} count={item.count} />;
            if (item.kind === 'player')
              return <PlayerRow player={item.item} onPress={() => openPlayer(item.item.id)} />;
            if (item.kind === 'tournament')
              return <TournamentRow t={item.item} onPress={() => openTournament(item.item.id)} />;
            if (item.kind === 'group')
              return <GroupRow g={item.item} onPress={() => openGroup(item.item.id, item.item.name)} />;
            return <ListingRow l={item.item} onPress={() => openListing(item.item.id)} />;
          }}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

function EmptyPrompt() {
  const { theme } = useSport();
  const hints = [
    { icon: 'person-outline', label: 'Players' },
    { icon: 'trophy-outline', label: 'Tournaments' },
    { icon: 'people-outline', label: 'Groups' },
    { icon: 'pricetag-outline', label: 'Marketplace' },
  ] as const;
  return (
    <View style={styles.empty}>
      <Text style={[typography.small, { color: theme.textMuted, marginBottom: spacing.md }]}>
        Type to search:
      </Text>
      <View style={styles.hintGrid}>
        {hints.map((h) => (
          <View key={h.label} style={[styles.hintPill, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name={h.icon} size={14} color={theme.secondary} />
            <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>{h.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  const { theme } = useSport();
  return (
    <View style={styles.sectionHead}>
      <Text style={[typography.overline, { color: theme.secondary }]}>{title}</Text>
      <Text style={[typography.caption, { color: theme.textMuted }]}>{count}</Text>
    </View>
  );
}

function PlayerRow({
  player, onPress,
}: { player: SearchResults['players'][number]; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: theme.cardBg }, shadows.sm, pressed && { opacity: 0.85 }]}>
      <Avatar name={player.name} photoUrl={player.profilePhotoUrl} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>{player.name}</Text>
        <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
          {[player.clubName, player.city, player.country].filter(Boolean).join(' · ') || 'Player'}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.featureBg }]}>
        <Text style={[typography.smallStrong, { color: theme.primary }]}>{player.globalRating}</Text>
      </View>
    </Pressable>
  );
}

function TournamentRow({
  t, onPress,
}: { t: SearchResults['tournaments'][number]; onPress: () => void }) {
  const { theme } = useSport();
  const d = new Date(t.startDate);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: theme.cardBg }, shadows.sm, pressed && { opacity: 0.85 }]}>
      <View style={[styles.dateBlock, { backgroundColor: theme.featureBg }]}>
        <Text style={[typography.caption, { color: theme.secondary, fontSize: 10, fontWeight: '800' }]}>
          {d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={[typography.h3, { color: theme.primary, fontSize: 18 }]}>{d.getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>{t.name}</Text>
        <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
          {[t.sportName, t.city, t.country].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

function GroupRow({
  g, onPress,
}: { g: SearchResults['groups'][number]; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: theme.cardBg }, shadows.sm, pressed && { opacity: 0.85 }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.featureBg }]}>
        <Ionicons name="people" size={18} color={theme.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{g.name}</Text>
        <Text style={[typography.caption, { color: theme.textMuted }]}>
          {g.memberCount} members · {g.postCount} posts
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

function ListingRow({
  l, onPress,
}: { l: SearchResults['listings'][number]; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: theme.cardBg }, shadows.sm, pressed && { opacity: 0.85 }]}>
      {l.imageUrl ? (
        <Image source={{ uri: l.imageUrl }} style={styles.listingImg} />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: theme.featureBg }]}>
          <Ionicons name="pricetag" size={18} color={theme.secondary} />
        </View>
      )}
      <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]} numberOfLines={2}>
        {l.title}
      </Text>
      <Text style={[typography.h3, { color: theme.primary, fontSize: 15 }]}>
        ${l.price.toFixed(0)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm + 2,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill, borderWidth: 1,
    minHeight: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  hintGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  hintPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill, borderWidth: 1,
  },

  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: spacing.sm, paddingBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  dateBlock: {
    width: 48, height: 48, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.pill,
  },
  listingImg: { width: 40, height: 40, borderRadius: 8 },
});
