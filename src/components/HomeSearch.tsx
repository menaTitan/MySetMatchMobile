import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';

/**
 * Dashboard search entry point. A Pressable shaped like a search input —
 * tap to open the full-screen SearchScreen (modal presentation). We used
 * to render a TextInput + inline dropdown here, but the dropdown clashed
 * with the surrounding ScrollView's stacking context: portions of the
 * dropdown rendered above the SportPickerBar visually, but taps still
 * routed through to the picker bar underneath. Routing to the dedicated
 * SearchScreen — the same one the Play tab uses — gives consistent,
 * reliable behavior on iOS and Android.
 */
interface Props {
  /** Legacy callback props are accepted but ignored — kept so the
   *  Dashboard call site doesn't need updating. SearchScreen handles
   *  its own navigation to player / tournament / group / listing. */
  onPlayer?: (id: string) => void;
  onTournament?: (id: string) => void;
  onGroup?: (id: string, name: string) => void;
  onListing?: (id: string) => void;
}

export default function HomeSearch(_props: Props) {
  const { theme } = useSport();
  const navigation = useNavigation<any>();

  return (
    <Pressable
      onPress={() => navigation.navigate('Search')}
      style={({ pressed }) => [
        styles.inputWrap,
        { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name="search" size={16} color="rgba(255,255,255,0.85)" />
      <Text style={styles.placeholder} numberOfLines={1}>
        Search players, tournaments…
      </Text>
      <View style={[styles.hint, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Ionicons name="sparkles" size={10} color={theme.accent} />
        <Text style={styles.hintText}>ALL</Text>
      </View>
    </Pressable>
  );
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
  placeholder: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
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
});
