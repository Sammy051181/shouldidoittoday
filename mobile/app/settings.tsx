import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius, Shadow } from '../src/constants/theme';
import { RegionKey } from '../src/types/activities';
import { REGIONS } from '../src/data/regions';

const REGION_OPTIONS = (Object.keys(REGIONS) as RegionKey[]).map(k => ({ key: k, label: REGIONS[k].name }));

export default function SettingsScreen() {
  const [region, setRegion] = useState<RegionKey>('UK');
  const [notifMow, setNotifMow] = useState(true);
  const [notifCamping, setNotifCamping] = useState(false);
  const [notifPlants, setNotifPlants] = useState(true);
  const [notifBbq, setNotifBbq] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            {[
              { label: 'Good mowing days', sub: 'Alert me when it’s a good day to mow', value: notifMow, set: setNotifMow },
              { label: 'Weekend camping alerts', sub: 'Weather warnings for camping', value: notifCamping, set: setNotifCamping },
              { label: 'Plant watering reminders', sub: 'Remind me to water plants', value: notifPlants, set: setNotifPlants },
              { label: 'BBQ weather alert', sub: 'Tell me when BBQ conditions look good', value: notifBbq, set: setNotifBbq },
            ].map((item, i, arr) => (
              <View key={item.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.set}
                  trackColor={{ false: Colors.line, true: Colors.blue }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REGION</Text>
          <View style={styles.card}>
            {REGION_OPTIONS.map((r, i, arr) => (
              <Pressable
                key={r.key}
                onPress={() => setRegion(r.key)}
                style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
              >
                <Text style={styles.rowLabel}>{r.label}</Text>
                {region === r.key && <Text style={{ color: Colors.blue, fontWeight: '700' }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Weather data</Text>
              <Text style={styles.rowSub}>Open-Meteo (free, no key)</Text>
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowSub}>1.0.0</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Practical weather guidance only. Always check actual local conditions.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.white },
  title: { fontSize: Typography.h2, fontWeight: '800', color: Colors.navy },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 40 },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: Typography.tiny, fontWeight: '800', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden', ...Shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, gap: Spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.line },
  rowLabel: { fontSize: Typography.body, fontWeight: '600', color: Colors.navy, flex: 1 },
  rowSub: { fontSize: Typography.small, color: Colors.muted, marginTop: 2 },
  footer: { fontSize: Typography.small, color: Colors.muted, textAlign: 'center', lineHeight: 18, marginTop: Spacing.sm },
});
