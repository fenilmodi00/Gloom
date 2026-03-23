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
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { OutfitGrid } from '@/components/shared/OutfitGrid';
import type { ModelCard, OutfitItem } from '@/types/inspo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Swipe gesture thresholds - balanced to prevent accidental taps while keeping usability
const MIN_DISTANCE = 10;        // Minimum distance to start gesture
const SWIPE_THRESHOLD = 60;     // Distance to trigger navigation (matches original minDistance)
const VELOCITY_THRESHOLD = 500; // Velocity to trigger navigation (matches original)

// Smooth flat-swipe spring config (no bounce, no rubber-band lag)
const SWIPE_SPRING = {
  damping: 40,
  stiffness: 400,
  mass: 1,
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
      // Handle asset from require()
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
      // Handle asset from require()
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
  surface: '#FFFFFF',
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const isGestureTriggered = useSharedValue(false);

   // ── Pop-up animation values (scale + fade, not slide-up) ──
   const scale = useSharedValue(0.88);
   const popupOpacity = useSharedValue(0);
   const backdropOpacity = useSharedValue(0);

   // ── Swipe animation value ──
   const translateX = useSharedValue(0);

  // ── Worklet-safe slide index (avoids stale closure in gesture callbacks) ──
  const currentSlideShared = useSharedValue(0);

  // ── Sync shared value with React state ──
  useEffect(() => {
    currentSlideShared.value = currentSlide;
  }, [currentSlide, currentSlideShared]);

  // ── Sync translateX with currentSlide (skip if gesture triggered) ──
  useEffect(() => {
    if (isGestureTriggered.value) {
      isGestureTriggered.value = false;
      return;
    }
    translateX.value = withSpring(-currentSlide * SCREEN_WIDTH, SWIPE_SPRING);
  }, [currentSlide, translateX, isGestureTriggered]);

  // ── Entry animation ──
  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      // Backdrop fades in first
      backdropOpacity.value = withTiming(1, { duration: 200 });
      // Then popup scales+fades in (pop-up feel)
      scale.value = withSpring(1, {
        damping: 18,
        stiffness: 200,
        mass: 0.7,
      });
      popupOpacity.value = withSpring(1, {
        damping: 18,
        stiffness: 200,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.id]);

  // ── Close helper ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Safe state setter for gesture callbacks (runs on JS thread) ──
  const setSlideIndex = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // ── Programmatic slide navigation (updates both state and translateX) ──
  const navigateToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    translateX.value = withSpring(-index * SCREEN_WIDTH, SWIPE_SPRING);
  }, [translateX]);

   // ── Horizontal swipe gesture ──
   // GestureDetector wraps slideOuter to capture swipes from both Slide 0 and Slide 1
   // minDistance prevents gesture from starting on tiny movements (avoids treating taps as swipes)
   // Only swipes (not taps) will trigger navigation
   const swipeGesture = Gesture.Pan()
     .minDistance(10)
     .failOffsetY([-25, 25])
     .shouldCancelWhenOutside(false)
     .onUpdate((e) => {
       'worklet';
       // 1:1 flat card feel — no rubber-band lag
       // Only update if we've moved a meaningful distance (ignore tiny jitter)
       if (Math.abs(e.translationX) > 5) {
         // Mark gesture as active to prevent sync effect from overriding during drag
         isGestureTriggered.value = true;
         translateX.value = e.translationX;
       }
     })
     .onEnd((e) => {
       'worklet';
       const drag = e.translationX;
       const velocity = e.velocityX;

       // Use shared value for worklet-safe state access
       const currentIdx = currentSlideShared.value;
       let targetSlide = currentIdx;

       // Require either sufficient distance OR (sufficient velocity AND minimum distance)
       // This prevents taps with high velocity but low distance from triggering navigation
       const distanceThresholdMet = Math.abs(drag) > SWIPE_THRESHOLD;
       const velocityThresholdMet = Math.abs(velocity) > 500;
       const minimumDistanceForVelocity = Math.abs(drag) > 20; // Need some movement to use velocity

       let shouldNavigate = false;
       if (currentIdx === 0) {
         // Swipe left → outfit grid
         shouldNavigate = distanceThresholdMet || (velocityThresholdMet && minimumDistanceForVelocity && drag < 0);
       } else if (currentIdx === 1) {
         // Swipe right → model
         shouldNavigate = distanceThresholdMet || (velocityThresholdMet && minimumDistanceForVelocity && drag > 0);
       }

       if (shouldNavigate) {
         targetSlide = 1 - currentIdx; // Toggle between 0 and 1
       }

       const targetTranslateX = -targetSlide * SCREEN_WIDTH;
       translateX.value = withSpring(targetTranslateX, {
         ...SWIPE_SPRING,
         velocity: e.velocityX,
       });

       if (targetSlide !== currentIdx) {
         runOnJS(setSlideIndex)(targetSlide);
       }
       // Reset flag after gesture ends
       isGestureTriggered.value = false;
     });

  // ── Animated styles ──
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  // The slides themselves translate with the swipe gesture
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const imageSource =
    model?.imageUrl
      ? typeof model.imageUrl === 'string'
        ? { uri: model.imageUrl }
        : model.imageUrl
      : require('../../assets/modal.png');

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
          {/* Dark tint layer */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Frost overlay: white light from top, fading down */}
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle inner glow at edges */}
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'transparent', 'transparent', 'rgba(0,0,0,0.1)']}
            locations={[0, 0.15, 0.85, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        {/* ── Popup card: centered, scale+fade animation ── */}
        <Animated.View style={[styles.popupCard, popupStyle]}>
          {/* Header */}
          <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable onPress={safeClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        {/* ── Swipeable slide content ── */}
        {/* slideOuter clips overflow; slideTrack holds both slides side-by-side */}
        {/* GestureDetector wraps slideOuter to capture swipes from both slides */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.slideOuter]}>
            <Animated.View
              style={[
                styles.slideTrack,
                { width: SCREEN_WIDTH * 2 },
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
                <View style={styles.swipeHint}>
                  <Feather name="chevron-left" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.hintText}>Swipe for outfit details</Text>
                  <Feather name="chevron-right" size={13} color={COLORS.textSecondary} />
                </View>
              </View>

              {/* ── Slide 1: Outfit grid — OutfitGrid stays pressable ── */}
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
                  <OutfitGrid items={clothItems} />
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

const styles = {
  gestureRoot: {
    flex: 1,
  } as ViewStyle,

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  } as ViewStyle,

  popupCard: {
    position: 'absolute' as const,
    top: SCREEN_HEIGHT * 0.10,
    bottom: SCREEN_HEIGHT * 0.10,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: COLORS.background,
    borderRadius: 28,
    // Card shadow
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden' as const,
  } as ViewStyle,

  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  } as ViewStyle,
  headerSpacer: { flex: 1 } as ViewStyle,
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,

  // ── Slide layout ──
  // The outer container is the gesture target and clips overflow
  slideOuter: {
    flex: 1,
    overflow: 'hidden' as const,
  } as ViewStyle,
  // The track holds both slides side-by-side, translated by gesture
  slideTrack: {
    flex: 1,
    flexDirection: 'row' as const,
  } as ViewStyle,
  slide: {
    width: SCREEN_WIDTH, // One screen width per slide
    flex: 1,
    backgroundColor: COLORS.background,
  } as ViewStyle,

  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: COLORS.surface,
  } as ViewStyle,
  modelImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  swipeHint: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
  } as ViewStyle,
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  } as TextStyle,

  outfitHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  } as ViewStyle,
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  outfitTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  } as TextStyle,

  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  } as TextStyle,

  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 14,
  } as ViewStyle,
  pagination: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  } as ViewStyle,
  dotActive: {
    width: 24,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  } as ViewStyle,

  actions: {
    flexDirection: 'row' as const,
    gap: 12,
  } as ViewStyle,
  saveBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
  } as ViewStyle,
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.accent,
  } as TextStyle,
  shareBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  } as ViewStyle,
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.surface,
  } as TextStyle,
};
