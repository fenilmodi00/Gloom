import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutfitGrid } from '@/components/shared/OutfitGrid';
import { PaginationIndicator } from '@/components/shared/PaginationIndicator';
import type { ModelCard, OutfitItem } from '@/types/inspo';

interface ModelDetailSheetProps {
  model: ModelCard | null;
  isOpen: boolean;
  clothItems: OutfitItem[];
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const CONTENT_HEIGHT = SHEET_HEIGHT - 180;

export function ModelDetailSheet({ model, isOpen, clothItems, onClose }: ModelDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  // v5 requires animationConfigs to be a function from useBottomSheetSpringConfigs
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 18,
    stiffness: 180,
    mass: 0.8,
  });

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  // Only render when open to avoid gesture conflicts
  if (!isOpen || !model) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={[SHEET_HEIGHT]}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#F5F2EE', borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: '#D4C5B0', width: 40 }}
      animationConfigs={animationConfigs}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, height: 44 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              bottomSheetRef.current?.close();
            }}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 22 }}
          >
            <Feather name="x" size={24} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Content: Model image */}
        <View style={{ height: CONTENT_HEIGHT }}>
          <Image
            source={model.imageUrl}
            style={{ width: SCREEN_WIDTH, height: CONTENT_HEIGHT }}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Footer: Pagination + Buttons */}
        <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) }}>
          {/* Page indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 20 }}>
            <View style={{ width: 30, height: 2, backgroundColor: '#8B7355', borderRadius: 1 }} />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16 }}>
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 999, borderWidth: 1.5, borderColor: '#8B7355', gap: 8 }}
            >
              <Feather name="bookmark" size={20} color="#8B7355" />
              <Text style={{ color: '#8B7355', fontWeight: '700', fontSize: 16 }}>Save</Text>
            </Pressable>

            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 999, backgroundColor: '#8B7355', gap: 8 }}
            >
              <Feather name="share" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Share</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
