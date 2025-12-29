import { create } from 'zustand';

import { api } from '@/lib/api';
import type { ProgressStats, Achievement } from '@/types/workout.types';

interface ProgressState {
  stats: ProgressStats | null;
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgress: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  stats: null,
  achievements: [],
  isLoading: false,
  error: null,

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        api.get<{ stats: ProgressStats }>('/progress/stats'),
        api.get<{ achievements: Achievement[] }>('/progress/achievements'),
      ]);

      set({
        stats: statsRes.stats,
        achievements: achievementsRes.achievements,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAchievements: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ achievements: Achievement[] }>('/progress/achievements');
      set({ achievements: response.achievements, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
