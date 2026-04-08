import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, BackHandler, ScrollView } from 'react-native';
import { showToast } from '@/components/shared/Toast';
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
      showToast({ type: 'warning', message: 'Select items to build outfit' });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Placeholder alert
    showToast({ 
      type: 'info', 
      message: 'AI styling coming soon' 
    });
  }, [selectedItemsArray, selectedStyle]);

  // Handle combination card press - navigate to combination screen
  const handleCombinationPress = useCallback((combination: OutfitCombination) => {
    const index = combinations.findIndex(c => c.id === combination.id);
    router.push(`/outfit-combination?index=${index >= 0 ? index : 0}`);
  }, [combinations, router]);



  return (
    <View className="flex-1 bg-bgCanvas">
      {isVisible && (
        <Animated.View
          entering={FadeInDown.springify().mass(1).damping(18)}
          exiting={FadeOutDown.springify().mass(1).damping(18)}
          className="absolute inset-0"
        >
          {/* Header */}
          <View className="flex-row items-center px-5 pb-4 bg-bgCanvas" style={{ paddingTop: insets.top + 8 }}>
            <View className="flex-1 justify-center">
              <Text className="font-heading text-2xl text-textPrimary">Build Outfit</Text>
              <Text className="font-body text-xs text-textSecondary -mt-0.5">Mix & match items</Text>
            </View>
            <View className="items-end justify-center">
              <View className="flex-row items-center bg-primary rounded-full px-0.5 py-0.5 shadow-md shadow-primary/20" style={{ elevation: 4 }}>
                <Pressable onPress={navigateToAddItem} className="w-10 h-9 items-center justify-center rounded-full">
                  <Plus size={18} color={THEME.bgSurface} />
                </Pressable>
                <View className="w-px h-3.5 bg-white/20" />
                <Pressable onPress={closeScreen} className="w-10 h-9 items-center justify-center rounded-full">
                  <X size={18} color={THEME.bgSurface} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Main content - scrollable item selection + combinations */}
          <View className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 140 }}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
            >


              {/* Item selection by category */}
              <SelectItemsSection items={items} />

              {/* Outfit combinations section - appears below categories */}
              <View className="mt-2">
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
            className="absolute z-50"
            style={{ bottom: insets.bottom || 16, right: 16 }}
          >
            <Pressable
              className={`w-16 h-16 rounded-full items-center justify-center shadow-lg ${selectedItemsArray.length === 0 ? 'bg-bgMuted shadow-transparent' : 'bg-[#D4AF37] shadow-[#D4AF37]/40'}`}
              style={selectedItemsArray.length > 0 ? { elevation: 8 } : { elevation: 0 }}
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
