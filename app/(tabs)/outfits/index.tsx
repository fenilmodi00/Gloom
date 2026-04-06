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
      <Text style={styles.tagline}>
        Curated styles for your{'\n'}inspired wardrobe
      </Text>

      {/* Stacked card illustration — mimics the Stitch card fan */}
      <View style={styles.cardFan}>
        {/* Back-left card */}
        <View style={[styles.fanCard, styles.fanCardLeft]} />
        {/* Back-right card */}
        <View style={[styles.fanCard, styles.fanCardRight]} />
        {/* Front center card */}
        <View style={[styles.fanCard, styles.fanCardCenter]}>
          <View style={styles.fanCardLabel}>
            <Text style={styles.fanCardLabelSub}>SIGNATURE LOOK</Text>
            <Text style={styles.fanCardLabelTitle}>Modern Classics</Text>
          </View>
        </View>
      </View>

      {/* CTAs */}
      <View className="w-full px-4 mt-8 gap-3">
           {wardrobeItems.length === 0 ? (
             <TouchableOpacity
               style={styles.primaryBtn}
               onPress={() =>
                 router.push({
                   pathname: '/(tabs)/wardrobe/add-item',
                   params: { origin: 'outfits' },
                 })
               }
               activeOpacity={0.85}
             >
               <Feather name="plus" size={18} color={Colors.light.bgCanvas} />
               <Text style={styles.primaryBtnText}>Add items to wardrobe</Text>
             </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={generateSuggestions} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>✦ Generate Outfits</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── MAIN RENDER ────────────────────────────────────────
  if (isLoading && outfits.length === 0) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={{ flex: 1, backgroundColor: Colors.light.bgCanvas, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingOverlay message="Loading outfits..." />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header — Stitch style */}
        <View className="flex-row justify-between items-center px-8 pt-2 pb-4">
          <Text style={styles.headerTitle}>Outfits</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity style={styles.uploadBtn} onPress={() => generateSuggestions()} activeOpacity={0.85}>
              <Feather name="plus" size={16} color={Colors.light.bgCanvas} />
              <Text style={styles.uploadBtnText}>Upload outfit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
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
          <View style={StyleSheet.absoluteFill}>
            <LoadingOverlay message="AI is styling your outfits..." />
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgCanvas,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '600',
    fontStyle: 'italic',
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    color: Colors.light.bgSurface,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  filterBtn: {
    backgroundColor: 'rgba(234, 228, 218, 0.5)', // bgMuted with alpha
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168, 152, 128, 0.1)', // textTertiary with alpha
  },
  tagline: {
    fontSize: 26,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.light.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 28,
  },
  cardFan: {
    width: SCREEN_W * 0.85,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fanCard: {
    position: 'absolute',
    backgroundColor: Colors.light.bgSurface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: Colors.light.bgSurface,
  },
  fanCardLeft: {
    width: 130,
    height: 180,
    left: 10,
    top: 10,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.7,
    backgroundColor: Colors.light.bgSurfaceRaised,
  },
  fanCardRight: {
    width: 135,
    height: 190,
    right: 10,
    top: 20,
    transform: [{ rotate: '6deg' }],
    opacity: 0.7,
    backgroundColor: Colors.light.bgMuted,
  },
  fanCardCenter: {
    width: 230,
    height: 310,
    top: 40,
    backgroundColor: Colors.light.bgSurface,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  fanCardLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  fanCardLabelSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(45, 47, 29, 0.6)',
    textTransform: 'uppercase',
  },
  fanCardLabelTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 999,
    gap: 8,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: {
    color: Colors.light.bgSurface,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
