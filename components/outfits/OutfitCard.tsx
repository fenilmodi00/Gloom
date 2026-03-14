import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import OccasionBadge from './OccasionBadge';

interface OutfitItem {
  id: string;
  imageUrl: string;
}

export interface OutfitCardProps {
  id: string;
  items: OutfitItem[];
  occasion: string;
  vibe: string;
  colorReasoning?: string;
  aiScore?: number;
  onTryOn?: (id: string) => void;
  index?: number;
}

export default function OutfitCard({
  id,
  items,
  occasion,
  vibe,
  aiScore,
  onTryOn,
  index = 0,
}: OutfitCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Show up to 3 item images in a stacked collage
  const visibleItems = items.slice(0, 3);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-surface rounded-3xl mx-4 mb-4 overflow-hidden"
        accessibilityLabel={`${vibe} outfit for ${occasion}`}
      >
        {/* Collage area */}
        <View className="h-80 relative items-center justify-center bg-[#F2F0E9]">
          {/* Background cards (slightly rotated) */}
          {visibleItems[1] && (
            <View 
              className="absolute w-[130px] h-[180px] rounded-2xl overflow-hidden border-4 border-white opacity-80"
              style={{ left: 16, top: 8, transform: [{ rotate: '-8deg' }] }}
            >
              <Image
                source={{ uri: visibleItems[1].imageUrl }}
                className="w-full h-full"
                contentFit="cover"
              />
            </View>
          )}
          {visibleItems[2] && (
            <View 
              className="absolute w-[130px] h-[180px] rounded-2xl overflow-hidden border-4 border-white opacity-80"
              style={{ right: 16, top: 20, transform: [{ rotate: '6deg' }] }}
            >
              <Image
                source={{ uri: visibleItems[2].imageUrl }}
                className="w-full h-full"
                contentFit="cover"
              />
            </View>
          )}
          {/* Front card */}
          {visibleItems[0] && (
            <View 
              className="w-[220px] h-[290px] rounded-2xl overflow-hidden border-7 border-white z-10"
              style={Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
              } : { elevation: 12 }}
            >
              <Image
                source={{ uri: visibleItems[0].imageUrl }}
                className="w-full h-full"
                contentFit="cover"
              />
              {/* Vibe label overlay */}
              <View className="absolute bottom-3 left-2.5 right-2.5 bg-white/95 rounded-xl py-2.5 px-3">
                <Text className="text-[8px] font-bold tracking-widest text-[#2D2F1D]/60 uppercase mb-0.5">
                  SIGNATURE LOOK
                </Text>
                <Text className="text-[13px] italic text-[#2D2F1D] font-medium">
                  {vibe}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom info row */}
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="gap-1.5">
            <OccasionBadge label={occasion} />
            {aiScore !== undefined && (
              <Text className="text-[11px] text-[#2D2F1D]/50 tracking-wider">
                {Math.round(aiScore * 100)}% match
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={Platform.OS === 'ios' ? {
              shadowColor: '#2D2F1D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            } : { elevation: 4 }}
            className="bg-[#2D2F1D] rounded-full py-2.5 px-5"
            onPress={() => onTryOn?.(id)}
            accessibilityLabel="Try On (Coming Soon)"
          >
            <Text className="text-[#F2F0E9] text-xs font-semibold tracking-wide">
              ✦ Try On
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
