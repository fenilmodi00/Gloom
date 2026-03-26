import React, { useEffect, memo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { View } from 'react-native';
import Colors from '@/constants/Colors';


const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;

export type SkeletonVariant = 'tops' | 'bottoms' | 'shoes' | 'bags' | 'fullbody' | 'outerwear' | 'default';


// ─────────────────────────────────────────────
// Shape Components
// Each receives the shared animatedStyle (opacity shimmer)
// and renders absolutely-positioned pieces inside CARD_WIDTH × CARD_HEIGHT
// ─────────────────────────────────────────────

/** 👕 Shirt – collar + two sleeves + body */
const ShirtShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <>
    {/* Left sleeve */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 16,
          left: 0,
          width: 22,
          height: 24,
          borderRadius: 6,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Right sleeve */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 16,
          right: 0,
          width: 22,
          height: 24,
          borderRadius: 6,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Collar (rounded bottom, sits at very top center) */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: CARD_WIDTH / 2 - 14,
          width: 28,
          height: 20,
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Body */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 30,
          left: 10,
          right: 10,
          bottom: 0,
          borderRadius: 10,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
  </>
);

/** 👖 Pants – waistband + two legs */
const PantsShape = ({ animatedStyle }: { animatedStyle: object }) => {
  const legWidth = Math.floor((CARD_WIDTH - 28) / 2); // 46px each
  return (
    <>
      {/* Waistband */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 8,
            right: 8,
            height: 28,
            borderRadius: 8,
            backgroundColor: Colors.light.bgMuted,
          },
          animatedStyle,
        ]}
      />
      {/* Left leg */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 34,
            left: 8,
            width: legWidth,
            bottom: 0,
            borderRadius: 8,
            backgroundColor: Colors.light.bgMuted,
          },
          animatedStyle,
        ]}
      />
      {/* Right leg */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 34,
            right: 8,
            width: legWidth,
            bottom: 0,
            borderRadius: 8,
            backgroundColor: Colors.light.bgMuted,
          },
          animatedStyle,
        ]}
      />
    </>
  );
};

/** 👟 Shoe – tongue + upper toe box + heel + sole */
const ShoeShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <>
    {/* Tongue */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 8,
          left: 20,
          width: 20,
          height: 18,
          borderRadius: 6,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Toe box / upper */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 22,
          left: 6,
          right: 24,
          height: 54,
          borderRadius: 14,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Heel */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 30,
          right: 6,
          width: 20,
          height: 42,
          borderRadius: 8,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Sole */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 12,
          left: 6,
          right: 6,
          height: 14,
          borderRadius: 7,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
  </>
);

/** 👜 Bag – two straps + strap connector + body */
const BagShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <>
    {/* Left strap */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 24,
          width: 10,
          height: 28,
          borderRadius: 5,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Right strap */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          right: 24,
          width: 10,
          height: 28,
          borderRadius: 5,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Strap top connector */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 24,
          right: 24,
          height: 6,
          borderRadius: 3,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    {/* Bag body */}
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 26,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 12,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
  </>
);

/** 👗 Dress – body + flare */
const DressShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <Animated.View
    style={[
      {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        bottom: 0,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: Colors.light.bgMuted,
      },
      animatedStyle,
    ]}
  />
);

/** 🧥 Jacket – body + central opening line */
const JacketShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <>
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 10,
          right: 10,
          bottom: 0,
          borderRadius: 12,
          backgroundColor: Colors.light.bgMuted,
        },
        animatedStyle,
      ]}
    />
    <View
      style={{
        position: 'absolute',
        top: 20,
        left: CARD_WIDTH / 2 - 1,
        width: 2,
        bottom: 0,
        backgroundColor: Colors.light.bgCanvas,
        opacity: 0.5,
      }}
    />
  </>
);

/** ▭ Default – plain rectangle (fullbody, outerwear, accessories) */
const DefaultShape = ({ animatedStyle }: { animatedStyle: object }) => (
  <Animated.View
    style={[
      {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        backgroundColor: Colors.light.bgMuted,
      },
      animatedStyle,
    ]}
  />
);


// ─────────────────────────────────────────────
// Shape registry
// ─────────────────────────────────────────────

const SHAPE_MAP: Record<
  SkeletonVariant,
  React.ComponentType<{ animatedStyle: object }>
> = {
  tops: ShirtShape,
  bottoms: PantsShape,
  shoes: ShoeShape,
  bags: BagShape,
  fullbody: DressShape,
  outerwear: JacketShape,
  default: DefaultShape,
};


/**
 * SkeletonCard - Shimmer loading placeholder for wardrobe items.
 *
 * @param variant - Shape style matching the clothing category (default: 'default')
 *
 * Shimmer: 1000ms loop, opacity 0.3 → 0.7 → 0.3
 * Color: Colors.light.bgMuted
 */
export const SkeletonCard = memo(function SkeletonCard({
  variant = 'default',
}: {
  variant?: SkeletonVariant;
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  const ShapeComponent = SHAPE_MAP[variant];

  return (
    <View
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginRight: 12 }}
    >
      <ShapeComponent animatedStyle={animatedStyle} />
    </View>
  );
});


export interface WardrobeSkeletonProps {
  count?: number;
  variant?: SkeletonVariant;
}

/**
 * WardrobeSkeleton - Horizontal row of category-shaped skeleton cards.
 *
 * @param count   - Number of cards (default: 4)
 * @param variant - Shape matching the category (default: 'default')
 */
export function WardrobeSkeleton({
  count = 4,
  variant = 'default',
}: WardrobeSkeletonProps) {
  return (
    <View className="flex-row px-4" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`skeleton-${i}`} variant={variant} />
      ))}
    </View>
  );
}

export const SKELETON_CARD_WIDTH = CARD_WIDTH;
export const SKELETON_CARD_HEIGHT = CARD_HEIGHT;
