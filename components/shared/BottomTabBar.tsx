import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  interpolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Aesty-inspired color palette
const COLORS = {
  navBg: '#F5F3ED',
  activeHighlight: '#EBE7DB',
  activeColor: '#8B7355', // Golden accent color
  inactiveColor: 'rgba(45, 47, 29, 0.35)', // Muted dark for inactive
  border: 'rgba(45, 47, 29, 0.05)',
  white: '#FFFFFF',
};

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  'inspo/index': { icon: 'home', label: 'Inspo' },
  'wardrobe/index': { icon: 'grid', label: 'Wardrobe' },
  'outfits/index': { icon: 'heart', label: 'Outfits' },
  'profile/index': { icon: 'user', label: 'Profile' },
};

// Spring config for 60fps smooth animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

function AnimatedTabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
  options
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  options: any;
}) {
  const scale = useSharedValue(1);
  const cfg = TAB_CONFIG[route.name] ?? { icon: 'circle', label: route.name };

  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    // Smoother, bouncy spring transition
    focusProgress.value = withSpring(isFocused ? 1 : 0, {
      damping: 11, // Bouncier to achieve the "10% bounce" causing siblings to shift slightly
      stiffness: 130,
      mass: 0.5,
    });
  }, [isFocused]);

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.92, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const containerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        focusProgress.value,
        [0, 1],
        ['rgba(235, 231, 219, 0)', COLORS.activeHighlight]
      ),
      paddingHorizontal: Math.max(0, interpolate(focusProgress.value, [0, 1], [0, 16])),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(focusProgress.value, [0.3, 1], [0, 1], 'clamp'),
      maxWidth: Math.max(0, interpolate(focusProgress.value, [0, 1], [0, 100])),
      marginLeft: Math.max(0, interpolate(focusProgress.value, [0, 1], [0, 8])),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? cfg.label}
      style={styles.pressable}
    >
      <Animated.View style={[styles.tabItem, containerStyle]}>
        <Feather
          name={cfg.icon}
          size={22}
          color={isFocused ? COLORS.activeColor : COLORS.inactiveColor}
        />
        <Animated.Text
          numberOfLines={1}
          style={[styles.label, textStyle]}
        >
          {cfg.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabRoutes = state.routes.filter((route) => {
    const routeOptions = descriptors[route.key]?.options as { href?: string | null } | undefined;
    return route.name in TAB_CONFIG && routeOptions?.href !== null;
  });

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      pointerEvents="box-none"
    >
      {/* Blur background for frosted glass effect */}
      <BlurView
        intensity={30}
        tint="light"
        style={styles.blurPill}
      >
        <View style={styles.pill}>
          {tabRoutes.map((route) => {
            const originalIndex = state.routes.findIndex((r) => r.name === route.name);
            const isFocused = state.index === originalIndex;
            const { options } = descriptors[route.key];

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

            return (
              <AnimatedTabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                options={options}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  blurPill: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 380,
  },
  pill: {
    backgroundColor: 'rgba(245, 243, 237, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    // NO shadow - removed as requested
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    minHeight: 48,
    minWidth: 48,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.activeColor,
    // Ensure text stays single line
    includeFontPadding: false,
  },
});
