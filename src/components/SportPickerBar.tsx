import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import SportIcon from './ui/SportIcon';

export default function SportPickerBar() {
  const { sports, currentSport, setSport, theme } = useSport();
  if (sports.length === 0) return null;

  return (
    <View style={[
      styles.wrapper,
      { backgroundColor: theme.pageBg, borderBottomColor: theme.border },
    ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sports.map((s) => {
          const active = currentSport?.id === s.id;
          const inactiveText = theme.textSecondary;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSport(s)}
              style={({ pressed }) => [
                styles.pill,
                {
                  backgroundColor: active ? theme.accent : theme.cardBg,
                  borderColor: active ? theme.accent : theme.border,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <SportIcon
                icon={s.icon}
                size={14}
                color={active ? theme.textInverse : theme.accent}
              />
              <Text style={[
                styles.pillText,
                { color: active ? theme.textInverse : inactiveText },
              ]}>
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
  row: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm + 2, gap: spacing.sm },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: radii.sm, borderWidth: 1,
    gap: spacing.xs + 2,
  },
  pillText: {
    ...typography.overline,
    fontSize: 11,
  },
});
