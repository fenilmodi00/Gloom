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
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView
          intensity={60}
          tint="dark"
          style={StyleSheet.absoluteFill}
        >
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.4)', 'rgba(26, 26, 26, 0.6)']}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
        <Pressable style={StyleSheet.absoluteFill} onPress={safeClose} />
      </Animated.View>

      {/* Popup Card */}
      <View style={styles.container}>
        <Animated.View style={[styles.popupCard, popupStyle]}>
          <View style={styles.cardHeader}>
            <View style={styles.closeButtonContainer}>
              <Pressable onPress={safeClose} style={styles.closeButton}>
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Image Container */}
          {item && (
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                {imageSource ? (
                  <Image
                    source={imageSource}
                    style={styles.clothingImage}
                    contentFit="contain"
                    transition={0} // Instant when opening from list
                    priority="high"
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={[styles.clothingImage, styles.placeholderImage]} />
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Delete Button */}
            <Pressable
              onPress={handleDelete}
              style={[
                styles.actionButton,
                styles.deleteButton,
              ]}
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
              style={[
                styles.actionButton,
                styles.makeOutfitButton,
              ]}
            >
              <Shirt size={20} color={Colors.light.textOnDark} />
              <Text style={styles.buttonText}>Make Outfit</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 380,
    height: SCREEN_HEIGHT * 0.65, // Rectangular profile
    backgroundColor: Colors.light.bgSurface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 200, 184, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    padding: 24,
  },
  cardHeader: {
    height: 32,
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closeButtonContainer: {
    zIndex: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.bgSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 200, 184, 0.4)',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 80, // Space for action buttons
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.bgSurfaceRaised,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 200, 184, 0.2)',
  },
  clothingImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.light.bgMuted,
  },
  actionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  deleteButton: {
    width: 56,
    backgroundColor: 'rgba(184, 92, 74, 0.1)', // Feedback.stateError with opacity
    borderWidth: 1.5,
    borderColor: 'rgba(184, 92, 74, 0.2)',
  },
  makeOutfitButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.textOnDark,
    letterSpacing: 1,
  },
});
