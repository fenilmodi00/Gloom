import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

interface AddItemSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageCaptured: (uri: string) => void;
}

export function AddItemSheet({
  visible,
  onClose,
  onImageCaptured,
}: AddItemSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add items to your wardrobe.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageCaptured(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageCaptured(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <BlurView
          intensity={50}
          tint="dark"
          className="absolute inset-0"
        />
        <Pressable
          className={`bg-background rounded-t-3xl p-5 ${Platform.OS === 'ios' ? 'pb-10' : 'pb-5'}`}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />
          <Text className="text-lg font-semibold text-text-primary mb-6 text-center">
            Add Item
          </Text>

          <Pressable
            onPress={takePhoto}
            disabled={isLoading}
            className="flex-row items-center p-4 bg-surface rounded-xl mb-3"
          >
            <View className="w-10 h-10 bg-accent-light rounded-full items-center justify-center mr-3">
              <Text className="text-xl">📷</Text>
            </View>
            <Text className="text-base text-text-primary">Take a photo</Text>
          </Pressable>

          <Pressable
            onPress={pickFromGallery}
            disabled={isLoading}
            className="flex-row items-center p-4 bg-surface rounded-xl"
          >
            <View className="w-10 h-10 bg-accent-light rounded-full items-center justify-center mr-3">
              <Text className="text-xl">🖼️</Text>
            </View>
            <Text className="text-base text-text-primary">Choose from gallery</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="mt-4 p-4"
          >
            <Text className="text-center text-text-secondary">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
