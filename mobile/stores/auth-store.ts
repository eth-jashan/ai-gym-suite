import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (answers?: Record<string, string>) => Promise<boolean>;
  clearError: () => void;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        api.setAuthToken(token);
        set({ user, token, isAuthenticated: true, hasCompletedOnboarding: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    // API call commented out for UI testing
    // try {
    //   const response = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    //   await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    //   await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
    //   api.setAuthToken(response.token);
    //   set({ user: response.user, token: response.token, isAuthenticated: true, hasCompletedOnboarding: true, isLoading: false });
    //   return true;
    // } catch (error: any) {
    //   set({ error: error.message || 'Failed to login', isLoading: false });
    //   return false;
    // }

    // Mock login for UI testing - skips onboarding (existing user)
    const mockUser = { id: '1', email, name: email.split('@')[0] };
    set({ user: mockUser, token: 'mock-token', isAuthenticated: true, hasCompletedOnboarding: true, isLoading: false });
    return true;
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    // API call commented out for UI testing
    // try {
    //   const response = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password });
    //   await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    //   await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
    //   api.setAuthToken(response.token);
    //   set({ user: response.user, token: response.token, isAuthenticated: true, hasCompletedOnboarding: false, isLoading: false });
    //   return true;
    // } catch (error: any) {
    //   set({ error: error.message || 'Failed to register', isLoading: false });
    //   return false;
    // }

    // Mock register for UI testing - triggers onboarding (new user)
    const mockUser = { id: '1', email, name };
    set({ user: mockUser, token: 'mock-token', isAuthenticated: true, hasCompletedOnboarding: false, isLoading: false });
    return true;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    api.clearAuthToken();
    set({ user: null, token: null, isAuthenticated: false, hasCompletedOnboarding: false });
  },

  completeOnboarding: async (answers?) => {
    set({ isLoading: true, error: null });
    // API call commented out for UI testing
    // try {
    //   if (answers) {
    //     await api.post('/onboarding/complete', { answers });
    //   }
    // } catch (error: any) {
    //   console.log('Onboarding API error:', error.message);
    // }
    set({ hasCompletedOnboarding: true, isLoading: false });
    return true;
  },

  clearError: () => set({ error: null }),
}));
