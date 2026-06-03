import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../constants/theme';

interface WeatherMetricCardProps {
  label: string;
  value: string;
  icon?: string;
}

export function WeatherMetricCard({ label, value, icon }: WeatherMetricCardProps) {
  return (
    <View style={styles.card}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.blueLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.blueMid,
    ...Shadow.card,
  },
  icon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.tiny,
    color: Colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  value: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.navy,
    textAlign: 'center',
  },
});
