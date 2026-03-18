/**
 * GlassButton - Glassmorphism Button Component
 *
 * A button with glass-like effect using blur and transparency.
 * Used for "Try on" buttons and other overlay actions.
 */
import React from 'react';
import { StyleSheet, Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';

// ============================================================================
// Types
// ============================================================================

export interface GlassButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'light' | 'dark';
}

// ============================================================================
// Component
// ============================================================================

export function GlassButton({
  label,
  icon,
  onPress,
  style,
  textStyle,
  variant = 'dark',
}: GlassButtonProps) {
  const isLight = variant === 'light';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isLight && styles.containerLight,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      {icon && (
        <Text style={[styles.icon, isLight && styles.iconLight]}>
          {icon}
        </Text>
      )}
      <Text style={[styles.label, isLight && styles.labelLight, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 12,
    color: '#333',
  },
  iconLight: {
    color: '#666',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  labelLight: {
    color: '#1A1A1A',
  },
});

export default GlassButton;
