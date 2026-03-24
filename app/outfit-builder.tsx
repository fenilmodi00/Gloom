import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, BackHandler, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { X, Sparkles, Plus, Maximize2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { SelectItemsSection } from '@/components/wardrobe/outfit-builder/SelectItemsSection';
import { StyleSelector } from '@/components/wardrobe/outfit-builder/StyleSelector';
import { SelectedItemsBar } from '@/components/wardrobe/outfit-builder/SelectedItemsBar';
import { OutfitCombinationsSection } from '@/components/wardrobe/outfit-builder/OutfitCombinationsSection';
import { OutfitBoardSheet } from '@/components/wardrobe/outfit-builder/OutfitBoardSheet';
import { OutfitBoard } from '@/components/outfit-board';
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useSelectedItemsArray, useSelectedStyle, useOutfitBuilderStore, useSelectedItems } from '@/lib/store/outfit-builder.store';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';


import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export default function OutfitBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { items: storeItems } = useWardrobeStore();
  const selectedItemsArray = useSelectedItemsArray();
  const selection = useSelectedItems();
  const selectedStyle = useSelectedStyle();
  const openCombinationSheet = useOutfitBuilderStore((s) => s.openCombinationSheet);

  // Use mock data if store is empty
  const items = useMemo(() => {
    return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
  }, [storeItems]);


  const [isVisible, setIsVisible] = React.useState(true);

  // Close screen - navigate back
  const closeScreen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible(false);
    // Delay the actual navigation until the animation completes
    setTimeout(() => {
      router.back();
    }, 400);
  }, [router]);

  const navigation = useNavigation();

  // Handle hardware back button and native gestures
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If we're already closing via our custom logic, let the removal happen
      if (!isVisible) {
        return;
      }

      // Prevent immediate removal
      e.preventDefault();

      // Trigger our custom close logic which includes animation
      closeScreen();
    });

    return unsubscribe;
  }, [navigation, isVisible, closeScreen]);

  // Android hardware back - also covered by beforeRemove but good to have explicit handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        closeScreen();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [closeScreen])
  );

  // Navigate to add-item screen
  const navigateToAddItem = useCallback(() => {
    router.push('/(tabs)/wardrobe/add-item');
  }, [router]);

  // Handle generate outfit
  const handleGenerateOutfit = useCallback(() => {
    if (selectedItemsArray.length === 0) {
      Alert.alert('No items selected', 'Select at least one item to build an outfit.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Placeholder alert
    Alert.alert(
      'Generate Outfit',
      `Style: ${selectedStyle || 'any'}\nItems: ${selectedItemsArray.length}\n\nAI generation coming soon!`
    );
  }, [selectedItemsArray, selectedStyle]);

  // Handle combination card press - open full board sheet
  const handleCombinationPress = useCallback((combination: OutfitCombination) => {
    openCombinationSheet(combination);
  }, [openCombinationSheet]);

  const BOARD_WIDTH = screenWidth - 32;
  const BOARD_HEIGHT = BOARD_WIDTH * 1.25;

  return (
    <View style={styles.container}>
      {isVisible && (
        <Animated.View
          entering={FadeInDown.springify().mass(1).damping(18)}
          exiting={FadeOutDown.springify().mass(1).damping(18)}
          style={StyleSheet.absoluteFill}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
          </View>

          {/* Main content - scrollable item selection + combinations */}
          <View style={styles.mainContent}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 140 }
              ]}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
            >
              {/* Live Preview Board */}
              <View style={styles.boardPreviewContainer}>
                <Pressable 
                  onPress={() => openCombinationSheet({ id: 'live', selection, matchScore: 100 })}
                  style={({ pressed }) => [
                    styles.boardPressable,
                    pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }
                  ]}
                >
                  <OutfitBoard 
                    selection={selection} 
                    width={BOARD_WIDTH} 
                    height={BOARD_HEIGHT}
                  />
                  
                  {/* Overlay indicators */}
                  <View style={styles.boardOverlay}>
                    <View style={styles.liveBadge}>
                      <Sparkles size={12} color={THEME.goldAccent} />
                      <Text style={styles.liveBadgeText}>LIVE PREVIEW</Text>
                    </View>
                    <View style={styles.expandButton}>
                      <Maximize2 size={16} color={THEME.textSecondary} />
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Item selection by category */}
              <SelectItemsSection items={items} />

              {/* Outfit combinations section - appears below categories */}
              <View style={styles.combinationsContainer}>
                <OutfitCombinationsSection
                  items={items}
                  onCombinationPress={handleCombinationPress}
                />
              </View>
            </ScrollView>
          </View>

          {/* Floating Style Selector - bottom center */}
          <StyleSelector />

          {/* Floating Selected Items Bar - bottom left */}
          <SelectedItemsBar />

          {/* Floating Generate Button - right side bottom */}
          <View
            style={[styles.generateButtonContainer, { bottom: insets.bottom || 16, right: 16 }]}
          >
            <Pressable
              style={[
                styles.generateButton,
                selectedItemsArray.length === 0 && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerateOutfit}
              disabled={selectedItemsArray.length === 0}
            >
              <Sparkles size={24} color={selectedItemsArray.length > 0 ? THEME.bgSurface : THEME.textSecondary} />
            </Pressable>
          </View>

          {/* Outfit Board Sheet - opens when combination card is tapped */}
          <OutfitBoardSheet />
        </Animated.View>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  boardPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  boardPressable: {
    backgroundColor: THEME.bgSurface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: THEME.bgMuted,
  },
  boardOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    pointerEvents: 'none',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.bgMuted,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: 0.5,
  },
  expandButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.bgMuted,
  },
  combinationsContainer: {
    marginTop: 8,
  },
  generateButtonContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  generateButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.goldAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.goldAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    backgroundColor: THEME.bgMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
});
