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
      <View className="p-8 items-center justify-center">
        <Text className="text-lg font-body text-textPrimary mb-2">No model images saved yet.</Text>
        <Text className="text-sm font-body text-textSecondary text-center">Try on an outfit to save your look!</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap p-2">
      {images.map((image) => (
        <View key={image.id} className="w-1/2 p-2">
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
