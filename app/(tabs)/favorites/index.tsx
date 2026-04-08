import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bgCanvas" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3">
        <Text className="text-4xl font-semibold italic text-textPrimary font-heading">Saved</Text>
      </View>
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-6xl mb-4 text-textPrimary opacity-30">♡</Text>
        <Text className="text-4xl font-semibold italic text-textPrimary font-heading">No saved items yet</Text>
        <Text className="text-sm text-textSecondary text-center mt-2 font-body">
          Save your favorite outfits and inspiration
        </Text>
      </View>
    </View>
  );
}
