import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  label: string;
  /**
   * Stored value. Date-only mode → `YYYY-MM-DD`. Date+time mode (`withTime`)
   * → ISO string (`2026-06-12T18:30:00.000Z`). Empty string when unset.
   */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Show a time picker after the date picker so the value carries a clock. */
  withTime?: boolean;
  disabled?: boolean;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse either YYYY-MM-DD or a full ISO/datetime string. */
function parseValue(s: string): Date | null {
  if (!s) return null;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(s: string, withTime: boolean): string {
  const d = parseValue(s);
  if (!d) return '';
  return withTime
    ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Calendar-backed date (and optional time) field. Tapping the row opens
 * the platform picker — Android dialog, iOS inline spinner. Stores the
 * value as `YYYY-MM-DD` or ISO depending on `withTime` so callers can
 * keep using a plain string in form state.
 */
export default function DatePickerField({
  label, value, onChange, placeholder, minimumDate, maximumDate, withTime, disabled,
}: Props) {
  const { theme } = useSport();
  // Android needs two separate pickers (date, then time) since it has no
  // combined datetime mode.
  const [open, setOpen] = useState<null | 'date' | 'time'>(null);
  // Holds the date the user picked in the first step so the time picker
  // can combine them when it closes.
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const current = parseValue(value) ?? new Date();
  const ph = placeholder ?? (withTime ? 'Select date & time' : 'Select date');

  function emit(d: Date) {
    onChange(withTime ? d.toISOString() : toYmd(d));
  }

  function handleAndroidDate(_e: DateTimePickerEvent, picked?: Date) {
    setOpen(null);
    if (!picked) return;
    if (withTime) {
      setPendingDate(picked);
      // Re-open as time picker on the next tick — Android dismisses the
      // dialog on selection, so we have to chain.
      setTimeout(() => setOpen('time'), 0);
    } else {
      emit(picked);
    }
  }

  function handleAndroidTime(_e: DateTimePickerEvent, picked?: Date) {
    setOpen(null);
    if (!picked) return;
    const base = pendingDate ?? current;
    const merged = new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      picked.getHours(), picked.getMinutes(), 0, 0,
    );
    setPendingDate(null);
    emit(merged);
  }

  function handleIosChange(_e: DateTimePickerEvent, picked?: Date) {
    if (picked) emit(picked);
  }

  return (
    <View style={{ marginBottom: spacing.sm + 2 }}>
      <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen('date')}
        disabled={disabled}
        style={({ pressed }) => [
          styles.row,
          { borderColor: theme.border, backgroundColor: theme.cardBg, opacity: disabled ? 0.5 : 1 },
          pressed && { borderColor: theme.accent },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, color: value ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
          {formatDisplay(value, !!withTime) || ph}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>

      {open && Platform.OS === 'ios' ? (
        <View style={[styles.iosWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <DateTimePicker
            value={current}
            mode={withTime ? 'datetime' : 'date'}
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleIosChange}
            themeVariant="dark"
          />
          <Pressable
            onPress={() => setOpen(null)}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: pressed ? theme.accent : theme.primary },
            ]}
          >
            <Text style={[typography.smallStrong, { color: '#fff' }]}>Done</Text>
          </Pressable>
        </View>
      ) : null}

      {open === 'date' && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={current}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidDate}
        />
      ) : null}

      {open === 'time' && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={pendingDate ?? current}
          mode="time"
          is24Hour={false}
          onChange={handleAndroidTime}
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
