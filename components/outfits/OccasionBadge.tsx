import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OccasionBadgeProps {
  occasion: string;
}

export function OccasionBadge({ occasion }: OccasionBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{occasion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(45, 47, 29, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#2D2F1D',
    fontWeight: '500',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
