import React from 'react';
import { ScrollView, StyleSheet, Pressable, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

export interface SegmentedTab<K extends string = string> {
  key: K;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

interface Props<K extends string = string> {
  tabs: SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  variant?: 'pill' | 'underline';
  scrollable?: boolean;
  style?: ViewStyle;
}

/**
 * Pro-sports segmented control.
 * - "pill": sharp dark pills with cyber-accent active fill.
 * - "underline": flat tabs with bright accent indicator.
 */
export default function SegmentedTabs<K extends string = string>({
  tabs, value, onChange, variant = 'pill', scrollable = true, style,
}: Props<K>) {
  const { theme } = useSport();

  const Inner = (
    <View style={[
      variant === 'pill' ? styles.pillRow : styles.underlineRow,
      !scrollable && variant === 'underline' && { justifyContent: 'space-around' },
    ]}>
      {tabs.map((t) => {
        const active = t.key === value;
        if (variant === 'pill') {
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={({ pressed }) => [
                styles.pill,
                {
                  borderColor: active ? theme.accent : theme.border,
                  backgroundColor: active ? theme.accent : 'transparent',
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              {t.icon ? (
                <Ionicons name={t.icon} size={14} color={active ? theme.textInverse : theme.textSecondary} />
              ) : null}
              <Text style={[
                typography.overline,
                { color: active ? theme.textInverse : theme.textSecondary, fontSize: 11 },
              ]}>
                {t.label}
              </Text>
              {typeof t.count === 'number' ? (
                <View style={[
                  styles.count,
                  { backgroundColor: active ? 'rgba(0,0,0,0.18)' : theme.divider },
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: active ? theme.textInverse : theme.textSecondary },
                  ]}>{t.count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }
        // underline
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [styles.underlineTab, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.underlineRowInner}>
              {t.icon ? (
                <Ionicons name={t.icon} size={15} color={active ? theme.accent : theme.textMuted} />
              ) : null}
              <Text style={[
                typography.overline,
                { color: active ? theme.accent : theme.textMuted, fontSize: 11 },
              ]}>
                {t.label}
              </Text>
              {typeof t.count === 'number' ? (
                <Text style={[typography.caption, { color: active ? theme.accent : theme.textMuted }]}>
                  {t.count}
                </Text>
              ) : null}
            </View>
            <View style={[
              styles.underlineBar,
              { backgroundColor: active ? theme.accent : 'transparent' },
            ]} />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[
      { backgroundColor: theme.pageBg, borderBottomWidth: 1, borderBottomColor: theme.border },
      style,
    ]}>
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
          {Inner}
        </ScrollView>
      ) : (
        <View style={styles.scrollPad}>{Inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollPad: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  pillRow: { flexDirection: 'row', gap: spacing.xs + 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  count: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  countText: { fontSize: 10, fontWeight: '800' },

  underlineRow: { flexDirection: 'row', flex: 1 },
  underlineTab: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  underlineRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: spacing.sm,
  },
  underlineBar: {
    height: 2,
    width: '100%',
  },
});
