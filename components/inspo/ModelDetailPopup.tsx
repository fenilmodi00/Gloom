/**
 * ModelDetailPopup — Inline overlay popup for model detail.
 *
 * - Appears as a centered pop-up over the live inspo screen
 * - Full-screen blur backdrop keeps inspo content visible but dimmed
 * - Horizontal swipe navigates between model image and outfit board
 * - Scale+fade animation (not bottom-sheet slide-up)
 * - Uses react-native-reanimated-carousel for reliable swiping
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  Dimensions,
  BackHandler,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Asset } from 'expo-asset';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';

import { OutfitBoard } from '@/components/outfit-board/OutfitBoard';
import type { ClothingItem } from '@/lib/store/outfit-board.store';
import type { ModelCard, OutfitItem } from '@/types/inspo';
import { Brand, Backgrounds, Typography } from '@/constants/Colors';

const COLORS = {
  background: Backgrounds.bgCanvas,
  surface: Backgrounds.bgSurface,
  textPrimary: Typography.textPrimary,
  textSecondary: Typography.textSecondary,
  accent: Brand.primary,
};

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
  const carouselRef = React.useRef<any>(null);

  // -- Animations --
  const backdropOpacity = useSharedValue(0);
  const popupOpacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  const safeClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.9, { duration: 200 });
    popupOpacity.value = withTiming(0, { duration: 200 }, () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSlide(0);
      onClose();
    });
  }, [backdropOpacity, scale, popupOpacity, onClose]);

  // Entrance
  useEffect(() => {
    if (visible) {
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Saved!', 'Look added to your boards.', [{ text: 'OK' }]);
    } catch (err) {
      console.log('Error saving image:', err);
    }
  };

  const handleShare = async (source: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  const [carouselHeight, setCarouselHeight] = useState<number>(0);

  const renderItem = ({ index }: { index: number }) => {
    if (index === 0) {
      return (
        <View style={styles.slide}>
          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.modelImage}
              contentFit="cover"
              transition={200}
            />
          </View>
          <View style={styles.swipeHint}>
            <Feather name="chevron-left" size={13} color={COLORS.textSecondary} />
            <Text style={styles.hintText}>Swipe for outfit details</Text>
            <Feather name="chevron-right" size={13} color={COLORS.textSecondary} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.slide}>
        <View style={styles.outfitHeader}>
          <Pressable
            onPress={() => navigateToSlide(0)}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={18} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.outfitTitle}>Complete Look</Text>
          <View style={{ width: 36 }} />
        </View>

        {clothItems.length > 0 ? (
          <View style={styles.outfitBoardContainer}>
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No outfit items</Text>
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
      <GestureHandlerRootView style={styles.gestureRoot}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
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
        <Animated.View style={[styles.popupCard, popupStyle]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Pressable onPress={safeClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Swipeable slides using Carousel */}
          <View
            style={styles.slideOuter}
            onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.height)}
          >
            {carouselHeight > 0 && (
              <Carousel
                ref={carouselRef}
                loop={false}
                width={SCREEN_WIDTH}
                height={carouselHeight}
                data={[0, 1]}
                onSnapToItem={(index) => setCurrentSlide(index)}
                renderItem={renderItem}
                enabled={true}
                defaultIndex={0}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.pagination}>
              <View style={[styles.dot, currentSlide === 0 && styles.dotActive]} />
              <View style={[styles.dot, currentSlide === 1 && styles.dotActive]} />
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.saveBtn} onPress={() => handleSave(imageSource)}>
                <Feather name="bookmark" size={18} color={COLORS.accent} />
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>

              <Pressable style={styles.shareBtn} onPress={() => handleShare(imageSource)}>
                <Feather name="share" size={18} color={COLORS.surface} />
                <Text style={styles.shareBtnText}>Share</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  popupCard: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.10,
    bottom: SCREEN_HEIGHT * 0.10,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: COLORS.background,
    borderRadius: 28,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerSpacer: { flex: 1 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideOuter: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  slide: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  outfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  outfitBoardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: {
    width: 24,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
