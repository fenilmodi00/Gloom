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

// Save model image to gallery
async function handleSave(imageUrl: string | number) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to save images.');
      return;
    }
    const uri = typeof imageUrl === 'string' ? imageUrl : Image.resolveAssetSource(imageUrl).uri;
    await MediaLibrary.saveToLibraryAsync(uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    Alert.alert('Error', 'Failed to save image.');
  }
}

// Share model image
async function handleShare(imageUrl: string | number) {
  try {
    const uri = typeof imageUrl === 'string' ? imageUrl : Image.resolveAssetSource(imageUrl).uri;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(uri);
  } catch (err) {
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
  const isGestureTriggered = useRef(false);

  // ── Pop-up animation values (scale + fade, not slide-up) ──
  const scale = useSharedValue(0.88);
  const popupOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // ── Swipe animation value ──
  const translateX = useSharedValue(0);

  // ── Sync translateX with currentSlide (skip if gesture triggered) ──
  useEffect(() => {
    if (isGestureTriggered.current) {
      isGestureTriggered.current = false;
      return;
    }
    translateX.value = withSpring(-currentSlide * SCREEN_WIDTH, {
      damping: 22,
      stiffness: 220,
    });
  }, [currentSlide, translateX]);

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
    translateX.value = withSpring(-index * SCREEN_WIDTH, {
      damping: 22,
      stiffness: 220,
    });
  }, [translateX]);

  // ── Horizontal swipe gesture ──
  // GestureDetector wraps ONLY the slide content — not the whole card
  // This keeps header/footer buttons pressable
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      'worklet';
      // Apply drag directly to slide transform (visual swipe)
      translateX.value = e.translationX * 0.6;
    })
    .onEnd((e) => {
      'worklet';
      const threshold = SCREEN_WIDTH * 0.18;
      const drag = e.translationX;
      const velocity = e.velocityX;

      let targetSlide = currentSlide;
      if (currentSlide === 0 && (drag < -threshold || velocity < -500)) {
        // Swipe left → outfit grid
        targetSlide = 1;
      } else if (currentSlide === 1 && (drag > threshold || velocity > 500)) {
        // Swipe right → model
        targetSlide = 0;
      }
      
      const targetTranslateX = -targetSlide * SCREEN_WIDTH;
      translateX.value = withSpring(targetTranslateX, { damping: 22, stiffness: 220 });
      
      if (targetSlide !== currentSlide) {
        runOnJS(() => {
          isGestureTriggered.current = true;
          setCurrentSlide(targetSlide);
        })();
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
        {/* GestureDetector wraps ONLY this area — buttons in header/footer stay pressable */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.slideOuter]}>
            <Animated.View
              style={[
                styles.slideTrack,
                // Width = 2 screens so swiping left reveals slide 1 to the right
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
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }
            >
              <Feather name="bookmark" size={18} color={COLORS.accent} />
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>

            <Pressable
              style={styles.shareBtn}
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }
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
