/**
 * GlassButton - Glassmorphism Button Component
 *
 * A button with glass-like effect using blur and transparency.
 * Used for "Try on" buttons and other overlay actions.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

export interface GlassButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export function GlassButton({
  label,
  icon,
  onPress,
  className = '',
  variant = 'dark',
}: GlassButtonProps) {
  const isLight = variant === 'light';

  return (
    <Pressable
      onPress={onPress}
      className={`overflow-hidden rounded-full shadow-sm ${className}`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <BlurView
        intensity={isLight ? 40 : 60}
        tint={isLight ? 'light' : 'dark'}
        className="flex-row items-center justify-center py-2.5 px-5 gap-1.5 bg-white/10"
      >
        {icon && (
          <Text className={`text-[12px] ${isLight ? 'text-textSecondary' : 'text-white'}`}>
            {icon}
          </Text>
        )}
        <Text className={`text-[14px] font-semibold ${isLight ? 'text-textPrimary' : 'text-white'}`}>
          {label}
        </Text>
      </BlurView>
    </Pressable>
  );
}

export default GlassButton;
