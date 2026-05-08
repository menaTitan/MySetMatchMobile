import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { Button, Card, PageHeader } from '../../components/ui';

export default function RegistrationSuccessScreen({ navigation, route }: any) {
  const { tournamentName, registrationId } = route?.params ?? {};
  const { theme } = useSport();
  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Registered!" compact />
      <View style={styles.center}>
        <View style={[styles.successOrb, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
          <Ionicons name="checkmark-circle" size={56} color={theme.successGreen} />
        </View>
        <Text style={[typography.h1, { color: theme.primary, marginTop: spacing.md }]}>You're in!</Text>
        <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
          We've registered you for {tournamentName ?? 'this tournament'}. A confirmation email is on its way.
        </Text>
        {registrationId && (
          <Card style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Registration ID</Text>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary, marginTop: 2 }]}>{registrationId}</Text>
          </Card>
        )}
        <Button title="Done" onPress={() => navigation.popToTop()} variant="primary" size="lg" fullWidth style={{ marginTop: spacing.xl }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xxl },
  successOrb: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
});
