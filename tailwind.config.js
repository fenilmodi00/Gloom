
const Typography = require('./constants/Typography').Typography;
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
        goldAccent: '#bc921cfa',
        goldSoft: '#E8D5A3',
        secondary: 'rgba(251, 249, 242, 0.98)',

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

        // Modal & Sheet Components
        sheetBg: '#FDFAF6',
        sectionHeaderBg: '#EAE4DA',
        dragHandle: '#C4B8A8',
        scrimColor: 'rgba(26, 26, 26, 0.45)',
        goldBtn: '#bc921cfa',
        ghostBtn: '#F0EBE3',

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

      fontSize: {
        'hero': ['48px', { lineHeight: '56px', letterSpacing: '-1px' }],
        'heading1': ['32px', { lineHeight: '40px', letterSpacing: '-0.5px' }],
        'heading2': ['24px', { lineHeight: '32px', letterSpacing: '-0.5px' }],
        'heading3': ['20px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
        'productName': ['18px', { lineHeight: '24px', letterSpacing: '0px' }],
        'uiLabel': ['12px', { lineHeight: '16px', letterSpacing: '1.5px' }],
        'uiLabelMedium': ['14px', { lineHeight: '20px', letterSpacing: '1px' }],
        'body': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
        'bodySmall': ['14px', { lineHeight: '20px', letterSpacing: '0.2px' }],
      },

      fontSize: {
        'hero': [Typography.hero.fontSize + 'px', { lineHeight: Typography.hero.lineHeight + 'px', letterSpacing: Typography.hero.letterSpacing + 'px' }],
        'heading1': [Typography.heading1.fontSize + 'px', { lineHeight: Typography.heading1.lineHeight + 'px', letterSpacing: Typography.heading1.letterSpacing + 'px' }],
        'heading2': [Typography.heading2.fontSize + 'px', { lineHeight: Typography.heading2.lineHeight + 'px', letterSpacing: Typography.heading2.letterSpacing + 'px' }],
        'heading3': [Typography.heading3.fontSize + 'px', { lineHeight: Typography.heading3.lineHeight + 'px', letterSpacing: Typography.heading3.letterSpacing + 'px' }],
        'productName': [Typography.productName.fontSize + 'px', { lineHeight: Typography.productName.lineHeight + 'px', letterSpacing: Typography.productName.letterSpacing + 'px' }],
        'uiLabel': [Typography.uiLabel.fontSize + 'px', { lineHeight: Typography.uiLabel.lineHeight + 'px', letterSpacing: Typography.uiLabel.letterSpacing + 'px' }],
        'uiLabelMedium': [Typography.uiLabelMedium.fontSize + 'px', { lineHeight: Typography.uiLabelMedium.lineHeight + 'px', letterSpacing: Typography.uiLabelMedium.letterSpacing + 'px' }],
        'body': [Typography.body.fontSize + 'px', { lineHeight: Typography.body.lineHeight + 'px', letterSpacing: Typography.body.letterSpacing + 'px' }],
        'bodySmall': [Typography.bodySmall.fontSize + 'px', { lineHeight: Typography.bodySmall.lineHeight + 'px', letterSpacing: Typography.bodySmall.letterSpacing + 'px' }],
      },
      fontFamily: {
        hero: ['BodoniModa_700Bold'],
        heading: ['PlayfairDisplay_600SemiBold'],
        product: ['CormorantGaramond_500Medium'],
        ui: ['InstrumentSans_500Medium'],
        body: ['DMSans_400Regular'],
      },
    },
  },
  plugins: [],
};
