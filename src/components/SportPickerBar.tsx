import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import SportIcon from './ui/SportIcon';

export default function SportPickerBar() {
  const { sports, currentSport, setSport, theme } = useSport();
  if (sports.length === 0) return null;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
      {/* Gradient tint overlay for premium feel */}
      <LinearGradient
        colors={[theme.accentLight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sports.map((s) => {
          const active = currentSport?.id === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSport(s)}
              style={({ pressed }) => [
                styles.pill,
                active
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.cardBg, borderColor: theme.border },
                active && {
                  shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 }, elevation: 3,
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: active ? 'rgba(255,255,255,0.2)' : theme.featureBg },
                ]}
              >
                <SportIcon icon={s.icon} size={12} color={active ? '#fff' : theme.secondary} />
              </View>
              <Text
                style={[
                  styles.pillText,
                  { color: active ? '#fff' : theme.textSecondary },
                ]}
              >
                {s.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1 },
  row: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingLeft: 6, paddingRight: 14,
    borderRadius: radii.pill, borderWidth: 1.5,
    gap: spacing.xs + 2,
  },
  iconBubble: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pillText: {
    ...typography.smallStrong,
    fontSize: 13,
  },
});
