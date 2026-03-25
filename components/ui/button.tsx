// Button wrapper component
import React from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type ButtonProps = PressableProps & {
  variant?: 'solid' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isLoading?: boolean;
};

export type ButtonTextProps = {
  className?: string;
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'secondary';
};

export type ButtonIconProps = {
  as?: LucideIcon;
  className?: string;
  color?: string;
};

const variantClasses = {
  solid: 'bg-primary',
  secondary: 'bg-btnSecondaryBg',
  outline: 'bg-transparent border border-primary',
  ghost: 'bg-transparent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 rounded-full',
  md: 'px-4 py-2.5 rounded-full',
  lg: 'px-6 py-3.5 rounded-full',
};

const textColorClasses = {
  solid: 'text-white',
  secondary: 'text-btnSecondaryText',
  outline: 'text-primary',
  ghost: 'text-primary',
};

export function Button({ 
  variant = 'solid', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  // Pass variant to children if they are ButtonText
  const childrenWithProps = typeof children === 'function' 
    ? children 
    : React.Children.map(children, (child): React.ReactNode => {
        if (React.isValidElement(child) && (child.type as any).name === 'ButtonText') {
          return React.cloneElement(child as React.ReactElement<any>, { variant });
        }
        return child;
      });

  return (
    <Pressable
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} flex-row items-center justify-center gap-2 ${className}`}
      disabled={disabled}
      {...props}
    >
      {childrenWithProps}
    </Pressable>
  );
}

export function ButtonText({ className = '', children, variant = 'solid' }: ButtonTextProps) {
  return (
    <Text className={`font-ui uppercase tracking-widest text-center ${textColorClasses[variant]} ${className}`}>
      {children}
    </Text>
  );
}

export function ButtonIcon({ as: Icon, className = '', color }: ButtonIconProps) {
  if (!Icon) return null;
  return <Icon className={className} size={18} color={color} />;
}
