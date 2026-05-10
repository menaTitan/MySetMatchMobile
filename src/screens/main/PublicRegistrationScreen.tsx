import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { tournamentsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import { useLocationChain } from '../../hooks/useLocationChain';
import { radii, spacing, typography } from '../../theme';
import { Button, Chip, Input, KeyboardAware, PageHeader, useToast } from '../../components/ui';

export default function PublicRegistrationScreen({ route, navigation }: any) {
  const { tournamentId, tournamentName } = route?.params ?? {};
  const { theme } = useSport();
  const toast = useToast();

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState<string | null>(null);
  const [rating, setRating] = useState('');
  const loc = useLocationChain();
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!first.trim() || !last.trim() || !email.trim()) {
      Alert.alert('Missing info', 'First name, last name, and email are required.'); return;
    }
    setBusy(true);
    try {
      const { data } = await tournamentsApi.publicRegister({
        tournamentId,
        firstName: first.trim(), lastName: last.trim(),
        email: email.trim(), phone: phone.trim() || undefined,
        countryId: loc.countryId || undefined, cityId: loc.cityId || undefined,
        skillLevel: skill ?? undefined,
        ratingEstimate: rating ? parseInt(rating) : undefined,
      });
      toast('Registered', 'success');
      navigation.replace('RegistrationSuccess', { registrationId: data.registrationId, tournamentName });
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not register.');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Tournament Registration" subtitle={tournamentName ?? 'Public registration'} compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <Input label="First name" value={first} onChangeText={setFirst} leftIcon="person-outline" />
        <Input label="Last name" value={last} onChangeText={setLast} />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
        <Input label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="call-outline" />
        <Input label="Rating estimate" value={rating} onChangeText={setRating} keyboardType="numeric" leftIcon="bar-chart-outline" />

        <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>Skill level</Text>
        <View style={styles.row}>
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((s) => (
            <Chip key={s} label={s} color={skill === s ? 'primary' : 'muted'} variant={skill === s ? 'solid' : 'soft'} onPress={() => setSkill(s)} />
          ))}
        </View>

        <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>Country</Text>
        <View style={styles.row}>
          {loc.countries.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              color={loc.countryId === c.id ? 'primary' : 'muted'}
              variant={loc.countryId === c.id ? 'solid' : 'soft'}
              onPress={() => loc.setCountry(c)}
            />
          ))}
        </View>

        {loc.hasRegions ? (
          <>
            <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>State / Region</Text>
            <View style={styles.row}>
              {loc.regions.map((r) => (
                <Chip
                  key={r.id}
                  label={r.name}
                  color={loc.regionId === r.id ? 'primary' : 'muted'}
                  variant={loc.regionId === r.id ? 'solid' : 'soft'}
                  onPress={() => loc.setRegion(r)}
                />
              ))}
            </View>
          </>
        ) : null}

        {loc.countryId && (!loc.hasRegions || loc.regionId) ? (
          <>
            <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>City</Text>
            <View style={styles.row}>
              {loc.cities.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  color={loc.cityId === c.id ? 'primary' : 'muted'}
                  variant={loc.cityId === c.id ? 'solid' : 'soft'}
                  onPress={() => loc.setCity(c)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Button title="Register" onPress={submit} loading={busy} variant="primary" size="lg" fullWidth leftIcon="checkmark-circle-outline" style={{ marginTop: spacing.lg }} />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
