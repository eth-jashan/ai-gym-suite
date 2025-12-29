import { create } from 'zustand';

import { api } from '@/lib/api';
import type { Workout, WorkoutStats } from '@/types/workout.types';

interface WorkoutState {
  workouts: Workout[];
  todaysWorkout: Workout | null;
  recentWorkouts: Workout[];
  stats: WorkoutStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkouts: () => Promise<void>;
  fetchWorkoutById: (id: string) => Promise<Workout | null>;
  fetchHomeData: () => Promise<void>;
  generateWorkout: () => Promise<Workout | null>;
  startWorkout: (id: string) => Promise<void>;
  completeExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  finishWorkout: (id: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  todaysWorkout: null,
  recentWorkouts: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchWorkouts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ workouts: Workout[] }>('/workouts');
      set({ workouts: response.workouts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchWorkoutById: async (id) => {
    try {
      const response = await api.get<{ workout: Workout }>(`/workouts/${id}`);
      return response.workout;
    } catch {
      return null;
    }
  },

  fetchHomeData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [workoutsRes, statsRes] = await Promise.all([
        api.get<{ workouts: Workout[]; today: Workout | null }>('/workouts/home'),
        api.get<{ stats: WorkoutStats }>('/progress/stats'),
      ]);

      set({
        todaysWorkout: workoutsRes.today,
        recentWorkouts: workoutsRes.workouts,
        stats: statsRes.stats,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  generateWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ workout: Workout }>('/workouts/generate', {});
      const { workouts } = get();
      set({
        workouts: [response.workout, ...workouts],
        isLoading: false,
      });
      return response.workout;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  startWorkout: async (id) => {
    try {
      await api.post(`/workouts/${id}/start`, {});
      const { workouts } = get();
      set({
        workouts: workouts.map((w) =>
          w.id === id ? { ...w, status: 'in_progress' as const, startedAt: new Date().toISOString() } : w
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  completeExercise: async (workoutId, exerciseId) => {
    try {
      await api.post(`/workouts/${workoutId}/exercises/${exerciseId}/complete`, {});
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  finishWorkout: async (id) => {
    try {
      await api.post(`/workouts/${id}/complete`, {});
      const { workouts } = get();
      set({
        workouts: workouts.map((w) =>
          w.id === id ? { ...w, status: 'completed' as const, completedAt: new Date().toISOString() } : w
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
