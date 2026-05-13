import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderationApi, REPORT_REASONS, type ReportableType } from '../api';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import { BottomSheet, Button } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Type of content being reported. */
  contentType: ReportableType;
  /** Post / Comment / ChatMessage id. Omit for direct user reports. */
  contentId?: string;
  /** Author of the content (or the user being directly reported). */
  reportedUserId?: string;
  /** Called after a successful report — caller can hide the content locally. */
  onReported?: () => void;
}

/**
 * Bottom sheet that lets the user file a report against a post / comment /
 * message / user. Required by Apple Guideline 1.2.
 */
export default function ReportSheet({
  visible, onClose, contentType, contentId, reportedUserId, onReported,
}: Props) {
  const { theme } = useSport();
  const [reason, setReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason) { Alert.alert('Pick a reason', 'Please choose what\'s wrong.'); return; }
    setSubmitting(true);
    try {
      await moderationApi.report({ contentType, contentId, reportedUserId, reason, notes: notes.trim() || undefined });
      onReported?.();
      onClose();
      setReason(null);
      setNotes('');
      Alert.alert('Report sent', 'Thanks for letting us know. Our team will review this within 24 hours.');
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not send report.');
    } finally { setSubmitting(false); }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Report" tall>
      <Text style={[typography.body, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
        Why are you reporting this {contentType.toLowerCase()}? A human reviewer will see your choice within 24 hours.
      </Text>

      <View style={styles.list}>
        {REPORT_REASONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setReason(r)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: reason === r ? theme.featureBg : theme.cardBg,
                borderColor: reason === r ? theme.accent : theme.border,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name={reason === r ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={reason === r ? theme.accent : theme.textMuted}
            />
            <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[typography.smallStrong, { color: theme.textSecondary, marginTop: spacing.base, marginBottom: 6 }]}>
        Anything else? (optional)
      </Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add detail to help the reviewer."
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={3}
        style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.cardBg }]}
      />

      <Button
        title="Submit report"
        variant="danger"
        size="lg"
        fullWidth
        loading={submitting}
        leftIcon="flag-outline"
        onPress={submit}
        style={{ marginTop: spacing.md }}
      />
      <Button
        title="Cancel"
        variant="ghost"
        size="md"
        fullWidth
        uppercase={false}
        onPress={onClose}
        style={{ marginTop: spacing.xs }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs + 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderRadius: radii.md,
  },
  notes: {
    borderWidth: 1.5, borderRadius: radii.md,
    padding: 12, minHeight: 72,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
