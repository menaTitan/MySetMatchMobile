import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import BottomSheet from './ui/BottomSheet';
import SportIcon from './ui/SportIcon';

type Variant = 'onPrimary' | 'surface';

interface Props {
  /** When true, render with translucent white styling (for use over a gradient hero). */
  variant?: Variant;
  /** When true, the trigger label is forced to uppercase like a tag/badge. */
  uppercase?: boolean;
  /** Show an "All sports" option that clears the filter. */
  allowClear?: boolean;
}

/**
 * Compact sport-filter dropdown. Trigger looks like a pill; tapping opens a
 * bottom sheet to pick a sport (or clear the filter).
 */
export default function SportDropdown({
  variant = 'onPrimary',
  uppercase = true,
  allowClear = true,
}: Props) {
  const { sports, currentSport, setSport, theme } = useSport();
  const [open, setOpen] = useState(false);

  if (sports.length === 0) return null;

  const onHero = variant === 'onPrimary';
  const label = currentSport?.name ?? 'All Sports';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.trigger,
          onHero
            ? {
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderColor: 'rgba(255,255,255,0.22)',
              }
            : {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              },
          pressed && { opacity: 0.8 },
        ]}
      >
        {currentSport?.icon ? (
          <SportIcon
            icon={currentSport.icon}
            size={11}
            color={onHero ? '#fff' : theme.secondary}
          />
        ) : (
          <Ionicons
            name="apps-outline"
            size={11}
            color={onHero ? '#fff' : theme.secondary}
          />
        )}
        <Text
          style={[
            styles.triggerText,
            uppercase && { textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 9.5 },
            { color: onHero ? '#fff' : theme.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={12}
          color={onHero ? 'rgba(255,255,255,0.85)' : theme.textMuted}
        />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Filter by sport"
        subtitle="Pick a sport to focus your dashboard"
      >
        {allowClear && (
          <PickerRow
            iconName="apps"
            label="All sports"
            hint="Stats across every sport"
            active={!currentSport}
            onPress={() => {
              setSport(null);
              setOpen(false);
            }}
          />
        )}
        {sports.map((s) => {
          const active = s.id === currentSport?.id;
          return (
            <PickerRow
              key={s.id}
              sportIcon={s.icon}
              label={s.name}
              active={active}
              onPress={() => {
                setSport(s);
                setOpen(false);
              }}
            />
          );
        })}
      </BottomSheet>
    </>
  );
}

function PickerRow({
  sportIcon,
  iconName,
  label,
  hint,
  active,
  onPress,
}: {
  sportIcon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: active ? theme.accentLight : theme.pageBg,
          borderColor: active ? theme.primary : theme.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: active ? theme.primary : theme.featureBg }]}>
        {sportIcon ? (
          <SportIcon icon={sportIcon} size={16} color={active ? '#fff' : theme.secondary} />
        ) : iconName ? (
          <Ionicons name={iconName} size={16} color={active ? '#fff' : theme.secondary} />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 1 }]} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {active ? (
        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
  triggerText: {
    ...typography.smallStrong,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
