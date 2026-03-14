/// <reference types="nativewind/types" />

// Declare custom design tokens for TypeScript
declare module 'nativewind' {
  export interface NativeWindConfig {
    theme: {
      colors: {
        background: string;
        surface: string;
        'text-primary': string;
        'text-secondary': string;
        accent: string;
        'accent-light': string;
        error: string;
        success: string;
      };
    };
  }
}
