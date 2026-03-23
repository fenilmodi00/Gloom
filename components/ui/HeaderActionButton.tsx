/**
 * HeaderActionButton
 * 
 * A capsule button that morphs between states:
 * - Default: Shows "+ Add Item" with brown background
 * - Expanded: Shows "Add Item" button + "X" close button
 * 
 * Positioned absolutely to float above the bottom sheet when expanded.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Design tokens
const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  white: '#FFFFFF',
};

interface HeaderActionButtonProps {
  isExpanded: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const HeaderActionButton = React.memo(
  ({ isExpanded, onClose, onOpen }: HeaderActionButtonProps) => {
    const router = useRouter();

    // Animated width for capsule morphing
    const containerStyle = useAnimatedStyle(() => {
      const width = interpolate(
        isExpanded ? 1 : 0,
        [0, 1],
        [120, 200],
        Extrapolate.CLAMP
      );
      return {
        width: withTiming(width, { duration: 250 }),
      };
    });

    // Animated opacity for content transitions
    const defaultContentStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(isExpanded ? 0 : 1, { duration: 200 }),
      };
    });

    const expandedContentStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(isExpanded ? 1 : 0, { duration: 200 }),
      };
    });

    const handleAddItem = () => {
      // Close sheet first, then navigate
      onClose();
      router.push({
        pathname: '/(tabs)/wardrobe/add-item',
        params: { origin: 'wardrobe' },
      });
    };

    return (
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Default state: + Add Item button */}
        <Animated.View style={[styles.defaultContent, defaultContentStyle]}>
          <Pressable onPress={onOpen} style={styles.button} accessibilityLabel="Add Item">
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.buttonText}>Add Item</Text>
          </Pressable>
        </Animated.View>

        {/* Expanded state: Add Item + X */}
        <Animated.View style={[styles.expandedContent, expandedContentStyle]}>
          <Pressable onPress={handleAddItem} style={styles.addButton} accessibilityLabel="Add Item">
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
            <X size={16} color={COLORS.white} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
  },
  defaultContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  expandedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  addButton: {
    flex: 1,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});

export default HeaderActionButton;
