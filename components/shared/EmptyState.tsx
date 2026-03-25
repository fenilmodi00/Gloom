import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, Search, Sparkles } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle?: string;
  onPress: () => void;
  onSearchPress?: () => void;
  onOutfitPress?: () => void;
}

export function EmptyState({
  title,
  description,
  buttonTitle = 'Add item',
  onPress,
  onSearchPress,
  onOutfitPress,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-bgCanvas">
      <View className="bg-white py-10 px-7 rounded-[28px] w-full max-w-[340px] items-center shadow-sm">
        {/* Icon */}
        <View className="w-[72px] h-[72px] rounded-full bg-bgCanvas items-center justify-center mb-5">
          <Text className="text-3xl font-body">👕</Text>
        </View>

        {/* Text */}
        <Text className="text-lg font-heading text-textPrimary text-center mb-2 tracking-tight">
          {title}
        </Text>
        <Text className="text-sm font-normal text-textSecondary text-center leading-5 mb-7 font-body">
          {description}
        </Text>

        {/* Buttons */}
        <View className="w-full gap-2.5">
          <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-center bg-textPrimary py-[15px] px-6 rounded-full gap-2"
            activeOpacity={0.8}
          >
            <Camera size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-heading text-white">{buttonTitle}</Text>
          </TouchableOpacity>

          {onSearchPress && (
            <TouchableOpacity
              onPress={onSearchPress}
              className="flex-row items-center justify-center bg-bgCanvas py-[15px] px-6 rounded-full gap-2"
              activeOpacity={0.8}
            >
              <Search size={18} color="#1A1A1A" />
              <Text className="text-[15px] font-ui uppercase text-textPrimary">Search web</Text>
            </TouchableOpacity>
          )}

          {onOutfitPress && (
            <TouchableOpacity
              onPress={onOutfitPress}
              className="flex-row items-center justify-center border border-accent-light py-[15px] px-6 rounded-full gap-2"
              activeOpacity={0.8}
            >
              <Sparkles size={18} color="#8B7355" />
              <Text className="text-[15px] font-ui uppercase text-primary">Add items from outfit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
