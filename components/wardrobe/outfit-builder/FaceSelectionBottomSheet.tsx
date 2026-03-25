import { Typography } from '@/constants/Typography';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/constants/Colors';
import { FaceCarousel, type FaceItem } from './FaceCarousel';

interface FaceSelectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTryOn: (selectedFace: FaceItem | null) => void;
  faces: FaceItem[];
  selectedFaceId?: string;
  onSelectFace: (face: FaceItem) => void;
  onAddFace?: () => void;
}

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
  const snapPoints = useMemo(() => ['50%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const selectedFace = faces.find((f) => f.id === selectedFaceId) || null;

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
  }, []);

  const handleTryOn = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTryOn(selectedFace);
    bottomSheetRef.current?.close();
  }, [onTryOn, selectedFace]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

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
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
    >
      {/*
        🔧 FIX 1: BottomSheetView instead of plain View.
        Plain View breaks bottom sheet's internal height measurement
        making the sheet content invisible. BottomSheetView is the
        correct non-scrollable container for @gorhom/bottom-sheet
        and respects overflow:'visible' unlike BottomSheetScrollView.
      */}
      <BottomSheetView style={styles.contentContainer}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Face for Try-On</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={THEME.textPrimary} />
          </Pressable>
        </View>

        {/*
          🔧 FIX 2: Removed the redundant carouselContainer wrapper View.
          FaceCarousel already has its own container with marginHorizontal:-16.
          Double-wrapping with padding/alignment was breaking the edge-to-edge layout.
        */}
        <FaceCarousel
          faces={faces}
          selectedFaceId={selectedFaceId}
          onSelectFace={onSelectFace}
          onAddFace={onAddFace}
        />

        {/* Selected Face Info */}
        {selectedFace && !selectedFace.isAddButton && (
          <Text style={styles.selectedFaceName}>
            {selectedFace.name || 'Selected Face'}
          </Text>
        )}

        {/* Try On Button */}
        <Pressable
          style={[
            styles.tryOnButton,
            !selectedFace && styles.tryOnButtonDisabled,
          ]}
          onPress={handleTryOn}
          disabled={!selectedFace}
        >
          <Text style={styles.tryOnButtonText}>Try on</Text>
          <Sparkles size={18} color={THEME.bgSurface} />
        </Pressable>
      </BottomSheetView>
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
    marginTop: 20,
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
