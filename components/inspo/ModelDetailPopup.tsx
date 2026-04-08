/**
 * ModelDetailPopup — Inline overlay popup for model detail.
 *
 * - Appears as a centered pop-up over the live inspo screen
 * - Full-screen blur backdrop keeps inspo content visible but dimmed
 * - Horizontal swipe navigates between model image and outfit board
 * - Scale+fade animation (not bottom-sheet slide-up)
 * - Uses react-native-reanimated-carousel for reliable swiping
 */
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useModelImageStore } from '@/lib/store/model-image.store';
import { Feather } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

import { OutfitBoard } from '@/components/outfit-board/OutfitBoard';
import type { ClothingItem } from '@/lib/store/outfit-board.store';
import type { ModelCard, OutfitItem } from '@/types/inspo';


// COLORS removed in favor of Colors.light

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The popup width/height
const CARD_WIDTH = SCREEN_WIDTH;
// The slides take the remaining height.
// We know top/bottom constraints: top: SCREEN_HEIGHT*0.10, bottom: SCREEN_HEIGHT*0.10
const CARD_HEIGHT = SCREEN_HEIGHT * 0.80;
// Header is around 60, Footer is around 100. Let's let the carousel fill the remaining space flexibly.
// But reanimated-carousel needs explicit height, or we can use `flex: 1` if we set height to 100%.
// We will measure the content area or use flex, actually reanimated-carousel supports width={width} and handles height with `flex: 1` if `height` is not provided but sometimes it needs it.
// We will calculate exact height or use a dynamic onLayout.

export interface ModelDetailPopupProps {
  visible: boolean;
  onClose: () => void;
  model: ModelCard | null;
  clothItems: OutfitItem[]; // For OutfitBoard
}

