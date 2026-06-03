import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../src/constants/theme';
import { DecisionBadge } from '../src/components/DecisionBadge';
import { WeatherMetricCard } from '../src/components/WeatherMetricCard';
import { LoadingState } from '../src/components/LoadingState';
import { ErrorState } from '../src/components/ErrorState';
import { analyseBbq } from '../src/logic/bbqDecision';
import { formatTemp, formatWind } from '../src/utils/units';
import { Period, RegionKey } from '../src/types/activities';
import { WeatherData, DecisionResult } from '../src/types/weather';

export default function BbqScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ period: string; regionKey: string; placeName: string; weatherJson: string }>();
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const period = (params.period ?? 'today') as Period;
  const regionKey = (params.regionKey ?? 'UK') as RegionKey;
  const placeName = params.placeName ?? '';
  const isUS = regionKey === 'US' || regionKey === 'CA';

  useEffect(() => {
    try {
      if (!params.weatherJson) { setError('No weather data. Go back and enter a location.'); return; }
      const data: WeatherData = JSON.parse(params.weatherJson);
      setResult(analyseBbq(data, period, regionKey));
    } catch { setError('Could not analyse the weather data.'); }
  }, [params.weatherJson, period, regionKey]);

  if (error) return <ErrorState message={error} onRetry={() => router.back()} />;
  if (!result) return <LoadingState message={`Checking ${isUS ? 'grill' : 'BBQ'} conditions…`} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={Colors.navy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🔥 Should I {isUS ? 'grill' : 'BBQ'} today?</Text>
          {placeName ? <Text style={styles.headerSub}>{placeName} · {period}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <DecisionBadge status={result.status} size="large" />
        </View>

        <View style={styles.reasonCard}>
          <Text style={styles.reasonText}>{result.reason}</Text>
        </View>

        <View style={styles.metricsRow}>
          <WeatherMetricCard label="Best window" value={result.best} icon="⏰" />
          <WeatherMetricCard label="Rain risk" value={result.rain} icon="🌧️" />
        </View>
        <View style={styles.metricsRow}>
          <WeatherMetricCard label="Wind" value={formatWind(result.windMph, regionKey)} icon="💨" />
          <WeatherMetricCard label="Temperature" value={formatTemp(result.tempC, regionKey)} icon="🌡️" />
        </View>

        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why this answer?</Text>
          {result.why.map((w, i) => (
            <View key={i} style={styles.whyRow}>
              <Text style={styles.whyBullet}>•</Text>
              <Text style={styles.whyText}>{w}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{isUS ? 'Grilling' : 'BBQ'} tips</Text>
          <Text style={styles.tipText}>🔥 Always check for thunder or lightning before lighting up.</Text>
          <Text style={styles.tipText}>💨 Wind over 20 mph makes temperature control harder.</Text>
          <Text style={styles.tipText}>☔ Light rain is manageable with a canopy. Heavy rain is not.</Text>
          {regionKey === 'AU' && <Text style={styles.tipText}>🇦🇺 Check local fire restrictions before lighting a {isUS ? 'grill' : 'BBQ'}.</Text>}
        </View>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.white },
  back: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  headerSub: { fontSize: Typography.small, color: Colors.muted, marginTop: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  badgeRow: { alignItems: 'center', paddingVertical: Spacing.xl },
  reasonCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.line, ...Shadow.card },
  reasonText: { fontSize: Typography.body, color: Colors.soft, lineHeight: 22 },
  metricsRow: { flexDirection: 'row', gap: Spacing.md },
  whyCard: { backgroundColor: Colors.blueLight, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.blueMid },
  whyTitle: { fontSize: Typography.small, fontWeight: '800', color: Colors.blue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  whyRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  whyBullet: { color: Colors.blue, fontWeight: '700' },
  whyText: { flex: 1, fontSize: Typography.small, color: Colors.soft, lineHeight: 20 },
  tipsCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.line, gap: Spacing.md, ...Shadow.card },
  tipsTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  tipText: { fontSize: Typography.small, color: Colors.muted, lineHeight: 20 },
  backBtn: { backgroundColor: Colors.blue, borderRadius: Radius.full, padding: Spacing.lg, alignItems: 'center' },
  backBtnText: { color: Colors.white, fontWeight: '700', fontSize: Typography.body },
});
