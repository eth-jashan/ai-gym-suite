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

  // === NEON GREEN (Primary) ===
  // The signature accent - electric, energetic, motivating
  neon: {
    50: '#EAFFF0',
    100: '#D0FFE0',
    200: '#A3FFC2',
    300: '#6AFF9A',
    400: '#39FF75',
    500: '#00FF57', // Primary neon
    600: '#00E64D',
    700: '#00CC44',
    800: '#00A336',
    900: '#007A29',
    950: '#004D1A',
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
  neon: (opacity: number) => `rgba(0, 255, 87, ${opacity})`,
} as const;

export type Palette = typeof palette;
export type PaletteColor = keyof Palette;
