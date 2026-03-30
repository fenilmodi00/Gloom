import Colors from '@/constants/Colors';
import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon, Rect, Text } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export const SplashScreenAnimation = () => {
  // Shared values for different animation elements
  const swordDraw = useSharedValue(0);
  const penOpacity = useSharedValue(0);
  const clothOpacity = useSharedValue(0);
  const swordRotation = useSharedValue(0);
  const penScale = useSharedValue(0);
  const clothBounce = useSharedValue(0);

  useEffect(() => {
    // Sword drawing animation (simulating drawing a line)
    swordDraw.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );

    // Pen fade in/out
    penOpacity.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );

    // Cloth hanger bounce
    clothBounce.value = withRepeat(
      withTiming(1, { duration: 1800 }),
      -1,
      true
    );

    // Sword rotation
    swordRotation.value = withRepeat(
      withTiming(0.5, { duration: 3000 }),
      -1,
      true
    );

    // Pen scale pulse
    penScale.value = withRepeat(
      withTiming(1, { duration: 2200 }),
      -1,
      true
    );
  }, [swordDraw, penOpacity, clothBounce, swordRotation, penScale]);

  // Animated styles
  const swordStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swordDraw.value, [0, 1], [0.3, 1]),
    transform: [{ rotate: `${swordRotation.value * 360}deg` }],
  }));

  const penStyle = useAnimatedStyle(() => ({
    opacity: penOpacity.value,
    transform: [{ scale: interpolate(penScale.value, [0, 1], [0.8, 1.2]) }],
  }));

  const clothStyle = useAnimatedStyle(() => ({
    opacity: clothOpacity.value,
    transform: [
      { translateY: interpolate(clothBounce.value, [0, 1], [0, -10]) },
    ],
  }));

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.bgCanvas,
      }}
    >
      <View style={{ position: 'relative' }}>
        {/* Sword (representing tailoring/precision) */}
        <Animated.View style={[swordStyle, { position: 'absolute', left: width * 0.3 }]}>
          <Svg width={60} height={80}>
            <Path
              d="M30 10 L30 70 M20 30 L30 20 L40 30"
              stroke={Colors.light.primary}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* Pen (representing design/creation) */}
        <Animated.View style={[penStyle, { position: 'absolute', left: width * 0.5 }]}>
          <Svg width={40} height={60}>
            <Rect x={15} y={10} width={10} height={40}
              fill={Colors.light.primary} rx={2} />
            <Polygon points="15,10 25,10 20,0"
              fill={Colors.light.primary} />
            <Circle cx={20} cy={50} r={3} fill={Colors.light.primary} />
          </Svg>
        </Animated.View>

        {/* Cloth Hanger (representing fabric/clothing) */}
        <Animated.View style={[clothStyle, { position: 'absolute', left: width * 0.7 }]}>
          <Svg width={50} height={70}>
            <Path d="M25 10 L25 60 M15 25 L35 25 M10 40 L40 40"
              stroke={Colors.light.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round" />
            <Path d="M20 30 Q25 20 30 30"
              stroke={Colors.light.primary}
              strokeWidth={2}
              fill="none" />
          </Svg>
        </Animated.View>
      </View>

      {/* App name or logo */}
      <View style={{ marginTop: 40 }}>
        <Svg width={120} height={40}>
          <Text x="50%" y="50%" textAnchor="middle"
            fill={Colors.light.primaryDark}
            fontSize={24}
            fontWeight="600">
            Gloom
          </Text>
        </Svg>
      </View>
    </View>
  );
};