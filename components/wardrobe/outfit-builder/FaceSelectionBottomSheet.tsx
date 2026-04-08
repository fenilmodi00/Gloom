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
  const snapPoints = useMemo(() => ['40%'], []);

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
      backgroundStyle={{ backgroundColor: THEME.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: THEME.dragHandle, width: 40 }}
      backdropComponent={renderBackdrop}
    >
      {/*
        🔧 FIX 1: BottomSheetView instead of plain View.
        Plain View breaks bottom sheet's internal height measurement
        making the sheet content invisible. BottomSheetView is the
        correct non-scrollable container for @gorhom/bottom-sheet
        and respects overflow:'visible' unlike BottomSheetScrollView.
      */}
      <BottomSheetView className="p-4 gap-5">

        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-xl text-textPrimary">Select Face for Try-On</Text>
          <Pressable onPress={handleClose} className="w-9 h-9 rounded-full bg-black/5 items-center justify-center">
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

        {/* Try On Button */}
        <Pressable
          className={`flex-row items-center justify-center py-4 rounded-2xl gap-2 mt-5 ${selectedFace ? 'bg-goldAccent shadow-md shadow-black/10' : 'bg-black/10'}`}
          onPress={handleTryOn}
          disabled={!selectedFace}
        >
          <Text className="font-ui text-sm font-medium text-bgSurface">Try on</Text>
          <Sparkles size={18} color={THEME.bgSurface} />
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}
