import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: 'light' | 'dark';
  preference: Theme;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => Promise<void>;
}

const THEME_KEY = 'theme_preference';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  preference: 'system',

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const preference = (stored as Theme) || 'system';

      let theme: 'light' | 'dark' = 'dark';
      if (preference === 'system') {
        theme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
      } else {
        theme = preference;
      }

      set({ theme, preference });
    } catch {
      // Use defaults
    }
  },

  setTheme: (preference) => {
    let theme: 'light' | 'dark' = 'dark';
    if (preference === 'system') {
      theme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
    } else {
      theme = preference;
    }

    set({ theme, preference });
    AsyncStorage.setItem(THEME_KEY, preference);
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme, preference: newTheme });
    AsyncStorage.setItem(THEME_KEY, newTheme);
  },
}));
