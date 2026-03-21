/**
 * ModelDetailScreen — Modal route for model detail view
 *
 * Architecture:
 * - Lives outside InspoScreen component tree (no gesture conflicts)
 * - State shared via modelDetail store
 * - Blur backdrop with tap-to-dismiss
 * - Horizontal swipe between Model view and OutfitGrid
 *
 * Close strategy: router.replace('/(tabs)/inspo') — same pattern as wardrobe/add-item.tsx:62-64
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Dimensions,
  BackHandler,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useModelDetailStore } from '@/lib/store/modelDetail.store';
import { OutfitGrid } from '@/components/shared/OutfitGrid';
import type { ModelCard } from '@/types/inspo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design tokens matching the app
const COLORS = {
  background: '#F5F2EE',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  accent: '#8B7355',
  accentLight: '#D4C5B0',
};

export default function ModelDetailScreen() {
  const router = useRouter();
  const selectedModel = useModelDetailStore((state) => state.selectedModel);
  const clothItems = useModelDetailStore((state) => state.clothItems);
  const closeModelDetail = useModelDetailStore((state) => state.closeModelDetail);

  // Capture model into local state on mount (before clearing store)
  const [displayModel, setDisplayModel] = useState<ModelCard | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (selectedModel) {
      setDisplayModel(selectedModel);
    }
  }, [selectedModel]);

  // Reset slide when model changes
  useEffect(() => {
    setCurrentSlide(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayModel?.id]);

  // Slide-up animation
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const translateX = useSharedValue(0);

  // Close modal — matches wardrobe/add-item.tsx:62-64 pattern
  // Ref so BackHandler always calls the latest version
  const closeModalRef = useRef<() => void>(() => {});
  const closeModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 20,
      stiffness: 200,
    }, () => {
      closeModelDetail();
      router.replace('/(tabs)/inspo');
    });
  }, [translateY, closeModelDetail, router]);
  closeModalRef.current = closeModal;

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Horizontal swipe gesture for sliding between views
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH * 0.2;
      if (currentSlide === 0 && e.translationX < -threshold) {
        // Swipe left to show outfit grid
        setCurrentSlide(1);
      } else if (currentSlide === 1 && e.translationX > threshold) {
        // Swipe right to show model
        setCurrentSlide(0);
      }
      translateX.value = withSpring(0);
    });

  // Clear store on unmount/dismiss
  useEffect(() => {
    return () => {
      closeModelDetail();
    };
  }, [closeModelDetail]);

  // Android hardware back → dismiss
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        closeModalRef.current();
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  const imageSource: ImageSourcePropType | number = displayModel?.imageUrl
    ? (typeof displayModel.imageUrl === 'string'
      ? { uri: displayModel.imageUrl }
      : displayModel.imageUrl)
    : require('../../../assets/modal.png');

  return (
    <View style={styles.container} testID="modal-container">
      {/* Blur backdrop — wraps entire screen */}
      <BlurView
        intensity={80}
        tint="dark"
        style={StyleSheet.absoluteFill}
        testID="blur-backdrop"
      >
        {/* Tap outside content to dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeModal}
          testID="backdrop-press"
        />
      </BlurView>

      {/* Modal content with slide-up animation */}
      <Animated.View
        style={[styles.content, animatedStyle]}
        testID="modal-content"
      >
        {/* Header: close button */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable
            onPress={closeModal}
            style={styles.closeButton}
            testID="close-button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={24} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        {/* Swipeable content */}
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.slideContainer}>
            {currentSlide === 0 ? (
              /* Slide 1: Model image */
              <View style={styles.modelSlide} testID="model-slide">
                <View style={styles.imageContainer} testID="image-container">
                  <Image
                    source={imageSource}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                    testID="model-image"
                  />
                </View>

                {/* Swipe hint */}
                <View style={styles.swipeHint}>
                  <Feather name="chevron-left" size={16} color={COLORS.textSecondary} />
                  <Pressable
                    onPress={() => setCurrentSlide(1)}
                    style={styles.swipeHintText}
                  >
                    <Feather name="arrow-right" size={14} color={COLORS.textSecondary} />
                  </Pressable>
                  <Text style={styles.hintLabel}>Swipe for outfit details</Text>
                </View>
              </View>
            ) : (
              /* Slide 2: Outfit Grid */
              <View style={styles.outfitSlide} testID="outfit-slide">
                <View style={styles.outfitHeader}>
                  <Pressable onPress={() => setCurrentSlide(0)} style={styles.backButton}>
                    <Feather name="arrow-left" size={20} color={COLORS.textPrimary} />
                  </Pressable>
                  <Text style={styles.outfitTitle}>Complete Look</Text>
                  <View style={{ width: 44 }} />
                </View>
                {clothItems.length > 0 ? (
                  <OutfitGrid items={clothItems} />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No outfit items available</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </GestureDetector>

        {/* Footer: pagination + action buttons */}
        <View style={styles.footer}>
          {/* Pagination indicator */}
          <View style={styles.paginationContainer}>
            <View style={styles.paginationDots}>
              <View style={[styles.paginationDot, currentSlide === 0 && styles.paginationDotActive]} />
              <View style={[styles.paginationDot, currentSlide === 1 && styles.paginationDotActive]} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              style={styles.saveButton}
              testID="save-button"
            >
              <Feather name="bookmark" size={20} color={COLORS.accent} />
            </Pressable>

            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              style={styles.shareButton}
              testID="share-button"
            >
              <Feather name="share" size={20} color={COLORS.surface} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Text component for swipe hint (avoiding inline Text import)
const Text = require('react-native').Text;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 60,
    marginBottom: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    height: 60,
    backgroundColor: COLORS.surface,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  slideContainer: {
    flex: 1,
  },
  modelSlide: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  swipeHintText: {
    padding: 4,
  },
  hintLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  outfitSlide: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  outfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitTitle: {
    fontSize: 18,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  paginationContainer: {
    marginBottom: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BEBEBE',
  },
  paginationDotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    gap: 8,
  },
});
