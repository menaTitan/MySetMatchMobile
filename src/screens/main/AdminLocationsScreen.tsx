import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type CountryRow, type RegionRow, type CityRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { BottomSheet, Button, Chip, EmptyState, LoadingView, PageHeader, Input, useToast } from '../../components/ui';

type Tab = 'countries' | 'regions' | 'cities';

export default function AdminLocationsScreen() {
  const { theme } = useSport();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('countries');
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<{ kind: Tab; row?: any } | null>(null);
  const [selCountry, setSelCountry] = useState<string | null>(null);
  const [selRegion, setSelRegion] = useState<string | null>(null);

  async function loadCountries() {
    const { data } = await adminApi.countries();
    setCountries(data);
    if (!selCountry && data.length) setSelCountry(data[0].id);
  }
  async function loadRegions(countryId: string | null) {
    if (!countryId) { setRegions([]); return; }
    const { data } = await adminApi.regions(countryId);
    setRegions(data);
    if (!selRegion && data.length) setSelRegion(data[0].id);
  }
  async function loadCities(regionId: string | null) {
    if (!regionId) { setCities([]); return; }
    const { data } = await adminApi.cities(regionId);
    setCities(data);
  }

  useEffect(() => { loadCountries().catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (selCountry) loadRegions(selCountry); }, [selCountry]);
  useEffect(() => { if (selRegion) loadCities(selRegion); }, [selRegion]);

  async function deleteRow(kind: Tab, id: string) {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (kind === 'countries') { await adminApi.deleteCountry(id); loadCountries(); }
          else if (kind === 'regions') { await adminApi.deleteRegion(id); loadRegions(selCountry); }
          else { await adminApi.deleteCity(id); loadCities(selRegion); }
          toast('Deleted', 'success');
        } catch {}
      } },
    ]);
  }

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Locations" subtitle="Countries, regions, cities" compact />

      <View style={[styles.tabs, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        {(['countries', 'regions', 'cities'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { borderBottomColor: theme.primary }]}>
            <Text style={[typography.smallStrong, { color: tab === t ? theme.primary : theme.textMuted }]}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {tab !== 'countries' && (
        <View style={styles.crumb}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>Country:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: 6 }}>
            {countries.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                size="sm"
                color={selCountry === c.id ? 'primary' : 'muted'}
                variant={selCountry === c.id ? 'solid' : 'soft'}
                onPress={() => { setSelCountry(c.id); setSelRegion(null); }}
              />
            ))}
          </View>
        </View>
      )}
      {tab === 'cities' && (
        <View style={styles.crumb}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>Region:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: 6 }}>
            {regions.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                size="sm"
                color={selRegion === r.id ? 'primary' : 'muted'}
                variant={selRegion === r.id ? 'solid' : 'soft'}
                onPress={() => setSelRegion(r.id)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Button title={`Add ${tab.slice(0, -1)}`} onPress={() => setEditor({ kind: tab })} leftIcon="add" variant="primary" size="md" uppercase={false} style={{ margin: spacing.base }} />
        <FlatList
          data={tab === 'countries' ? countries : tab === 'regions' ? regions : cities}
          keyExtractor={(r: any) => r.id}
          contentContainerStyle={{ padding: spacing.base, paddingTop: 0, gap: spacing.xs + 2 }}
          renderItem={({ item }: any) => (
            <View style={[styles.row, { backgroundColor: theme.cardBg }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{item.name}</Text>
                {item.code && <Text style={[typography.caption, { color: theme.textMuted }]}>Code: {item.code}</Text>}
              </View>
              <Pressable onPress={() => setEditor({ kind: tab, row: item })} style={styles.iconBtn}>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
              </Pressable>
              <Pressable onPress={() => deleteRow(tab, item.id)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={16} color={theme.dangerRed} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="location-outline" title={`No ${tab}`} />}
        />
      </View>

      {editor && <LocationEditor
        editor={editor}
        countries={countries}
        regions={regions}
        selCountry={selCountry}
        selRegion={selRegion}
        onClose={() => setEditor(null)}
        onSaved={() => {
          if (editor.kind === 'countries') loadCountries();
          else if (editor.kind === 'regions') loadRegions(selCountry);
          else loadCities(selRegion);
          setEditor(null);
        }}
      />}
    </View>
  );
}

function LocationEditor({
  editor, countries, regions, selCountry, selRegion, onClose, onSaved,
}: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [name, setName] = useState(editor.row?.name ?? '');
  const [code, setCode] = useState(editor.row?.code ?? '');
  const [parent, setParent] = useState(editor.kind === 'regions' ? editor.row?.countryId ?? selCountry : editor.row?.regionId ?? selRegion);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (editor.kind === 'countries') {
        if (editor.row) await adminApi.editCountry(editor.row.id, name.trim(), code.trim());
        else await adminApi.addCountry(name.trim(), code.trim());
      } else if (editor.kind === 'regions') {
        if (editor.row) await adminApi.editRegion(editor.row.id, name.trim(), parent);
        else await adminApi.addRegion(name.trim(), parent);
      } else {
        if (editor.row) await adminApi.editCity(editor.row.id, name.trim(), parent);
        else await adminApi.addCity(name.trim(), parent);
      }
      toast('Saved', 'success');
      onSaved();
    } catch (err: any) { Alert.alert('Failed', err?.response?.data?.message ?? 'Failed.'); }
    finally { setBusy(false); }
  }

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={`${editor.row ? 'Edit' : 'Add'} ${editor.kind.slice(0, -1)}`}
    >
      <Input label="Name" value={name} onChangeText={setName} />
      {editor.kind === 'countries' && <Input label="Code (e.g., US)" value={code} onChangeText={setCode} autoCapitalize="characters" />}
      {editor.kind === 'regions' && (
        <View>
          <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Country</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {countries.map((c: CountryRow) => (
              <Chip key={c.id} label={c.name} size="sm" color={parent === c.id ? 'primary' : 'muted'} variant={parent === c.id ? 'solid' : 'soft'} onPress={() => setParent(c.id)} />
            ))}
          </View>
        </View>
      )}
      {editor.kind === 'cities' && (
        <View>
          <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Region</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {regions.map((r: RegionRow) => (
              <Chip key={r.id} label={r.name} size="sm" color={parent === r.id ? 'primary' : 'muted'} variant={parent === r.id ? 'solid' : 'soft'} onPress={() => setParent(r.id)} />
            ))}
          </View>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        <Button title="Save" variant="primary" onPress={save} loading={busy} style={{ flex: 1 }} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: spacing.sm + 4, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  crumb: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: spacing.base, paddingBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm + 2, borderRadius: radii.md },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
