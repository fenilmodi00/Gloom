/**
 * OutfitBoardSheet
 *
 * Bottom sheet that displays the full OutfitBoard when a combination card is tapped.
 * Uses @gorhom/bottom-sheet for native feel.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Pressable } from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { OutfitBoard } from '@/components/outfit-board';
import { Text } from '@/components/ui/text';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import {
useOutfitBuilderStore,
useActiveCombination,
useIsCombinationSheetOpen,
} from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export function OutfitBoardSheet() {
const { width: screenWidth } = useWindowDimensions();
const bottomSheetRef = useRef<BottomSheet>(null);

const activeCombination = useActiveCombination();
const isOpen = useIsCombinationSheetOpen();
const closeCombinationSheet = useOutfitBuilderStore((s) => s.closeCombinationSheet);

// Sheet snap points
const snapPoints = useMemo(() => ['85%'], []);

// Board dimensions
const boardWidth = screenWidth - 32;
const boardHeight = boardWidth * 1.2;

// Handle close
const handleClose = useCallback(() => {
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
closeCombinationSheet();
}, [closeCombinationSheet]);

// Handle generate
const handleGenerate = useCallback(() => {
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// TODO: Navigate to generation flow
closeCombinationSheet();
}, [closeCombinationSheet]);

// Animate sheet open/close
React.useEffect(() => {
if (isOpen && bottomSheetRef.current) {
bottomSheetRef.current.expand();
} else if (bottomSheetRef.current) {
bottomSheetRef.current.close();
}
}, [isOpen]);

if (!activeCombination) return null;

return (
<BottomSheet
ref={bottomSheetRef}
index={-1}
snapPoints={snapPoints}
enablePanDownToClose
onClose={closeCombinationSheet}
backgroundStyle={{ backgroundColor: THEME.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
handleIndicatorStyle={{ backgroundColor: THEME.textTertiary }}
backgroundComponent={() => (
<BlurView intensity={80} tint="light" className="absolute inset-0" />
)}
>
<BottomSheetScrollView
contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
showsVerticalScrollIndicator={false}
>
{/* Header */}
<View className="flex-row justify-between items-center mb-4">
<View className="flex-1">
<Text className="font-heading text-2xl text-textPrimary">Outfit Preview</Text>
<Text className="font-body text-xs text-textSecondary mt-0.5">
{activeCombination.matchScore}% match
</Text>
</View>
<Pressable onPress={handleClose} className="w-9 h-9 rounded-full bg-bgMuted items-center justify-center">
<X size={20} color={THEME.textPrimary} />
</Pressable>
</View>

{/* OutfitBoard */}
<View className="items-center mb-6">
<OutfitBoard
selection={activeCombination.selection}
width={boardWidth}
height={boardHeight}
/>
</View>

{/* Generate CTA */}
<Pressable className="flex-row items-center justify-center gap-2 bg-goldAccent py-4 rounded-2xl" onPress={handleGenerate}>
<Sparkles size={18} color={THEME.bgSurface} />
<Text className="font-ui text-sm font-medium text-white">Generate Outfit</Text>
</Pressable>
</BottomSheetScrollView>
</BottomSheet>
);
}
