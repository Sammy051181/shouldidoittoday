import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../src/constants/theme';
import { DaySelector } from '../src/components/DaySelector';
import { ActivityCard } from '../src/components/ActivityCard';
import { ACTIVITIES } from '../src/data/activities';
import { Period, RegionKey, ActivityKey } from '../src/types/activities';
import { requestDeviceLocation } from '../src/services/location';
import { geocode } from '../src/services/geocoding';
import { getWeather } from '../src/services/weather';

const REGIONS: { key: RegionKey; label: string }[] = [
  { key: 'UK', label: '🇬🇧 UK' },
  { key: 'IE', label: '🇮🇪 Ireland' },
  { key: 'US', label: '🇺🇸 US' },
  { key: 'CA', label: '🇨🇦 Canada' },
  { key: 'AU', label: '🇦🇺 Australia' },
  { key: 'NZ', label: '🇳🇿 NZ' },
];

const QUICK_ACTIVITIES: ActivityKey[] = ['grass', 'washing', 'washCar', 'bbq', 'camping', 'plants', 'run', 'dog'];

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [period, setPeriod] = useState<Period>('today');
  const [region, setRegion] = useState<RegionKey>('UK');
  const [locating, setLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const quickActivities = ACTIVITIES.filter(a => QUICK_ACTIVITIES.includes(a.key));

  const handleCheck = useCallback(async (activityKey: ActivityKey) => {
    const q = location.trim();
    if (!q) {
      Alert.alert('Enter a location', 'Type a postcode, city or town to continue.');
      return;
    }
    try {
      setStatusMsg('Searching…');
      const place = await geocode(q, region);
      const data = await getWeather(place.latitude, place.longitude);
      setStatusMsg('');
      router.push({
        pathname: '/result',
        params: {
          activityKey,
          period,
          regionKey: region,
          placeName: place.name,
          weatherJson: JSON.stringify(data),
        },
      });
    } catch (e: unknown) {
      setStatusMsg('');
      Alert.alert('Location not found', (e instanceof Error ? e.message : null) ?? "Couldn't find that location. Try a town, city or postcode.");
    }
  }, [location, period, region, router]);

  const handleUseLocation = useCallback(async () => {
    try {
      setLocating(true);
      setStatusMsg('Getting your location…');
      const coords = await requestDeviceLocation();
      const data = await getWeather(coords.latitude, coords.longitude);
      setStatusMsg('');
      setLocating(false);
      router.push({
        pathname: '/result',
        params: {
          activityKey: 'grass',
          period,
          regionKey: region,
          placeName: 'Your location',
          weatherJson: JSON.stringify(data),
        },
      });
    } catch (e: unknown) {
      setStatusMsg('');
      setLocating(false);
      Alert.alert('Location error', (e instanceof Error ? e.message : null) ?? 'Could not get your location.');
    }
  }, [period, region, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logoLine}>
                Should I Do It <Text style={styles.logoStrong}>Today?</Text>
              </Text>
              <Text style={styles.tagline}>Weather. Decisions. Done.</Text>
            </View>
          </View>

          {/* Checker card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Check your local conditions</Text>
            <Text style={styles.cardSub}>Enter a location to get started</Text>

            {/* Region row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionRow} contentContainerStyle={styles.regionContent}>
              {REGIONS.map(r => (
                <Pressable
                  key={r.key}
                  onPress={() => setRegion(r.key)}
                  style={[styles.regionChip, region === r.key && styles.regionActive]}
                >
                  <Text style={[styles.regionLabel, region === r.key && styles.regionLabelActive]}>{r.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Day selector */}
            <DaySelector selected={period} onChange={setPeriod} />

            {/* Location input */}
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Postcode, ZIP, town or city"
                placeholderTextColor={Colors.muted}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={() => location.trim() && handleCheck('grass')}
              />
            </View>

            <Pressable onPress={handleUseLocation} style={styles.geoBtn} disabled={locating}>
              <Ionicons name="navigate" size={16} color={Colors.blue} />
              <Text style={styles.geoBtnText}>{locating ? 'Getting location…' : 'Use my location'}</Text>
            </Pressable>

            {statusMsg ? <Text style={styles.statusMsg}>{statusMsg}</Text> : null}
          </View>

          {/* Quick shortcuts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick check</Text>
            <View style={styles.grid}>
              {quickActivities.map(a => (
                <ActivityCard
                  key={a.key}
                  activity={a}
                  onPress={() => handleCheck(a.key)}
                />
              ))}
            </View>
            <Pressable onPress={() => router.push('/activities')} style={styles.allBtn}>
              <Text style={styles.allBtnText}>All activities</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.blue} />
            </Pressable>
          </View>

          {/* Specialised checks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialised checks</Text>
            <View style={styles.specialGrid}>
              {[
                { key: 'camping' as ActivityKey, label: 'Weekend camping outlook', icon: '⛺', desc: 'Fri, Sat & Sun breakdown' },
                { key: 'plants' as ActivityKey, label: 'Plant watering', icon: '💧', desc: 'WATER / CHECK SOIL / WAIT' },
                { key: 'bbq' as ActivityKey, label: 'BBQ checker', icon: '🔥', desc: 'Best cooking window' },
              ].map(item => (
                <Pressable
                  key={item.key}
                  onPress={() => handleCheck(item.key)}
                  style={styles.specialCard}
                >
                  <Text style={styles.specialIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.specialLabel}>{item.label}</Text>
                    <Text style={styles.specialDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 40 },
  header: { paddingVertical: Spacing.md },
  logoLine: { fontSize: 24, fontWeight: '700', color: Colors.navy, letterSpacing: -0.5 },
  logoStrong: { color: Colors.blue, fontWeight: '900' },
  tagline: { fontSize: Typography.small, color: Colors.muted, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.heavy,
  },
  cardTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  cardSub: { fontSize: Typography.small, color: Colors.muted, marginTop: -Spacing.sm },
  regionRow: { marginHorizontal: -Spacing.xs },
  regionContent: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  regionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  regionActive: { backgroundColor: Colors.blueLight, borderColor: Colors.blue },
  regionLabel: { fontSize: Typography.small, color: Colors.muted, fontWeight: '600' },
  regionLabelActive: { color: Colors.blue, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.blueMid,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.navy,
  },
  geoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.blueMid,
    backgroundColor: Colors.blueLight,
  },
  geoBtnText: { fontSize: Typography.body, color: Colors.blue, fontWeight: '600' },
  statusMsg: { fontSize: Typography.small, color: Colors.muted, textAlign: 'center' },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  allBtnText: { fontSize: Typography.body, color: Colors.blue, fontWeight: '600' },
  specialGrid: { gap: Spacing.sm },
  specialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  specialIcon: { fontSize: 24 },
  specialLabel: { fontSize: Typography.body, fontWeight: '700', color: Colors.navy },
  specialDesc: { fontSize: Typography.small, color: Colors.muted, marginTop: 2 },
});
