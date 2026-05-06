import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, RefreshControl, Alert, Image,
  Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { marketplaceApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { MarketplaceListing } from '../../types';
import {
  MARKETPLACE_CATEGORIES, MARKETPLACE_CONDITIONS,
  type MarketplaceCategory, type MarketplaceCondition,
} from '../../types';
import { radii, shadows, spacing, typography } from '../../theme';
import { Button, Chip, EmptyState, Input, LoadingView, PageHeader, useToast } from '../../components/ui';

const MAX_PHOTOS = 8;

type SortBy = 'newest' | 'price_asc' | 'price_desc';
const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Newest First',        value: 'newest' },
  { label: 'Price: Low to High',  value: 'price_asc' },
  { label: 'Price: High to Low',  value: 'price_desc' },
];
const CONDITION_COLOR: Record<string, { bg: string; fg: string }> = {
  'New':       { bg: 'rgba(34,197,94,0.12)',  fg: '#16a34a' },
  'Like New':  { bg: 'rgba(59,130,246,0.12)', fg: '#2563eb' },
  'Good':      { bg: 'rgba(245,158,11,0.12)', fg: '#b45309' },
  'Fair':      { bg: 'rgba(249,115,22,0.12)', fg: '#c2410c' },
  'Poor':      { bg: 'rgba(239,68,68,0.12)',  fg: '#dc2626' },
};

