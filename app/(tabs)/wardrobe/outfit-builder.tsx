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
import { THEME } from '@/constants/Colors';


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
      <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Build Outfit</Text>
          <Text style={styles.headerSubtitle}>Mix & match items</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.actionPill}>
            <Pressable onPress={navigateToAddItem} style={styles.pillButton}>
              <Plus size={18} color={THEME.bgSurface} />
            </Pressable>
            <View style={styles.pillDivider} />
            <Pressable onPress={closeScreen} style={styles.pillButton}>
              <X size={18} color={THEME.bgSurface} />
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
          <Sparkles size={20} color={selectedItems.length > 0 ? THEME.bgSurface : THEME.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgCanvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: THEME.bgCanvas,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.textSecondary,
    marginTop: -2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    borderRadius: 22,
    paddingHorizontal: 2,
    paddingVertical: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pillButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  pillDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainContent: {
    flex: 1,
  },
  generateButtonContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  generateButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.goldAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
});