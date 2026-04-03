import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Pressable, StyleSheet, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera as CameraIcon, Check, Image as ImageIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useWardrobeProcessingStore } from '@/lib/store/wardrobe-processing.store';
import { showToast } from '@/components/shared/Toast';
import { Typography } from '@/constants/Typography';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/lib/store/auth.store';
// TODO: Import Gemini tagging when ready: import { tagWardrobeItem } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/wardrobe';
import { uuidv4 } from '@/lib/utils/uuid';

// Origin paths for navigation - defined outside component to avoid ESLint warnings
const ORIGIN_PATHS: Record<string, string> = {
  wardrobe: '/(tabs)/wardrobe',
  inspo: '/(tabs)/inspo',
  outfits: '/(tabs)/outfits',
};

/**
 * Trigger background removal via Go backend (which calls GCP Cloud Run service)
 */
async function triggerBackgroundRemoval(
  itemId: string,
  filePath: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!authToken) {
    console.error('No auth token available for background removal');
    return { success: false, error: 'Authentication required' };
  }
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    // Call Go backend endpoint (not Edge Function)
    const response = await fetch(`${backendUrl}/api/v1/wardrobe/${itemId}/process-rembg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend rembg error:', errorData);
      return { success: false, error: errorData.error || 'Failed to trigger background removal' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to call backend rembg:', error);
    return { success: false, error: 'Network error calling background removal service' };
  }
}

function PreviewSkeleton() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { origin, ts } = useLocalSearchParams<{ origin?: string; ts?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [showUploadScreen, setShowUploadScreen] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
const { addItem, uploadImage, updateItemTags } = useWardrobeStore();
  const { user } = useAuthStore();

  const closeScreen = useCallback(() => {
    const dest = origin ? ORIGIN_PATHS[origin as keyof typeof ORIGIN_PATHS] : ORIGIN_PATHS.wardrobe;
    router.replace(dest as Href);
  }, [origin, router]);

  const goBack = useCallback(() => {
    if (photoUri) {
      setPhotoUri(null);
    } else if (!showUploadScreen) {
      setShowUploadScreen(true);
    } else {
      closeScreen();
    }
  }, [photoUri, showUploadScreen, closeScreen]);

  // Reset state when screen gains focus (also triggers re-animation)
  useFocusEffect(
    useCallback(() => {
      setPhotoUri(null);
      setShowUploadScreen(true);
      setIsProcessing(false);
      setLoadingMessage('Processing...');
      setAnimationKey((k) => k + 1);
    }, [])
  );

  // Handle hardware back button
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
      // Call goBack to respect the origin param
      goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [photoUri, showUploadScreen, goBack]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setPhotoUri(photo.uri);
        }
      } catch (error) {
        console.error('Camera error:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!photoUri || (!user && !__DEV__)) return;

    setIsProcessing(true);
    setLoadingMessage('Uploading image...');

    let newItemId: string | null = null;

    try {
      // Get auth session for Edge Function calls
      const { data: sessionData } = await supabase.auth.getSession();
      let authToken = sessionData?.session?.access_token;

      if (!authToken && __DEV__) {
        // In DEV mode, use the anon key as fallback token for Edge Functions
        authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      }

      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Generate file path for background removal - must match what was uploaded to storage
      const userId = user?.id || 'dev-user';
      const fileExt = photoUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/temp/${fileName}`;

      // Upload to temporary storage and create wardrobe item with processing status
      setLoadingMessage('Saving to wardrobe...');
      const newItem = await addItem({
        image_url: photoUri,
        category: 'tops', // Default to tops during development
        sub_category: null,
        colors: [],
        style_tags: [],
        occasion_tags: [],
        vibe_tags: [],
        fabric_guess: null,
        processing_status: 'processing',
      });
      
      newItemId = newItem.id;

      // Always try background removal (works in DEV mode too with Go backend)
      setLoadingMessage('Removing background...');

      // Trigger background removal via Go backend (which calls GCP Cloud Run)
      const triggerResult = await triggerBackgroundRemoval(newItem.id, filePath, authToken);

      if (!triggerResult.success) {
        console.error('Failed to trigger background removal:', triggerResult.error);
        // Task 1.2: Mark status as failed if trigger fails
        await supabase.from('wardrobe_items').update({ processing_status: 'failed' }).eq('id', newItem.id);
        throw new Error(triggerResult.error || 'Failed to start background removal');
      }

       // Start polling via processing store (handles skeleton and updates automatically)
       const { startProcessing } = useWardrobeProcessingStore.getState();
       startProcessing(newItem.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeScreen();
    } catch (error) {
      console.error('Save error:', error);
      setIsProcessing(false);
      
      // If we created an item but trigger failed, ensure UI reflects failure
      if (newItemId) {
        // We catch the error but the item exists, maybe show a toast
        showToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save item' });
      }
    }
  };

  // 1. Initial Choice Screen
  if (showUploadScreen && !photoUri) {
    return (
      <Animated.View key={animationKey} entering={ZoomIn.duration(350)} style={[styles.uploadContainer, { paddingTop: insets.top }]} >
        <View style={styles.uploadHeader}>
          <Pressable onPress={closeScreen} style={styles.backButton}>
            <X size={24} color={Colors.light.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.uploadContent}>
          <View style={styles.illustrationCard}>
            <View style={styles.illustrationImage}>
              <CameraIcon size={48} color={Colors.light.primary} />
            </View>
          </View>
          <View style={styles.textSection}>
            <Text style={styles.uploadTitle}>Add to your Wardrobe</Text>
            <Text style={styles.uploadSubtitle}>
              Snap a photo or choose from your library to start styling your next look.
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <Pressable style={styles.captureButton} onPress={() => setShowUploadScreen(false)} >
              <CameraIcon size={20} color={Colors.light.textOnDark} />
              <Text style={styles.captureButtonText}>Capture</Text>
            </Pressable>
            <Pressable style={styles.galleryButton} onPress={pickImage} >
              <ImageIcon size={20} color={Colors.light.textPrimary} />
              <Text style={styles.galleryButtonText}>Upload from Gallery</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // 2. Camera View
  if (!showUploadScreen && !photoUri) {
    if (!permission?.granted) {
      return (
        <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
          <Text style={styles.permissionText}>We need camera permission to continue</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={closeScreen} style={{ marginTop: 24 }}>
            <Text style={{ color: Colors.light.textSecondary }}>Cancel</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <View style={[styles.cameraHeader, { paddingTop: insets.top }]}>
          <Pressable onPress={() => setShowUploadScreen(true)} style={styles.headerButton}>
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
      </View>
    );
  }

  // 3. Preview Screen
  if (photoUri) {
    return (
      <View style={[styles.previewContainer, { paddingTop: insets.top }]}>
        <LoadingOverlay visible={isProcessing} message={loadingMessage} />
        <View style={styles.previewHeader}>
          <Pressable onPress={() => setPhotoUri(null)} style={styles.headerButton}>
            <X size={24} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.previewImageContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="cover" />
          {isProcessing && <PreviewSkeleton />}
        </View>
        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.retakeButton} onPress={() => setPhotoUri(null)}>
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
  uploadContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  uploadHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
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
    backgroundColor: Colors.light.bgSurface,
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
    backgroundColor: Colors.light.bgSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  uploadTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
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
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 999,
  },
  captureButtonText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.textOnDark,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.light.bgSurface,
    borderWidth: 1,
    borderColor: Colors.light.navbarBorder,
    paddingVertical: 16,
    borderRadius: 999,
  },
  galleryButtonText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.textPrimary,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  permissionButtonText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.bgSurface,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  cameraTitle: {
    ...Typography.uiLabelMedium,
    color: 'white',
  },
  cameraPreview: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    margin: 40,
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
    color: 'white',
    opacity: 0.8,
  },
  cameraControls: {
    alignItems: 'center',
    paddingVertical: 24,
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
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  previewTitle: {
    ...Typography.uiLabelMedium,
  },
  previewImageContainer: {
    flex: 1,
    aspectRatio: 3 / 4,
    alignSelf: 'center',
    margin: 16,
    borderRadius: 24,
    backgroundColor: 'white',
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: Colors.light.navbarBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    ...Typography.uiLabelMedium,
  },
  saveButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    ...Typography.uiLabelMedium,
    color: 'white',
  },
});