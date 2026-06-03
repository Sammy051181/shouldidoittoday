import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Period } from '../types/activities';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
];

interface DaySelectorProps {
  selected: Period;
  onChange: (p: Period) => void;
}

export function DaySelector({ selected, onChange }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      {PERIODS.map(p => (
        <Pressable
          key={p.key}
          onPress={() => onChange(p.key)}
          style={[styles.tab, selected === p.key && styles.active]}
        >
          <Text style={[styles.label, selected === p.key && styles.labelActive]}>{p.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.blueLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.blueMid,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  active: {
    backgroundColor: Colors.white,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: Colors.muted,
  },
  labelActive: {
    color: Colors.blue,
    fontWeight: '700',
  },
});
