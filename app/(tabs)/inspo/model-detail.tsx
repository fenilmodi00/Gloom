/**
 * ModelDetailScreen — Modal route for model detail view
 *
 * Architecture:
 * - Lives outside InspoScreen component tree (no gesture conflicts)
 * - State shared via modelDetail store
 * - Blur backdrop with tap-to-dismiss
 * - Slide-up animation via Reanimated
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

import { useModelDetailStore } from '@/lib/store/modelDetail.store';
import type { ModelCard } from '@/types/inspo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design tokens matching the app
const COLORS = {
  accent: '#8B7355',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
};

export default function ModelDetailScreen() {
  const router = useRouter();
  const selectedModel = useModelDetailStore((state) => state.selectedModel);
  const clothItems = useModelDetailStore((state) => state.clothItems);
  const closeModelDetail = useModelDetailStore((state) => state.closeModelDetail);

  // Capture model into local state on mount (before clearing store)
  const [displayModel, setDisplayModel] = useState<ModelCard | null>(null);

  useEffect(() => {
    if (selectedModel) {
      setDisplayModel(selectedModel);
    }
  }, [selectedModel]);

  // Slide-up animation
  const translateY = useSharedValue(SCREEN_HEIGHT);

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

  const imageSource: ImageSourcePropType | number =
    displayModel?.imageUrl
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

        {/* Model image */}
        <View style={styles.imageContainer} testID="image-container">
          <Image
            source={imageSource}
            style={styles.image}
            contentFit="cover"
            transition={200}
            testID="model-image"
          />
        </View>

        {/* Footer: page indicator + action buttons */}
        <View style={styles.footer}>
          {/* Page indicator */}
          <View style={styles.pageIndicator} testID="page-indicator">
            <View style={styles.activeLine} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 60,
    height: 100,
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
  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pageIndicator: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  activeLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
