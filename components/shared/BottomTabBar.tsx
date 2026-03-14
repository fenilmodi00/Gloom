import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

// Tab config — map route name → icon (Material Symbols name) + label
const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  inspo: { icon: 'home', label: 'Home' },
  wardrobe: { icon: 'search', label: 'Search' },
  outfits: { icon: 'dresser', label: 'Outfits' },
  favorites: { icon: 'favorite', label: 'Saved' },
  profile: { icon: 'person', label: 'Profile' },
};

// We embed Material Symbols as a ligature-based font text on web/Android.
// On iOS we use expo-symbols; here we use a simple text icon fallback for
// cross-platform compatibility without adding a new native dependency.
const EMOJI_FALLBACK: Record<string, string> = {
  home: '⌂',
  search: '🔍',
  dresser: '👗',
  favorite: '♥',
  person: '👤',
};

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      {/* Frosted glass container using expo-blur */}
      <BlurView
        intensity={80}
        tint="light"
        style={styles.blurContainer}
      >
        <View style={styles.pill}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const cfg = TAB_CONFIG[route.name] ?? { icon: 'home', label: route.name };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            if (isFocused) {
              // Active: pill-within-pill with label
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? cfg.label}
                  style={styles.activePill}
                >
                  <Text style={styles.activeIcon}>{EMOJI_FALLBACK[cfg.icon] ?? '•'}</Text>
                  <Text style={styles.activeLabel}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: false }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? cfg.label}
                style={styles.iconBtn}
              >
                <Text style={styles.inactiveIcon}>{EMOJI_FALLBACK[cfg.icon] ?? '•'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Transparent — pill floats over content
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    maxWidth: 380,
    backgroundColor: 'rgba(245, 243, 237, 0.85)',
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 12,
    // Subtle border + shadow matching Aesty design
    borderWidth: 1,
    borderColor: 'rgba(45,47,29,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  inactiveIcon: {
    fontSize: 20,
    opacity: 0.4,
    color: '#2D2F1D',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBE7DB',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    // inner shadow via shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  activeIcon: {
    fontSize: 18,
    color: '#2D2F1D',
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#2D2F1D',
  },
});
