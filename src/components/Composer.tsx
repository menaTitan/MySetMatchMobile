import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Pressable, Image, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSport } from '../context/SportContext';
import { useAuth } from '../context/AuthContext';
import { feedApi } from '../api';
import type { MentionUser, PostVisibility } from '../api';
import { radii, spacing, typography } from '../theme';
import Avatar from './ui/Avatar';
import { useToast } from './ui';

interface Props {
  value: string;
  onChange: (s: string) => void;
  onSubmit: (content: string, imageUri?: string, visibility?: PostVisibility) => Promise<void> | void;
  loading?: boolean;
  placeholder?: string;
  showVisibility?: boolean;
}

const MENTION_RE = /(^|\s)@(\w{0,30})$/;

export default function Composer({ value, onChange, onSubmit, loading, placeholder, showVisibility }: Props) {
  const { theme } = useSport();
  const { player } = useAuth();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>('Public');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const searchSeq = useRef(0);

  const canSend = !!value.trim() || !!imageUri;

  // Detect "@partial" right before the caret and search backend.
  useEffect(() => {
    const head = value.slice(0, selection.start);
    const m = head.match(MENTION_RE);
    if (!m) { setMentionQuery(null); setMentionResults([]); return; }
    const q = m[2];
    setMentionQuery(q);
    if (q.length === 0) { setMentionResults([]); return; }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const r = await feedApi.searchUsers(q);
        if (seq === searchSeq.current) setMentionResults(r.data.slice(0, 6));
      } catch {
        if (seq === searchSeq.current) setMentionResults([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [value, selection.start]);

  function applyMention(u: MentionUser) {
    const head = value.slice(0, selection.start);
    const tail = value.slice(selection.start);
    const replaced = head.replace(MENTION_RE, (_full, pre) => `${pre}@${u.userName} `);
    const next = replaced + tail;
    onChange(next);
    setMentionQuery(null);
    setMentionResults([]);
  }

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
    await onSubmit(value, imageUri ?? undefined, visibility);
    setImageUri(null);
  }

  const visIcon: any = visibility === 'Public' ? 'globe-outline'
    : visibility === 'Followers' ? 'people-outline'
    : visibility === 'Sport' ? 'tennisball-outline'
    : 'lock-closed-outline';

  function nextVis() {
    const order: PostVisibility[] = ['Public', 'Followers', 'Sport', 'Private'];
    const i = order.indexOf(visibility);
    setVisibility(order[(i + 1) % order.length]);
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
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
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

      {/* Mention autocomplete */}
      {mentionQuery !== null && mentionResults.length > 0 ? (
        <View style={[styles.mentionList, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <FlatList
            data={mentionResults}
            keyExtractor={(u) => u.userId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => applyMention(item)}
                style={({ pressed }) => [styles.mentionRow, pressed && { opacity: 0.85 }]}
              >
                <Avatar name={item.fullName ?? item.userName} photoUrl={item.profilePhotoUrl} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary, fontSize: 13 }]} numberOfLines={1}>
                    {item.fullName ?? item.userName}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                    @{item.userName}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Image preview */}
      {imageUri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Pressable onPress={() => setImageUri(null)} style={styles.removeBtn}>
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {/* Attach + visibility */}
      <View style={styles.actionsRow}>
        <Pressable onPress={pickImage} style={styles.attachBtn} hitSlop={8}>
          <Ionicons name="image-outline" size={16} color={theme.secondary} />
        </Pressable>
        {showVisibility !== false && (
          <Pressable onPress={nextVis} style={styles.attachBtn} hitSlop={8}>
            <Ionicons name={visIcon} size={14} color={theme.secondary} />
            <Text style={[typography.caption, { color: theme.secondary, fontWeight: '700' }]}>
              {visibility.toUpperCase()}
            </Text>
          </Pressable>
        )}
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

  mentionList: {
    marginLeft: 48,
    borderWidth: 1, borderRadius: radii.md,
    maxHeight: 200,
    overflow: 'hidden',
  },
  mentionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
});
