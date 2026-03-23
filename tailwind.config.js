/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand Core
        primary: '#8B7355',
        primaryDark: '#6B5840',
        primaryLight: '#B09A7A',
        goldAccent: '#C9A84C',
        goldSoft: '#E8D5A3',

        // Backgrounds
        bgCanvas: '#F5F2EE',
        bgSurface: '#FDFAF6',
        bgSurfaceRaised: '#F0EBE3',
        bgMuted: '#EAE4DA',

        // Typography
        textPrimary: '#1A1A1A',
        textSecondary: '#6B6B6B',
        textTertiary: '#A89880',
        textOnDark: '#FDFAF6',

        // Buttons
        btnPrimaryBg: '#8B7355',
        btnPrimaryText: '#FDFAF6',
        btnSecondaryBg: '#F0EBE3',
        btnSecondaryText: '#6B5840',

        // Chips
        chipActiveBg: '#1A1A1A',
        chipActiveText: '#FDFAF6',
        chipIdleBg: '#FDFAF6',
        chipIdleBorder: '#D4C8B8',

        // Feedback States
        stateSuccess: '#6A8C69',
        stateError: '#B85C4A',
        stateWarning: '#C9A84C',
        stateInfo: '#7A8FAB',

        // Legacy (keeping for compatibility during refactor)
        background: '#F5F2EE',
        surface: '#FFFFFF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        accent: '#8B7355',
        'accent-light': '#D4C5B0',
        error: '#C0392B',
        success: '#27AE60',
      },
    },
  },
  plugins: [],
};
