import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { api } from '@/lib/api';
import type { User } from '@/types/workout.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  completeOnboarding: (answers: Record<string, string>) => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
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

        // Verify token is still valid
        try {
          const response = await api.get<{ user: User }>('/auth/verify');
          set({
            user: response.user,
            token,
            isAuthenticated: true,
            hasCompletedOnboarding: true, // Assume completed if logged in
            isLoading: false,
          });
        } catch {
          // Token invalid, clear storage
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/login', {
        email,
        password,
      });

      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
      api.setAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to login',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/register', {
        name,
        email,
        password,
      });

      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
      api.setAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        hasCompletedOnboarding: false,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to register',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    api.clearAuthToken();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
    });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send reset email',
        isLoading: false,
      });
      return false;
    }
  },

  completeOnboarding: async (answers) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/onboarding/complete', { answers });
      set({
        hasCompletedOnboarding: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to complete onboarding',
        isLoading: false,
      });
      return false;
    }
  },

  updateUser: (data) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...data };
      set({ user: updatedUser });
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  },

  clearError: () => set({ error: null }),
}));
