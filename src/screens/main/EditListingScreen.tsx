import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { marketplaceApi } from '../../api';
import { useSport } from '../../context/SportContext';
import {
  MARKETPLACE_CATEGORIES, MARKETPLACE_CONDITIONS,
  type MarketplaceListing,
} from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Button, Chip, Input, KeyboardAware, LoadingView, PageHeader, useToast } from '../../components/ui';

const MAX_PHOTOS = 8;

export default function EditListingScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [data, setData] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    marketplaceApi.detail(id).then(({ data: d }) => {
      setData(d);
      setTitle(d.title); setDescription(d.description);
      setPrice(String(d.price));
      setCategory(d.category); setCondition(d.condition);
      setBrand((d as any).brand ?? ''); setModel((d as any).model ?? '');
      setPhotos(d.imageUrls ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: remaining,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (r.canceled) return;
    setPhotos((prev) => [...prev, ...r.assets.map((a) => a.uri)]);
  }

  async function save() {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Required', 'Title and price are required.'); return;
    }
    setSaving(true);
    try {
      let imageUrls = photos.filter((u) => u.startsWith('http'));
      const newOnes = photos.filter((u) => !u.startsWith('http'));
      if (newOnes.length > 0) {
        const { data: up } = await marketplaceApi.uploadPhotos(newOnes);
        imageUrls = [...imageUrls, ...up.urls];
      }
      await marketplaceApi.update(id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category, condition,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        imageUrls,
      });
      toast('Listing updated', 'success');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not update.');
    } finally { setSaving(false); }
  }

  if (loading) return <LoadingView />;
  if (!data) return <View />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Edit Listing" compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photo}>
              <Image source={{ uri }} style={styles.photoImg} />
              <Pressable
                onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                style={styles.removePhoto}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable onPress={pickPhotos} style={[styles.photoAdd, { borderColor: theme.border, backgroundColor: theme.featureBg }]}>
              <Ionicons name="add" size={28} color={theme.primary} />
            </Pressable>
          )}
        </ScrollView>

        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
        <Input label="Price (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" leftIcon="pricetag-outline" />
        <Input label="Brand" value={brand} onChangeText={setBrand} />
        <Input label="Model" value={model} onChangeText={setModel} />

        <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Category</Text>
        <View style={styles.chipsRow}>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <Chip key={c} label={c} color={category === c ? 'primary' : 'muted'} variant={category === c ? 'solid' : 'soft'} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Text style={[typography.smallStrong, { color: theme.textPrimary, marginTop: spacing.sm }]}>Condition</Text>
        <View style={styles.chipsRow}>
          {MARKETPLACE_CONDITIONS.map((c) => (
            <Chip key={c} label={c} color={condition === c ? 'primary' : 'muted'} variant={condition === c ? 'solid' : 'soft'} onPress={() => setCondition(c)} />
          ))}
        </View>

        <Button title="Save changes" onPress={save} loading={saving} variant="primary" size="lg" fullWidth style={{ marginTop: spacing.md }} />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: 80, height: 80, marginRight: 8, borderRadius: radii.md, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 80, height: 80, borderRadius: radii.md,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
