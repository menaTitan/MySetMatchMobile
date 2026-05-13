import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Button, Card, Input, PageHeader } from '../../components/ui';

const CONFIRM_PHRASE = 'DELETE';

/**
 * Permanent account deletion (Apple Guideline 5.1.1(v)).
 *
 * Two-step confirmation:
 *   1. The user types `DELETE` to unlock the action.
 *   2. The user re-enters their password — this is what the backend uses
 *      to verify them before removing the account.
 *
 * On success the AuthContext is logged out and the root navigator drops
 * the user back at the sign-in screen.
 */
export default function DeleteAccountScreen({ navigation }: any) {
  const { theme } = useSport();
  const { logout } = useAuth();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const phraseOk = phrase.trim().toUpperCase() === CONFIRM_PHRASE;
  const canSubmit = phraseOk && password.length > 0;

  async function handleDelete() {
    Alert.alert(
      'Delete account permanently?',
      'This will remove your profile, posts, and group memberships. Matches you played remain on opponents\' records but appear as "Deleted player". This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await authApi.deleteAccount(password);
              await logout();
              // logout() triggers the root navigator to swap to AuthNavigator
              // automatically. No need to navigate manually.
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? 'Account could not be deleted.';
              Alert.alert('Failed', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Delete Account" subtitle="This action is permanent" compact />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
        <Card>
          <View style={[styles.warningBox, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.35)' }]}>
            <Ionicons name="warning-outline" size={22} color={theme.dangerRed} />
            <Text style={[typography.bodyStrong, { color: theme.dangerRed, flex: 1 }]}>
              Deleting your account is permanent
            </Text>
          </View>

          <Text style={[typography.body, { color: theme.textPrimary, marginTop: spacing.sm }]}>
            Once you confirm, we will:
          </Text>
          <Bullet text="Anonymize your name and profile photo so they no longer appear anywhere in the app." />
          <Bullet text="Remove your posts, comments, and group memberships." />
          <Bullet text="Cancel any pending club invitations." />
          <Bullet text="Sign you out and delete your login credentials." />

          <Text style={[typography.small, { color: theme.textMuted, marginTop: spacing.sm }]}>
            Match results you played remain on your opponents' records but show as "Deleted player" — this keeps their rating history accurate.
          </Text>
        </Card>

        <Card>
          <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>
            Type {CONFIRM_PHRASE} to confirm
          </Text>
          <Input
            placeholder={CONFIRM_PHRASE}
            autoCapitalize="characters"
            autoCorrect={false}
            value={phrase}
            onChangeText={setPhrase}
          />

          <Input
            label="Password"
            leftIcon="lock-closed-outline"
            placeholder="Your current password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </Card>

        <Button
          title="Delete My Account"
          variant="danger"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={deleting}
          leftIcon="trash-outline"
          onPress={handleDelete}
        />

        <Button
          title="Cancel"
          variant="ghost"
          size="md"
          fullWidth
          uppercase={false}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const { theme } = useSport();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
      <Text style={[typography.body, { color: theme.textMuted }]}>•</Text>
      <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
