import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import { PersonalizedPlan } from '@/lib/types/onboarding';
import { useWorkoutStore } from './workout-store';

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
  personalizedPlan: PersonalizedPlan | null;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (plan?: PersonalizedPlan) => Promise<boolean>;
  clearError: () => void;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const PLAN_KEY = 'personalized_plan';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  personalizedPlan: null,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      const planStr = await SecureStore.getItemAsync(PLAN_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User & { onboardingCompleted?: boolean };
        const plan = planStr ? JSON.parse(planStr) as PersonalizedPlan : null;
        // Read onboardingCompleted from stored user, default to false if plan exists
        const hasCompletedOnboarding = user.onboardingCompleted ?? (plan !== null);

        api.setAuthToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          hasCompletedOnboarding,
          personalizedPlan: plan,
          isLoading: false,
        });
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
      interface LoginResponse {
        user: User & { onboardingCompleted?: boolean };
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }

      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      const user = response.user;
      const token = response.tokens?.accessToken;
      const refreshToken = response.tokens?.refreshToken;
      const hasCompletedOnboarding = response.user?.onboardingCompleted ?? true;

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }
      api.setAuthToken(token);

      set({ user, token, isAuthenticated: true, hasCompletedOnboarding, isLoading: false });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      interface RegisterResponse {
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }

      const response = await api.post<RegisterResponse>('/auth/register', { name, email, password });

      const user = response.user;
      const token = response.tokens?.accessToken;
      const refreshToken = response.tokens?.refreshToken;

      console.log('[Register] User:', user?.email, 'Token:', token ? 'present' : 'missing');

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }
      api.setAuthToken(token);

      console.log('[Register] Success - navigating to onboarding');
      set({ user, token, isAuthenticated: true, hasCompletedOnboarding: false, isLoading: false });
      return true;
    } catch (error: unknown) {
      console.error('[Register] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to register';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(PLAN_KEY);
    api.clearAuthToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      personalizedPlan: null,
    });
  },

  completeOnboarding: async (plan?) => {
    set({ isLoading: true, error: null });

    try {
      // Save the personalized plan to secure storage
      if (plan) {
        await SecureStore.setItemAsync(PLAN_KEY, JSON.stringify(plan));
      }

      // Update stored user with onboardingCompleted: true
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.onboardingCompleted = true;
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      }

      // Reset workout store to clear old cached data and force fresh API fetch
      console.log('[AuthStore] Resetting workout store after onboarding');
      useWorkoutStore.getState().reset();

      set({
        hasCompletedOnboarding: true,
        personalizedPlan: plan || null,
        isLoading: false,
      });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save onboarding data';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
