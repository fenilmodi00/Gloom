import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, RefreshControl, 
  Platform, StyleSheet, Dimensions 
} from 'react-native';
import { showToast } from '@/components/shared/Toast';
import Colors from '@/constants/Colors';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../../../lib/store/auth.store';
import { useWardrobeStore } from '../../../lib/store/wardrobe.store';
import { useOutfitStore } from '../../../lib/store/outfit.store';
import { OutfitCard } from '../../../components/outfits/OutfitCard';
import { LoadingOverlay } from '../../../components/shared/LoadingOverlay';
import { supabase } from '../../../lib/supabase';
import { generateOutfitSuggestions } from '../../../lib/gemini';
import { useRouter } from 'expo-router';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
const { width: SCREEN_W } = Dimensions.get('window');

export default function OutfitsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items: wardrobeItems, fetchItems } = useWardrobeStore();
  const { outfits, isLoading, fetchOutfits, addOutfit } = useOutfitStore();
  const { animatedStyle } = useTabAnimation('outfits/index');

  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchOutfits();
  }, [fetchItems, fetchOutfits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchOutfits()]);
    setRefreshing(false);
  }, [fetchItems, fetchOutfits]);

  const generateSuggestions = async () => {
    if (!user?.id) return;

    if (wardrobeItems.length < 3) {
      showToast({ type: 'warning', message: 'Add at least 3 items first' });
      return;
    }

    try {
      setIsGenerating(true);

      const date = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const weather = 'Clear, 28°C';
      const city = 'Mumbai';

      const suggestions = await generateOutfitSuggestions(wardrobeItems, date, weather, city);

      for (const suggestion of suggestions) {
        if (!suggestion) continue;

        const coverItem = wardrobeItems.find((i) => i.id === suggestion.item_ids[0]);

        const { data, error } = await supabase
          .from('outfits')
          .insert({
            user_id: user.id,
            item_ids: suggestion.item_ids,
            occasion: suggestion.occasion,
            vibe: suggestion.vibe,
            color_reasoning: suggestion.color_reasoning,
            ai_score: suggestion.ai_score,
            cover_image_url: coverItem?.image_url || '',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) addOutfit(data);
      }

      showToast({ type: 'success', message: 'New outfits generated!' });
      await fetchOutfits();
    } catch (error: any) {
      showToast({ type: 'error', message: 'Generation failed. Try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── EMPTY STATE ────────────────────────────────────────
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      {/* Cursive tagline — matches Stitch reference */}
      <Text className="text-3xl font-bold italic text-textPrimary text-center leading-[36px] mb-7 font-heading">
        Curated styles for your{'\n'}inspired wardrobe
      </Text>

      {/* Stacked card illustration — mimics the Stitch card fan */}
      <View className="items-center justify-center relative" style={{ width: SCREEN_W * 0.85, height: 400 }}>
        {/* Back-left card */}
        <View className="absolute bg-bgSurfaceRaised rounded-3xl overflow-hidden border-[6px] border-bgSurface opacity-70 w-[130px] h-[180px] left-2.5 top-2.5 -rotate-[8deg]" />
        {/* Back-right card */}
        <View className="absolute bg-bgMuted rounded-3xl overflow-hidden border-[6px] border-bgSurface opacity-70 w-[135px] h-[190px] right-2.5 top-5 rotate-[6deg]" />
        {/* Front center card */}
        <View className="absolute bg-bgSurface rounded-3xl overflow-hidden border-[6px] border-bgSurface w-[230px] h-[310px] top-10 shadow-xl shadow-primary/15" style={{ elevation: 10 }}>
          <View className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-xl py-2.5 px-3.5">
            <Text className="text-[9px] font-bold tracking-[1.5px] text-[#2D2F1D]/60 uppercase font-ui">SIGNATURE LOOK</Text>
            <Text className="text-sm font-semibold italic text-textPrimary mt-0.5 font-heading">Modern Classics</Text>
          </View>
        </View>
      </View>

      {/* CTAs */}
      <View className="w-full px-4 mt-8 gap-3">
           {wardrobeItems.length === 0 ? (
             <TouchableOpacity
               className="flex-row items-center justify-center bg-primary py-4 rounded-full gap-2 shadow-lg shadow-[#8B7355]/25" style={{ elevation: 6 }}
               onPress={() =>
                 router.push({
                   pathname: '/(tabs)/wardrobe/add-item',
                   params: { origin: 'outfits' },
                 })
               }
               activeOpacity={0.85}
             >
               <Feather name="plus" size={18} color={Colors.light.bgCanvas} />
               <Text className="text-bgSurface text-[15px] font-semibold tracking-[0.3px] font-ui">Add items to wardrobe</Text>
             </TouchableOpacity>
        ) : (
          <TouchableOpacity className="flex-row items-center justify-center bg-primary py-4 rounded-full gap-2 shadow-lg shadow-[#8B7355]/25" style={{ elevation: 6 }} onPress={generateSuggestions} activeOpacity={0.85}>
            <Text className="text-bgSurface text-[15px] font-semibold tracking-[0.3px] font-ui">✦ Generate Outfits</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── MAIN RENDER ────────────────────────────────────────
  if (isLoading && outfits.length === 0) {
    return (
      <Animated.View style={animatedStyle} className="flex-1 bg-bgCanvas">
        <View className="flex-1 bg-bgCanvas justify-center items-center">
          <LoadingOverlay message="Loading outfits..." />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle} className="flex-1 bg-bgCanvas">
      <SafeAreaView className="flex-1 bg-bgCanvas" edges={['top']}>
        {/* Header — Stitch style */}
        <View className="flex-row justify-between items-center px-8 pt-2 pb-4">
          <Text className="text-4xl font-semibold italic text-textPrimary tracking-tight font-heading">Outfits</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2.5 rounded-full shadow-md shadow-[#8B7355]/20" style={{ elevation: 4 }} onPress={() => generateSuggestions()} activeOpacity={0.85}>
              <Feather name="plus" size={16} color={Colors.light.bgCanvas} />
              <Text className="text-bgSurface text-xs font-medium tracking-[0.3px] font-ui">Upload outfit</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#EAE4DA]/50 p-2.5 rounded-full border border-[#A89880]/10" activeOpacity={0.7}>
              <Feather name="sliders" size={20} color={Colors.light.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {outfits.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlashList
            data={outfits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OutfitCard outfit={item} />}
            contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.textPrimary} />}
          />
        )}

        {isGenerating && (
          <View className="absolute inset-0 z-50">
            <LoadingOverlay message="AI is styling your outfits..." />
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
