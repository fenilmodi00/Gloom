import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, BackHandler, ScrollView } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { X, Plus, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { SelectItemsSection } from '@/components/wardrobe/outfit-builder/SelectItemsSection';
import { StyleSelector } from '@/components/wardrobe/outfit-builder/StyleSelector';
import { SelectedItemsBar } from '@/components/wardrobe/outfit-builder/SelectedItemsBar';
import { OutfitCombinationsSection } from '@/components/wardrobe/outfit-builder/OutfitCombinationsSection';
import { OutfitBoardSheet } from '@/components/wardrobe/outfit-builder/OutfitBoardSheet';

import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useSelectedItemsArray, useSelectedStyle, useOutfitBuilderStore, useCombinations } from '@/lib/store/outfit-builder.store';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export default function OutfitBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: storeItems } = useWardrobeStore();
  const selectedItemsArray = useSelectedItemsArray();
const selectedStyle = useSelectedStyle();
const openCombinationSheet = useOutfitBuilderStore((s) => s.openCombinationSheet);
const combinations = useCombinations();

  // Use real store items
  const items = storeItems;


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

  // Handle combination card press - navigate to combination screen
  const handleCombinationPress = useCallback((combination: OutfitCombination) => {
    const index = combinations.findIndex(c => c.id === combination.id);
    router.push(`/outfit-combination?index=${index >= 0 ? index : 0}`);
  }, [combinations, router]);



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
    ...Typography.heading2,
    color: THEME.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
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
