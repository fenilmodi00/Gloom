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
      className="flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-bgMuted"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: image.image_url }}
        className="w-full h-full"
        contentFit="cover"
        transition={200}
      />
      {onDelete && (
        <TouchableOpacity
          className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm shadow-black/10"
          style={{ elevation: 2 }}
          onPress={() => onDelete(image.id)}
        >
          <LucideTrash2 size={20} color={Colors.light.stateError} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
