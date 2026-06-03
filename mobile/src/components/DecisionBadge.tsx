import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DecisionStatus } from '../types/weather';
import { Colors, Radius, Spacing } from '../constants/theme';

interface DecisionBadgeProps {
  status: DecisionStatus;
  size?: 'large' | 'small';
}

function badgeColors(status: DecisionStatus) {
  if (['GO', 'WATER', 'TAKE ONE'].includes(status)) {
    return { bg: Colors.goBg, text: Colors.go, border: Colors.goBorder };
  }
  if (['CAUTION', 'CHECK SOIL', 'MAYBE', 'CHECK'].includes(status)) {
    return { bg: Colors.cautionBg, text: Colors.caution, border: Colors.cautionBorder };
  }
  return { bg: Colors.warningBg, text: Colors.warning, border: Colors.warningBorder };
}

export function DecisionBadge({ status, size = 'large' }: DecisionBadgeProps) {
  const c = badgeColors(status);
  const isLarge = size === 'large';
  return (
    <View style={[
      styles.badge,
      { backgroundColor: c.bg, borderColor: c.border },
      isLarge ? styles.large : styles.small,
    ]}>
      <Text style={[styles.text, { color: c.text }, isLarge ? styles.textLarge : styles.textSmall]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    minWidth: 160,
  },
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  textLarge: {
    fontSize: 36,
  },
  textSmall: {
    fontSize: 12,
  },
});
