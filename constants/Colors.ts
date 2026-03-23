export const Brand = {
  primary: '#8B7355',
  primaryDark: '#6B5840',
  primaryLight: '#B09A7A',
  goldAccent: '#C9A84C',
  goldSoft: '#E8D5A3',
};

export const Backgrounds = {
  bgCanvas: '#F5F2EE',
  bgSurface: '#FDFAF6',
  bgSurfaceRaised: '#F0EBE3',
  bgMuted: '#EAE4DA',
};

export const Typography = {
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#A89880',
  textOnDark: '#FDFAF6',
};

export const Feedback = {
  stateSuccess: '#6A8C69',
  stateError: '#B85C4A',
  stateWarning: '#C9A84C',
  stateInfo: '#7A8FAB',
};

const tintColorLight = '#8B7355';
const tintColorDark = '#FDFAF6';

export const BLUR = {
  navbar: 24,
  sheet: 18,
  modal: 12,
  card: 6,
};

export default {
  light: {
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

    // Chips / Pills
    chipActiveBg: '#1A1A1A',
    chipActiveText: '#FDFAF6',
    chipIdleBg: '#FDFAF6',
    chipIdleBorder: '#D4C8B8',

    // Bottom Sheet
    sheetBg: '#FDFAF6',
    sectionHeaderBg: '#EAE4DA',
    dragHandle: '#C4B8A8',
    scrimColor: 'rgba(26, 26, 26, 0.45)',
    goldBtn: '#C9A84C',
    ghostBtn: '#F0EBE3',

    // Glass Navbar
    navbarBg: 'rgba(253, 250, 246, 0.72)',
    navbarBorder: '#D4C8B8',
    navIconActive: '#8B7355',
    navIconInactive: '#A89880',
    navActiveDot: '#C9A84C',

    // Feedback States
    stateSuccess: '#6A8C69',
    stateError: '#B85C4A',
    stateWarning: '#C9A84C',
    stateInfo: '#7A8FAB',

    // Expo defaults/compat
    tint: tintColorLight,
    tabIconDefault: '#A89880',
    tabIconSelected: tintColorLight,
  },
  dark: {
    // Phase 1 is light-first, but we provide a fallback
    text: '#FDFAF6',
    background: '#1A1A1A',
    tint: tintColorDark,
    tabIconDefault: '#6B6B6B',
    tabIconSelected: tintColorDark,
  },
};
