import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, FlatList, Pressable, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { useLocationChain } from '../../hooks/useLocationChain';
import { DEFAULT_THEME, radii, spacing, typography } from '../../theme';
import { AuthScreen, BottomSheet, Button, Input } from '../../components/ui';

const T = DEFAULT_THEME;

interface PickerItem { id: string; name: string; }

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const loc = useLocationChain();
  const [loading, setLoading] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    if (!form.email.trim() || !form.password || !form.name.trim()) {
      Alert.alert('Missing info', 'Name, email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    // Backend requires a country and city for every Player row, so we can't
    // submit empty Guids — guide the user to pick before continuing.
    if (!loc.countryId) {
      Alert.alert('Missing country', 'Please select your country.');
      return;
    }
    if (!loc.cityId) {
      Alert.alert('Missing city', 'Please select your city.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        countryId: loc.countryId,
        cityId: loc.cityId,
      });
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors ? errors.join('\n') : (err?.response?.data?.message ?? 'Registration failed. Please try again.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthScreen
        title="Create account"
        subtitle="Join the MySetMatch community"
        onBack={() => navigation.goBack()}
      >
        <Input
          label="Full name"
          leftIcon="person-outline"
          placeholder="John Doe"
          autoCapitalize="words"
          value={form.name}
          onChangeText={v => update('name', v)}
        />
        <Input
          label="Email"
          leftIcon="mail-outline"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={v => update('email', v)}
        />
        <Input
          label="Password"
          leftIcon="lock-closed-outline"
          rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
          onRightIconPress={() => setShowPass((x) => !x)}
          placeholder="At least 6 characters"
          secureTextEntry={!showPass}
          value={form.password}
          onChangeText={v => update('password', v)}
        />

        <PickerField
          label="Country *"
          placeholder="Select country"
          value={loc.countryName}
          icon="earth-outline"
          onPress={() => setCountryModal(true)}
        />
        {loc.hasRegions ? (
          <PickerField
            label="State / Region"
            placeholder="Select state"
            value={loc.regionName}
            icon="map-outline"
            onPress={() => setRegionModal(true)}
          />
        ) : null}
        <PickerField
          label="City *"
          placeholder={
            !loc.countryId
              ? 'Choose country first'
              : loc.hasRegions && !loc.regionId
                ? 'Choose state first'
                : 'Select city'
          }
          value={loc.cityName}
          icon="location-outline"
          disabled={!loc.countryId || (loc.hasRegions && !loc.regionId)}
          onPress={() => {
            if (loc.hasRegions && !loc.regionId) return;
            if (loc.countryId) setCityModal(true);
          }}
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon="arrow-forward"
          style={{ marginTop: spacing.sm }}
        />

        <Pressable onPress={() => navigation.goBack()} style={styles.signInLink}>
          <Text style={[typography.small, { color: T.textMuted }]}>
            Already have an account? <Text style={{ color: T.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </AuthScreen>

      <PickerModal
        visible={countryModal}
        onClose={() => setCountryModal(false)}
        items={loc.countries}
        title="Select Country"
        onSelect={(item) => loc.setCountry(item)}
      />
      <PickerModal
        visible={regionModal}
        onClose={() => setRegionModal(false)}
        items={loc.regions}
        title="Select State / Region"
        onSelect={(item) => loc.setRegion(item)}
      />
      <PickerModal
        visible={cityModal}
        onClose={() => setCityModal(false)}
        items={loc.cities}
        title="Select City"
        onSelect={(item) => loc.setCity(item)}
      />
    </>
  );
}

function PickerField({
  label, placeholder, value, icon, disabled, onPress,
}: { label: string; placeholder: string; value: string; icon: any; disabled?: boolean; onPress: () => void; }) {
  return (
    <View style={{ marginBottom: spacing.base }}>
      <Text style={[typography.smallStrong, { color: T.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pickerRow,
          { borderColor: T.border, backgroundColor: T.cardBg, opacity: disabled ? 0.5 : 1 },
          pressed && { borderColor: T.accent },
        ]}
      >
        <Ionicons name={icon} size={18} color={T.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, color: value ? T.textPrimary : T.textMuted, fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={T.textMuted} />
      </Pressable>
    </View>
  );
}

function PickerModal({
  visible, onClose, items, onSelect, title,
}: {
  visible: boolean; onClose: () => void; items: PickerItem[];
  onSelect: (item: PickerItem) => void; title: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      <View style={styles.modalSearch}>
        <Ionicons name="search" size={16} color={T.textMuted} />
        <TextInput
          placeholder="Search…"
          placeholderTextColor={T.textMuted}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, fontSize: 14, color: T.textPrimary }}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.modalItem, pressed && { backgroundColor: T.pageBg }]}
            onPress={() => { onSelect(item); onClose(); setQuery(''); }}
          >
            <Text style={{ fontSize: 15, color: T.textPrimary }}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={T.textMuted} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={[styles.modalSep, { backgroundColor: T.divider }]} />}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },
  signInLink: { marginTop: spacing.lg, alignItems: 'center' },

  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.md, backgroundColor: T.cardBg,
    borderWidth: 1, borderColor: T.border,
  },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  modalSep: { height: 1, marginHorizontal: spacing.lg },
});
