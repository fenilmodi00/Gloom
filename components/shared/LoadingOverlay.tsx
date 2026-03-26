import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { BlurView } from 'expo-blur';

export function LoadingOverlay({ visible, message = "Loading..." }: { visible?: boolean, message?: string }) {
  if (!visible) return null;
  return (
    <View className="absolute inset-0 z-50">
      <BlurView 
        intensity={30} 
        tint="light" 
        className="flex-1 items-center justify-center"
      >
        <View className="bg-surface px-8 py-6 rounded-3xl shadow-sm items-center border border-accent-light/30">
          <ActivityIndicator size="large" color="#8B7355" className="mb-4" />
          <Text className="text-text-primary font-product">{message}</Text>
        </View>
      </BlurView>
    </View>
  );
}
