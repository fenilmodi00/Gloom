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
backgroundStyle={styles.sheetBackground}
handleIndicatorStyle={styles.handleIndicator}
backgroundComponent={() => (
<BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
)}
>
<BottomSheetScrollView
contentContainerStyle={styles.content}
showsVerticalScrollIndicator={false}
>
{/* Header */}
<View style={styles.header}>
<View style={styles.headerLeft}>
<Text style={styles.title}>Outfit Preview</Text>
<Text style={styles.subtitle}>
{activeCombination.matchScore}% match
</Text>
</View>
<Pressable onPress={handleClose} style={styles.closeButton}>
<X size={20} color={THEME.textPrimary} />
</Pressable>
</View>

{/* OutfitBoard */}
<View style={styles.boardWrapper}>
<OutfitBoard
selection={activeCombination.selection}
width={boardWidth}
height={boardHeight}
/>
</View>

{/* Generate CTA */}
<Pressable style={styles.generateButton} onPress={handleGenerate}>
<Sparkles size={18} color={THEME.bgSurface} />
<Text style={styles.generateText}>Generate Outfit</Text>
</Pressable>
</BottomSheetScrollView>
</BottomSheet>
);
}

const styles = StyleSheet.create({
sheetBackground: {
backgroundColor: THEME.bgSurface,
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
},
handleIndicator: {
backgroundColor: THEME.textTertiary,
},
content: {
paddingHorizontal: 16,
paddingBottom: 32,
},
header: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 16,
},
headerLeft: {
flex: 1,
},
title: {
fontSize: 22,
fontWeight: '700',
color: THEME.textPrimary,
},
subtitle: {
fontSize: 13,
fontWeight: '500',
color: THEME.textSecondary,
marginTop: 2,
},
closeButton: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: THEME.bgMuted,
alignItems: 'center',
justifyContent: 'center',
},
boardWrapper: {
alignItems: 'center',
marginBottom: 24,
},
generateButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 8,
backgroundColor: THEME.goldAccent,
paddingVertical: 16,
borderRadius: 16,
},
generateText: {
fontSize: 16,
fontWeight: '600',
color: THEME.bgSurface,
},
});
