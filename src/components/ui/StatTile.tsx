import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

type IconColor = 'blue' | 'accent' | 'green' | 'orange' | 'purple' | 'red';

interface Props {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: IconColor;
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

const ICON_TINT: Record<IconColor, string> = {
  blue:   '#38BDF8',
  accent: '#FF5500',
  green:  '#22C55E',
  orange: '#F59E0B',
  purple: '#A78BFA',
  red:    '#EF4444',
};

export default function StatTile({
  label, value, sublabel, icon, iconColor = 'blue', style, orientation = 'horizontal',
}: Props) {
  const { theme } = useSport();
  const tint = ICON_TINT[iconColor];
  const iconBg = `${tint}1F`; // ~12% alpha appended

  if (orientation === 'vertical') {
    return (
      <View style={[
        styles.wrapV,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        style,
      ]}>
        {icon ? (
          <View style={[styles.iconV, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={18} color={tint} />
          </View>
        ) : null}
        <Text style={[
          typography.display,
          { color: theme.textPrimary, fontSize: 30, lineHeight: 34, marginTop: icon ? spacing.sm : 0 },
        ]}>{value}</Text>
        <Text style={[typography.overline, { color: theme.textSecondary, marginTop: 2 }]}>{label}</Text>
        {sublabel ? (
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{sublabel}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[
      styles.wrap,
      { backgroundColor: theme.cardBg, borderColor: theme.border },
      style,
    ]}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[
          typography.display,
          { color: theme.textPrimary, fontSize: 26, lineHeight: 30 },
        ]}>{value}</Text>
        <Text style={[typography.overline, { color: theme.textSecondary, marginTop: 2 }]}>{label}</Text>
        {sublabel ? <Text style={[typography.caption, { color: theme.textMuted }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  wrapV: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.base,
    minWidth: 80,
  },
  icon: {
    width: 44, height: 44, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  iconV: {
    width: 40, height: 40, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
});
