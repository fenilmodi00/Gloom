import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ModelImage } from '@/types/model-image';
import Colors from '@/constants/Colors';
import { LucideTrash2 } from 'lucide-react-native';

interface Props {
  image: ModelImage;
  onPress?: () => void;
  onDelete?: (id: string) => void;
}

export function ModelImageCard({ image, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: image.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(image.id)}
        >
          <LucideTrash2 size={20} color={Colors.light.stateError} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.bgMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
