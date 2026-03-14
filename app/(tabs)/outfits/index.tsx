import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/store/auth.store';
import { useOutfitStore, useOutfits, useOutfitGenerating } from '@/lib/store/outfit.store';
import { generateOutfitSuggestions } from '@/lib/gemini';
import { useWardrobeStore, useWardrobeItems } from '@/lib/store/wardrobe.store';

function OccasionBadge({ occasion }: { occasion: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{occasion}</Text>
    </View>
  );
}

function OutfitCard({ outfit, items }: { outfit: any; items: any[] }) {
  return (
    <View style={styles.outfitCard}>
      <View style={styles.outfitImages}>
        {outfit.item_ids.slice(0, 3).map((itemId: string, index: number) => {
          const item = items.find(i => i.id === itemId);
          return item ? (
            <Image
              key={itemId}
              source={{ uri: item.image_url }}
              style={[
                styles.outfitImage,
                { marginLeft: index > 0 ? -20 : 0, zIndex: 3 - index },
              ]}
            />
          ) : null;
        })}
      </View>
      <View style={styles.outfitInfo}>
        <OccasionBadge occasion={outfit.occasion || 'casual'} />
        <Text style={styles.vibe}>{outfit.vibe}</Text>
        <Text style={styles.reasoning} numberOfLines={2}>
          {outfit.color_reasoning}
        </Text>
      </View>
      <TouchableOpacity style={styles.tryOnButton}>
        <Text style={styles.tryOnText}>Try On</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✨</Text>
      <Text style={styles.emptyTitle}>No outfits yet</Text>
      <Text style={styles.emptySubtitle}>
        Get AI-powered outfit suggestions based on your wardrobe
      </Text>
      <TouchableOpacity style={styles.generateButton} onPress={onGenerate}>
        <Text style={styles.generateButtonText}>Generate Outfits</Text>
      </TouchableOpacity>
    </View>
  );
}

function NoItemsState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👗</Text>
      <Text style={styles.emptyTitle}>Add wardrobe items first</Text>
      <Text style={styles.emptySubtitle}>
        You need items in your wardrobe to get outfit suggestions
      </Text>
    </View>
  );
}

export default function OutfitsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fetchItems, items: wardrobeItems } = useWardrobeStore();
  const { fetchOutfits, generateOutfits, isGenerating } = useOutfitStore();
  const outfits = useOutfits();
  const generating = useOutfitGenerating();

  useEffect(() => {
    if (user?.id) {
      fetchItems(user.id);
      fetchOutfits(user.id);
    }
  }, [user?.id]);

  const handleGenerate = async () => {
    if (wardrobeItems.length === 0) {
      Alert.alert('No Items', 'Add items to your wardrobe first!');
      return;
    }

    try {
      const suggestions = await generateOutfitSuggestions(
        wardrobeItems,
        new Date().toLocaleDateString(),
        'Mumbai',
        'Sunny, 28°C'
      );
      
      // Save suggestions to store (would normally save to DB too)
      // This is a simplified version
      Alert.alert('Success', `Generated ${suggestions.length} outfit suggestions!`);
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('Error', 'Failed to generate outfits. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Outfits</Text>
        <TouchableOpacity
          style={[styles.generateButtonHeader, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || wardrobeItems.length === 0}
        >
          <Text style={styles.generateTextHeader}>
            {isGenerating ? 'Generating...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {wardrobeItems.length === 0 ? (
        <NoItemsState />
      ) : outfits.length === 0 ? (
        <EmptyState onGenerate={handleGenerate} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={wardrobeItems}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#1A1A1A',
    fontStyle: 'italic',
  },
  generateButtonHeader: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateTextHeader: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  outfitImages: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  outfitImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F0EDE8',
  },
  outfitInfo: {
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#D4C5B0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  vibe: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reasoning: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  tryOnButton: {
    backgroundColor: '#8B7355',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tryOnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
