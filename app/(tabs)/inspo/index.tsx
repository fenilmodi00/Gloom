import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Hardcoded trending data
const TRENDING_SECTIONS = [
  {
    id: '1',
    title: 'Leather Trench',
    items: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
      'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=400',
    ],
  },
  {
    id: '2',
    title: 'Minimalist Whites',
    items: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    ],
  },
  {
    id: '3',
    title: 'Festival Ready',
    items: [
      'https://images.unsplash.com/photo-1583847661594-9c7e5547a70a?w=400',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
      'https://images.unsplash.com/photo-1610189012906-2c8a2be2f14c?w=400',
    ],
  },
];

function InspoCard({ image, onTryOn }: { image: string; onTryOn: () => void }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" />
      <TouchableOpacity style={styles.tryOnButton} onPress={onTryOn}>
        <Text style={styles.tryOnText}>✦ Try On</Text>
      </TouchableOpacity>
    </View>
  );
}

function TrendingSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionContent}
      >
        {items.map((item, index) => (
          <InspoCard key={index} image={item} onTryOn={() => {}} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function InspoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspo</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRENDING_SECTIONS.map((section) => (
          <TrendingSection key={section.id} title={section.title} items={section.items} />
        ))}
      </ScrollView>
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
  uploadButton: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tryOnButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tryOnText: {
    color: '#8B7355',
    fontWeight: '600',
    fontSize: 14,
  },
});
