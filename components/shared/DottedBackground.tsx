import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

export interface DottedBackgroundProps {
  children: React.ReactNode;
  dotColor?: string;
  dotRadius?: number;
  spacing?: number;
  backgroundColor?: string;
}

export function DottedBackground({
  children,
  dotColor = '#BEBEBE',
  dotRadius = 5,
  spacing = 35,
  backgroundColor = '#EBEBEB',
}: DottedBackgroundProps) {
  return (
    <View className="flex-1 w-full h-full relative" style={{ backgroundColor }}>
      <View className="absolute inset-0">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="dottedPattern"
              x="0"
              y="0"
              width={spacing}
              height={spacing}
              patternUnits="userSpaceOnUse"
            >
              <Circle
                cx={spacing / 2}
                cy={spacing / 2}
                r={dotRadius}
                fill={dotColor}
                fillOpacity={0.05}
              />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dottedPattern)" />
        </Svg>
      </View>
      <View className="relative flex-1 z-10">
        {children}
      </View>
    </View>
  );
}
