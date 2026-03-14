// Fab (Floating Action Button) wrapper
import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type FabProps = PressableProps & {
  size?: 'sm' | 'md' | 'lg';
  placement?: 'bottom right' | 'bottom left';
  className?: string;
  isHovered?: boolean;
  isDisabled?: boolean;
  isPressed?: boolean;
};

export type FabIconProps = {
  as?: LucideIcon;
  className?: string;
};

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
};

export function Fab({ 
  size = 'md', 
  placement = 'bottom right',
  className = '', 
  children, 
  ...props 
}: FabProps) {
  const placementClasses = placement === 'bottom right' ? 'bottom-4 right-4' : 'bottom-4 left-4';
  
  return (
    <Pressable
      className={`${sizeClasses[size]} rounded-full items-center justify-center shadow-md ${placementClasses} ${className}`}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function FabIcon({ as: Icon, className = '' }: FabIconProps) {
  if (!Icon) return null;
  return <Icon className={className} size={24} />;
}
