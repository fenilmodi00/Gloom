// Simple Text wrapper - uses React Native Text with Tailwind classes
import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export type TextProps = RNTextProps & {
  className?: string;
};

export function Text({ className = '', children, ...props }: TextProps) {
  return (
    <RNText className={className} {...props}>
      {children}
    </RNText>
  );
}
