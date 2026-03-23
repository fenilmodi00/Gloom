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
    backgroundColor: 'rgba(139, 115, 85, 0.1)', // primary at 10%
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#8B7355', // primary
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
