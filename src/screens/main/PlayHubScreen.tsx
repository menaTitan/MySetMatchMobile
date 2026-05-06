import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { PageHeader, SearchBar } from '../../components/ui';

// Each sub-screen renders in its own tree; we avoid nesting stacks to keep scrolling snappy.
import TournamentsScreen from './TournamentsScreen';
import MatchesScreen from './MatchesScreen';
import LiveScoreScreen from './LiveScoreScreen';
import LeaderboardScreen from './LeaderboardScreen';

type Section = 'tournaments' | 'matches' | 'live' | 'leaderboard';

const SECTIONS: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tournaments', label: 'Tournaments', icon: 'trophy-outline' },
  { key: 'matches',     label: 'Matches',     icon: 'tennisball-outline' },
  { key: 'live',        label: 'Live',        icon: 'radio-outline' },
  { key: 'leaderboard', label: 'Rankings',    icon: 'medal-outline' },
];

export default function PlayHubScreen({ navigation }: any) {
  const { theme } = useSport();
  const [section, setSection] = useState<Section>('tournaments');

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader
        title="Play"
        subtitle="Tournaments, matches, live scores & rankings"
        compact
      >
        <SearchBar onPress={() => navigation.navigate('Search')} />
      </PageHeader>

      {/* Segmented control */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segRow}
        style={{ backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.divider, flexGrow: 0 }}
      >
        {SECTIONS.map((s) => {
          const active = section === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              style={[
                styles.seg,
                { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' },
              ]}
            >
              <Ionicons name={s.icon} size={14} color={active ? '#fff' : theme.textSecondary} />
              <Text style={[typography.smallStrong, { color: active ? '#fff' : theme.textSecondary }]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {section === 'tournaments' && <TournamentsScreen navigation={navigation} />}
        {section === 'matches' && <MatchesScreen navigation={navigation} />}
        {section === 'live' && <LiveScoreScreen />}
        {section === 'leaderboard' && <LeaderboardScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segRow: {
    padding: spacing.sm,
    gap: spacing.xs + 2,
  },
  seg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
});
