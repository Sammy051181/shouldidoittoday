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
import { analyse } from '../src/logic/decisions';
import { analyseBbq } from '../src/logic/bbqDecision';
import { analysePlants } from '../src/logic/plantDecision';
import { analyseCamping } from '../src/logic/campingDecision';
import { getActivity } from '../src/data/activities';
import { formatTemp, formatWind } from '../src/utils/units';
import { ActivityKey, Period, RegionKey } from '../src/types/activities';
import { WeatherData, DecisionResult } from '../src/types/weather';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    activityKey: string;
    period: string;
    regionKey: string;
    placeName: string;
    weatherJson: string;
  }>();

  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activityKey = (params.activityKey ?? 'grass') as ActivityKey;
  const period = (params.period ?? 'today') as Period;
  const regionKey = (params.regionKey ?? 'UK') as RegionKey;
  const placeName = params.placeName ?? '';
  const activity = getActivity(activityKey);

  useEffect(() => {
    try {
      if (!params.weatherJson) { setError('No weather data. Go back and enter a location.'); return; }
      const data: WeatherData = JSON.parse(params.weatherJson);
      let r: DecisionResult;
      if (activityKey === 'bbq') r = analyseBbq(data, period, regionKey);
      else if (activityKey === 'plants') r = analysePlants(data, period, regionKey);
      else r = analyse(data, activityKey, period, regionKey);
      setResult(r);
    } catch {
      setError('Could not analyse the weather data.');
    }
  }, [params.weatherJson, activityKey, period, regionKey]);

  if (error) return <ErrorState message={error} onRetry={() => router.back()} />;
  if (!result) return <LoadingState message="Analysing forecast…" />;

  const data: WeatherData = JSON.parse(params.weatherJson);
  const campingDays = activityKey === 'camping' ? analyseCamping(data, period, regionKey) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={Colors.navy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{activity.label}</Text>
          {placeName ? <Text style={styles.headerSub}>{placeName} · {period}</Text> : null}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>

        {/* Decision badge */}
        <View style={styles.badgeRow}>
          <DecisionBadge status={result.status} size="large" />
        </View>

        {/* Reason */}
        <View style={styles.reasonCard}>
          <Text style={styles.reasonText}>{result.reason}</Text>
        </View>

        {/* Weather metrics */}
        <View style={styles.metricsRow}>
          <WeatherMetricCard label="Best window" value={result.best} icon="⏰" />
          <WeatherMetricCard label="Rain risk" value={result.rain} icon="🌧️" />
        </View>
        <View style={styles.metricsRow}>
          <WeatherMetricCard label="Wind" value={formatWind(result.windMph, regionKey)} icon="💨" />
          <WeatherMetricCard label="Temperature" value={formatTemp(result.tempC, regionKey)} icon="🌡️" />
        </View>

        {/* Why this answer */}
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why this answer?</Text>
          {result.why.map((w, i) => (
            <View key={i} style={styles.whyRow}>
              <Text style={styles.whyBullet}>•</Text>
              <Text style={styles.whyText}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Camping breakdown */}
        {campingDays && campingDays.length > 0 && (
          <View style={styles.campingSection}>
            <Text style={styles.sectionTitle}>⛺ Weekend breakdown</Text>
            {campingDays.map((day, i) => (
              <View key={i} style={styles.campingCard}>
                <View style={styles.campingHeader}>
                  <Text style={styles.campingDay}>{day.title}</Text>
                  <DecisionBadge status={day.status} size="small" />
                </View>
                {[day.morning, day.afternoon, day.evening, day.overnight].map(seg => (
                  <View key={seg.label} style={styles.segRow}>
                    <Text style={styles.segLabel}>{seg.symbol} {seg.label}</Text>
                    <Text style={styles.segDetail}>
                      {formatTemp(seg.avgTempC, regionKey)} · rain {Math.round(seg.rainProb)}% · {formatWind(seg.windMph, regionKey)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/activities')} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Check another activity</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const nextPeriod: Period = period === 'today' ? 'tomorrow' : period === 'tomorrow' ? 'weekend' : 'today';
              router.replace({ pathname: '/result', params: { ...params, period: nextPeriod } });
            }}
            style={styles.btnOutline}
          >
            <Text style={styles.btnOutlineText}>
              {period === 'today' ? 'Try tomorrow' : period === 'tomorrow' ? 'Try weekend' : 'Try today'}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.white },
  back: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  headerSub: { fontSize: Typography.small, color: Colors.muted, marginTop: 1, textTransform: 'capitalize' },
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
  campingSection: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.h4, fontWeight: '700', color: Colors.navy },
  campingCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.line, gap: Spacing.sm, ...Shadow.card },
  campingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  campingDay: { fontSize: Typography.body, fontWeight: '700', color: Colors.navy },
  segRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.line },
  segLabel: { fontSize: Typography.small, color: Colors.navy, fontWeight: '600' },
  segDetail: { fontSize: Typography.small, color: Colors.muted },
  actions: { gap: Spacing.md, marginTop: Spacing.sm },
  btnSecondary: { backgroundColor: Colors.blue, borderRadius: Radius.full, padding: Spacing.lg, alignItems: 'center' },
  btnSecondaryText: { color: Colors.white, fontWeight: '700', fontSize: Typography.body },
  btnOutline: { borderRadius: Radius.full, padding: Spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.blue },
  btnOutlineText: { color: Colors.blue, fontWeight: '700', fontSize: Typography.body },
});
