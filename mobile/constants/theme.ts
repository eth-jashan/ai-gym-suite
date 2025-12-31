/**
 * AI Gym Suite Design System - Theme Configuration
 *
 * Semantic color tokens that map to the color primitives.
 * Components should ONLY use these semantic tokens, never raw palette colors.
 *
 * Structure inspired by Spotify's design system approach:
 * - Semantic naming (what it's for, not what color it is)
 * - Consistent light/dark mode support
 * - Layered surface system for depth
 */

import { Platform } from 'react-native';
import { palette, alpha } from './colors';

// ============================================================================
// SEMANTIC COLOR TOKENS
// ============================================================================

export const themes = {
  dark: {
    // === BACKGROUNDS ===
    // Layered system: base -> elevated -> surface -> raised
    background: {
      base: palette.black.pure,        // App background
      elevated: palette.black.deep,     // Cards, modals base
      surface: palette.black.surface,   // Interactive surfaces
      raised: palette.black.raised,     // Hover states, raised cards
      overlay: alpha.black(0.8),        // Modal overlays
      scrim: alpha.black(0.6),          // Dim backgrounds
    },

    // === TEXT ===
    text: {
      primary: palette.white.pure,      // Main content
      secondary: palette.gray[400],     // Supporting text
      tertiary: palette.gray[500],      // Subtle text, placeholders
      disabled: palette.gray[600],      // Disabled states
      inverse: palette.black.pure,      // Text on light backgrounds
      onPrimary: palette.black.pure,    // Text on primary (neon) color
    },

    // === PRIMARY (Neon Green) ===
    primary: {
      base: palette.neon[500],          // Primary buttons, links
      hover: palette.neon[400],         // Hover state
      pressed: palette.neon[600],       // Active/pressed state
      muted: alpha.neon(0.15),          // Subtle backgrounds
      subtle: alpha.neon(0.08),         // Very subtle tints
    },

    // === BORDER ===
    border: {
      default: palette.black.subtle,    // Default borders
      muted: palette.black.muted,       // Subtle borders
      focus: palette.neon[500],         // Focus rings
      divider: palette.black.overlay,   // Divider lines
    },

    // === INTERACTIVE ===
    interactive: {
      default: palette.black.surface,   // Default interactive bg
      hover: palette.black.raised,      // Hover state
      pressed: palette.black.overlay,   // Pressed state
      disabled: palette.black.elevated, // Disabled state
    },

    // === STATUS ===
    status: {
      success: palette.success.light,
      successMuted: alpha.black(0) + '22C55E26', // 15% opacity hack
      warning: palette.warning.light,
      warningMuted: '#FBBF2426',
      error: palette.error.light,
      errorMuted: '#F8717126',
      info: palette.info.light,
      infoMuted: '#60A5FA26',
    },

    // === ICON ===
    icon: {
      primary: palette.white.pure,
      secondary: palette.gray[400],
      tertiary: palette.gray[500],
      disabled: palette.gray[600],
      accent: palette.neon[500],
    },

    // === GRADIENTS ===
    gradient: {
      primary: [palette.neon[500], palette.lime[500]] as const,
      surface: [palette.black.pure, palette.black.deep] as const,
      glow: [alpha.neon(0.3), alpha.neon(0)] as const,
    },
  },

  light: {
    // === BACKGROUNDS ===
    background: {
      base: palette.white.pure,
      elevated: palette.white.off,
      surface: palette.gray[100],
      raised: palette.gray[200],
      overlay: alpha.black(0.5),
      scrim: alpha.black(0.3),
    },

    // === TEXT ===
    text: {
      primary: palette.gray[900],
      secondary: palette.gray[600],
      tertiary: palette.gray[500],
      disabled: palette.gray[400],
      inverse: palette.white.pure,
      onPrimary: palette.black.pure,
    },

    // === PRIMARY (Darker green for light mode readability) ===
    primary: {
      base: palette.neon[700],
      hover: palette.neon[600],
      pressed: palette.neon[800],
      muted: palette.neon[100],
      subtle: palette.neon[50],
    },

    // === BORDER ===
    border: {
      default: palette.gray[200],
      muted: palette.gray[100],
      focus: palette.neon[600],
      divider: palette.gray[200],
    },

    // === INTERACTIVE ===
    interactive: {
      default: palette.white.pure,
      hover: palette.gray[50],
      pressed: palette.gray[100],
      disabled: palette.gray[100],
    },

    // === STATUS ===
    status: {
      success: palette.success.base,
      successMuted: '#22C55E15',
      warning: palette.warning.base,
      warningMuted: '#F59E0B15',
      error: palette.error.base,
      errorMuted: '#EF444415',
      info: palette.info.base,
      infoMuted: '#3B82F615',
    },

    // === ICON ===
    icon: {
      primary: palette.gray[900],
      secondary: palette.gray[600],
      tertiary: palette.gray[500],
      disabled: palette.gray[400],
      accent: palette.neon[600],
    },

    // === GRADIENTS ===
    gradient: {
      primary: [palette.neon[600], palette.neon[700]] as const,
      surface: [palette.white.pure, palette.gray[50]] as const,
      glow: [alpha.neon(0.2), alpha.neon(0)] as const,
    },
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fonts: Platform.select({
    ios: {
      sans: 'System',
      mono: 'Menlo',
    },
    android: {
      sans: 'Roboto',
      mono: 'monospace',
    },
    default: {
      sans: 'System',
      mono: 'monospace',
    },
  }),

  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Helper type to extract common structure from both themes
type DeepString<T> = T extends readonly [infer A, infer B]
  ? readonly [string, string]
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T extends string
  ? string
  : T;

export type Theme = DeepString<typeof themes.dark>;
export type ThemeMode = keyof typeof themes;
export type ThemeColors = Theme;

// Legacy export for backwards compatibility
export const Colors = {
  light: {
    text: themes.light.text.primary,
    background: themes.light.background.base,
    tint: themes.light.primary.base,
    icon: themes.light.icon.secondary,
    tabIconDefault: themes.light.icon.secondary,
    tabIconSelected: themes.light.primary.base,
  },
  dark: {
    text: themes.dark.text.primary,
    background: themes.dark.background.base,
    tint: themes.dark.primary.base,
    icon: themes.dark.icon.secondary,
    tabIconDefault: themes.dark.icon.secondary,
    tabIconSelected: themes.dark.primary.base,
  },
};
