import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../context/SportContext';
import type { EquipmentItem } from '../api/players';
import { radii, spacing, typography } from '../theme';

interface Props {
  /**
   * Equipment payload from the API. Accepts either:
   *   - an array of `EquipmentItem` (preferred), or
   *   - a flat object `{ blade: 'Butterfly Innerforce', forehandRubber: 'Tenergy 05' }`
   *     (auto-converted to items).
   */
  equipment?: EquipmentItem[] | Record<string, unknown> | null;
}

/** Title-cases a camelCased key — `forehandRubber` → `Forehand Rubber`. */
function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

function normalize(raw: Props['equipment']): EquipmentItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((e: any) => ({
        label: e?.label ?? e?.type ?? e?.name ?? '',
        brand: e?.brand,
        model: e?.model,
        description: e?.description ?? e?.value,
        sportName: e?.sportName,
      }))
      .filter((e) => e.label && (e.brand || e.model || e.description));
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([, v]) => v != null && v !== '')
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return { label: humanize(key), description: value };
        }
        if (typeof value === 'object' && value) {
          const v = value as any;
          return {
            label: humanize(key),
            brand: v.brand,
            model: v.model,
            description: v.description ?? v.value,
          };
        }
        return { label: humanize(key), description: String(value) };
      })
      .filter((e) => e.brand || e.model || e.description);
  }
  return [];
}

export default function EquipmentList({ equipment }: Props) {
  const { theme } = useSport();
  const items = normalize(equipment);
  if (items.length === 0) return null;

  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((item, i) => {
        const value = [item.brand, item.model].filter(Boolean).join(' ') || item.description;
        return (
          <View
            key={`${item.label}-${i}`}
            style={[
              styles.row,
              {
                borderBottomColor: theme.divider,
                borderBottomWidth: i === items.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
              <Ionicons name={iconFor(item.label)} size={14} color={theme.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[
                typography.overline,
                { color: theme.textMuted, fontSize: 10 },
              ]} numberOfLines={1}>
                {item.label.toUpperCase()}
                {item.sportName ? `  ·  ${item.sportName.toUpperCase()}` : ''}
              </Text>
              <Text
                style={[typography.bodyStrong, { color: theme.textPrimary }]}
                numberOfLines={2}
              >
                {value}
              </Text>
              {item.description && (item.brand || item.model) ? (
                <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Best-effort icon match for common gear labels. */
function iconFor(label: string): keyof typeof Ionicons.glyphMap {
  const l = label.toLowerCase();
  if (l.includes('rubber')) return 'ellipse-outline';
  if (l.includes('blade') || l.includes('paddle') || l.includes('bat') || l.includes('racket') || l.includes('racquet')) {
    return 'tennisball-outline';
  }
  if (l.includes('string')) return 'remove-outline';
  if (l.includes('shoe')) return 'footsteps-outline';
  if (l.includes('ball')) return 'football-outline';
  if (l.includes('grip')) return 'hand-left-outline';
  if (l.includes('bag') || l.includes('case')) return 'briefcase-outline';
  return 'construct-outline';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
