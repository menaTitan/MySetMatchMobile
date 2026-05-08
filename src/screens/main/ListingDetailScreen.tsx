import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Dimensions, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, marketplaceApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { MarketplaceListing } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, Chip, EmptyState, LoadingView, useToast } from '../../components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ListingDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { theme } = useSport();
  const { userId } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await marketplaceApi.detail(id);
        if (!cancelled) setData(r.data);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function contactSeller() {
    if (!data || !data.sellerId) return;
    if (data.sellerId === userId) {
      toast('That\'s your own listing', 'info');
      return;
    }
    setContacting(true);
    try {
      const { data: room } = await chatApi.createDirect(data.sellerId);
      // Cross-stack jump to the Community tab → ChatRoom.
      const root = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
      root.navigate('Community', {
        screen: 'ChatRoom',
        params: { roomId: room.id, title: data.sellerName },
      });
    } catch {
      toast('Could not open chat', 'error');
    } finally { setContacting(false); }
  }

  if (loading) return <LoadingView />;
  if (!data) return (
    <EmptyState icon="cube-outline" title="Listing not found" message="It may have been removed." />
  );

  const photos = data.imageUrls?.length ? data.imageUrls : [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.pageBg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {/* Photo gallery */}
      {photos.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setPhotoIdx(i);
            }}
          >
            {photos.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.photo} resizeMode="cover" />
            ))}
          </ScrollView>
          {photos.length > 1 ? (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === photoIdx ? theme.primary : 'rgba(0,0,0,0.25)' },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.photoFallback, { backgroundColor: theme.pageBgTint }]}>
          <Ionicons name="image-outline" size={48} color={theme.textMuted} />
        </View>
      )}

      <View style={{ padding: spacing.base, gap: spacing.base }}>
        {data.isSold ? (
          <Chip label="SOLD" color="danger" variant="solid" />
        ) : null}

        <Text style={[typography.h1, { color: theme.textPrimary }]}>{data.title}</Text>
        <Text style={[typography.h2, { color: theme.primary }]}>${data.price.toFixed(2)}</Text>

        <View style={styles.chipRow}>
          <Chip label={data.category} color="primary" variant="soft" size="sm" />
          <Chip label={data.condition} color="accent" variant="soft" size="sm" />
          {data.brand ? <Chip label={data.brand} color="muted" variant="soft" size="sm" /> : null}
        </View>

        {data.description ? (
          <Card>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary, marginBottom: 6 }]}>Description</Text>
            <Text style={[typography.body, { color: theme.textSecondary }]}>{data.description}</Text>
          </Card>
        ) : null}

        <Card>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary, marginBottom: 6 }]}>Seller</Text>
          <View style={styles.sellerRow}>
            <Avatar name={data.sellerName} photoUrl={data.sellerPhotoUrl} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{data.sellerName}</Text>
              {data.city ? (
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {data.city}{data.country ? `, ${data.country}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        {!data.isMyListing && !data.isSold ? (
          <Button
            title="Message seller"
            variant="primary"
            size="lg"
            leftIcon="chatbubble-outline"
            loading={contacting}
            onPress={contactSeller}
            fullWidth
          />
        ) : null}

        {data.isMyListing && !data.isSold ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              title="Edit"
              variant="secondary"
              leftIcon="create-outline"
              onPress={() => navigation.navigate('EditListing', { id: data.id })}
              style={{ flex: 1 }}
            />
            <Button
              title="Mark sold"
              variant="ghost"
              leftIcon="checkmark-outline"
              onPress={async () => { try { await marketplaceApi.markSold(data.id); toast('Marked sold', 'success'); navigation.goBack(); } catch {} }}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photo: { width: SCREEN_W, height: SCREEN_W * 0.75 },
  photoFallback: {
    width: SCREEN_W, height: SCREEN_W * 0.55,
    alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
});
