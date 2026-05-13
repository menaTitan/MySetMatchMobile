import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { preferencesApi, type UserPreferences } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Card, LoadingView, PageHeader, SectionHeader } from '../../components/ui';

type PrefKey = keyof UserPreferences;

interface Row { key: PrefKey; label: string; hint?: string; icon: any }

const EMAIL_ROWS: Row[] = [
  { key: 'emailTournamentAnnouncements', label: 'Tournament announcements', icon: 'trophy-outline', hint: 'New tournaments in your area' },
  { key: 'emailMatchResults',            label: 'Match results',             icon: 'tennisball-outline', hint: 'When an opponent enters a score' },
  { key: 'emailPostComments',            label: 'Comments on my posts',      icon: 'chatbubble-outline' },
  { key: 'emailPostReactions',           label: 'Reactions on my posts',     icon: 'heart-outline' },
  { key: 'emailDirectMessages',          label: 'Direct messages',           icon: 'mail-outline' },
  { key: 'emailClubInvitations',         label: 'Club / group invitations',  icon: 'people-outline' },
  { key: 'emailMarketing',               label: 'Product news & tips',       icon: 'newspaper-outline', hint: 'Occasional updates from us' },
];

const PUSH_ROWS: Row[] = [
  { key: 'pushMatchResults',          label: 'Match results',            icon: 'tennisball-outline' },
  { key: 'pushPostComments',          label: 'Comments on my posts',     icon: 'chatbubble-outline' },
  { key: 'pushPostReactions',         label: 'Reactions on my posts',    icon: 'heart-outline' },
  { key: 'pushDirectMessages',        label: 'Direct messages',          icon: 'mail-outline' },
  { key: 'pushClubInvitations',       label: 'Club / group invitations', icon: 'people-outline' },
  { key: 'pushTournamentReminders',   label: 'Tournament reminders',     icon: 'alarm-outline' },
];

const PRIVACY_ROWS: Row[] = [
  { key: 'showOnLeaderboards',           label: 'Show me on leaderboards',           icon: 'medal-outline' },
  { key: 'allowDirectMessagesFromAnyone', label: 'Allow messages from anyone',        icon: 'chatbubbles-outline', hint: 'Turn off to limit DMs to people in your clubs' },
  { key: 'showLocationOnProfile',        label: 'Show my city on my profile',         icon: 'location-outline' },
  { key: 'showEquipmentOnProfile',       label: 'Show my equipment on my profile',    icon: 'construct-outline' },
];

/**
 * Notification + privacy settings. PATCH-on-toggle so each switch saves
 * immediately — no "Save" button needed. Optimistic UI on success; reverts
 * on failure with an inline alert.
 */
export default function SettingsScreen() {
  const { theme } = useSport();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<PrefKey | null>(null);

  const load = useCallback(async () => {
    try { const { data } = await preferencesApi.get(); setPrefs(data); }
    catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(key: PrefKey, next: boolean) {
    if (!prefs) return;
    const prev = prefs[key];
    setPrefs({ ...prefs, [key]: next });
    setPendingKey(key);
    try {
      await preferencesApi.update({ [key]: next } as Partial<UserPreferences>);
    } catch (err: any) {
      // Revert on failure.
      setPrefs({ ...prefs, [key]: prev });
      Alert.alert('Could not save', err?.response?.data?.message ?? 'Please try again.');
    } finally {
      setPendingKey(null);
    }
  }

  if (loading || !prefs) return <LoadingView />;

  function renderRow(r: Row, last: boolean) {
    const value = prefs![r.key] as boolean;
    return (
      <View key={r.key} style={[styles.row, !last && { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.featureBg }]}>
          <Ionicons name={r.icon} size={18} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{r.label}</Text>
          {r.hint ? (
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 1 }]}>{r.hint}</Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={(v) => toggle(r.key, v)}
          disabled={pendingKey === r.key}
          trackColor={{ true: theme.accent, false: theme.border }}
          thumbColor={'#fff'}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Notifications & Privacy" subtitle="Control what you hear from us and what others see" compact />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
        <View>
          <SectionHeader title="Email Notifications" />
          <Card>{EMAIL_ROWS.map((r, i) => renderRow(r, i === EMAIL_ROWS.length - 1))}</Card>
        </View>
        <View>
          <SectionHeader title="Push Notifications" />
          <Card>{PUSH_ROWS.map((r, i) => renderRow(r, i === PUSH_ROWS.length - 1))}</Card>
        </View>
        <View>
          <SectionHeader title="Privacy" />
          <Card>{PRIVACY_ROWS.map((r, i) => renderRow(r, i === PRIVACY_ROWS.length - 1))}</Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
});
