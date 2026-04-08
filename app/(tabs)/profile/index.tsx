import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
import Animated from 'react-native-reanimated';
import { useModelImageStore } from '@/lib/store/model-image.store';
import { useEffect } from 'react';
import { ModelImageGrid } from '@/components/shared/ModelImageGrid';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const { images, fetchImages, deleteImage } = useModelImageStore();
  const router = useRouter();
  const { animatedStyle } = useTabAnimation('profile/index');

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <Animated.View style={animatedStyle} className="flex-1 bg-bgCanvas">
      <View className="flex-1 bg-bgCanvas" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3">
        <Text className="text-4xl font-semibold italic text-textPrimary font-heading">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center px-6 pt-6">
          <View className="w-20 h-20 rounded-full bg-primary justify-center items-center mb-4">
          <Text className="text-3xl font-semibold text-white font-ui">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

          <Text className="text-xl font-semibold text-textPrimary mb-1 font-body">
            {user?.name || 'Style Enthusiast'}
          </Text>

          <Text className="text-sm text-textSecondary mb-8 text-center font-body">
            {user?.style_tags?.join(' · ') || 'Setting up your style profile'}
          </Text>
        </View>

        <View className="mt-4 mb-8 px-4">
          <Text className="text-xl font-semibold text-textPrimary mb-4 px-2 font-heading">My Looks</Text>
          <ModelImageGrid
            images={images}
            onImageDelete={deleteImage}
          />
        </View>

        <View className="bg-white rounded-2xl px-4 mx-6 mb-6">
          <TouchableOpacity className="py-4 border-b border-bgMuted">
            <Text className="text-base text-textPrimary font-body">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-bgMuted">
            <Text className="text-base text-textPrimary font-body">Style Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-bgMuted">
            <Text className="text-base text-textPrimary font-body">Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4">
            <Text className="text-base text-textPrimary font-body">Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="py-4 px-8 self-center mb-8" onPress={handleSignOut}>
          <Text className="text-base font-medium text-stateError font-ui">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </Animated.View>
  );
}
