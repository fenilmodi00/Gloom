/**
 * OutfitCombinationsSection
 *
 * Horizontal scrollable section displaying outfit combination cards.
 * Appears below the category lists when items are selected.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';

import { OutfitCombinationCard } from './OutfitCombinationCard';
import type { WardrobeItem, Category } from '@/types/wardrobe';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import {
useOutfitBuilderStore,
useCombinations,
useSelectedCount,
} from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

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

// Generate combinations when selection changes
useEffect(() => {
if (selectedCount > 0) {
generateCombinations(items);
}
}, [selectedCount, items, generateCombinations]);

// Don't render if no items selected or no combinations
if (selectedCount === 0 || combinations.length === 0) {
return null;
}

return (
<LinearGradient
colors={[GRADIENT_START, GRADIENT_END]}
start={{ x: 0, y: 0 }}
end={{ x: 0, y: 1 }}
style={styles.container}
>
{/* Section header */}
<View style={styles.headerRow}>
<View style={styles.header}>
<Sparkles size={16} color={THEME.goldAccent} />
<Text style={styles.headerLabel}>Suggested Combinations</Text>
<ChevronRight size={16} color={THEME.textSecondary} />
</View>
<Text style={styles.countText}>{combinations.length} looks</Text>
</View>

{/* Horizontal scrollable cards */}
<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
contentContainerStyle={styles.scrollContent}
nestedScrollEnabled
>
{combinations.map((combination) => (
<OutfitCombinationCard
key={combination.id}
combination={combination}
onPress={onCombinationPress}
/>
))}
</ScrollView>
</LinearGradient>
);
}

const styles = StyleSheet.create({
container: {
paddingVertical: 16,
paddingHorizontal: 16,
},
headerRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 12,
},
header: {
flexDirection: 'row',
alignItems: 'center',
gap: 6,
},
headerLabel: {
fontSize: 15,
fontWeight: '500',
color: THEME.textPrimary,
},
countText: {
fontSize: 12,
fontWeight: '500',
color: THEME.textSecondary,
},
scrollContent: {
gap: 12,
paddingRight: 16,
},
});
