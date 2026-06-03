import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Activity } from '../types/activities';
import { Colors, Radius, Spacing, Typography, Shadow } from '../constants/theme';

interface ActivityCardProps {
  activity: Activity;
  selected?: boolean;
  onPress: () => void;
}

export function ActivityCard({ activity, selected, onPress }: ActivityCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{activity.icon}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{activity.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.line,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    ...Shadow.card,
  },
  selected: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blueLight,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  icon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.small,
    fontWeight: '700',
    color: Colors.navy,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.blue,
  },
});
