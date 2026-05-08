import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { MarketplaceListing } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

type Tab = 'active' | 'sold' | 'all';

export default function MyListingsScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('active');
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await marketplaceApi.myListings({ status: tab });
      setItems(data.items);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function handleSold(id: string) {
    Alert.alert('Mark as sold', 'Confirm this listing has been sold?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark sold', onPress: async () => {
        try { await marketplaceApi.markSold(id); toast('Marked sold', 'success'); load(); } catch {}
      } },
    ]);
  }

  async function handleRelist(id: string) {
    try { await marketplaceApi.relist(id); toast('Relisted', 'success'); load(); } catch {}
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete listing', 'This is permanent.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await marketplaceApi.delete(id); toast('Deleted', 'success'); load(); } catch {}
      } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="My Listings" subtitle="Manage your marketplace items" compact />

      <View style={[styles.tabs, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        {(['active', 'sold', 'all'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { borderBottomColor: theme.primary }]}
          >
            <Text style={[typography.smallStrong, { color: tab === t ? theme.primary : theme.textMuted }]}>
              {t.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <LoadingView /> : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={
            <EmptyState icon="cube-outline" title={`No ${tab} listings`} message={tab === 'active' ? 'Create your first listing in the Marketplace.' : ''} />
          }
          renderItem={({ item }) => (
            <Card padding={0}>
              <Pressable onPress={() => navigation.navigate('Marketplace', { screen: 'MarketplaceDetail', params: { id: item.id } })}>
                <View style={styles.row}>
                  {item.imageUrls?.[0] ? (
                    <Image source={{ uri: item.imageUrls[0] }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: theme.featureBg, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="cube-outline" size={24} color={theme.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, padding: spacing.sm + 2 }}>
                    <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                      {item.category} · {item.condition}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={[typography.bodyStrong, { color: theme.primary }]}>${item.price.toFixed(2)}</Text>
                      {item.isSold && <Chip label="SOLD" color="muted" variant="soft" size="sm" />}
                    </View>
                  </View>
                </View>
              </Pressable>
              <View style={[styles.actions, { borderTopColor: theme.divider }]}>
                <Pressable onPress={() => navigation.navigate('EditListing', { id: item.id })} style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={14} color={theme.primary} />
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>EDIT</Text>
                </Pressable>
                {item.isSold ? (
                  <Pressable onPress={() => handleRelist(item.id)} style={styles.actionBtn}>
                    <Ionicons name="refresh-outline" size={14} color={theme.successGreen} />
                    <Text style={[typography.caption, { color: theme.successGreen, fontWeight: '700' }]}>RELIST</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => handleSold(item.id)} style={styles.actionBtn}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={theme.successGreen} />
                    <Text style={[typography.caption, { color: theme.successGreen, fontWeight: '700' }]}>MARK SOLD</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={14} color={theme.dangerRed} />
                  <Text style={[typography.caption, { color: theme.dangerRed, fontWeight: '700' }]}>DELETE</Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: spacing.sm + 4, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 80, height: 80, borderTopLeftRadius: radii.md, borderBottomLeftRadius: radii.md },
  actions: {
    flexDirection: 'row', borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
    paddingVertical: spacing.sm,
  },
});
