import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { authApi, locationsApi } from '../../api';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input, Chip } from '../../components/ui';

const T = DEFAULT_THEME;

export default function CreateProfileScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState<string | null>(null);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    locationsApi.countries().then((r) => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!countryId) return;
    locationsApi.cities(countryId).then((r) => setCities(r.data)).catch(() => setCities([]));
  }, [countryId]);

  async function submit() {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter your full name.'); return; }
    if (!countryId || !cityId) { Alert.alert('Location required', 'Please select your country and city.'); return; }
    setLoading(true);
    try {
      await authApi.createProfile({
        name: name.trim(),
        countryId, cityId,
        skillLevel: skill ?? undefined,
        phoneNumber: phone.trim() || undefined,
      });
      Alert.alert('Profile created!', 'Welcome to MySetMatch.', [
        { text: 'Get started', onPress: () => navigation.replace?.('Login') ?? navigation.popToTop?.() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not create profile.');
    } finally { setLoading(false); }
  }

  return (
    <AuthScreen
      icon="person-circle-outline"
      title="Create your profile"
      subtitle="One last step — tell us a bit about yourself so other players can find you."
    >
      <Input label="Full name" leftIcon="person-outline" value={name} onChangeText={setName} placeholder="Jane Doe" />
      <Input label="Phone (optional)" leftIcon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={[typography.smallStrong, styles.sectionLabel]}>Country</Text>
      <View style={styles.chipsRow}>
        {countries.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            color={countryId === c.id ? 'primary' : 'muted'}
            variant={countryId === c.id ? 'solid' : 'soft'}
            onPress={() => { setCountryId(c.id); setCityId(null); }}
          />
        ))}
      </View>

      {countryId && (
        <>
          <Text style={[typography.smallStrong, styles.sectionLabel]}>City</Text>
          <View style={styles.chipsRow}>
            {cities.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                color={cityId === c.id ? 'primary' : 'muted'}
                variant={cityId === c.id ? 'solid' : 'soft'}
                onPress={() => setCityId(c.id)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={[typography.smallStrong, styles.sectionLabel]}>Skill level (optional)</Text>
      <View style={styles.chipsRow}>
        {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
          <Chip
            key={lvl}
            label={lvl}
            color={skill === lvl ? 'primary' : 'muted'}
            variant={skill === lvl ? 'solid' : 'soft'}
            onPress={() => setSkill(skill === lvl ? null : lvl)}
          />
        ))}
      </View>

      <Button
        title="Create profile"
        onPress={submit}
        loading={loading}
        variant="primary" size="lg" fullWidth
        rightIcon="arrow-forward"
        style={{ marginTop: spacing.lg }}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { color: T.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
