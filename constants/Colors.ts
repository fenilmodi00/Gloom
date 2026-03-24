/**
 * StyleAI Design System Tokens
 * 
 * Palette: "Earth & Gold" (Custom tailored HSL colors)
 * - primary: #8B7355 (Muted brown/olive)
 * - gold: #C9A84C (Warm metallic gold)
 * - surface: #FDFAF6 (Off-white/creme)
 */

export const Brand = {
  /** Main brand anchor. Use for dominant elements, primary branding, and hero states. */
  primary: '#8B7355',
  /** High-contrast deep brown. Use for active states of primary elements and dark layouts. */
  primaryDark: '#6B5840',
  /** Soft brand tint. Use for backgrounds of themed components and secondary brand highlights. */
  primaryLight: '#B09A7A',
  /** Premium highlight color. Use for accent icons, active indicators (dots), and status pills. */
  goldAccent: '#bc921cfa',
  /** Subdued gold. Use for subtle highlights and hover/active states of light surfaces. */
  goldSoft: '#E8D5A3',
};

export const Backgrounds = {
  /** Main application canvas. Slightly off-white to reduce eye strain. */
  bgCanvas: '#F5F2EE',
  /** Standard card and section surface color. Brightest creme. */
  bgSurface: '#FDFAF6',
  /** Raised surface for nested cards and secondary groupings. */
  bgSurfaceRaised: '#F0EBE3',
  /** Deepest neutral background. Use for chip outlines or recessed areas. */
  bgMuted: '#EAE4DA',
};

export const Typography = {
  /** Standard body text and headings. Deep charcoal (not pitch black). */
  textPrimary: '#1A1A1A',
  /** Secondary info, labels, and timestamps. Muted grey. */
  textSecondary: '#6B6B6B',
  /** Tertiary text, placeholders, and disabled states. Earthy taupe. */
  textTertiary: '#A89880',
  /** Text specifically for use on dark backgrounds or brand-primary fills. */
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

/** Blur intensities for glassmorphism effects. */
export const BLUR = {
  navbar: 24,
  sheet: 18,
  modal: 12,
  card: 6,
};

/**
 * Theme Context
 * Used by standard React Native and Expo components for dynamic theme switching.
 * Note: Phase 1 is light-only, so we export THEME as the primary light color set.
 */
export const THEME = {
  text: Typography.textPrimary,
  background: Backgrounds.bgSurface,
  // Brand Core
  primary: Brand.primary,
  primaryDark: Brand.primaryDark,
  primaryLight: Brand.primaryLight,
  goldAccent: Brand.goldAccent,
  goldSoft: Brand.goldSoft,

  // Backgrounds
  bgCanvas: Backgrounds.bgCanvas,
  bgSurface: Backgrounds.bgSurface,
  bgSurfaceRaised: Backgrounds.bgSurfaceRaised,
  bgMuted: Backgrounds.bgMuted,

  // Typography
  textPrimary: Typography.textPrimary,
  textSecondary: Typography.textSecondary,
  textTertiary: Typography.textTertiary,
  textOnDark: Typography.textOnDark,

  // Interactive Elements
  btnPrimaryBg: Brand.primary,
  btnPrimaryText: Typography.textOnDark,
  btnSecondaryBg: Backgrounds.bgSurfaceRaised,
  btnSecondaryText: Brand.primaryDark,

  chipActiveBg: Typography.textPrimary,
  chipActiveText: Typography.textOnDark,
  chipIdleBg: Backgrounds.bgSurface,
  chipIdleBorder: '#D4C8B8',

  // Modal & Sheet Components
  sheetBg: Backgrounds.bgSurface,
  sectionHeaderBg: Backgrounds.bgMuted,
  dragHandle: '#C4B8A8',
  scrimColor: 'rgba(26, 26, 26, 0.45)',
  goldBtn: Brand.goldAccent,
  ghostBtn: Backgrounds.bgSurfaceRaised,

  // Navigation & Glassmorphism
  navbarBg: 'rgba(253, 250, 246, 0.72)',
  navbarBorder: '#D4C8B8',
  navIconActive: Brand.primary,
  navIconInactive: Typography.textTertiary,
  navActiveDot: Brand.goldAccent,

  // Feedback States
  stateSuccess: Feedback.stateSuccess,
  stateError: Feedback.stateError,
  stateWarning: Feedback.stateWarning,
  stateInfo: Feedback.stateInfo,

  tint: tintColorLight,
  tabIconDefault: Typography.textTertiary,
  tabIconSelected: tintColorLight,

  // Misc
  skeleton: '#EAE4DA',
};

export const Colors = {
  light: THEME,
  dark: {
    // Phase 1 is light-first, but we provide a baseline fallback
    text: Typography.textOnDark,
    background: Typography.textPrimary,
    tint: tintColorDark,
    tabIconDefault: Typography.textSecondary,
    tabIconSelected: tintColorDark,
  },
};

export default Colors;

