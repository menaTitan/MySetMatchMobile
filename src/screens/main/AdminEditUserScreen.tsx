import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type AdminUserDetail } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Chip, Input, KeyboardAware, LoadingView, PageHeader, useToast } from '../../components/ui';

export default function AdminEditUserScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    adminApi.userDetail(userId).then(({ data }) => {
      setUser(data);
      setFullName(data.fullName ?? '');
      setEmail(data.email ?? '');
      setPhone(data.phoneNumber ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  async function save() {
    setSaving(true);
    try {
      await adminApi.updateUser(userId, {
        fullName, email, phoneNumber: phone,
        password: password.trim() || undefined,
      });
      toast('User saved', 'success');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not save.');
    } finally { setSaving(false); }
  }

  async function toggleRole(role: 'Admin' | 'Organizer' | 'Player') {
    if (!user) return;
    const has = user.roles.includes(role);
    try {
      const { data } = await adminApi.toggleRole(userId, role, !has);
      setUser({ ...user, roles: data.roles });
    } catch (err: any) { Alert.alert('Failed', err?.response?.data?.message ?? 'Failed.'); }
  }

  async function remove() {
    Alert.alert('Delete user', 'This is permanent.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await adminApi.deleteUser(userId); toast('Deleted', 'success'); navigation.goBack(); } catch {}
      } },
    ]);
  }

  async function suspend(hours: number | undefined) {
    try { await adminApi.suspend(userId, hours); toast(hours ? 'Suspended' : 'Un-suspended', 'success'); }
    catch {}
  }

  if (loading || !user) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Edit User" subtitle={user.userName} compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <View style={[styles.header, { backgroundColor: theme.cardBg }]}>
          <Avatar name={user.fullName ?? user.userName} photoUrl={user.profilePhotoUrl} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: theme.textPrimary }]}>{user.fullName ?? user.userName}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              Joined {new Date(user.createdDate).toLocaleDateString()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              {user.roles.map((r) => <Chip key={r} label={r} color="primary" variant="soft" size="sm" />)}
              {user.isSuspended && <Chip label="SUSPENDED" color="danger" variant="soft" size="sm" />}
            </View>
          </View>
        </View>

        <Input label="Full name" value={fullName} onChangeText={setFullName} />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Reset password (optional)" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>Roles</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['Admin', 'Organizer', 'Player'] as const).map((r) => (
            <Chip
              key={r}
              label={r}
              color={user.roles.includes(r) ? 'primary' : 'muted'}
              variant={user.roles.includes(r) ? 'solid' : 'soft'}
              onPress={() => toggleRole(r)}
            />
          ))}
        </View>

        <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>Suspension</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip label="24h" color="warning" variant="soft" onPress={() => suspend(24)} />
          <Chip label="7d" color="warning" variant="soft" onPress={() => suspend(24 * 7)} />
          <Chip label="30d" color="warning" variant="soft" onPress={() => suspend(24 * 30)} />
          <Chip label="Lift" color="success" variant="soft" onPress={() => suspend(undefined)} />
        </View>

        <Button title="Save changes" onPress={save} loading={saving} variant="primary" size="lg" fullWidth style={{ marginTop: spacing.md }} />
        <Button title="Delete user" onPress={remove} variant="danger" size="md" fullWidth leftIcon="trash-outline" style={{ marginTop: spacing.xs }} />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
});
