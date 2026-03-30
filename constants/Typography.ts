/**
 * Gloom Typography System
 * Luxury + Soft Modern typography for an elegant fashion app experience.
 */

export const Fonts = {
  hero: 'BodoniModa_700Bold',
  heading: 'PlayfairDisplay_600SemiBold',
  product: 'CormorantGaramond_500Medium',
  ui: 'InstrumentSans_500Medium',
  body: 'DMSans_400Regular',
};

export const Typography = {
  hero: {
    fontFamily: Fonts.hero,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1,
  },
  heading1: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heading3: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  productName: {
    fontFamily: Fonts.product,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  uiLabel: {
    fontFamily: Fonts.ui,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  uiLabelMedium: {
    fontFamily: Fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
};

export default Typography;
