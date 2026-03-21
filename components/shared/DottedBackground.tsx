import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

export interface DottedBackgroundProps {
  children: React.ReactNode;
  dotColor?: string;
  dotRadius?: number;
  spacing?: number;
  backgroundColor?: string;
}

/**
 * DottedBackground — SVG-based repeating dot pattern.
 *
 * Uses react-native-svg <Pattern> for efficient GPU-rendered dot grid.
 * This replaces the previous synchronous View-mapping approach which
 * rendered 500+ React Native View nodes synchronously, causing JS
 * thread hitches during gesture transitions.
 *
 * The SVG Pattern element handles repetition natively on the GPU,
 * with only 4 SVG elements total regardless of grid size.
 */
export function DottedBackground({
  children,
  dotColor = '#BEBEBE',
  dotRadius = 4,
  spacing = 35,
  backgroundColor = '#EBEBEB',
}: DottedBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* SVG pattern layer — rendered by native GPU, not JS thread */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
      >
        <Defs>
          <Pattern
            id="dotPattern"
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            {/* Background fill */}
            <Rect
              x="0"
              y="0"
              width={spacing}
              height={spacing}
              fill={backgroundColor}
            />
            {/* Dot — centered in each grid cell */}
            <Circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={dotRadius}
              fill={dotColor}
              opacity={0.45}
            />
          </Pattern>
        </Defs>
        {/* Fills the entire area with the dotted pattern */}
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#dotPattern)"
        />
      </Svg>

      {/* Content layer — zIndex above SVG */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
});
