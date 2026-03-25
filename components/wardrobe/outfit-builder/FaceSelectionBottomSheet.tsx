/**
 * FaceSelectionBottomSheet
 *
 * Bottom sheet for face selection before try-on.
 * Shows face carousel and "Try on" button.
 */
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/constants/Colors';
import { FaceCarousel, type FaceItem } from './FaceCarousel';

// ============================================================================
// Types
// ============================================================================

interface FaceSelectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTryOn: (selectedFace: FaceItem | null) => void;
  faces: FaceItem[];
  selectedFaceId?: string;
  onSelectFace: (face: FaceItem) => void;
  onAddFace?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function FaceSelectionBottomSheet({
  isOpen,
  onClose,
  onTryOn,
  faces,
  selectedFaceId,
  onSelectFace,
  onAddFace,
}: FaceSelectionBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points
  const snapPoints = useMemo(() => ['35%'], []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  // Get selected face
  const selectedFace = faces.find(f => f.id === selectedFaceId) || null;

  // Handle close - only close the sheet, let handleSheetChange update parent state
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
  }, []);

  // Handle try on - call onTryOn immediately, then close sheet
  const handleTryOn = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTryOn(selectedFace);
    bottomSheetRef.current?.close();
  }, [onTryOn, selectedFace]);

  // Handle sheet changes
  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Open/close based on isOpen prop
  React.useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Closed by default
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: THEME.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: THEME.dragHandle, width: 40 }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerClassName="p-4 gap-5">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-xl text-text-primary">Select Face for Try-On</Text>
          <Pressable onPress={handleClose} className="w-9 h-9 rounded-full bg-black/5 items-center justify-center">
            <X size={20} color={THEME.textPrimary} />
          </Pressable>
        </View>

        {/* Face Carousel */}
        <View className="items-center justify-center py-4">
          <FaceCarousel
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={onSelectFace}
            onAddFace={onAddFace}
          />
        </View>

        {/* Selected Face Info */}
        {selectedFace && !selectedFace.isAddButton && (
          <Text className="font-body text-base text-text-secondary text-center">
            {selectedFace.name || 'Selected Face'}
          </Text>
        )}

        {/* Try On Button */}
        <Pressable
          className={`flex-row items-center justify-center px-6 py-4 rounded-[20px] gap-2 mt-2 shadow-sm ${!selectedFace ? 'bg-black/10' : 'bg-gold-accent'}`}
          onPress={handleTryOn}
          disabled={!selectedFace}
        >
          <Text className="font-ui text-sm font-medium text-surface">Try on</Text>
          <Sparkles size={18} color={THEME.bgSurface} />
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
