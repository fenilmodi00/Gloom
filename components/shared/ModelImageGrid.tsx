import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ModelImage } from '@/types/model-image';
import { ModelImageCard } from './ModelImageCard';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface Props {
  images: ModelImage[];
  onImagePress?: (image: ModelImage) => void;
  onImageDelete?: (id: string) => void;
}

export function ModelImageGrid({ images, onImagePress, onImageDelete }: Props) {
  if (images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No model images saved yet.</Text>
        <Text style={styles.emptySubtext}>Try on an outfit to save your look!</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {images.map((image) => (
        <View key={image.id} style={styles.gridItem}>
          <ModelImageCard
            image={image}
            onPress={() => onImagePress?.(image)}
            onDelete={onImageDelete}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    ...Typography.bodyMedium,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
