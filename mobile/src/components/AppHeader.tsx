import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title, showBack }: AppHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.navy} />
        </TouchableOpacity>
      ) : (
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Should I Do It</Text>
          <Text style={styles.logoStrong}>Today?</Text>
        </View>
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {!showBack && !title ? (
        <Text style={styles.tagline}>Weather. Decisions. Done.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: Typography.h4,
    fontWeight: '600',
    color: Colors.navy,
  },
  logoStrong: {
    fontSize: Typography.h4,
    fontWeight: '800',
    color: Colors.blue,
  },
  title: {
    fontSize: Typography.h4,
    fontWeight: '700',
    color: Colors.navy,
    flex: 1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: Typography.tiny,
    color: Colors.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  backBtn: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    marginRight: Spacing.sm,
  },
});
