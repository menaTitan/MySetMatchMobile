import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, type SearchResults } from '../api';
import { useSport } from '../context/SportContext';
import { radii, shadows, spacing, typography } from '../theme';
import { Avatar } from './ui';

type RowKind = 'player' | 'tournament' | 'group' | 'listing';

type Hit =
  | { kind: 'player'; data: SearchResults['players'][number] }
  | { kind: 'tournament'; data: SearchResults['tournaments'][number] }
  | { kind: 'group'; data: SearchResults['groups'][number] }
  | { kind: 'listing'; data: SearchResults['listings'][number] };

interface Props {
  onPlayer: (id: string) => void;
  onTournament: (id: string) => void;
  onGroup: (id: string, name: string) => void;
  onListing: () => void;
}

/**
 * Inline search for the Dashboard hero. Real TextInput, debounced API call,
 * results render in a card directly below the input.
 */
export default function HomeSearch({
  onPlayer, onTournament, onGroup, onListing,
}: Props) {
  const { currentSport, theme } = useSport();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = query.trim();
    if (t.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { data } = await searchApi.search(t, currentSport?.id);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, currentSport?.id]);

  const hits: Hit[] = [];
  if (results) {
    results.players.slice(0, 4).forEach((p) => hits.push({ kind: 'player', data: p }));
    results.tournaments.slice(0, 3).forEach((t) => hits.push({ kind: 'tournament', data: t }));
    results.groups.slice(0, 3).forEach((g) => hits.push({ kind: 'group', data: g }));
    results.listings.slice(0, 3).forEach((l) => hits.push({ kind: 'listing', data: l }));
  }

  const showDropdown = focused && query.trim().length >= 2;
  const showEmpty = showDropdown && !loading && results !== null && hits.length === 0;

  return (
    <View>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' },
        ]}
      >
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.85)" />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search players, tournaments…"
          placeholderTextColor="rgba(255,255,255,0.7)"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => { setQuery(''); inputRef.current?.focus(); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        ) : (
          <View style={[styles.hint, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="sparkles" size={10} color={theme.accent} />
            <Text style={styles.hintText}>ALL</Text>
          </View>
        )}
      </View>

      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: theme.cardBg }, shadows.lg]}>
          {loading && hits.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : showEmpty ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={22} color={theme.textMuted} />
              <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: 6 }]}>
                No matches
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={1}>
                Nothing for "{query.trim()}"
              </Text>
            </View>
          ) : (
            <View>
              {hits.map((hit, i) => (
                <View key={`${hit.kind}-${i}`}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
                  <Row
                    hit={hit}
                    onPress={() => {
                      setQuery('');
                      setFocused(false);
                      inputRef.current?.blur();
                      if (hit.kind === 'player') onPlayer(hit.data.id);
                      else if (hit.kind === 'tournament') onTournament(hit.data.id);
                      else if (hit.kind === 'group') onGroup(hit.data.id, hit.data.name);
                      else onListing();
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Row({ hit, onPress }: { hit: Hit; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pageBg }]}
    >
      <Leading hit={hit} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
          {primaryText(hit)}
        </Text>
        <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
          {secondaryText(hit)}
        </Text>
      </View>
      <Tag kind={hit.kind} />
    </Pressable>
  );
}

function Leading({ hit }: { hit: Hit }) {
  const { theme } = useSport();
  if (hit.kind === 'player') {
    return <Avatar name={hit.data.name} photoUrl={hit.data.profilePhotoUrl} size={36} />;
  }
  if (hit.kind === 'listing' && hit.data.imageUrl) {
    return <Image source={{ uri: hit.data.imageUrl }} style={styles.img} />;
  }
  const iconName: keyof typeof Ionicons.glyphMap =
    hit.kind === 'tournament' ? 'trophy'
    : hit.kind === 'group' ? 'people'
    : 'pricetag';
  return (
    <View style={[styles.iconBox, { backgroundColor: theme.featureBg }]}>
      <Ionicons name={iconName} size={16} color={theme.secondary} />
    </View>
  );
}

function Tag({ kind }: { kind: RowKind }) {
  const { theme } = useSport();
  const label = kind === 'player' ? 'Player'
    : kind === 'tournament' ? 'Event'
    : kind === 'group' ? 'Group'
    : 'Listing';
  return (
    <View style={[styles.tag, { backgroundColor: theme.featureBg }]}>
      <Text style={[typography.caption, { color: theme.secondary, fontSize: 10, fontWeight: '800' }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function primaryText(hit: Hit): string {
  if (hit.kind === 'player') return hit.data.name;
  if (hit.kind === 'tournament') return hit.data.name;
  if (hit.kind === 'group') return hit.data.name;
  return hit.data.title;
}

function secondaryText(hit: Hit): string {
  if (hit.kind === 'player') {
    return [hit.data.clubName, hit.data.city, hit.data.country].filter(Boolean).join(' · ') || 'Player';
  }
  if (hit.kind === 'tournament') {
    const d = new Date(hit.data.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return [d, hit.data.sportName, hit.data.city].filter(Boolean).join(' · ');
  }
  if (hit.kind === 'group') {
    return `${hit.data.memberCount} members · ${hit.data.postCount} posts`;
  }
  return `$${hit.data.price.toFixed(0)} ${hit.data.currency}`;
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: typography.bodyStrong.fontFamily,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  hintText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: radii.lg,
    overflow: 'hidden',
    paddingVertical: 4,
    zIndex: 20,
    elevation: 12,
  },
  center: { padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing.lg, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.md },
  iconBox: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  img: { width: 36, height: 36, borderRadius: radii.sm },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
});