export default function MarketplaceScreen() {
  const { theme } = useSport();
  const toast = useToast();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterModal, setFilterModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    category: '' as MarketplaceCategory | '',
    condition: '' as MarketplaceCondition | '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerFor, setPickerFor] = useState<'category' | 'condition' | 'sort' | 'filterCat' | 'filterCond' | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await marketplaceApi.list({
        search: search.trim() || undefined,
        category: category || undefined,
        condition: condition || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy || undefined,
      });
      setListings(data?.items ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [search, category, condition, maxPrice, sortBy]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  function applyFilters() { setFilterModal(false); setLoading(true); load(); }

  async function pickPhotos() {
    if (photos.length >= MAX_PHOTOS) { toast(`You can upload up to ${MAX_PHOTOS} photos`, 'warning'); return; }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast('Photo library access is required', 'warning'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }

  async function createListing() {
    if (!form.title.trim()) { toast('Title is required', 'warning'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast('Enter a valid price', 'warning'); return;
    }
    if (!form.category)  { toast('Select a category', 'warning'); return; }
    if (!form.condition) { toast('Select a condition', 'warning'); return; }
    if (photos.length === 0) { toast('Add at least one photo', 'warning'); return; }

    setSaving(true);
    try {
      setUploading(true);
      const uploadRes = await marketplaceApi.uploadPhotos(photos);
      setUploading(false);

      await marketplaceApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        condition: form.condition,
        imageUrls: uploadRes.data.urls,
      });
      setForm({ title: '', description: '', price: '', category: '', condition: '' });
      setPhotos([]);
      setCreateModal(false);
      toast('Listing posted', 'success');
      setLoading(true);
      load();
    } catch {
      // interceptor already surfaces the error
    } finally { setSaving(false); setUploading(false); }
  }

  async function deleteListing(id: string) {
    Alert.alert('Delete listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await marketplaceApi.delete(id);
            setListings((prev) => prev.filter((l) => l.id !== id));
          } catch { Alert.alert('Error', 'Could not delete listing'); }
        },
      },
    ]);
  }

  async function markSold(id: string) {
    try {
      await marketplaceApi.markSold(id);
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, isSold: true } : l));
    } catch { Alert.alert('Error', 'Could not mark as sold'); }
  }

  const activeFilterCount = [category, condition, maxPrice].filter(Boolean).length;

  const renderListing = ({ item }: { item: MarketplaceListing }) => {
    const cond = CONDITION_COLOR[item.condition] ?? { bg: theme.divider, fg: theme.textSecondary };
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg }, shadows.md]}>
        <View style={styles.cardImgWrap}>
          {item.imageUrls?.[0] ? (
            <Image source={{ uri: item.imageUrls[0] }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImgPlaceholder, { backgroundColor: theme.pageBgTint }]}>
              <Ionicons name="image-outline" size={28} color={theme.textMuted} />
            </View>
          )}
          {item.isSold && (
            <View style={styles.soldBanner}>
              <Text style={styles.soldBannerText}>SOLD</Text>
            </View>
          )}
          <View style={[styles.condBadge, { backgroundColor: cond.bg }]}>
            <Text style={[typography.caption, { color: cond.fg, fontWeight: '800', fontSize: 9 }]}>
              {item.condition.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary, fontSize: 13 }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[typography.h2, { color: theme.primary, fontSize: 18, marginTop: 2 }]}>
            ${item.price.toFixed(2)}
          </Text>

          <View style={styles.sellerRow}>
            <Ionicons name="person-circle-outline" size={12} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
              {item.sellerName}
            </Text>
          </View>
          {item.city ? (
            <View style={styles.sellerRow}>
              <Ionicons name="location-outline" size={11} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>{item.city}</Text>
            </View>
          ) : null}

          {item.isMyListing && !item.isSold ? (
            <View style={styles.myActions}>
              <Pressable style={[styles.iconBtn, { backgroundColor: 'rgba(34,197,94,0.12)' }]} onPress={() => markSold(item.id)}>
                <Ionicons name="checkmark-outline" size={14} color={theme.successGreen} />
                <Text style={[typography.caption, { color: theme.successGreen, fontWeight: '700' }]}>Sold</Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={() => deleteListing(item.id)}>
                <Ionicons name="trash-outline" size={14} color={theme.dangerRed} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <PageHeader title="Marketplace" subtitle="Buy & sell equipment with the community" compact />

      {/* Search + filter */}
      <View style={[styles.searchBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
            placeholder="Search equipment…"
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={applyFilters}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}
          />
        </View>
        <Pressable
          style={[styles.filterBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setFilterModal(true)}
        >
          <Ionicons name="options-outline" size={18} color={theme.primary} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <View style={styles.chipRow}>
          {category ? (
            <Chip label={`${category} ✕`} onPress={() => { setCategory(''); setLoading(true); }} variant="soft" size="sm" />
          ) : null}
          {condition ? (
            <Chip label={`${condition} ✕`} onPress={() => { setCondition(''); setLoading(true); }} variant="soft" size="sm" />
          ) : null}
          {maxPrice ? (
            <Chip label={`≤ $${maxPrice} ✕`} onPress={() => { setMaxPrice(''); setLoading(true); }} variant="soft" size="sm" />
          ) : null}
        </View>
      )}

      {loading ? <LoadingView /> : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.base }}
          renderItem={renderListing}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ paddingVertical: spacing.base, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title="No listings found"
              message={activeFilterCount > 0 ? 'Try different filters' : 'Be the first to post equipment for sale!'}
            />
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => setCreateModal(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, shadowColor: theme.accent },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Ionicons name="add" size={22} color={theme.primary} />
        <Text style={[typography.smallStrong, { color: theme.primary, fontWeight: '800' }]}>Post</Text>
      </Pressable>

      {/* Filter Modal */}
      <BottomSheetModal visible={filterModal} onClose={() => setFilterModal(false)} title="Filter listings">
        <PickerField label="Category" value={category || 'All Categories'} onPress={() => setPickerFor('filterCat')} />
        <PickerField label="Condition" value={condition || 'Any Condition'} onPress={() => setPickerFor('filterCond')} />
        <Input
          label="Max price ($)"
          placeholder="No limit"
          value={maxPrice}
          onChangeText={setMaxPrice}
          keyboardType="numeric"
          leftIcon="cash-outline"
        />
        <PickerField
          label="Sort by"
          value={SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? ''}
          onPress={() => setPickerFor('sort')}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button
            title="Clear"
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            uppercase={false}
            onPress={() => { setCategory(''); setCondition(''); setMaxPrice(''); setSortBy('newest'); }}
          />
          <Button title="Apply" variant="primary" size="md" style={{ flex: 1 }} onPress={applyFilters} />
        </View>
      </BottomSheetModal>

      {/* Create Modal */}
      <BottomSheetModal visible={createModal} onClose={() => setCreateModal(false)} title="Post a listing" tall>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Input label="Title *" placeholder="e.g. Butterfly Timo Boll ALC Blade" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Input label="Price ($) *" placeholder="0.00" value={form.price} keyboardType="decimal-pad" leftIcon="cash-outline" onChangeText={(v) => setForm((f) => ({ ...f, price: v.replace(/[^0-9.]/g, '') }))} />
          <PickerField label="Category *" value={form.category || 'Select category'} onPress={() => setPickerFor('category')} />
          <PickerField label="Condition *" value={form.condition || 'Select condition'} onPress={() => setPickerFor('condition')} />
          <Input label="Description" placeholder="Describe the item…" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline numberOfLines={4} />

          {/* Photos */}
          <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>
            Photos ({photos.length}/{MAX_PHOTOS}) *
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((uri) => (
              <View key={uri} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photoImg} />
                <Pressable onPress={() => removePhoto(uri)} style={styles.photoRemove}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={pickPhotos}
                style={[styles.photoAdd, { borderColor: theme.border, backgroundColor: theme.pageBg }]}
              >
                <Ionicons name="add" size={22} color={theme.textMuted} />
                <Text style={[typography.caption, { color: theme.textMuted }]}>Add</Text>
              </Pressable>
            )}
          </View>

          <Button
            title={uploading ? 'Uploading…' : 'Post Listing'}
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            leftIcon="add-circle-outline"
            onPress={createListing}
            style={{ marginTop: spacing.base }}
          />
        </KeyboardAvoidingView>
      </BottomSheetModal>

      {/* Shared picker modal */}
      <PickerListModal
        visible={pickerFor !== null}
        title={
          pickerFor === 'category' || pickerFor === 'filterCat' ? 'Select Category'
          : pickerFor === 'condition' || pickerFor === 'filterCond' ? 'Select Condition'
          : 'Sort By'
        }
        items={
          pickerFor === 'category' || pickerFor === 'filterCat'
            ? ['', ...MARKETPLACE_CATEGORIES].map((v) => ({ label: v || 'All Categories', value: v }))
            : pickerFor === 'condition' || pickerFor === 'filterCond'
            ? ['', ...MARKETPLACE_CONDITIONS].map((v) => ({ label: v || 'Any Condition', value: v }))
            : SORT_OPTIONS.map((s) => ({ label: s.label, value: s.value }))
        }
        onSelect={(value) => {
          if (pickerFor === 'category') setForm((f) => ({ ...f, category: value as MarketplaceCategory }));
          else if (pickerFor === 'condition') setForm((f) => ({ ...f, condition: value as MarketplaceCondition }));
          else if (pickerFor === 'filterCat') setCategory(value);
          else if (pickerFor === 'filterCond') setCondition(value);
          else if (pickerFor === 'sort') setSortBy(value as SortBy);
          setPickerFor(null);
        }}
        onClose={() => setPickerFor(null)}
      />
    </View>
  );
}

