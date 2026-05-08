import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { HeroHeader, SearchBar, SegmentedTabs, type SegmentedTab } from '../../components/ui';

import TournamentsScreen from './TournamentsScreen';
import MatchesScreen from './MatchesScreen';
import LiveScoreScreen from './LiveScoreScreen';
import LeaderboardScreen from './LeaderboardScreen';

type Section = 'tournaments' | 'matches' | 'live' | 'leaderboard';

const SECTIONS: SegmentedTab<Section>[] = [
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
      <HeroHeader
        variant="compact"
        title="Play"
        subtitle="Tournaments, matches, live scores & rankings"
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={() => navigation.navigate('StartNewGame')} style={styles.headerBtn}>
              <Ionicons name="play-circle-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('TournamentArchive')} style={styles.headerBtn}>
              <Ionicons name="archive-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        }
      >
        <SearchBar onPress={() => navigation.navigate('Search')} />
      </HeroHeader>

      <SegmentedTabs tabs={SECTIONS} value={section} onChange={setSection} variant="pill" />

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
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
