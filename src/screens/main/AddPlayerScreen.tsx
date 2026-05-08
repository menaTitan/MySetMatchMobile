import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, type PlayerSearchRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Card, EmptyState, PageHeader, SearchBar, useToast } from '../../components/ui';

export default function AddPlayerScreen({ route, navigation }: any) {
  const { tournamentId, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PlayerSearchRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await tournamentsApi.searchPlayers(q.trim(), tournamentId);
        setResults(data);
      } catch {} finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, tournamentId]);

  async function add(p: PlayerSearchRow) {
    Alert.alert('Add player', `Add ${p.name} to ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: async () => {
        try {
          await tournamentsApi.addPlayer(tournamentId, p.playerId);
          toast(`Added ${p.name}`, 'success');
          navigation.goBack();
        } catch (err: any) {
          Alert.alert('Failed', err?.response?.data?.message ?? 'Could not add player.');
        }
      } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Add Player" subtitle={name ?? 'Search players'} compact />
      <View style={{ padding: spacing.base }}>
        <SearchBar
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or city..."
          autoFocus
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(p) => p.playerId}
        contentContainerStyle={{ padding: spacing.base, paddingTop: 0, gap: spacing.xs + 2 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => add(item)}>
            <Card padding={0}>
              <View style={styles.row}>
                <Avatar name={item.name} photoUrl={item.profilePhotoUrl} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    Rating {item.globalRating}
                    {item.city ? ` · ${item.city}` : ''}{item.country ? `, ${item.country}` : ''}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          q.length < 2 ? (
            <EmptyState icon="search-outline" title="Search players" message="Type at least 2 characters." />
          ) : loading ? null : (
            <EmptyState icon="person-outline" title="No players found" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
  },
});
