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
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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
      onClose();
      router.push({
        pathname: '/(tabs)/wardrobe/add-item',
        params: { origin: 'wardrobe' },
      });
    };

    return (
      <Animated.View 
        className="h-10 rounded-full bg-primary overflow-hidden shadow-sm"
        style={containerStyle}
      >
        {/* Default state: + Add Item button */}
        <Animated.View 
          className="absolute inset-0"
          style={defaultContentStyle}
        >
          <Pressable 
            onPress={onOpen} 
            className="flex-1 flex-row items-center justify-center px-4 gap-1.5"
            accessibilityLabel="Add Item"
          >
            <Plus size={18} color="white" />
            <Text className="text-white text-[14px] font-ui uppercase">Add Item</Text>
          </Pressable>
        </Animated.View>

        {/* Expanded state: Add Item + X */}
        <Animated.View 
          className="absolute inset-0 flex-row items-center pl-1"
          style={expandedContentStyle}
        >
          <Pressable 
            onPress={handleAddItem} 
            className="flex-1 h-8 bg-primaryDark rounded-full items-center justify-center mr-1"
            accessibilityLabel="Add Item"
          >
            <Text className="text-white text-[13px] font-ui uppercase">Add Item</Text>
          </Pressable>
          <Pressable 
            onPress={onClose} 
            className="w-8 h-8 rounded-full bg-primaryDark items-center justify-center mr-1"
            accessibilityLabel="Close"
          >
            <X size={16} color="white" />
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }
);

export default HeaderActionButton;
