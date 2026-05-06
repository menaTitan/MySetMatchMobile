import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSport } from '../context/SportContext';
import { useAuth } from '../context/AuthContext';
import { radii, spacing, typography } from '../theme';
import Avatar from './ui/Avatar';
import { useToast } from './ui';

interface Props {
  value: string;
  onChange: (s: string) => void;
  /**
   * Submits the post. Receives the currently composed text plus an optional
   * local image URI. Uploaders live in the owning screen so we can wire
   * feedApi vs privateGroupsApi.
   */
  onSubmit: (content: string, imageUri?: string) => Promise<void> | void;
  loading?: boolean;
  placeholder?: string;
}

export default function Composer({ value, onChange, onSubmit, loading, placeholder }: Props) {
  const { theme } = useSport();
  const { player } = useAuth();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const canSend = !!value.trim() || !!imageUri;

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast('Photo library access is required', 'warning'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSend() {
    await onSubmit(value, imageUri ?? undefined);
    setImageUri(null);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
      <View style={styles.topRow}>
        <Avatar name={player?.name} photoUrl={player?.profilePhotoUrl} size={36} />
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
          placeholder={placeholder ?? 'Share something…'}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onChange}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend || loading}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: canSend ? theme.primary : theme.divider,
              shadowColor: canSend ? theme.primary : 'transparent',
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <Ionicons name="send" size={16} color={canSend ? '#fff' : theme.textMuted} />
          )}
        </Pressable>
      </View>

      {/* Image preview */}
      {imageUri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Pressable onPress={() => setImageUri(null)} style={styles.removeBtn}>
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {/* Attach action */}
      <View style={styles.actionsRow}>
        <Pressable onPress={pickImage} style={styles.attachBtn} hitSlop={8}>
          <Ionicons name="image-outline" size={16} color={theme.secondary} />
          <View>
            {/* Using native Text from RN to keep bundle small */}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    gap: spacing.xs + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 42, maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },

  actionsRow: {
    flexDirection: 'row', paddingLeft: 48,
  },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 4, paddingVertical: 4,
  },

  previewRow: { position: 'relative', marginLeft: 48, marginTop: 4 },
  preview: {
    width: 120, height: 90, borderRadius: radii.sm,
  },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
});
