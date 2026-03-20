import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSharedValue } from 'react-native-reanimated';
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
const CAROUSEL_HEIGHT = SHEET_HEIGHT - 180; // leave room for header + footer

export function ModelDetailSheet({ model, isOpen, clothItems, onClose }: ModelDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollX = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

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

  const renderCarouselItem = useCallback(({ index }: { index: number }) => {
    if (index === 0 && model) {
      return (
        <View className="flex-1 w-full h-full">
          <Image
            source={model.imageUrl}
            style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
            contentFit="cover"
            transition={200}
          />
        </View>
      );
    } else {
      return (
        <View style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}>
          <OutfitGrid items={clothItems} />
        </View>
      );
    }
  }, [model, clothItems]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[SHEET_HEIGHT]}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#F5F2EE', borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: '#D4C5B0', width: 40 }}
      animationConfigs={{
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      }}
    >
      <BottomSheetView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-end px-4 py-2" style={{ height: 44 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              bottomSheetRef.current?.close();
            }}
            className="w-11 h-11 items-center justify-center bg-white rounded-full shadow-sm"
          >
            <Feather name="x" size={24} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Carousel */}
        <View style={{ height: CAROUSEL_HEIGHT }}>
          <Carousel
            loop={false}
            width={SCREEN_WIDTH}
            height={CAROUSEL_HEIGHT}
            data={[0, 1]}
            renderItem={renderCarouselItem}
            pagingEnabled
            snapEnabled
            onProgressChange={(_, absoluteProgress) => {
              'worklet';
              scrollX.value = absoluteProgress * SCREEN_WIDTH;
            }}
          />
        </View>

        {/* Footer */}
        <View 
          className="flex-1 justify-between px-6 pt-4 pb-2"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <PaginationIndicator
            currentIndex={0} // not really used by indicator, it relies on scrollX
            totalSlides={2}
            scrollX={scrollX}
          />

          <View className="flex-row items-center justify-between gap-4 mt-4">
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="flex-1 flex-row items-center justify-center py-4 rounded-full border border-accent bg-transparent gap-2"
            >
              <Feather name="bookmark" size={20} color="#8B7355" />
              <Text className="text-accent font-bold text-base">Save</Text>
            </Pressable>

            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="flex-1 flex-row items-center justify-center py-4 rounded-full bg-accent gap-2"
            >
              <Feather name="share" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base">Share</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
