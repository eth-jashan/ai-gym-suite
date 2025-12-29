import { create } from 'zustand';

import { api } from '@/lib/api';
import type { Exercise } from '@/types/workout.types';

interface ExerciseState {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchExercises: () => Promise<void>;
  searchExercises: (query: string) => Promise<void>;
  getExerciseById: (id: string) => Promise<Exercise | null>;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  exercises: [],
  isLoading: false,
  error: null,

  fetchExercises: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ exercises: Exercise[] }>('/exercises');
      set({ exercises: response.exercises, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  searchExercises: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ exercises: Exercise[] }>(`/exercises/search?q=${query}`);
      set({ exercises: response.exercises, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getExerciseById: async (id) => {
    try {
      const response = await api.get<{ exercise: Exercise }>(`/exercises/${id}`);
      return response.exercise;
    } catch {
      return null;
    }
  },
}));
