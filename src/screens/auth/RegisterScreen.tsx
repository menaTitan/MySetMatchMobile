import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Modal, FlatList, Pressable, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authApi, locationsApi } from '../../api';
import { DEFAULT_THEME, radii, shadows, spacing, typography } from '../../theme';
import { Button, Input, KeyboardAware } from '../../components/ui';

const T = DEFAULT_THEME;

interface PickerItem { id: string; name: string; }

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', name: '', countryId: '', cityId: '' });
  const [countries, setCountries] = useState<PickerItem[]>([]);
  const [cities, setCities] = useState<PickerItem[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    locationsApi.countries().then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.countryId) {
      setCities([]);
      setSelectedCityName('');
      setForm(f => ({ ...f, cityId: '' }));
      locationsApi.cities(form.countryId).then(r => setCities(r.data)).catch(() => setCities([]));
    }
  }, [form.countryId]);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    if (!form.email || !form.password || !form.name) {
      Alert.alert('Missing info', 'Name, email and password are required');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        countryId: form.countryId,
        cityId: form.cityId,
      });
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors ? errors.join('\n') : (err?.response?.data?.message ?? 'Registration failed');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={T.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: T.accentLight }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

      <KeyboardAware contentContainerStyle={styles.scroll} extraScroll={60}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.sub}>Join the MySetMatch community</Text>

          <View style={styles.card}>
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
              label="Country"
              placeholder="Select country (optional)"
              value={selectedCountryName}
              icon="earth-outline"
              onPress={() => setCountryModal(true)}
            />
            <PickerField
              label="City"
              placeholder={form.countryId ? 'Select city (optional)' : 'Choose country first'}
              value={selectedCityName}
              icon="location-outline"
              disabled={!form.countryId}
              onPress={() => form.countryId && setCityModal(true)}
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
          </View>
      </KeyboardAware>

      <PickerModal
        visible={countryModal}
        onClose={() => setCountryModal(false)}
        items={countries}
        title="Select Country"
        onSelect={(item) => { update('countryId', item.id); setSelectedCountryName(item.name); }}
      />
      <PickerModal
        visible={cityModal}
        onClose={() => setCityModal(false)}
        items={cities}
        title="Select City"
        onSelect={(item) => { update('cityId', item.id); setSelectedCityName(item.name); }}
      />
    </LinearGradient>
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
          { borderColor: T.border, backgroundColor: '#F7FAFC', opacity: disabled ? 0.5 : 1 },
          pressed && { borderColor: T.secondary },
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: T.primary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={T.textSecondary} />
            </Pressable>
          </View>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl + 20 },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 300, height: 300, top: -80, right: -80, opacity: 0.8 },
  orbB: { width: 240, height: 240, bottom: -40, left: -80 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  heading: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2, marginBottom: spacing.lg },
  card: { backgroundColor: '#fff', borderRadius: radii.xxl, padding: spacing.xl, ...shadows.xl },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },
  signInLink: { marginTop: spacing.lg, alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '75%', paddingBottom: spacing.lg,
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.md, backgroundColor: '#F7FAFC',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  modalSep: { height: 1, marginHorizontal: spacing.lg },
});
