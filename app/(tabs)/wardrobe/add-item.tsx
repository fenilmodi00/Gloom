import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera as CameraIcon, Check, Image as ImageIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useWardrobeProcessingStore } from '@/lib/store/wardrobe-processing.store';

const ORIGIN_PATHS: Record<string, string> = {
  wardrobe: '/(tabs)/wardrobe',
  inspo: '/(tabs)/inspo',
  outfits: '/(tabs)/outfits',
};

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [showUploadScreen, setShowUploadScreen] = useState(true);
  const { addItem } = useWardrobeStore();
  const { startProcessing } = useWardrobeProcessingStore();

  useEffect(() => {
    setPhotoUri(null);
    setShowUploadScreen(true);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (photoUri) { setPhotoUri(null); return true; }
      if (!showUploadScreen) { setShowUploadScreen(true); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [photoUri, showUploadScreen]);

  const closeScreen = () => {
    const dest = origin ? ORIGIN_PATHS[origin as keyof typeof ORIGIN_PATHS] : ORIGIN_PATHS.wardrobe;
    router.replace(dest as Href);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    } catch (error) { console.error('Gallery error:', error); }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (photo) setPhotoUri(photo.uri);
    } catch (error) { console.error('Camera error:', error); }
  };

  const handleSave = async () => {
    if (!photoUri) return;
    setIsProcessing(true);
    setLoadingMessage('Uploading image...');
    try {
      setLoadingMessage('Saving to wardrobe...');
      const newItem = await addItem({
        image_url: photoUri, category: 'tops', sub_category: null, colors: [],
        style_tags: [], occasion_tags: [], vibe_tags: [], fabric_guess: null, processing_status: 'processing',
      });
      startProcessing(newItem.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeScreen();
    } catch (error) {
      console.error('Save error:', error);
      setIsProcessing(false);
    }
  };

  // Initial Choice Screen
  if (showUploadScreen && !photoUri) {
    return (
      <Animated.View entering={ZoomIn.duration(350)} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="px-6 py-4">
          <Pressable onPress={closeScreen} className="p-2 -ml-2"><X size={24} className="text-text-primary" /></Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-full max-w-[280px] bg-surface rounded-2xl p-4 mb-10 shadow-sm">
            <View className="w-full aspect-[3/4] rounded-xl bg-surface-raised items-center justify-center">
              <CameraIcon size={48} color="#8B7355" />
            </View>
          </View>
          <View className="items-center mb-10">
            <Text className="text-2xl font-bold tracking-tight text-text-primary text-center mb-3">Add to your Wardrobe</Text>
            <Text className="text-base text-text-secondary text-center">Snap a photo or choose from your library to start styling your next look.</Text>
          </View>
          <View className="w-full max-w-[320px] gap-4">
            <Pressable onPress={() => setShowUploadScreen(false)} className="flex-row items-center justify-center gap-3 bg-primary py-4 rounded-full">
              <CameraIcon size={20} color="#1c1917" />
              <Text className="font-medium text-text-primary">Capture</Text>
            </Pressable>
            <Pressable onPress={pickImage} className="flex-row items-center justify-center gap-3 bg-surface border border-navbar-border py-4 rounded-full">
              <ImageIcon size={20} className="text-text-primary" />
              <Text className="font-medium text-text-primary">Upload from Gallery</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Camera View
  if (!showUploadScreen && !photoUri) {
    if (!permission?.granted) {
      return (
        <View className="flex-1 bg-background justify-center items-center p-8" style={{ paddingTop: insets.top }}>
          <Text className="text-base text-center mb-6">We need camera permission to continue</Text>
          <Pressable onPress={requestPermission} className="bg-primary py-3.5 px-7 rounded-full">
            <Text className="font-medium text-surface">Grant Permission</Text>
          </Pressable>
          <Pressable onPress={closeScreen} className="mt-6"><Text className="text-text-secondary">Cancel</Text></Pressable>
        </View>
      );
    }
    return (
      <View className="flex-1 bg-black">
        <View className="flex-row justify-between items-center px-4" style={{ paddingTop: insets.top }}>
          <Pressable onPress={() => setShowUploadScreen(true)} className="p-2 w-10"><X size={24} color="white" /></Pressable>
          <Text className="font-medium text-white">Add to Wardrobe</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 m-4 rounded-3xl overflow-hidden">
          <CameraView ref={cameraRef} className="flex-1" facing="back" />
          <View className="absolute inset-10 border-2 border-white/30 border-dashed rounded-2xl" />
          <Text className="absolute bottom-8 left-0 right-0 text-center text-white/80">Position item clearly in frame</Text>
        </View>
        <View className="items-center py-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <Pressable onPress={takePhoto} className="w-20 h-20 rounded-full border-4 border-white/50 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-white" />
          </Pressable>
        </View>
      </View>
    );
  }

  // Preview Screen
  if (photoUri) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <LoadingOverlay visible={isProcessing} message={loadingMessage} />
        <View className="flex-row justify-between items-center px-4">
          <Pressable onPress={() => setPhotoUri(null)} className="p-2 w-10"><X size={24} className="text-text-primary" /></Pressable>
          <Text className="font-medium">Preview</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 m-4 rounded-3xl bg-white overflow-hidden">
          <Image source={{ uri: photoUri }} className="flex-1" contentFit="cover" />
        </View>
        <View className="flex-row px-4 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable onPress={() => setPhotoUri(null)} className="flex-1 h-14 rounded-[27px] border border-navbar-border items-center justify-center">
            <Text className="font-medium">Retake</Text>
          </Pressable>
          <Pressable onPress={handleSave} className="flex-[1.5] h-14 rounded-[27px] bg-primary flex-row items-center justify-center gap-2">
            <Check size={18} color="white" />
            <Text className="font-medium text-white">Analyze & Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}
