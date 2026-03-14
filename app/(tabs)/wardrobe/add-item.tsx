import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera as CameraIcon, Check } from 'lucide-react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { tagWardrobeItem } from '@/lib/gemini';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';

export default function AddItemScreen() {
  const router = useRouter();
  const { method } = useLocalSearchParams<{ method: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  
  const { addItem } = useWardrobeStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (method === 'gallery' && !photoUri) {
      pickImage();
    }
  }, [method]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      } else {
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
      router.back();
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        if (photo) {
          setPhotoUri(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    if (method === 'gallery') {
      pickImage();
    }
  };

  const handleSave = async () => {
    if (!photoUri || !user) return;
    
    setIsProcessing(true);
    setLoadingMessage('Uploading image...');
    
    try {
      // 1. Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.WARDROBE_IMAGES)
        .upload(fileName, blob, { contentType: 'image/jpeg' });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.WARDROBE_IMAGES)
        .getPublicUrl(fileName);
        
      setLoadingMessage('Analyzing item with AI...');
      
      // We need base64 for Gemini
      const fileData = await fetch(photoUri);
      const fileBlob = await fileData.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const b64 = result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileBlob);
      });
      
      // 2. Tag with Gemini
      const tags = await tagWardrobeItem(base64);
      
      setLoadingMessage('Saving to wardrobe...');
      
      // 3. Save to database
      await addItem({
        image_url: publicUrl,
        category: tags.category,
        sub_category: tags.sub_category,
        colors: tags.colors,
        style_tags: tags.style_tags,
        occasion_tags: tags.occasion_tags,
        fabric_guess: tags.fabric_guess,
      });
      
      router.replace('/(tabs)/wardrobe');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to process and save item.');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <LoadingOverlay message={loadingMessage} />;
  }

  // Camera permissions
  if (method === 'camera' && !photoUri) {
    if (!permission) {
      return <View className="flex-1 bg-black" />;
    }
    if (!permission.granted) {
      return (
        <SafeAreaView className="flex-1 bg-background justify-center items-center px-4">
          <Text className="text-center mb-4">We need your permission to show the camera</Text>
          <Button onPress={requestPermission} className="bg-accent">
            <ButtonText>Grant Permission</ButtonText>
          </Button>
        </SafeAreaView>
      );
    }

    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-row justify-between items-center px-4 py-2 z-10">
            <Pressable onPress={() => router.back()} className="p-2">
              <X size={24} color="white" />
            </Pressable>
            <Text className="text-white font-medium">Add to Wardrobe</Text>
            <View className="w-10" />
          </View>
          
          <View className="flex-1 rounded-3xl overflow-hidden m-4 relative">
            <CameraView 
              ref={cameraRef}
              className="flex-1" 
              facing="back"
            />
            {/* Guide overlay */}
            <View className="absolute inset-0 border-2 border-white/30 rounded-3xl m-10 border-dashed" />
            <Text className="absolute bottom-8 w-full text-center text-white/80 font-medium">
              Position item clearly in frame
            </Text>
          </View>
          
          <View className="flex-row justify-center items-center pb-12 pt-4">
            <Pressable 
              onPress={takePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/50 items-center justify-center"
            >
              <View className="w-16 h-16 rounded-full bg-white" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Preview screen
  if (photoUri) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
         <View className="flex-row justify-between items-center px-4 py-2 z-10">
            <Pressable onPress={() => router.back()} className="p-2">
              <X size={24} className="text-text-primary" />
            </Pressable>
            <Text className="font-medium text-text-primary">Preview</Text>
            <View className="w-10" />
          </View>
          
          <View className="flex-1 p-4">
            <View className="flex-1 rounded-3xl overflow-hidden bg-surface shadow-sm mb-6 relative">
              <Image 
                source={{ uri: photoUri }} 
                className="flex-1"
                contentFit="cover"
              />
            </View>
            
            <View className="flex-row gap-4 mb-4">
              <Button 
                variant="outline" 
                className="flex-1 border-accent"
                onPress={handleRetake}
              >
                <ButtonText className="text-accent">Retake</ButtonText>
              </Button>
              <Button 
                className="flex-1 bg-accent"
                onPress={handleSave}
              >
                <ButtonText>Analyze & Save</ButtonText>
                <ButtonIcon as={Check} className="ml-2 w-4 h-4 text-white" />
              </Button>
            </View>
          </View>
      </SafeAreaView>
    );
  }

  return null;
}
