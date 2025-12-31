/**
 * AI Gym Suite - Theme Provider
 *
 * Provides theme context throughout the app with:
 * - Automatic system theme detection
 * - Manual theme override capability
 * - Strongly typed theme access
 */

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { themes, spacing, radius, typography } from '../constants/theme';
import type { Theme, ThemeMode } from '../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeContextValue {
  // Current theme colors
  colors: Theme;
  // Current mode
  mode: ThemeMode;
  // Is dark mode active
  isDark: boolean;
  // Design tokens
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  // Theme control
  setMode: (mode: ThemeMode | 'system') => void;
  toggleMode: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode | 'system';
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [userMode, setUserMode] = useState<ThemeMode | 'system'>(initialMode);

  // Resolve actual theme mode
  const mode: ThemeMode = useMemo(() => {
    if (userMode === 'system') {
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }
    return userMode;
  }, [userMode, systemColorScheme]);

  const isDark = mode === 'dark';
  const colors = themes[mode];

  const setMode = useCallback((newMode: ThemeMode | 'system') => {
    setUserMode(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setUserMode(current => {
      if (current === 'system') {
        // If system, toggle to opposite of current system setting
        return systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode,
      isDark,
      spacing,
      radius,
      typography,
      setMode,
      toggleMode,
    }),
    [colors, mode, isDark, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access the full theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Quick access to theme colors only
 */
export function useColors(): Theme {
  return useTheme().colors;
}

/**
 * Check if dark mode is active
 */
export function useIsDark(): boolean {
  return useTheme().isDark;
}

// ============================================================================
// STYLED HELPERS
// ============================================================================

/**
 * Create theme-aware styles
 *
 * Usage:
 * const styles = useThemedStyles((colors, isDark) => ({
 *   container: { backgroundColor: colors.background.base }
 * }));
 */
export function useThemedStyles<T>(
  styleFactory: (colors: Theme, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => styleFactory(colors, isDark), [colors, isDark, styleFactory]);
}
