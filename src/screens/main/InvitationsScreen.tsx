import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { privateGroupsApi, type IncomingInvitation } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

/**
 * Inbox of pending club / group invitations. The user accepts or declines
 * each one; accept adds them as a member, decline marks the invitation
 * Declined and it drops off the list.
 */
export default function InvitationsScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [items, setItems] = useState<IncomingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const { data } = await privateGroupsApi.myInvitations(); setItems(data); }
    catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function accept(inv: IncomingInvitation) {
    setBusyId(inv.id);
    try {
      const { data } = await privateGroupsApi.acceptInvitation(inv.id);
      toast(`Joined ${inv.groupName}`, 'success');
      setItems((arr) => arr.filter((x) => x.id !== inv.id));
      navigation.navigate('GroupDetail', { groupId: data.groupId, name: inv.groupName });
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not accept.');
    } finally { setBusyId(null); }
  }

  async function decline(inv: IncomingInvitation) {
    setBusyId(inv.id);
    try {
      await privateGroupsApi.declineInvitation(inv.id);
      setItems((arr) => arr.filter((x) => x.id !== inv.id));
    } catch {} finally { setBusyId(null); }
  }

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Invitations" subtitle="Clubs and groups you've been invited to" compact />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Avatar name={item.invitedByName} photoUrl={item.invitedByPhotoUrl} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{item.groupName}</Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>
                  Invited by {item.invitedByName ?? 'Someone'} · {new Date(item.createdDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {item.message ? (
              <Text style={[typography.small, { color: theme.textMuted, marginTop: spacing.xs, fontStyle: 'italic' }]}>
                "{item.message}"
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Button title="Decline" variant="ghost" onPress={() => decline(item)} loading={busyId === item.id} style={{ flex: 1 }} />
              <Button title="Accept" variant="primary" leftIcon="checkmark-outline" onPress={() => accept(item)} loading={busyId === item.id} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="mail-open-outline"
            title="No invitations"
            message="You'll see invitations to clubs and groups here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
