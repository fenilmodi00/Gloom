/**
 * ModelDetailPopup — Inline overlay popup for model detail.
 *
 * - Appears as a centered pop-up over the live inspo screen
 * - Full-screen blur backdrop keeps inspo content visible but dimmed
 * - Horizontal swipe navigates between model image and outfit grid
 * - Scale+fade animation (not bottom-sheet slide-up)
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  Pressable,
  BackHandler,
  Text,
  useWindowDimensions,
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
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { OutfitGrid } from '@/components/shared/OutfitGrid';
import { DotGrid } from '@/components/outfit-board/DotGrid';
import { THEME } from '@/constants/Colors';
import type { ModelCard, OutfitItem } from '@/types/inspo';

// Swipe gesture thresholds (relative to container width)
const SWIPE_THRESHOLD_RATIO = 0.3; // 30% of container width
const VELOCITY_THRESHOLD = 500;

// Physics-based spring config for smooth carousel
const SWIPE_SPRING = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

// Popup entry animation config
const POPUP_SPRING = {
  damping: 18,
  stiffness: 200,
  mass: 0.7,
};

// Save model image to gallery
async function handleSave(imageSource: any) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to save images.');
      return;
    }

    let uri: string;
    if (typeof imageSource === 'string') {
      uri = imageSource;
    } else if (imageSource.uri) {
      uri = imageSource.uri;
    } else {
      const asset = await Asset.fromModule(imageSource).downloadAsync();
      uri = asset.localUri || asset.uri;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    console.error('Save error:', err);
    Alert.alert('Error', 'Failed to save image.');
  }
}

// Share model image
async function handleShare(imageSource: any) {
  try {
    let uri: string;
    if (typeof imageSource === 'string') {
      uri = imageSource;
    } else if (imageSource.uri) {
      uri = imageSource.uri;
    } else {
      const asset = await Asset.fromModule(imageSource).downloadAsync();
      uri = asset.localUri || asset.uri;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(uri);
  } catch (err) {
    console.error('Share error:', err);
    Alert.alert('Error', 'Failed to share image.');
  }
}

// Design tokens
const COLORS = {
  background: '#F5F2EE',
  surface: '#FDFAF6',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  accent: '#8B7355',
  accentLight: '#D4C5B0',
};

export interface ModelDetailPopupProps {
  visible: boolean;
  model: ModelCard | null;
  clothItems: OutfitItem[];
  onClose: () => void;
}

export function ModelDetailPopup({
  visible,
  model,
  clothItems,
  onClose,
}: ModelDetailPopupProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Container width measured from onLayout (accurate for modal) ──
  const containerWidth = useSharedValue(windowWidth);

  // ── Pop-up animation values (scale + fade) ──
  const scale = useSharedValue(0.88);
  const popupOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // ── Swipe animation value ──
  const translateX = useSharedValue(0);

  // ── Worklet-safe slide index ──
  const currentSlideShared = useSharedValue(0);

  // ── Sync shared value with React state ──
  useEffect(() => {
    currentSlideShared.value = currentSlide;
  }, [currentSlide, currentSlideShared]);

  // ── Sync translateX with currentSlide ──
  useEffect(() => {
    translateX.value = withSpring(-currentSlide * containerWidth.value, SWIPE_SPRING);
  }, [currentSlide, containerWidth, translateX]);

  // ── Entry animation ──
  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, POPUP_SPRING);
      popupOpacity.value = withSpring(1, {
        damping: POPUP_SPRING.damping,
        stiffness: POPUP_SPRING.stiffness,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.88, { duration: 180 });
      popupOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, backdropOpacity, scale, popupOpacity]);

  // ── Reset slide when model changes ──
  const prevModelIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (model?.id && model.id !== prevModelIdRef.current) {
      prevModelIdRef.current = model.id;
      setCurrentSlide(0);
    }
  }, [model?.id]);

  // ── Close helper ──
  const safeClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    backdropOpacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.88, { duration: 150 });
    popupOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, backdropOpacity, scale, popupOpacity]);

  // ── Android hardware back ──
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      safeClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, safeClose]);

  // ── Safe state setter for gesture callbacks ──
  const setSlideIndex = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // ── Programmatic slide navigation ──
  const navigateToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    translateX.value = withSpring(-index * containerWidth.value, SWIPE_SPRING);
  }, [translateX, containerWidth]);

  // ── Measure container width for accurate slide positioning ──
  const onContainerLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      containerWidth.value = width;
    }
  }, [containerWidth]);

  // ── Horizontal swipe gesture (simplified for 2-slide carousel) ──
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // Ignore small horizontal movements (prevents accidental swipes)
    .failOffsetY([-25, 25]) // Block vertical scroll conflicts
    .onUpdate((e) => {
      'worklet';
      // 1:1 drag feel — translate from current position
      translateX.value = e.translationX - currentSlideShared.value * containerWidth.value;
    })
    .onEnd((e) => {
      'worklet';
      const drag = e.translationX;
      const velocity = e.velocityX;
      const currentIdx = currentSlideShared.value;
      const width = containerWidth.value;

      // Calculate thresholds based on container width
      const positionThreshold = width * SWIPE_THRESHOLD_RATIO;

      // Determine if we should navigate (combine position + velocity)
      const shouldNavigateLeft = currentIdx === 0 && (drag < -positionThreshold || velocity < -VELOCITY_THRESHOLD);
      const shouldNavigateRight = currentIdx === 1 && (drag > positionThreshold || velocity > VELOCITY_THRESHOLD);

      const shouldNavigate = shouldNavigateLeft || shouldNavigateRight;
      const targetSlide = shouldNavigate ? 1 - currentIdx : currentIdx;

      translateX.value = withSpring(-targetSlide * width, {
        ...SWIPE_SPRING,
        velocity: e.velocityX,
      });

      if (targetSlide !== currentIdx) {
        runOnJS(setSlideIndex)(targetSlide);
      }
    });

  // ── Animated styles ──
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const imageSource =
    model?.imageUrl
      ? typeof model.imageUrl === 'string'
        ? { uri: model.imageUrl }
        : model.imageUrl
      : require('../../assets/modal.png');

  // Responsive popup dimensions
  const popupTop = windowHeight * 0.08;
  const popupBottom = windowHeight * 0.08;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={safeClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        {/* ── Backdrop: frosted glass effect ── */}
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

        {/* ── Popup card: centered, scale+fade animation ── */}
        <Animated.View
          style={[
            styles.popupCard,
            { top: popupTop, bottom: popupBottom },
            popupStyle,
          ]}
          onLayout={onContainerLayout}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Pressable onPress={safeClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* ── Swipeable slide content ── */}
          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={styles.slideOuter}>
              <Animated.View
                style={[
                  styles.slideTrack,
                  { width: containerWidth.value * 2 },
                  slideStyle,
                ]}
              >
                {/* ── Slide 0: Model image ── */}
                <View style={styles.slide}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={imageSource}
                      style={styles.modelImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>

                  {/* Swipe hint */}
                  <DotGrid
                    width={containerWidth.value * 0.8}
                    height={60}
                    dotColor={THEME.goldAccent}
                    backgroundColor="transparent"
                  />
                </View>

                {/* ── Slide 1: Outfit grid ── */}
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
                    <View className="bg-bgSurface rounded-2xl overflow-hidden shadow-sm border border-black/5 mx-4 flex-1">
                      <OutfitGrid items={clothItems} />
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No outfit items</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {/* Footer: pagination + buttons */}
          <View style={styles.footer}>
            {/* Pagination dots */}
            <View style={styles.pagination}>
              <View
                style={[
                  styles.dot,
                  currentSlide === 0 && styles.dotActive,
                ]}
              />
              <View
                style={[
                  styles.dot,
                  currentSlide === 1 && styles.dotActive,
                ]}
              />
            </View>

            {/* Save + Share */}
            <View style={styles.actions}>
              <Pressable
                style={styles.saveBtn}
                onPress={() => handleSave(imageSource)}
              >
                <Feather name="bookmark" size={18} color={COLORS.accent} />
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>

              <Pressable
                style={styles.shareBtn}
                onPress={() => handleShare(imageSource)}
              >
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
  },
  slideTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
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
