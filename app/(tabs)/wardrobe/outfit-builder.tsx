import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Sparkles, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { SelectItemsSection } from '@/components/wardrobe/outfit-builder/SelectItemsSection';
import { SelectedItemsBar } from '@/components/wardrobe/outfit-builder/SelectedItemsBar';
import { StyleSelector } from '@/components/wardrobe/outfit-builder/StyleSelector';
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useSelectedItemsArray, useSelectedStyle } from '@/lib/store/outfit-builder.store';

// Design tokens from AGENTS.md
const COLORS = {
  primary: '#8B7355',
  background: '#F5F2EE',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  brand: '#8B7355',
  brandLight: '#D4C5B0',
  white: '#FFFFFF',
  error: '#C0392B',
  success: '#27AE60',
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

  // Navigate to add-item screen
  const navigateToAddItem = useCallback(() => {
    router.push('/(tabs)/wardrobe/add-item');
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
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Build Outfit</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.actionPill}>
            <Pressable onPress={navigateToAddItem} style={styles.pillButton}>
              <Plus size={20} color={COLORS.white} />
            </Pressable>
            <View style={styles.pillDivider} />
            <Pressable onPress={closeScreen} style={styles.pillButton}>
              <X size={20} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Main content - scrollable item selection */}
      <View style={styles.mainContent}>
        <SelectItemsSection items={items} />
      </View>

      {/* Floating Style Selector - bottom center */}
      <StyleSelector />

      {/* Floating SelectedItemsBar - bottom left */}
      <SelectedItemsBar />

      {/* Floating Generate Button - right side bottom */}
      <Animated.View 
        entering={FadeInUp.delay(150).springify()} 
        style={[styles.generateButtonContainer, { bottom: insets.bottom || 16, right: 16 }]}
      >
        <Pressable
          style={[
            styles.generateButton,
            selectedItems.length === 0 && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateOutfit}
          disabled={selectedItems.length === 0}
        >
          <Sparkles size={20} color={selectedItems.length > 0 ? COLORS.white : COLORS.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pillButton: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  pillDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 0,
  },
  mainContent: {
    flex: 1,
  },
  generateButtonContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  generateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
});