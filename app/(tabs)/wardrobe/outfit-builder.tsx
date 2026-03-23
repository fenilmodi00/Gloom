import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { SelectItemsSection } from '@/components/wardrobe/outfit-builder/SelectItemsSection';
import { SelectedItemsBar } from '@/components/wardrobe/outfit-builder/SelectedItemsBar';
import { StyleSelector } from '@/components/wardrobe/outfit-builder/StyleSelector';
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useSelectedItemsArray, useSelectedStyle } from '@/lib/store/outfit-builder.store';

// Design tokens
const COLORS = {
  brand: '#D0BB95',
  surface: '#FCF9F5',
  textPrimary: '#1c1917',
  textSecondary: '#78716c',
  white: '#FFFFFF',
  primary: '#8B7355',
};

export default function OutfitBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: storeItems } = useWardrobeStore();
  const selectedItems = useSelectedItemsArray();
  const selectedStyle = useSelectedStyle();

  // Use mock data if store is empty
  const items = useMemo(() => {
    return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
  }, [storeItems]);

  // Close screen - navigate back to wardrobe
  const closeScreen = useCallback(() => {
    router.replace('/(tabs)/wardrobe');
  }, [router]);

  // Handle generate outfit - placeholder for now
  const handleGenerateOutfit = useCallback(() => {
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Select at least one item to build an outfit.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // TODO: Implement AI outfit generation using selectedStyle and selectedItems
    Alert.alert(
      'Generate Outfit',
      `Style: ${selectedStyle || 'any'}\nItems: ${selectedItems.length}\n\nAI generation coming soon!`
    );
  }, [selectedItems, selectedStyle]);

  return (
    <View style={styles.container}>
      {/* Transparent top area to show wardrobe index underneath */}
      <View style={styles.backgroundTop} />
      
      {/* Blurred background for content area - overlays wardrobe underneath */}
      <BlurView intensity={25} tint="light" style={styles.backgroundBlur} />

      {/* Close button - outside the rounded card area */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={[styles.closeButtonContainer, { top: insets.top + 8 }]}>
        <Pressable onPress={closeScreen} style={styles.closeButton}>
          <X size={22} color={COLORS.textPrimary} />
        </Pressable>
      </Animated.View>

      {/* Content with rounded edges - like overlay card, using full width */}
      <Animated.View 
        entering={FadeIn.duration(250)} 
        exiting={FadeOut.duration(200)}
        style={[
          styles.content,
          {
            marginHorizontal: 0,
            marginTop: 48, // Space for close button
            marginBottom: 0, // Attached to bottom
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }
        ]}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Build Outfit</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Main content - scrollable item selection */}
        <View style={styles.mainContent}>
          <SelectItemsSection items={items} />
        </View>

        {/* Floating Style Selector - bottom center */}
        <StyleSelector />

        {/* Floating Selected Items Bar - bottom left */}
        <SelectedItemsBar />

        {/* Floating Generate Button - right side bottom */}
        <Animated.View 
          entering={FadeInUp.delay(150).springify()} 
          style={[styles.generateButtonContainer, { bottom: insets.bottom + 16, right: 16 }]}
        >
          <Pressable
            style={[
              styles.generateButton,
              selectedItems.length === 0 && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateOutfit}
            disabled={selectedItems.length === 0}
          >
            <Sparkles size={18} color={selectedItems.length > 0 ? COLORS.white : COLORS.textSecondary} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundTop: {
    height: 48, // Same height as close button area for consistency
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 200,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginTop: 48, // Space for close button
    marginBottom: 0, // Will be set dynamically in JSX
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mainContent: {
    flex: 1,
  },
  generateButtonContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  generateButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
});