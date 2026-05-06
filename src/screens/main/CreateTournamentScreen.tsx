import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, sportsApi, locationsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { Sport } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Button, Card, Input, KeyboardAware, useToast } from '../../components/ui';

const TYPES = ['Local', 'Regional', 'National', 'International'] as const;
const FORMATS = ['SingleElimination', 'RoundRobin', 'Mixed'] as const;

interface PickerItem { id: string; name: string; }

export default function CreateTournamentScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const toast = useToast();

  const [sports, setSports] = useState<Sport[]>([]);
  const [countries, setCountries] = useState<PickerItem[]>([]);
  const [cities, setCities] = useState<PickerItem[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    type: 'Local' as typeof TYPES[number],
    format: 'SingleElimination' as typeof FORMATS[number],
    sportId: currentSport?.id ?? '',
    sportName: currentSport?.name ?? '',
    countryId: '',
    countryName: '',
    cityId: '',
    cityName: '',
    maxParticipants: '',
    entryFee: '',
    isDoubles: false,
  });

  const [modal, setModal] = useState<null | 'sport' | 'type' | 'format' | 'country' | 'city'>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sportsApi.list().then(r => setSports(r.data)).catch(() => {});
    locationsApi.countries().then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.countryId) return;
    setForm(f => ({ ...f, cityId: '', cityName: '' }));
    locationsApi.cities(form.countryId).then(r => setCities(r.data)).catch(() => setCities([]));
  }, [form.countryId]);

  async function handleCreate() {
    if (!form.name.trim()) { toast('Name is required', 'warning'); return; }
    if (!form.sportId)     { toast('Pick a sport', 'warning'); return; }
    if (!form.startDate)   { toast('Start date is required', 'warning'); return; }
    if (!form.endDate)     { toast('End date is required', 'warning'); return; }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast('Use YYYY-MM-DD format for dates', 'warning'); return;
    }
    if (end < start) { toast('End must be on/after start', 'warning'); return; }

    setSaving(true);
    try {
      const { data } = await tournamentsApi.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        venue: form.venue.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type: form.type,
        format: form.format,
        sportId: form.sportId,
        countryId: form.countryId || undefined,
        cityId: form.cityId || undefined,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
        entryFee: form.entryFee ? parseFloat(form.entryFee) : undefined,
        isDoubles: form.isDoubles,
      });
      toast('Tournament created', 'success');
      navigation.replace('TournamentDetail', { id: data.id });
    } catch {
      // interceptor toasts error
    } finally { setSaving(false); }
  }

  return (
    <>
    <KeyboardAware
      style={{ flex: 1, backgroundColor: theme.pageBg }}
      contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }}
    >
        <Card>
          <Input label="Tournament name *" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Summer Open 2026" />
          <Input label="Venue" leftIcon="business-outline" value={form.venue} onChangeText={v => setForm(f => ({ ...f, venue: v }))} placeholder="Community Sports Hall" />
          <Input label="Description" multiline numberOfLines={3} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} />
        </Card>

        <Card>
          <Input
            label="Start date * (YYYY-MM-DD)"
            leftIcon="calendar-outline"
            placeholder="2026-06-12"
            value={form.startDate}
            onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
          />
          <Input
            label="End date * (YYYY-MM-DD)"
            leftIcon="calendar-outline"
            placeholder="2026-06-14"
            value={form.endDate}
            onChangeText={v => setForm(f => ({ ...f, endDate: v }))}
          />
        </Card>

        <Card>
          <PickerRow label="Sport *"  value={form.sportName} icon="tennisball-outline" onPress={() => setModal('sport')} />
          <PickerRow label="Type"     value={form.type}      icon="earth-outline"     onPress={() => setModal('type')} />
          <PickerRow label="Format"   value={form.format}    icon="git-branch-outline" onPress={() => setModal('format')} />
          <PickerRow label="Country"  value={form.countryName} icon="flag-outline"     onPress={() => setModal('country')} />
          <PickerRow label="City"     value={form.cityName}  icon="location-outline"  disabled={!form.countryId} onPress={() => form.countryId && setModal('city')} />
        </Card>

        <Card>
          <Input
            label="Max participants"
            leftIcon="people-outline"
            keyboardType="number-pad"
            value={form.maxParticipants}
            onChangeText={v => setForm(f => ({ ...f, maxParticipants: v.replace(/[^0-9]/g, '') }))}
            placeholder="32"
          />
          <Input
            label="Entry fee ($)"
            leftIcon="cash-outline"
            keyboardType="decimal-pad"
            value={form.entryFee}
            onChangeText={v => setForm(f => ({ ...f, entryFee: v.replace(/[^0-9.]/g, '') }))}
            placeholder="0 (free)"
          />
          <Pressable
            onPress={() => setForm(f => ({ ...f, isDoubles: !f.isDoubles }))}
            style={({ pressed }) => [styles.toggleRow, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.checkbox, {
              backgroundColor: form.isDoubles ? theme.primary : 'transparent',
              borderColor: form.isDoubles ? theme.primary : theme.border,
            }]}>
              {form.isDoubles ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]}>
              Doubles tournament
            </Text>
          </Pressable>
        </Card>

        <Button
          title="Create Tournament"
          variant="primary"
          size="lg"
          fullWidth
          leftIcon="add-circle-outline"
          loading={saving}
          onPress={handleCreate}
        />
      </KeyboardAware>

      <SheetPicker
        visible={modal === 'sport'}
        title="Select Sport"
        items={sports.map(s => ({ id: s.id, name: s.name }))}
        onSelect={(i) => { setForm(f => ({ ...f, sportId: i.id, sportName: i.name })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <SheetPicker
        visible={modal === 'type'}
        title="Tournament Type"
        items={TYPES.map(t => ({ id: t, name: t }))}
        onSelect={(i) => { setForm(f => ({ ...f, type: i.id as any })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <SheetPicker
        visible={modal === 'format'}
        title="Format"
        items={FORMATS.map(t => ({ id: t, name: t.replace(/([A-Z])/g, ' $1').trim() }))}
        onSelect={(i) => { setForm(f => ({ ...f, format: i.id as any })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <SheetPicker
        visible={modal === 'country'}
        title="Select Country"
        items={countries}
        searchable
        onSelect={(i) => { setForm(f => ({ ...f, countryId: i.id, countryName: i.name })); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <SheetPicker
        visible={modal === 'city'}
        title="Select City"
        items={cities}
        searchable
        onSelect={(i) => { setForm(f => ({ ...f, cityId: i.id, cityName: i.name })); setModal(null); }}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function PickerRow({
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

function SheetPicker({
  visible, onClose, items, onSelect, title, searchable,
}: {
  visible: boolean; onClose: () => void; items: PickerItem[];
  onSelect: (item: PickerItem) => void; title: string; searchable?: boolean;
}) {
  const { theme } = useSport();
  const [query, setQuery] = useState('');
  const filtered = searchable ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())) : items;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={[typography.h2, { color: theme.primary }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.divider }]}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          {searchable ? (
            <View style={[styles.search, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <Input
                placeholder="Search…"
                containerStyle={{ flex: 1, marginBottom: 0 }}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 1.5, borderRadius: radii.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    maxHeight: '75%', paddingBottom: spacing.lg,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginTop: 8 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  search: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radii.md, borderWidth: 1,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  sep: { height: 1, marginHorizontal: spacing.lg },
});
