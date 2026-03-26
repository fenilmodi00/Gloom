import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Typography } from '@/constants/Typography';
import { useAuthStore } from '@/lib/store/auth.store';
import { tagWardrobeItem } from '@/lib/gemini';
import type { Category } from '@/types/wardrobe';

// Design tokens from Stitch
const COLORS = {
  brand: '#D0BB95',
  brandLight: '#f5f1e8',
  surface: '#FCF9F5',
  textPrimary: '#1c1917',
  textSecondary: '#78716c',
  white: '#FFFFFF',
  border: '#e7e5e4',
};

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { method, origin, ts } = useLocalSearchParams<{ method: string; origin?: string; ts?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  const { addItem, uploadImage } = useWardrobeStore();
  const { user } = useAuthStore();

  // Show upload screen first (Stitch design) - always show upload screen, let user choose
  const [showUploadScreen, setShowUploadScreen] = useState(true);

  // Reset state ONLY on first mount (key={ts} change = fresh navigation).
  // Does NOT run on router.back() returns — those keep component alive.
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      setPhotoUri(null);
      setShowUploadScreen(true);
    }
  }, []);

  // Handle hardware back button — step back through the add-item flow
  useEffect(() => {
    const backAction = () => {
      if (photoUri) {
        setPhotoUri(null);
        return true;
      }
      if (!showUploadScreen) {
        setShowUploadScreen(true);
        return true;
      }
      // Upload screen: let default back behavior (close to origin)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [photoUri, showUploadScreen]);

  // Go back one step in the add-item flow
  const goBack = () => {
    if (photoUri) {
      // Preview → camera
      setPhotoUri(null);
    } else if (!showUploadScreen) {
      // Camera → upload
      setShowUploadScreen(true);
    } else {
      // Upload → origin tab
      closeScreen();
    }
  };

  // Map origin keys to tab paths — deterministic, no navigation stack dependency
  const ORIGIN_PATHS: Record<string, string> = {
    wardrobe: '/(tabs)/wardrobe',
    inspo: '/(tabs)/inspo',
    outfits: '/(tabs)/outfits',
  };

  // Close: use origin param to directly navigate to the correct tab.
  // This bypasses Expo Router's broken back-stack for hidden tab routes.
  const closeScreen = () => {
    const dest = origin ? ORIGIN_PATHS[origin] : ORIGIN_PATHS.wardrobe;
    router.replace(dest as any);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      } else {
        setShowUploadScreen(true);
      }
    } catch {
      setShowUploadScreen(true);
    }
  };

  const openCamera = () => {
    setShowUploadScreen(false);
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        if (photo) {
          setPhotoUri(photo.uri);
        }
      } catch {
        // Handle error silently
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setShowUploadScreen(true);
  };

  const handleSave = async () => {
    if (!photoUri || !user) return;

    setIsProcessing(true);
    setLoadingMessage('Uploading image...');

    try {
      const publicUrl = await uploadImage(photoUri);


      setLoadingMessage('Analyzing item with AI...');

      const fileData = await fetch(photoUri);
      const fileBlob = await fileData.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const b64 = result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileBlob);
      });

      const tags = await tagWardrobeItem(base64);

      setLoadingMessage('Saving to wardrobe...');

      await addItem({
        image_url: publicUrl,
        category: tags.category as Category,
        sub_category: tags.sub_category,
        colors: tags.colors,
        style_tags: tags.style_tags,
        occasion_tags: tags.occasion_tags,
        fabric_guess: tags.fabric_guess,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeScreen();
    } catch (error) {
      console.error('Error adding item:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <LoadingOverlay message={loadingMessage} />;
  }

  // Stitch-inspired Upload Screen with animated transitions
  if (showUploadScreen && !photoUri) {
    return (
      <Animated.View 
        key={ts}
        entering={ZoomIn.duration(350)}
        style={[styles.uploadContainer, { paddingTop: insets.top }]}
      >
          <View style={styles.uploadHeader}>
            <Pressable onPress={closeScreen} style={styles.backButton}>
              <X size={24} color={COLORS.textPrimary} />
            </Pressable>
        </View>

        <View style={styles.uploadContent}>
          <View style={styles.illustrationCard}>
            <View style={styles.illustrationImage}>
              <CameraIcon size={48} color={COLORS.brand} />
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={styles.uploadTitle}>Add to your Wardrobe</Text>
            <Text style={styles.uploadSubtitle}>
              Snap a photo or choose from your library to start styling your next look.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={styles.captureButton}
              onPress={openCamera}
            >
              <CameraIcon size={20} color="#1c1917" />
              <Text style={styles.captureButtonText}>Capture</Text>
            </Pressable>

            <Pressable
              style={styles.galleryButton}
              onPress={pickImage}
            >
              <ImageIcon size={20} color={COLORS.textPrimary} />
              <Text style={styles.galleryButtonText}>Upload from Gallery</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </Animated.View>
    );
  }

  // Camera Screen with animated transitions
  if (!showUploadScreen && !photoUri) {
    if (!permission) {
      return <View style={styles.cameraContainer} />;
    }
    if (!permission.granted) {
      return (
        <View 
          style={[styles.permissionContainer, { paddingTop: insets.top }]}
        >
          <Text style={styles.permissionText}>We need your permission to show the camera</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Animated.View 
        entering={ZoomIn.duration(350)}
        style={styles.cameraContainer}
      >
          <View style={[styles.cameraHeader, { paddingTop: insets.top }]}>
            <Pressable onPress={goBack} style={styles.headerButton}>
              <X size={24} color="white" />
            </Pressable>
            <Text style={styles.cameraTitle}>Add to Wardrobe</Text>
            <View style={styles.headerButton} />
          </View>

        <View style={styles.cameraPreview}>
          <CameraView ref={cameraRef} style={styles.cameraView} facing="back" />
          <View style={styles.guideOverlay} />
          <Text style={styles.guideText}>Position item clearly in frame</Text>
        </View>

        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={styles.captureButtonOuter} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // Preview Screen with animated transitions
  if (photoUri) {
    return (
      <View 
        style={[styles.previewContainer, { paddingTop: insets.top }]}
      >
        <View style={styles.previewHeader}>
          <Pressable onPress={goBack} style={styles.headerButton}>
            <X size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.previewImageContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="cover" />
        </View>

        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Check size={18} color="white" />
            <Text style={styles.saveButtonText}>Analyze & Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Upload Screen (Stitch-inspired)
  uploadContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  uploadHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },
  uploadContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  illustrationImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  uploadTitle: {
    ...Typography.heading2,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...Typography.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButtons: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  captureButtonText: {
    ...Typography.uiLabelMedium,
    color: COLORS.textPrimary,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  galleryButtonText: {
    ...Typography.uiLabelMedium,
    color: COLORS.textPrimary,
  },

  // Camera Screen
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    ...Typography.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  permissionButtonText: {
    ...Typography.uiLabelMedium,
    color: COLORS.textPrimary,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  cameraTitle: {
    ...Typography.uiLabelMedium,
    color: COLORS.white,
  },
  cameraPreview: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  guideOverlay: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  guideText: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    ...Typography.uiLabelMedium,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },

  // Preview Screen
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewTitle: {
    ...Typography.uiLabelMedium,
    color: COLORS.textPrimary,
  },
  previewImageContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 56,
  },
  retakeButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  retakeButtonText: {
    ...Typography.uiLabelMedium,
    color: COLORS.brand,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    borderRadius: 24,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
    flexShrink: 1,
  },
  saveButtonText: {
    ...Typography.uiLabelMedium,
    color: COLORS.white,
    textAlign: 'center',
  },
});