export function ModelDetailPopup({
  visible,
  onClose,
  model,
  clothItems,
}: ModelDetailPopupProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);
  const carouselRef = useRef<any>(null);

  // -- Animations --
  const backdropOpacity = useSharedValue(0);
  const popupOpacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  const safeClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.9, { duration: 200 });
    popupOpacity.value = withTiming(0, { duration: 200 }, (isFinished) => {
      if (isFinished) {
        runOnJS(onClose)();
      }
    });
  }, [backdropOpacity, scale, popupOpacity, onClose]);

  // Entrance
  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      backdropOpacity.value = withTiming(1, { duration: 300 });
      popupOpacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, {
        damping: 24,
        stiffness: 250,
        mass: 0.8,
      });
    }
  }, [visible, backdropOpacity, popupOpacity, scale]);

  // Back handler
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      safeClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, safeClose]);

  const navigateToSlide = (index: number) => {
    carouselRef.current?.scrollTo({ index, animated: true });
  };

  const handleSnap = (index: number) => {
    setCurrentSlide(index);
    Haptics.selectionAsync();
  };

  const { uploadImage } = useModelImageStore();

  // Convert clothItems to OutfitBoard format
  const mappedOutfit = React.useMemo(() => {
    const result: {
      top?: ClothingItem;
      bottom?: ClothingItem;
      shoes?: ClothingItem;
      accessory?: ClothingItem;
    } = {};

    clothItems.forEach(item => {
      // Typecast uri since OutfitBoard expects ClothingItem format
      const clothingItem: ClothingItem = {
        id: item.id,
        uri: item.image as number | string,
        name: item.label
      };

      const lbl = item.label.toLowerCase();
      if (lbl.includes('top')) result.top = clothingItem;
      else if (lbl.includes('bottom')) result.bottom = clothingItem;
      else if (lbl.includes('shoe')) result.shoes = clothingItem;
      else if (lbl.includes('accessori') || lbl.includes('accessory')) result.accessory = clothingItem;
    });

    return result;
  }, [clothItems]);

  const handleSave = async (source: any) => {
    try {
      let localUri = source.uri;

      if (!localUri && typeof source === 'number') {
        const [asset] = await Asset.loadAsync(source);
        localUri = asset.localUri || asset.uri;
      }

      if (localUri) {
        await uploadImage(localUri);
        Alert.alert('Saved!', 'Look added to your profile.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', 'Image not available for saving');
      }
    } catch (err) {
      console.log('Error saving image:', err);
      Alert.alert('Error', 'Could not save the image.');
    }
  };

  const handleShare = async (source: any) => {
    try {
      let localUri = source.uri;

      if (!localUri && typeof source === 'number') {
        const [asset] = await Asset.loadAsync(source);
        localUri = asset.localUri || asset.uri;
      }

      if (localUri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(localUri);
        } else {
          Alert.alert('Sharing is not available on this device');
        }
      } else {
        Alert.alert('Image not available for sharing');
      }
    } catch (error) {
      console.log('Error sharing image:', error);
      Alert.alert('Error', 'Could not share the image.');
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const imageSource =
    model?.imageUrl
      ? typeof model.imageUrl === 'string'
        ? { uri: model.imageUrl }
        : model.imageUrl
      : require('../../assets/modal.png');

  // We need to measure the container of the carousel so it sizes perfectly.

  const renderItem = ({ index }: { index: number }) => {
    if (index === 0) {
      return (
        <View className="flex-1 w-full bg-bgCanvas" style={{ width: SCREEN_WIDTH }}>
          <View className="flex-1 mx-4 mt-2 rounded-[20px] overflow-hidden bg-bgSurface">
            <Image
              source={imageSource}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
            />
          </View>
          <View className="flex-row items-center justify-center gap-1.5 py-2.5">
            <Feather name="chevron-left" size={13} color={Colors.light.textSecondary} />
            <Text className="font-body text-xs text-textSecondary">Swipe for outfit details</Text>
            <Feather name="chevron-right" size={13} color={Colors.light.textSecondary} />
          </View>
        </View>
      );
    }

    return (
      <View className="flex-1 w-full bg-bgCanvas" style={{ width: SCREEN_WIDTH }}>
        <View className="flex-row items-center justify-between px-4 py-3 bg-bgSurface">
          <Pressable
            onPress={() => navigateToSlide(0)}
            className="w-9 h-9 rounded-full bg-bgCanvas items-center justify-center"
          >
            <Feather name="arrow-left" size={18} color={Colors.light.textPrimary} />
          </Pressable>
          <Text className="font-heading text-lg text-textPrimary">Complete Look</Text>
          <View style={{ width: 36 }} />
        </View>

        {clothItems.length > 0 ? (
          <View className="flex-1 items-center justify-center px-4 pb-4">
            <OutfitBoard
              top={mappedOutfit.top}
              bottom={mappedOutfit.bottom}
              shoes={mappedOutfit.shoes}
              accessory={mappedOutfit.accessory}
              transparent={true} // blends with background
              disableShadow={true}
              noBorderRadius={true}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="font-body text-base text-textSecondary">No outfit items</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={safeClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView className="flex-1">
        {/* Backdrop */}
        <Animated.View className="absolute inset-0" style={backdropStyle}>
          <Pressable
            className="absolute inset-0"
            onPress={safeClose}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'transparent', 'transparent', 'rgba(0,0,0,0.1)']}
              locations={[0, 0.15, 0.85, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </Animated.View>

        {/* Popup Card */}
        <Animated.View
          className="absolute left-0 right-0 z-10 bg-bgCanvas rounded-[28px] overflow-hidden shadow-2xl shadow-black/10"
          style={[
            popupStyle,
            { top: SCREEN_HEIGHT * 0.10, bottom: SCREEN_HEIGHT * 0.10, elevation: 8 }
          ]}
        >
          <View className="flex-row items-center px-4 py-3 bg-bgSurface rounded-t-[28px]">
            <View className="flex-1" />
            <Pressable onPress={safeClose} className="w-9 h-9 rounded-full bg-bgCanvas items-center justify-center">
              <Feather name="x" size={20} color={Colors.light.textPrimary} />
            </Pressable>
          </View>

          {/* Swipeable slides using Carousel */}
          <View
            className="flex-1 overflow-hidden bg-bgCanvas"
            onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.height)}
          >
            {carouselHeight > 0 && (
              <Carousel
                ref={carouselRef}
                loop={false}
                width={SCREEN_WIDTH}
                height={carouselHeight}
                data={[0, 1]}
                onSnapToItem={handleSnap}
                renderItem={renderItem}
                enabled={true}
                defaultIndex={0}
              />
            )}
          </View>

          {/* Footer */}
          <View className="px-5 pt-3.5 pb-7 bg-bgSurface rounded-b-[28px] gap-3.5">
            <View className="flex-row justify-center gap-2">
              <View className={`h-2 rounded-full ${currentSlide === 0 ? 'w-6 bg-primary' : 'w-2 bg-[#D0D0D0]'}`} />
              <View className={`h-2 rounded-full ${currentSlide === 1 ? 'w-6 bg-primary' : 'w-2 bg-[#D0D0D0]'}`} />
            </View>

            <View className="flex-row gap-3">
              <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-3.5 rounded-full border-[1.5px] border-primary bg-bgSurface" onPress={() => handleSave(imageSource)}>
                <Feather name="bookmark" size={18} color={Colors.light.primary} />
                <Text className="font-ui text-sm font-medium text-primary">Save</Text>
              </Pressable>

              <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-3.5 rounded-full bg-primary" onPress={() => handleShare(imageSource)}>
                <Feather name="share" size={18} color={Colors.light.bgSurface} />
                <Text className="font-ui text-sm font-medium text-white">Share</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
