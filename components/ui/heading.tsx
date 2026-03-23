// Simple Heading wrapper - uses React Native Text with bold styling
import React from 'react';
import { Text, TextProps } from 'react-native';

export type HeadingProps = TextProps & {
  size?: 'xl' | '2xl' | '3xl';
  className?: string;
};

const sizeClasses = {
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

export function Heading({ size = 'xl', className = '', children, ...props }: HeadingProps) {
  return (
    <Text className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
