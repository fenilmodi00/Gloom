/**
 * DotGrid
 *
 * Dots are arranged in an oval/elliptical shape — NOT a full rectangular grid.
 * Edge columns have fewer dots, center columns have more, creating a
 * rounded dot field that matches the screenshot reference.
 */
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Fill, Circle } from '@shopify/react-native-skia';
import { THEME } from '@/constants/Colors';

interface DotGridProps {
  width: number;
  height: number;
  backgroundColor?: string;
  dotColor?: string;
  dotRadius?: number;
  spacing?: number;
}

export function DotGrid({
  width,
  height,
  backgroundColor = 'transparent',
  dotColor = THEME.dragHandle,
  dotRadius = 3.5,   // ← bigger dots, not tiny 1.8px
  spacing = 30,      // ← wider spacing to match screenshot
}: DotGridProps) {
  const dots = useMemo(() => {
    const positions: Array<{ x: number; y: number; opacity: number }> = [];

    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);

    // Center the entire grid
    const offsetX = (width - (cols - 1) * spacing) / 2;
    const offsetY = (height - (rows - 1) * spacing) / 2;

    const centerX = width / 2;
    const centerY = height / 2;

    // Ellipse semi-axes — controls how far the dot field extends
    // Slightly inset so dots don't touch the board edges
    const a = width * 0.43;   // horizontal radius
    const b = height * 0.43;  // vertical radius

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotX = offsetX + col * spacing;
        const dotY = offsetY + row * spacing;

        // Only draw dot if it falls inside the ellipse
        const dx = dotX - centerX;
        const dy = dotY - centerY;
        const distSq = (dx * dx) / (a * a) + (dy * dy) / (b * b);
        const insideEllipse = distSq <= 1;

        if (insideEllipse) {
          // Calculate opacity: 1.0 at center, 0.2 at the very edge
          // Using square root for a more natural radial falloff
          const distRatio = Math.sqrt(distSq);
          const opacity = Math.max(0.1, 1.0 - (1.0 - 0.1) * distRatio);
          
          positions.push({ x: dotX, y: dotY, opacity });
        }
      }
    }

    return positions;
  }, [width, height, spacing]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill color={backgroundColor} />
      {dots.map((dot, index) => (
        <Circle
          key={`dot-${index}-${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={dotRadius}
          color={dotColor}
          opacity={dot.opacity}
        />
      ))}
    </Canvas>
  );
}
