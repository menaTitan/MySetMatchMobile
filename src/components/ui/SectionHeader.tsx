import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  title: string;
  eyebrow?: string;
  action?: { label: string; onPress: () => void };
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function SectionHeader({ title, eyebrow, action, icon }: Props) {
  const { theme } = useSport();
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {icon ? (
          <View style={[
            styles.iconBox,
            { backgroundColor: theme.featureBg, borderColor: theme.border },
          ]}>
            <Ionicons name={icon} size={14} color={theme.accent} />
          </View>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          {eyebrow ? (
            <Text style={[typography.overline, { color: theme.accent, marginBottom: 2 }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[
            typography.h3,
            { color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 },
          ]}>{title}</Text>
        </View>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={[typography.overline, { color: theme.accent, fontSize: 11 }]}>{action.label} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  iconBox: {
    width: 28, height: 28, borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
