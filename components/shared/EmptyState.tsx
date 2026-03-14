import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, Search, Shirt } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle?: string;
  onPress: () => void;
  onSearchPress?: () => void;
  onOutfitPress?: () => void;
}

export function EmptyState({ title, description, buttonTitle = 'Add item', onPress, onSearchPress, onOutfitPress }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <View className="bg-surface p-6 rounded-3xl w-full max-w-sm border border-accent-light/30 shadow-sm flex items-center">
        <View className="w-20 h-20 rounded-full bg-background items-center justify-center mb-6">
          <Shirt size={32} color="#6B6B6B" />
        </View>
        
        <Text className="text-xl font-bold text-text-primary mb-2 text-center">{title}</Text>
        <Text className="text-secondary text-center mb-8">{description}</Text>

        <View className="w-full gap-3">
          <TouchableOpacity 
            onPress={onPress}
            className="bg-text-primary rounded-full py-4 px-6 flex-row items-center justify-center gap-2"
          >
            <Camera size={20} color="#FFFFFF" />
            <Text className="text-surface font-medium">{buttonTitle}</Text>
          </TouchableOpacity>

          {onSearchPress && (
            <TouchableOpacity 
              onPress={onSearchPress}
              className="bg-background rounded-full py-4 px-6 flex-row items-center justify-center gap-2"
            >
              <Search size={20} color="#1A1A1A" />
              <Text className="text-text-primary font-medium">Search web</Text>
            </TouchableOpacity>
          )}

          {onOutfitPress && (
            <TouchableOpacity 
              onPress={onOutfitPress}
              className="border border-accent-light rounded-full py-4 px-6 flex-row items-center justify-center gap-2"
            >
              <Text className="text-accent font-medium">✦ Add items from outfit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
