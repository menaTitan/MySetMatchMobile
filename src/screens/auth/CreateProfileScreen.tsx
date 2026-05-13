import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi, playerApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLocationChain } from '../../hooks/useLocationChain';
import { DEFAULT_THEME, radii, spacing, typography } from '../../theme';
import { AuthScreen, BottomSheet, Button, Chip, Input } from '../../components/ui';

const T = DEFAULT_THEME;

interface PickerItem { id: string; name: string; }

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
const HANDEDNESS = ['Right', 'Left', 'Ambidextrous'] as const;
const PLAY_STYLES = ['Offensive', 'Defensive', 'All-Round'] as const;

/**
 * Step 3 of registration — runs after the user verifies their email.
 * Collects the Player profile (name + location, plus optional skill /
 * handedness / play style) and creates the Player row.
 *
 * On success the AuthContext.player goes from null to populated, which
 * the root navigator picks up and switches to the Main stack.
 */
export default function CreateProfileScreen({ navigation, route }: any) {
  const { player, updatePlayer } = useAuth();
  const initialName: string = route?.params?.name ?? '';
  const [name, setName] = useState(initialName);
  const [skill, setSkill] = useState<string | null>(null);
  const [hand, setHand] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const loc = useLocationChain();
  const [loading, setLoading] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Missing info', 'Please enter your full name.'); return; }
    if (!loc.countryId) { Alert.alert('Missing country', 'Please select your country.'); return; }
    if (!loc.cityId) { Alert.alert('Missing city', 'Please select your city.'); return; }
    setLoading(true);
    try {
      await authApi.createProfile({
        name: name.trim(),
        countryId: loc.countryId,
        cityId: loc.cityId,
        skillLevel: skill ?? undefined,
      });
      // Persist handedness / play style on the new Player row if chosen.
      if (hand || style) {
        try {
          await playerApi.updateMe({
            handedness: hand ?? undefined,
            playStyle: style ?? undefined,
          });
        } catch { /* non-fatal */ }
      }
      // Pull the canonical player back so the AuthContext flips from
      // "no player yet" to populated — the root navigator then routes
      // to the Main stack automatically.
      try {
        const { data: me } = await playerApi.me();
        if (player) updatePlayer({ ...player, ...me });
        else updatePlayer(me as any);
      } catch { /* tolerated; next focus will reload */ }
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors ? errors.join('\n') : (err?.response?.data?.message ?? 'Could not create profile.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthScreen
        title="Complete your profile"
        subtitle="A few more details so we can match you with the right players"
      >
        <Input
          label="Full name *"
          leftIcon="person-outline"
          placeholder="John Doe"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
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

        <Text style={[typography.smallStrong, { color: T.textSecondary, marginTop: spacing.base, marginBottom: 6 }]}>
          Skill level
        </Text>
        <View style={styles.row}>
          {SKILL_LEVELS.map((s) => (
            <Chip key={s} label={s} color={skill === s ? 'primary' : 'muted'} variant={skill === s ? 'solid' : 'soft'} onPress={() => setSkill(s)} />
          ))}
        </View>

        <Text style={[typography.smallStrong, { color: T.textSecondary, marginTop: spacing.base, marginBottom: 6 }]}>
          Playing hand
        </Text>
        <View style={styles.row}>
          {HANDEDNESS.map((h) => (
            <Chip key={h} label={h} color={hand === h ? 'primary' : 'muted'} variant={hand === h ? 'solid' : 'soft'} onPress={() => setHand(h)} />
          ))}
        </View>

        <Text style={[typography.smallStrong, { color: T.textSecondary, marginTop: spacing.base, marginBottom: 6 }]}>
          Play style
        </Text>
        <View style={styles.row}>
          {PLAY_STYLES.map((p) => (
            <Chip key={p} label={p} color={style === p ? 'primary' : 'muted'} variant={style === p ? 'solid' : 'soft'} onPress={() => setStyle(p)} />
          ))}
        </View>

        <Button
          title="Finish & Get Started"
          onPress={handleCreate}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon="checkmark-circle-outline"
          style={{ marginTop: spacing.lg }}
        />
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
}: { label: string; placeholder: string; value: string; icon: any; disabled?: boolean; onPress: () => void }) {
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
        <Text style={{ flex: 1, color: value ? T.textPrimary : T.textMuted, fontSize: 15 }}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={T.textMuted} />
      </Pressable>
    </View>
  );
}

function PickerModal({
  visible, onClose, items, onSelect, title,
}: { visible: boolean; onClose: () => void; items: PickerItem[]; onSelect: (item: PickerItem) => void; title: string }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
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
        keyExtractor={(i) => i.id}
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },
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
