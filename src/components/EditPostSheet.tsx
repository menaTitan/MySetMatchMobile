import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, ActivityIndicator, Pressable, Text } from 'react-native';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import { BottomSheet } from './ui';

interface Props {
  visible: boolean;
  initialText: string;
  title?: string;
  onClose: () => void;
  onSave: (text: string) => Promise<void> | void;
}

export default function EditPostSheet({
  visible, initialText, title = 'Edit post', onClose, onSave,
}: Props) {
  const { theme } = useSport();
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setText(initialText); }, [visible, initialText]);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    try { await onSave(text.trim()); onClose(); } finally { setSaving(false); }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      <TextInput
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        underlineColorAndroid="transparent"
      />
      <Pressable
        onPress={handleSave}
        disabled={!text.trim() || saving}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: text.trim() ? theme.primary : theme.divider },
          pressed && { opacity: 0.85 },
        ]}
      >
        {saving ? <ActivityIndicator size="small" color="#fff" /> : (
          <Text style={[
            typography.smallStrong,
            { color: text.trim() ? '#fff' : theme.textMuted, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
          ]}>
            Save
          </Text>
        )}
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1, borderRadius: radii.md,
    padding: 12, fontSize: 15, minHeight: 120, maxHeight: 240,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
});
