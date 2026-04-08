import React from 'react';
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  BackHandler,
  Alert,
  Dimensions,
  Text,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Shirt, X } from 'lucide-react-native';
import { Colors, Brand } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getWardrobeItemImageUrl } from '@/lib/wardrobe-image';
import type { WardrobeItem } from '@/types/wardrobe';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ClothPopupProps {
  visible: boolean;
  item: WardrobeItem | null;
  source?: ImageSourcePropType;
  onClose: () => void;
  onDelete?: (itemId: string) => void;
  onMakeOutfit?: (item: WardrobeItem) => void;
}

export function ClothPopup({
  visible,
  item,
  source: initialSource,
  onClose,
  onDelete,
  onMakeOutfit,
}: ClothPopupProps) {
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const popupOpacity = useSharedValue(1); // Set to 1 initially for instant appear
  const scale = useSharedValue(0.9);

  const safeClose = React.useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.95, { duration: 150 });
    // Immediately close modal logic
    runOnJS(onClose)();
  }, [onClose, backdropOpacity, scale]);

  // Entrance animation
  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 0.5,
      });
    }
  }, [visible, backdropOpacity, scale]);

  // Back handler
  React.useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      safeClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, safeClose]);

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this clothing item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(item.id) },
      ],
    );
  };

  // Backdrop Styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Resolve which URL to show - prioritize cached images for faster loading
  // Priority: 1) initialSource (pre-loaded image), 2) direct URL (may be cached), 3) proxy URL (fallback)
  let imageSource: ImageSourcePropType | null = initialSource || null;

  if (!imageSource && item) {
    const proxyUrl = getWardrobeItemImageUrl(item);
    imageSource = proxyUrl ? { uri: proxyUrl } : null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={safeClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View className="absolute inset-0" style={backdropStyle}>
        <BlurView
          intensity={60}
          tint="dark"
          className="absolute inset-0"
        >
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.4)', 'rgba(26, 26, 26, 0.6)']}
            className="absolute inset-0"
          />
        </BlurView>
        <Pressable className="absolute inset-0" onPress={safeClose} />
      </Animated.View>

      {/* Popup Card */}
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          className="w-full max-w-[380px] bg-bgSurface rounded-[32px] border border-[#D4C8B8]/30 overflow-hidden p-6 shadow-2xl shadow-black/15"
          style={[popupStyle, { height: SCREEN_HEIGHT * 0.65, elevation: 10 }]}
        >
          <View className="h-8 w-full items-end justify-center mb-2 z-10">
            <View className="z-10">
              <Pressable onPress={safeClose} className="w-8 h-8 rounded-full bg-bgSurfaceRaised items-center justify-center border border-[#D4C8B8]/40">
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Image Container */}
          {item && (
            <View className="flex-1 items-center justify-center mt-3 mb-20">
              <View className="w-full h-full bg-bgSurfaceRaised rounded-3xl p-5 items-center justify-center border border-[#D4C8B8]/20">
                {imageSource ? (
                  <Image
                    source={imageSource}
                    className="w-full h-full"
                    contentFit="contain"
                    transition={0} // Instant when opening from list
                    priority="high"
                    cachePolicy="disk"
                  />
                ) : (
                  <View className="w-full h-full bg-bgMuted" />
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row absolute bottom-6 left-6 right-6 gap-3">
            {/* Delete Button */}
            <Pressable
              onPress={handleDelete}
              className="w-14 h-14 rounded-2xl items-center justify-center bg-[#B85C4A]/10 border-[1.5px] border-[#B85C4A]/20 shadow-md shadow-primary/10"
            >
              <Trash2 size={22} color={Colors.light.stateError} />
            </Pressable>

            {/* Make Outfit Button */}
            <Pressable
              onPress={() => {
                if (item) {
                  onMakeOutfit?.(item);
                }
              }}
              className="flex-1 h-14 bg-primary flex-row rounded-2xl items-center justify-center gap-2.5 shadow-md shadow-primary/10"
            >
              <Shirt size={20} color={Colors.light.textOnDark} />
              <Text className="font-ui text-sm font-medium text-white tracking-widest">Make Outfit</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
