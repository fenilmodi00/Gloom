import { Canvas, Circle, Paint } from '@shopify/react-native-skia';

interface ColorSwatchProps {
  hex: string;
  size?: number;
}

export const ColorSwatch = ({ hex, size = 32 }: ColorSwatchProps) => {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2}>
        <Paint color={hex} />
      </Circle>
    </Canvas>
  );
};
