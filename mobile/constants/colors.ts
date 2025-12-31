/**
 * AI Gym Suite Design System - Color Primitives
 *
 * Inspired by Higgsfield's dark aesthetic with neon green accents.
 * These are raw color values - use semantic tokens in components.
 */

export const palette = {
  // === BLACK SCALE ===
  // True blacks for deep, immersive UI
  black: {
    pure: '#000000',
    rich: '#050505',
    deep: '#0A0A0A',
    base: '#0F0F0F',
    elevated: '#141414',
    surface: '#1A1A1A',
    raised: '#1F1F1F',
    overlay: '#242424',
    muted: '#2A2A2A',
    subtle: '#333333',
  },

  // === WHITE SCALE ===
  // For light mode and text on dark backgrounds
  white: {
    pure: '#FFFFFF',
    off: '#FAFAFA',
    soft: '#F5F5F5',
    muted: '#E8E8E8',
    subtle: '#D4D4D4',
  },

  // === GRAY SCALE ===
  // Neutral tones for borders, disabled states, secondary text
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // === EMERALD/TEAL (Primary) ===
  // Sophisticated, energetic yet easy on the eyes
  neon: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Primary - sophisticated emerald
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },

  // === LIME (Secondary accent) ===
  // Softer green for gradients and secondary highlights
  lime: {
    400: '#A3E635',
    500: '#84CC16',
    600: '#65A30D',
  },

  // === STATUS COLORS ===
  success: {
    light: '#22C55E',
    base: '#16A34A',
    dark: '#15803D',
  },

  warning: {
    light: '#FBBF24',
    base: '#F59E0B',
    dark: '#D97706',
  },

  error: {
    light: '#F87171',
    base: '#EF4444',
    dark: '#DC2626',
  },

  info: {
    light: '#60A5FA',
    base: '#3B82F6',
    dark: '#2563EB',
  },

  // === SPECIAL ===
  transparent: 'transparent',
} as const;

// Alpha variants for overlays and glass effects
export const alpha = {
  black: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  white: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
  neon: (opacity: number) => `rgba(16, 185, 129, ${opacity})`, // #10B981
} as const;

export type Palette = typeof palette;
export type PaletteColor = keyof Palette;
