import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  label: string;
  /** Date in YYYY-MM-DD form, or empty string when unset. */
  value: string;
  onChange: (yyyyMmDd: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** When true, render a small inline trigger instead of a full field. */
  disabled?: boolean;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function format(s: string): string {
  const d = parseYmd(s);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Calendar-backed date field. Tapping the row opens the platform date
 * picker (Android dialog, iOS inline spinner). The value is stored as a
 * plain `YYYY-MM-DD` string so callers can keep using simple form state.
 */
export default function DatePickerField({
  label, value, onChange, placeholder = 'Select date', minimumDate, maximumDate, disabled,
}: Props) {
  const { theme } = useSport();
  const [open, setOpen] = useState(false);

  const current = parseYmd(value) ?? new Date();

  function handleChange(_e: DateTimePickerEvent, picked?: Date) {
    // Android: the dialog dismisses itself; iOS: the inline spinner stays open
    // until the user taps Done, so we close on each change-to-confirm flow.
    if (Platform.OS !== 'ios') setOpen(false);
    if (picked) onChange(toYmd(picked));
  }

  return (
    <View style={{ marginBottom: spacing.sm + 2 }}>
      <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.row,
          { borderColor: theme.border, backgroundColor: theme.cardBg, opacity: disabled ? 0.5 : 1 },
          pressed && { borderColor: theme.accent },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, color: value ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
          {format(value) || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>

      {open && Platform.OS === 'ios' ? (
        <View style={[styles.iosWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <DateTimePicker
            value={current}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
            themeVariant="dark"
          />
          <Pressable
            onPress={() => setOpen(false)}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: pressed ? theme.accent : theme.primary },
            ]}
          >
            <Text style={[typography.smallStrong, { color: '#fff' }]}>Done</Text>
          </Pressable>
        </View>
      ) : null}

      {open && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={current}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },
  iosWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
});
