import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  /** Optional left visual: icon name, or a custom node (e.g. Avatar). */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  leading?: React.ReactNode;

  title: string;
  subtitle?: string;
  meta?: string;

  /** Optional right slot — chip, value, badge, etc. */
  trailing?: React.ReactNode;
  showChevron?: boolean;

  onPress?: () => void;
  divider?: boolean;
  style?: ViewStyle;
  dense?: boolean;
}

/**
 * A unified row: leading visual, title/subtitle/meta stack, optional trailing slot.
 * Replaces hand-rolled rows for tournaments/players/listings/chats/etc.
 */
export default function ListRow({
  icon, iconColor, iconBg, leading,
  title, subtitle, meta,
  trailing, showChevron,
  onPress, divider, style, dense,
}: Props) {
  const { theme } = useSport();

  const left = leading ?? (icon ? (
    <View style={[styles.iconBox, { backgroundColor: iconBg ?? theme.featureBg }]}>
      <Ionicons name={icon} size={18} color={iconColor ?? theme.secondary} />
    </View>
  ) : null);

  const inner = (
    <View style={[
      styles.row,
      dense && { paddingVertical: spacing.sm },
      divider && { borderTopWidth: 1, borderTopColor: theme.divider },
      style,
    ]}>
      {left ? <View style={styles.leading}>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: spacing.xs }} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  leading: { alignSelf: 'center' },
  iconBox: {
    width: 40, height: 40,
    borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  trailing: { alignSelf: 'center', flexShrink: 0 },
  pressed: { opacity: 0.6 },
});
