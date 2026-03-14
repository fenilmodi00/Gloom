import React from 'react';
import { Text, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface OccasionBadgeProps {
  label: string;
  style?: ViewStyle;
}

const OCCASION_EMOJI: Record<string, string> = {
  casual: '☀️',
  formal: '✦',
  wedding: '💐',
  party: '🎉',
  work: '💼',
  date: '🕯️',
  diwali: '🪔',
  holi: '🌈',
  ethnic: '🌸',
  travel: '✈️',
  sport: '🏃',
};

export default function OccasionBadge({ label, style }: OccasionBadgeProps) {
  const key = label.toLowerCase();
  const emoji = OCCASION_EMOJI[key] ?? '✦';

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      className="flex-row items-center gap-1 self-start bg-[#EBE7DB] rounded-full py-1 px-2.5"
      style={style}
    >
      <Text className="text-[11px]">{emoji}</Text>
      <Text className="text-[10px] font-semibold tracking-wide uppercase text-[#2D2F1D] opacity-70">
        {label}
      </Text>
    </Animated.View>
  );
}
