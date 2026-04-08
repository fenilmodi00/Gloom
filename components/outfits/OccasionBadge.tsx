import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OccasionBadgeProps {
  occasion: string;
}

export function OccasionBadge({ occasion }: OccasionBadgeProps) {
  return (
    <View className="bg-primary/10 border border-primary/15 px-3 py-1 rounded-full self-start">
      <Text className="text-primary font-semibold text-[10px] uppercase tracking-[1.2px] font-ui">{occasion}</Text>
    </View>
  );
}
