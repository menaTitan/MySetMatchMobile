import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type AdminUser } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Card, Chip, EmptyState, LoadingView, PageHeader, SearchBar, useToast } from '../../components/ui';

type ActionSheetState = { user: AdminUser } | null;

export default function AdminUsersScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState<ActionSheetState>(null);

  async function load() {
    try {
      const { data } = await adminApi.users({ search: query.trim() || undefined, pageSize: 50 });
      setUsers(data.items);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function toggleRole(user: AdminUser, role: 'Admin' | 'Organizer') {
    const has = user.roles.includes(role);
    try {
      const { data } = await adminApi.toggleRole(user.id, role, !has);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, roles: data.roles } : u));
      toast(`${role} role ${has ? 'removed' : 'granted'}`, 'success');
    } catch {}
  }

  async function suspend(user: AdminUser) {
    if (user.isSuspended) {
      try {
        await adminApi.suspend(user.id, 0);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isSuspended: false, lockoutEnd: undefined } : u));
        toast('User unsuspended', 'success');
      } catch {}
      return;
    }
    Alert.alert(
      `Suspend ${user.userName}?`,
      'Pick a duration',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '24h', onPress: () => doSuspend(user, 24) },
        { text: '7 days', onPress: () => doSuspend(user, 24 * 7) },
        { text: '30 days', style: 'destructive', onPress: () => doSuspend(user, 24 * 30) },
      ],
    );
  }

  async function doSuspend(user: AdminUser, hours: number) {
    try {
      const { data } = await adminApi.suspend(user.id, hours);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isSuspended: true, lockoutEnd: data.until } : u));
      toast('User suspended', 'warning');
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Users" subtitle="Search, suspend, assign roles" compact />

      <View style={{ padding: spacing.sm, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.divider }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name, email, username…" />
      </View>

      {loading ? <LoadingView /> : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onRoleToggle={(r) => toggleRole(item, r)}
              onSuspendToggle={() => suspend(item)}
              onPress={() => navigation.navigate('AdminEditUser', { userId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
          }
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
        />
      )}
    </View>
  );
}

function UserRow({
  user, onRoleToggle, onSuspendToggle, onPress,
}: {
  user: AdminUser;
  onRoleToggle: (role: 'Admin' | 'Organizer') => void;
  onSuspendToggle: () => void;
  onPress?: () => void;
}) {
  const { theme } = useSport();
  return (
    <Card padding={0} onPress={onPress}>
      <View style={styles.userRow}>
        <Avatar name={user.fullName ?? user.userName} photoUrl={user.profilePhotoUrl} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
            {user.fullName ?? user.userName}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
            {user.email ?? user.userName}
          </Text>
          <View style={styles.chips}>
            {user.roles.map((r) => (
              <Chip key={r} label={r} color={r === 'Admin' ? 'danger' : r === 'Organizer' ? 'accent' : 'primary'} variant="soft" size="sm" />
            ))}
            {user.isSuspended ? <Chip label="Suspended" color="warning" variant="solid" size="sm" /> : null}
          </View>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: theme.divider }]}>
        <RoleBtn
          label="Admin"
          active={user.roles.includes('Admin')}
          onPress={() => onRoleToggle('Admin')}
        />
        <RoleBtn
          label="Organizer"
          active={user.roles.includes('Organizer')}
          onPress={() => onRoleToggle('Organizer')}
        />
        <Pressable
          onPress={onSuspendToggle}
          style={({ pressed }) => [
            styles.suspendBtn,
            { backgroundColor: user.isSuspended ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={user.isSuspended ? 'checkmark-circle-outline' : 'ban-outline'}
            size={14}
            color={user.isSuspended ? theme.successGreen : theme.warning}
          />
          <Text style={[typography.caption, { color: user.isSuspended ? theme.successGreen : theme.warning, fontWeight: '700' }]}>
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

function RoleBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleBtn,
        {
          backgroundColor: active ? theme.primary : 'transparent',
          borderColor: active ? theme.primary : theme.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Ionicons
        name={active ? 'checkmark' : 'add'}
        size={12}
        color={active ? '#fff' : theme.textSecondary}
      />
      <Text style={[typography.caption, { color: active ? '#fff' : theme.textSecondary, fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.base,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  actions: {
    flexDirection: 'row', gap: spacing.xs + 2,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  roleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.pill, borderWidth: 1.5,
  },
  suspendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.pill,
    marginLeft: 'auto',
  },
});
