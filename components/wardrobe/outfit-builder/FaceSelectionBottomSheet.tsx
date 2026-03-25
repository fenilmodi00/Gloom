import { Typography } from '@/constants/Typography';
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
import { Pressable, StyleSheet, View } from 'react-native';

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
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Face for Try-On</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={THEME.textPrimary} />
          </Pressable>
        </View>

        {/* Face Carousel */}
        <View style={styles.carouselContainer}>
          <FaceCarousel
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={onSelectFace}
            onAddFace={onAddFace}
          />
        </View>

        {/* Selected Face Info */}
        {selectedFace && !selectedFace.isAddButton && (
          <Text style={styles.selectedFaceName}>
            {selectedFace.name || 'Selected Face'}
          </Text>
        )}

        {/* Try On Button */}
        <Pressable
          style={[styles.tryOnButton, !selectedFace && styles.tryOnButtonDisabled]}
          onPress={handleTryOn}
          disabled={!selectedFace}
        >
          <Text style={styles.tryOnButtonText}>Try on</Text>
          <Sparkles size={18} color={THEME.bgSurface} />
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: THEME.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: THEME.dragHandle,
    width: 40,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.heading3,
    color: THEME.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  selectedFaceName: {
    ...Typography.body,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.goldAccent,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  tryOnButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tryOnButtonText: {
    ...Typography.uiLabelMedium,
    color: THEME.bgSurface,
  },
});
