/**
 * OutfitCombinationsSection
 *
 * Horizontal scrollable section displaying outfit combination cards.
 * Appears below the category lists when items are selected.
 */
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

import { OutfitCombinationCard } from './OutfitCombinationCard';
import type { WardrobeItem } from '@/types/wardrobe';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import {
  useOutfitBuilderStore,
  useCombinations,
  useSelectedCount,
} from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { OUTFIT_BUILDER_CONSTANTS } from '@/constants/OutfitBuilder';

const { CARD_WIDTH } = OUTFIT_BUILDER_CONSTANTS;

const GRADIENT_START = THEME.bgCanvas;
const GRADIENT_END = THEME.bgSurfaceRaised;

interface OutfitCombinationsSectionProps {
  items: WardrobeItem[];
  onCombinationPress: (combination: OutfitCombination) => void;
}

export function OutfitCombinationsSection({
  items,
  onCombinationPress,
}: OutfitCombinationsSectionProps) {
  const combinations = useCombinations();
  const selectedCount = useSelectedCount();
  const generateCombinations = useOutfitBuilderStore((s) => s.generateCombinations);
  const generateRef = React.useRef(generateCombinations);
  generateRef.current = generateCombinations;

  // Generate combinations when selection changes
  useEffect(() => {
    if (selectedCount > 0) {
      generateRef.current(items);
    }
  }, [selectedCount, items]);

  // Don't render if no items selected or no combinations
  if (selectedCount === 0 || combinations.length === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={[GRADIENT_START, GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="py-4"
    >
      {/* Section header */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-gold-soft items-center justify-center">
            <Sparkles size={14} color={THEME.goldAccent} />
          </View>
          <Text className="font-heading text-xl text-text-primary">Suggested Looks</Text>
        </View>
        <Text className="font-body text-xs text-text-secondary bg-surface px-2.5 py-1 rounded-xl">{combinations.length} options</Text>
      </View>

      {/* Horizontal scrollable cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 pb-2 gap-4 flex-row items-start"
        decelerationRate="fast"
        nestedScrollEnabled
      >
        {combinations.map((combination) => (
          <View key={combination.id} className="shrink-0" style={{ width: CARD_WIDTH }}>
            <OutfitCombinationCard
              combination={combination}
              onPress={onCombinationPress}
            />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
