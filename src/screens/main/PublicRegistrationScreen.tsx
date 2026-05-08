import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { tournamentsApi, locationsApi } from '../../api';
import { useSport } from '../../context/SportContext';
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
  const [countryId, setCountryId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { locationsApi.countries().then((r) => setCountries(r.data)).catch(() => {}); }, []);
  useEffect(() => { if (countryId) locationsApi.cities(countryId).then((r) => setCities(r.data)).catch(() => {}); }, [countryId]);

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
        countryId: countryId ?? undefined, cityId: cityId ?? undefined,
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
          {countries.map((c) => (
            <Chip key={c.id} label={c.name} color={countryId === c.id ? 'primary' : 'muted'} variant={countryId === c.id ? 'solid' : 'soft'} onPress={() => { setCountryId(c.id); setCityId(null); }} />
          ))}
        </View>

        {countryId && (
          <>
            <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>City</Text>
            <View style={styles.row}>
              {cities.map((c) => (
                <Chip key={c.id} label={c.name} color={cityId === c.id ? 'primary' : 'muted'} variant={cityId === c.id ? 'solid' : 'soft'} onPress={() => setCityId(c.id)} />
              ))}
            </View>
          </>
        )}

        <Button title="Register" onPress={submit} loading={busy} variant="primary" size="lg" fullWidth leftIcon="checkmark-circle-outline" style={{ marginTop: spacing.lg }} />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
