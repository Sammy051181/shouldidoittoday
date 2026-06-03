import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../src/constants/theme';
import { ACTIVITIES, CATEGORY_LABELS } from '../src/data/activities';
import { ActivityKey, ActivityCategory, Period, RegionKey } from '../src/types/activities';
import { geocode } from '../src/services/geocoding';
import { getWeather } from '../src/services/weather';

const CATEGORY_ORDER: ActivityCategory[] = ['Garden', 'Home', 'Food & BBQ', 'Travel', 'Fitness', 'Pets'];

export default function ActivitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ location?: string; period?: Period; regionKey?: RegionKey }>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const period: Period = params.period ?? 'today';
  const region: RegionKey = params.regionKey ?? 'UK';
  const locationQuery = params.location ?? '';

  const filtered = search.trim()
    ? ACTIVITIES.filter(a => a.label.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
    : ACTIVITIES;

  const handleSelect = async (key: ActivityKey) => {
    if (!locationQuery) {
      router.push({ pathname: '/result', params: { activityKey: key, period, regionKey: region, placeName: '', weatherJson: '' } });
      return;
    }
    try {
      setLoading(true);
      const place = await geocode(locationQuery, region);
      const data = await getWeather(place.latitude, place.longitude);
      setLoading(false);
      router.push({
        pathname: '/result',
        params: { activityKey: key, period, regionKey: region, placeName: place.name, weatherJson: JSON.stringify(data) },
      });
    } catch (e: unknown) {
      setLoading(false);
      Alert.alert('Error', (e instanceof Error ? e.message : null) ?? 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={Colors.navy} />
        </Pressable>
        <Text style={styles.title}>Choose activity</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities…"
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {CATEGORY_ORDER.map(category => {
          const items = filtered.filter(a => a.category === category);
          if (!items.length) return null;
          return (
            <View key={category} style={styles.group}>
              <Text style={styles.groupLabel}>{category.toUpperCase()}</Text>
              <View style={styles.grid}>
                {items.map(a => (
                  <Pressable
                    key={a.key}
                    onPress={() => handleSelect(a.key)}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.cardIcon}>{a.icon}</Text>
                    <Text style={styles.cardLabel}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Fetching weather…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.white },
  back: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  title: { fontSize: Typography.h3, fontWeight: '700', color: Colors.navy },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.white, paddingHorizontal: Spacing.md },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: Typography.body, color: Colors.navy },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.xl },
  group: { gap: Spacing.md },
  groupLabel: { fontSize: Typography.tiny, fontWeight: '800', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.line,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.card,
  },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: Typography.small, fontWeight: '700', color: Colors.navy, textAlign: 'center' },
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: Typography.body, color: Colors.muted },
});
