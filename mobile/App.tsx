import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { Theme as NavigationTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './stores/auth-store';
import { ThemeProvider, useTheme } from './providers/theme-provider';
import { themes } from './constants/theme';

/**
 * Creates a React Navigation theme from our design system
 */
function createNavigationTheme(isDark: boolean): NavigationTheme {
  const colors = isDark ? themes.dark : themes.light;

  return {
    dark: isDark,
    colors: {
      primary: colors.primary.base,
      background: colors.background.base,
      card: colors.background.elevated,
      text: colors.text.primary,
      border: colors.border.default,
      notification: colors.primary.base,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };
}

function AppContent() {
  const { isDark } = useTheme();
  const { initialize } = useAuthStore();
  const navigationTheme = createNavigationTheme(isDark);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
