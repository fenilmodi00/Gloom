import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

interface DotGridProps {
  width: number;
  height: number;
}

export const DotGrid: React.FC<DotGridProps> = ({ width, height }) => {
  const DOT_RADIUS = 1.8;
  const DOT_SPACING = 22;
  const DOT_COLOR = '#C5C1BB';

  const dots = useMemo(() => {
    if (width <= 0 || height <= 0) return [];

    const numCols = Math.floor(width / DOT_SPACING);
    const numRows = Math.floor(height / DOT_SPACING);

    // Calculate offsets to center the grid
    const offsetX = (width - numCols * DOT_SPACING) / 2 + DOT_SPACING / 2;
    const offsetY = (height - numRows * DOT_SPACING) / 2 + DOT_SPACING / 2;

    const points = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        points.push({
          cx: offsetX + col * DOT_SPACING,
          cy: offsetY + row * DOT_SPACING,
        });
      }
    }
    return points;
  }, [width, height]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group>
        {dots.map((dot, index) => (
          <Circle
            key={`dot-${index}`}
            cx={dot.cx}
            cy={dot.cy}
            r={DOT_RADIUS}
            color={DOT_COLOR}
          />
        ))}
      </Group>
    </Canvas>
  );
};