function PickerField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <View style={{ marginBottom: spacing.base }}>
      <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pickerRow,
          { borderColor: pressed ? theme.secondary : theme.border, backgroundColor: '#F7FAFC' },
        ]}
      >
        <Text style={{ flex: 1, fontSize: 15, color: theme.textPrimary }}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

function BottomSheetModal({
  visible, onClose, title, children, tall,
}: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; tall?: boolean }) {
  const { theme } = useSport();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { backgroundColor: theme.cardBg, maxHeight: tall ? '90%' : '75%' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: theme.primary }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.divider }]}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PickerListModal({
  visible, onClose, items, onSelect, title,
}: {
  visible: boolean; onClose: () => void; items: { label: string; value: string }[];
  onSelect: (v: string) => void; title: string;
}) {
  const { theme } = useSport();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: theme.primary }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.divider }]}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(i) => i.value}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.pickerItem, pressed && { backgroundColor: theme.pageBg }]}
                onPress={() => onSelect(item.value)}
              >
                <Text style={{ fontSize: 15, color: theme.textPrimary, flex: 1 }}>{item.label}</Text>
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
  container: { flex: 1 },

  searchBar: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, borderBottomWidth: 1 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, borderWidth: 1, borderRadius: radii.md, minHeight: 42,
  },
  filterBtn: {
    width: 42, height: 42, borderRadius: radii.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },

  card: { flex: 1, borderRadius: radii.lg, overflow: 'hidden' },
  cardImgWrap: { position: 'relative' },
  cardImg: { width: '100%', height: 140 },
  cardImgPlaceholder: { width: '100%', height: 140, alignItems: 'center', justifyContent: 'center' },
  soldBanner: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#EF4444', borderRadius: radii.xs,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soldBannerText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  condBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  cardBody: { padding: spacing.sm + 2 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  myActions: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  iconBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 6, borderRadius: radii.sm,
  },

  fab: {
    position: 'absolute', bottom: 20, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: radii.pill,
    shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
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
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  sep: { height: 1, marginHorizontal: spacing.lg },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radii.md,
    paddingHorizontal: 14, minHeight: 50,
  },

  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginBottom: spacing.sm,
  },
  photoTile: {
    width: 72, height: 72, borderRadius: radii.sm, overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 72, height: 72, borderRadius: radii.sm,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
});
