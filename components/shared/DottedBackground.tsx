import React from 'react';
import { View } from 'react-native';

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
    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor }}>
      {/* Dot pattern overlay using small View circles */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: Math.ceil(800 / spacing) }).map((_, i) => {
          const dotId = `dot-${String(i).padStart(4, '0')}`;
          return (
            <View
              key={dotId}
              style={{
                width: spacing,
                height: spacing,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: dotRadius * 2,
                  height: dotRadius * 2,
                  borderRadius: dotRadius,
                  backgroundColor: dotColor,
                  opacity: 0.05,
                }}
              />
            </View>
          );
        })}
      </View>
      {/* Content layer */}
      <View style={{ position: 'relative', flex: 1, zIndex: 10 }}>
        {children}
      </View>
    </View>
  );
}

