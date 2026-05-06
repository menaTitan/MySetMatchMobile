import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

/**
 * Tap-target "search" bar used in page headers. It's not an input — tapping it
 * opens the full SearchScreen so the keyboard can take the whole viewport.
 */
export default function SearchBar({
  onPress, placeholder = 'Search players, tournaments, groups…',
}: { onPress: () => void; placeholder?: string }) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name="search" size={16} color="rgba(255,255,255,0.85)" />
      <Text style={[typography.smallStrong, { color: 'rgba(255,255,255,0.75)', flex: 1 }]} numberOfLines={1}>
        {placeholder}
      </Text>
      <View style={[styles.hint, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Ionicons name="sparkles" size={10} color={theme.accent} />
        <Text style={styles.hintText}>ALL</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
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
