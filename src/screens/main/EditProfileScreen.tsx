import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  Pressable, FlatList, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { locationsApi, playerApi } from '../../api';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, Card, HeroHeader, Input, KeyboardAware, useToast } from '../../components/ui';

const HANDEDNESS_OPTIONS = ['Right', 'Left', 'Ambidextrous'];
const PLAY_STYLE_OPTIONS = ['Offensive', 'Defensive', 'All-Round'];

interface PickerItem { id: string; name: string; }

export default function EditProfileScreen({ navigation }: any) {
  const { player, updatePlayer } = useAuth();
  const { theme } = useSport();
  const toast = useToast();

  const [form, setForm] = useState({
    name: player?.name ?? '',
    clubName: player?.clubName ?? '',
    handedness: player?.handedness ?? '',
    playStyle: player?.playStyle ?? '',
    countryId: '',
    cityId: '',
  });
  const [countryName, setCountryName] = useState(player?.country ?? '');
  const [cityName, setCityName] = useState(player?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [countries, setCountries] = useState<PickerItem[]>([]);
  const [cities, setCities] = useState<PickerItem[]>([]);
  const [modal, setModal] = useState<null | 'country' | 'city' | 'handedness' | 'style'>(null);

  useEffect(() => {
    locationsApi.countries().then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.countryId) return;
    setCities([]); setCityName(''); setForm(f => ({ ...f, cityId: '' }));
    locationsApi.cities(form.countryId).then(r => setCities(r.data)).catch(() => {});
  }, [form.countryId]);

  async function handlePickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast('Photo library access is required', 'warning'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const { data } = await playerApi.uploadPhoto(result.assets[0].uri);
      if (player) updatePlayer({ ...player, profilePhotoUrl: data.profilePhotoUrl });
      toast('Photo updated', 'success');
    } catch {
      // axios interceptor already toasts the error
    } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      const { data } = await playerApi.updateMe({
        name: form.name,
        clubName: form.clubName,
        handedness: form.handedness || undefined,
        playStyle: form.playStyle || undefined,
        countryId: form.countryId || undefined,
        cityId: form.cityId || undefined,
      });
      if (player) updatePlayer({ ...player, ...data });
      toast('Profile saved', 'success');
      navigation.goBack();
    } catch {
      // interceptor handles the toast
    } finally { setSaving(false); }
  }

  return (
    <>
    <KeyboardAware
      style={{ flex: 1, backgroundColor: theme.pageBg }}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
    >
        <HeroHeader variant="standard" align="center">
          <View style={{ alignItems: 'center' }}>
            <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
              <View style={[styles.avatarRing, { borderColor: theme.accent, shadowColor: theme.accent }]}>
                <Avatar name={player?.name} photoUrl={player?.profilePhotoUrl} size={96} />
              </View>
              <View style={[styles.cameraBadge, { backgroundColor: theme.accent }]}>
                <Ionicons
                  name={uploading ? 'hourglass-outline' : 'camera'}
                  size={14}
                  color={theme.primary}
                />
              </View>
            </Pressable>
            <Text style={[typography.smallStrong, { color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm }]}>
              Tap to change photo
            </Text>
          </View>
        </HeroHeader>

        <View style={{ padding: spacing.base, gap: spacing.base }}>
          <Card>
            <Input label="Full name" leftIcon="person-outline" value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} />
            <Input label="Club" leftIcon="business-outline" value={form.clubName} onChangeText={(v) => setForm(f => ({ ...f, clubName: v }))} placeholder="e.g. Brentwood TT Club" />
          </Card>

          <Card>
            <PickerField label="Handedness" value={form.handedness} icon="hand-left-outline" onPress={() => setModal('handedness')} />
            <PickerField label="Play style" value={form.playStyle} icon="flash-outline" onPress={() => setModal('style')} />
          </Card>

          <Card>
            <PickerField label="Country" value={countryName} icon="earth-outline" onPress={() => setModal('country')} />
            <PickerField label="City" value={cityName} icon="location-outline" disabled={!form.countryId} onPress={() => form.countryId && setModal('city')} />
          </Card>

          <Button
            title="Save Changes"
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            leftIcon="checkmark-circle-outline"
            onPress={handleSave}
          />
        </View>
      </KeyboardAware>

      {/* Picker modals */}
      <PickerModal
        visible={modal === 'handedness'}
        title="Handedness"
        items={HANDEDNESS_OPTIONS.map(v => ({ id: v, name: v }))}
        onSelect={(i) => { setForm(f => ({ ...f, handedness: i.id })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <PickerModal
        visible={modal === 'style'}
        title="Play Style"
        items={PLAY_STYLE_OPTIONS.map(v => ({ id: v, name: v }))}
        onSelect={(i) => { setForm(f => ({ ...f, playStyle: i.id })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <PickerModal
        visible={modal === 'country'}
        title="Select Country"
        items={countries}
        searchable
        onSelect={(i) => { setForm(f => ({ ...f, countryId: i.id })); setCountryName(i.name); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <PickerModal
        visible={modal === 'city'}
        title="Select City"
        items={cities}
        searchable
        onSelect={(i) => { setForm(f => ({ ...f, cityId: i.id })); setCityName(i.name); setModal(null); }}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function PickerField({
  label, value, icon, disabled, onPress,
}: { label: string; value: string; icon: any; disabled?: boolean; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <View style={{ marginBottom: spacing.sm + 2 }}>
      <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pickerRow,
          { borderColor: theme.border, backgroundColor: '#F7FAFC', opacity: disabled ? 0.5 : 1 },
          pressed && { borderColor: theme.secondary },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, color: value ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
          {value || 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

function PickerModal({
  visible, onClose, items, onSelect, title, searchable,
}: {
  visible: boolean; onClose: () => void; items: PickerItem[];
  onSelect: (item: PickerItem) => void; title: string; searchable?: boolean;
}) {
  const { theme } = useSport();
  const [query, setQuery] = useState('');
  const filtered = searchable ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())) : items;
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      {searchable ? (
        <View style={[styles.search, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
            placeholder="Search…"
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}
          />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        style={{ maxHeight: 480 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.pageBg }]}
            onPress={() => { onSelect(item); setQuery(''); }}
          >
            <Text style={{ flex: 1, fontSize: 15, color: theme.textPrimary }}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.divider }]} />}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { position: 'relative' },
  avatarRing: {
    padding: 3, borderRadius: 56, borderWidth: 3,
    shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },

  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.md, borderWidth: 1,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  sep: { height: 1, marginHorizontal: spacing.lg },
});
