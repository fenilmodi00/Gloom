/**
 * BottomContentFade - Fade gradient at bottom of scrollable content
 * 
 * Positioned absolutely at the bottom of the screen,
 * above the floating tab bar, to create smooth fade effect.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

// Fade extends from tab bar upward into content
const FADE_HEIGHT = 90;

// Tab bar is at bottom: 6, so fade starts just below it (after the pill ends)
const TAB_BAR_OFFSET = 6;

export function BottomContentFade() {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
        { 
          // Position at the very bottom of screen (below tab bar)
          bottom: 0,
          // Below tab bar in z-order (tab bar is zIndex: 50)
          zIndex: 49,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', Colors.light.bgCanvas]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
  },
  gradient: {
    flex: 1,
  },
});
