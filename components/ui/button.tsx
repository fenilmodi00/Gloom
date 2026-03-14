// Button wrapper component
import React from 'react';
import { Pressable, PressableProps, Text, View, ActivityIndicator } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type ButtonProps = PressableProps & {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export type ButtonTextProps = {
  className?: string;
  children: React.ReactNode;
};

export type ButtonIconProps = {
  as?: LucideIcon;
  className?: string;
};

const variantClasses = {
  solid: 'bg-accent',
  outline: 'bg-transparent border border-accent',
  ghost: 'bg-transparent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 rounded-full',
  md: 'px-4 py-2 rounded-full',
  lg: 'px-6 py-3 rounded-full',
};

const textColorClasses = {
  solid: 'text-white',
  outline: 'text-accent',
  ghost: 'text-accent',
};

export function Button({ 
  variant = 'solid', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <Pressable
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function ButtonText({ className = '', children }: ButtonTextProps) {
  return (
    <Text className={`font-medium text-center ${textColorClasses.solid} ${className}`}>
      {children}
    </Text>
  );
}

export function ButtonIcon({ as: Icon, className = '' }: ButtonIconProps) {
  if (!Icon) return null;
  return <Icon className={className} size={16} />;
}
