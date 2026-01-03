/**
 * Workout Store
 *
 * Zustand store for managing workout state including:
 * - Weekly plan data
 * - Active workout session
 * - Exercise logging
 * - Workout completion
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { workoutService } from '@/lib/services/workout-service';
import {
  WeeklyPlan,
  Workout,
  WorkoutDay,
  WorkoutExercise,
  SetLog,
  WorkoutStats,
  SimilarExercisesResponse,
} from '@/lib/types/workout';

// Storage keys
const WEEKLY_PLAN_KEY = 'weekly_plan';
const ACTIVE_WORKOUT_KEY = 'active_workout';

interface ActiveWorkoutSession {
  workoutId: string;
  workout: Workout;
  startedAt: string;
  currentExerciseIndex: number;
  currentSetNumber: number;
  exerciseLogs: Record<string, SetLog[]>; // exerciseId -> sets
  isPaused: boolean;
  pausedAt?: string;
  totalPausedTime: number; // milliseconds
  restTimerEnd?: string;
}

interface WorkoutState {
  // Data
  weeklyPlan: WeeklyPlan | null;
  todayWorkout: Workout | null;
  upcomingWorkouts: Workout[];
  activeSession: ActiveWorkoutSession | null;
  lastWorkoutStats: WorkoutStats | null;

  // UI State
  isLoading: boolean;
  isGeneratingPlan: boolean;
  error: string | null;
  selectedDayIndex: number;

  // Actions - Plan
  fetchWeeklyPlan: () => Promise<void>;
  generateWeeklyPlan: () => Promise<void>;
  setSelectedDay: (dayIndex: number) => void;
  getWorkoutForDay: (dayIndex: number) => WorkoutDay | null;

  // Actions - Workout Session
  startWorkout: (workout: Workout) => Promise<void>;
  logSet: (exerciseId: string, setData: Omit<SetLog, 'loggedAt'>) => void;
  nextExercise: () => void;
  previousExercise: () => void;
  skipExercise: (reason?: string) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: (notes?: string) => Promise<WorkoutStats>;
  cancelWorkout: () => void;

  // Actions - Rest Timer
  startRestTimer: (seconds: number) => void;
  skipRestTimer: () => void;
  addRestTime: (seconds: number) => void;

  // Actions - Exercise Swap
  getAlternatives: (exerciseId: string) => Promise<SimilarExercisesResponse | null>;
  swapExercise: (exerciseId: string, newExercise: WorkoutExercise) => void;

  // Actions - Utility
  clearError: () => void;
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  weeklyPlan: null,
  todayWorkout: null,
  upcomingWorkouts: [],
  activeSession: null,
  lastWorkoutStats: null,
  isLoading: false,
  isGeneratingPlan: false,
  error: null,
  selectedDayIndex: new Date().getDay(), // Start with today

  // ============================================================================
  // PLAN ACTIONS
  // ============================================================================

  fetchWeeklyPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try to get from API first
      console.log('[WorkoutStore] Fetching weekly plan from API...');
      const response = await workoutService.getWeeklyPlan();
      console.log('[WorkoutStore] API response:', JSON.stringify(response, null, 2));

      if (response.success && response.plan) {
        const plan = response.plan;
        console.log('[WorkoutStore] Plan received with', plan.days?.length, 'days, daysPerWeek:', plan.daysPerWeek);

        // Save to storage
        await SecureStore.setItemAsync(WEEKLY_PLAN_KEY, JSON.stringify(plan));

        // Find today's workout
        const today = new Date().getDay();
        const todayDay = plan.days.find(d => d.dayIndex === today);
        const todayWorkout = todayDay ? convertDayToWorkout(todayDay, plan) : null;

        // Get upcoming workouts
        const upcoming = plan.days
          .filter(d => d.dayIndex > today)
          .slice(0, 3)
          .map(d => convertDayToWorkout(d, plan));

        set({
          weeklyPlan: plan,
          todayWorkout,
          upcomingWorkouts: upcoming,
          isLoading: false,
        });
      } else {
        console.log('[WorkoutStore] API returned success=false or no plan');
        throw new Error('No plan available');
      }
    } catch (error) {
      console.error('[WorkoutStore] API fetch failed:', error);

      // Try loading from cache
      try {
        const cached = await SecureStore.getItemAsync(WEEKLY_PLAN_KEY);
        if (cached) {
          console.log('[WorkoutStore] Loading from cache...');
          const plan = JSON.parse(cached) as WeeklyPlan;
          console.log('[WorkoutStore] Cached plan has', plan.days?.length, 'days');
          const today = new Date().getDay();
          const todayDay = plan.days.find(d => d.dayIndex === today);
          const todayWorkout = todayDay ? convertDayToWorkout(todayDay, plan) : null;

          const upcoming = plan.days
            .filter(d => d.dayIndex > today)
            .slice(0, 3)
            .map(d => convertDayToWorkout(d, plan));

          set({
            weeklyPlan: plan,
            todayWorkout,
            upcomingWorkouts: upcoming,
            isLoading: false,
          });
          return;
        }
      } catch (cacheError) {
        console.error('[WorkoutStore] Cache read failed:', cacheError);
      }

      // Fall back to mock data for UI testing
      console.log('[WorkoutStore] Falling back to mock data');
      const mockResponse = workoutService.mockGetWeeklyPlan();
      const plan = mockResponse.plan;
      const today = new Date().getDay();
      const todayDay = plan.days.find(d => d.dayIndex === today);
      const todayWorkout = todayDay ? convertDayToWorkout(todayDay, plan) : null;

      set({
        weeklyPlan: plan,
        todayWorkout,
        isLoading: false,
        error: 'Using offline data',
      });
    }
  },

  generateWeeklyPlan: async () => {
    set({ isGeneratingPlan: true, error: null });
    try {
      // Clear old cache before generating new plan
      await SecureStore.deleteItemAsync(WEEKLY_PLAN_KEY);

      const response = await workoutService.generateWeeklyPlan();
      console.log('[WorkoutStore] generateWeeklyPlan response:', JSON.stringify(response, null, 2));

      if (response.success && response.plan) {
        const plan = response.plan;
        await SecureStore.setItemAsync(WEEKLY_PLAN_KEY, JSON.stringify(plan));

        const today = new Date().getDay();
        const todayDay = plan.days.find(d => d.dayIndex === today);
        const todayWorkout = todayDay ? convertDayToWorkout(todayDay, plan) : null;

        // Get upcoming workouts
        const upcoming = plan.days
          .filter(d => d.dayIndex > today)
          .slice(0, 3)
          .map(d => convertDayToWorkout(d, plan));

        set({
          weeklyPlan: plan,
          todayWorkout,
          upcomingWorkouts: upcoming,
          isGeneratingPlan: false,
        });
      } else {
        throw new Error(response.message || 'Failed to generate plan');
      }
    } catch (error) {
      console.error('[WorkoutStore] generateWeeklyPlan error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate plan';
      set({ error: message, isGeneratingPlan: false });
    }
  },

  setSelectedDay: (dayIndex: number) => {
    set({ selectedDayIndex: dayIndex });
  },

  getWorkoutForDay: (dayIndex: number): WorkoutDay | null => {
    const { weeklyPlan } = get();
    if (!weeklyPlan) return null;
    return weeklyPlan.days.find(d => d.dayIndex === dayIndex) || null;
  },

  // ============================================================================
  // WORKOUT SESSION ACTIONS
  // ============================================================================

  startWorkout: async (workout: Workout) => {
    const session: ActiveWorkoutSession = {
      workoutId: workout.id,
      workout,
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      exerciseLogs: {},
      isPaused: false,
      totalPausedTime: 0,
    };

    // Initialize empty logs for each exercise
    workout.exercises.forEach(ex => {
      session.exerciseLogs[ex.exerciseId] = [];
    });

    // Save to storage for recovery
    await SecureStore.setItemAsync(ACTIVE_WORKOUT_KEY, JSON.stringify(session));

    set({ activeSession: session });

    // Notify API
    try {
      await workoutService.startWorkout(workout.id);
    } catch {
      // Continue even if API fails
    }
  },

  logSet: (exerciseId: string, setData: Omit<SetLog, 'loggedAt'>) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const newSetLog: SetLog = {
      ...setData,
      loggedAt: new Date().toISOString(),
    };

    const updatedLogs = {
      ...activeSession.exerciseLogs,
      [exerciseId]: [...(activeSession.exerciseLogs[exerciseId] || []), newSetLog],
    };

    const currentExercise = activeSession.workout.exercises[activeSession.currentExerciseIndex];
    const setsLogged = updatedLogs[exerciseId].length;
    const targetSets = currentExercise.sets || currentExercise.targetSets || 3;
    const isLastSet = setsLogged >= targetSets;

    set({
      activeSession: {
        ...activeSession,
        exerciseLogs: updatedLogs,
        currentSetNumber: isLastSet ? 1 : activeSession.currentSetNumber + 1,
      },
    });

    // Save to storage
    SecureStore.setItemAsync(ACTIVE_WORKOUT_KEY, JSON.stringify(get().activeSession));
  },

  nextExercise: () => {
    const { activeSession } = get();
    if (!activeSession) return;

    const nextIndex = activeSession.currentExerciseIndex + 1;
    if (nextIndex < activeSession.workout.exercises.length) {
      set({
        activeSession: {
          ...activeSession,
          currentExerciseIndex: nextIndex,
          currentSetNumber: 1,
          restTimerEnd: undefined,
        },
      });
    }
  },

  previousExercise: () => {
    const { activeSession } = get();
    if (!activeSession) return;

    const prevIndex = activeSession.currentExerciseIndex - 1;
    if (prevIndex >= 0) {
      set({
        activeSession: {
          ...activeSession,
          currentExerciseIndex: prevIndex,
          currentSetNumber: 1,
          restTimerEnd: undefined,
        },
      });
    }
  },

  skipExercise: (reason?: string) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const currentExercise = activeSession.workout.exercises[activeSession.currentExerciseIndex];

    // Notify API (fire and forget)
    workoutService.skipExercise(activeSession.workoutId, currentExercise.exerciseId, reason).catch(() => {});

    // Move to next exercise
    get().nextExercise();
  },

  pauseWorkout: () => {
    const { activeSession } = get();
    if (!activeSession || activeSession.isPaused) return;

    set({
      activeSession: {
        ...activeSession,
        isPaused: true,
        pausedAt: new Date().toISOString(),
      },
    });
  },

  resumeWorkout: () => {
    const { activeSession } = get();
    if (!activeSession || !activeSession.isPaused) return;

    const pausedDuration = activeSession.pausedAt
      ? new Date().getTime() - new Date(activeSession.pausedAt).getTime()
      : 0;

    set({
      activeSession: {
        ...activeSession,
        isPaused: false,
        pausedAt: undefined,
        totalPausedTime: activeSession.totalPausedTime + pausedDuration,
      },
    });
  },

  completeWorkout: async (notes?: string): Promise<WorkoutStats> => {
    const { activeSession } = get();
    if (!activeSession) {
      throw new Error('No active workout');
    }

    set({ isLoading: true });

    try {
      // Calculate duration
      const startTime = new Date(activeSession.startedAt).getTime();
      const endTime = new Date().getTime();
      const durationSeconds = Math.round((endTime - startTime - activeSession.totalPausedTime) / 1000);

      // Try API first
      try {
        const response = await workoutService.completeWorkout(activeSession.workoutId, {
          userNotes: notes,
        });

        await SecureStore.deleteItemAsync(ACTIVE_WORKOUT_KEY);

        set({
          activeSession: null,
          lastWorkoutStats: response.stats,
          isLoading: false,
        });

        return response.stats;
      } catch {
        // Use mock stats if API fails
        const mockStats = workoutService.mockCompleteWorkout(activeSession.workoutId, durationSeconds);

        await SecureStore.deleteItemAsync(ACTIVE_WORKOUT_KEY);

        set({
          activeSession: null,
          lastWorkoutStats: mockStats,
          isLoading: false,
        });

        return mockStats;
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelWorkout: () => {
    SecureStore.deleteItemAsync(ACTIVE_WORKOUT_KEY);
    set({ activeSession: null });
  },

  // ============================================================================
  // REST TIMER ACTIONS
  // ============================================================================

  startRestTimer: (seconds: number) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + seconds);

    set({
      activeSession: {
        ...activeSession,
        restTimerEnd: endTime.toISOString(),
      },
    });
  },

  skipRestTimer: () => {
    const { activeSession } = get();
    if (!activeSession) return;

    set({
      activeSession: {
        ...activeSession,
        restTimerEnd: undefined,
      },
    });
  },

  addRestTime: (seconds: number) => {
    const { activeSession } = get();
    if (!activeSession?.restTimerEnd) return;

    const currentEnd = new Date(activeSession.restTimerEnd);
    currentEnd.setSeconds(currentEnd.getSeconds() + seconds);

    set({
      activeSession: {
        ...activeSession,
        restTimerEnd: currentEnd.toISOString(),
      },
    });
  },

  // ============================================================================
  // EXERCISE SWAP ACTIONS
  // ============================================================================

  getAlternatives: async (exerciseId: string): Promise<SimilarExercisesResponse | null> => {
    try {
      return await workoutService.getSimilarExercises(exerciseId, 5);
    } catch {
      return null;
    }
  },

  swapExercise: (exerciseId: string, newExercise: WorkoutExercise) => {
    const { activeSession, weeklyPlan, todayWorkout } = get();

    // Update active session if workout is in progress
    if (activeSession) {
      const updatedExercises = activeSession.workout.exercises.map(ex =>
        ex.exerciseId === exerciseId ? newExercise : ex
      );

      set({
        activeSession: {
          ...activeSession,
          workout: {
            ...activeSession.workout,
            exercises: updatedExercises,
          },
        },
      });
    }

    // Update today's workout
    if (todayWorkout) {
      const updatedExercises = todayWorkout.exercises.map(ex =>
        ex.exerciseId === exerciseId ? newExercise : ex
      );

      set({
        todayWorkout: {
          ...todayWorkout,
          exercises: updatedExercises,
        },
      });
    }

    // Update weekly plan
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.map(day => ({
        ...day,
        exercises: day.exercises.map(ex =>
          ex.exerciseId === exerciseId ? newExercise : ex
        ),
      }));

      set({
        weeklyPlan: {
          ...weeklyPlan,
          days: updatedDays,
        },
      });
    }
  },

  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isLoading: true });

    try {
      // Check for active workout session to recover
      const activeWorkoutStr = await SecureStore.getItemAsync(ACTIVE_WORKOUT_KEY);
      if (activeWorkoutStr) {
        const session = JSON.parse(activeWorkoutStr) as ActiveWorkoutSession;
        set({ activeSession: session });
      }

      // Load weekly plan
      await get().fetchWeeklyPlan();
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => {
    SecureStore.deleteItemAsync(WEEKLY_PLAN_KEY);
    SecureStore.deleteItemAsync(ACTIVE_WORKOUT_KEY);

    set({
      weeklyPlan: null,
      todayWorkout: null,
      upcomingWorkouts: [],
      activeSession: null,
      lastWorkoutStats: null,
      isLoading: false,
      isGeneratingPlan: false,
      error: null,
      selectedDayIndex: new Date().getDay(),
    });
  },
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function convertDayToWorkout(day: WorkoutDay, plan: WeeklyPlan): Workout {
  const today = new Date();
  const dayOffset = day.dayIndex - today.getDay();
  const scheduledDate = new Date(today);
  scheduledDate.setDate(today.getDate() + dayOffset);

  return {
    id: `${plan.id}-day-${day.dayIndex}`,
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    dayOfWeek: day.dayIndex,
    workoutType: day.splitType,
    title: day.dayName,
    focusMuscles: day.focusMuscles,
    estimatedDuration: day.estimatedDuration,
    status: 'SCHEDULED',
    exercises: day.exercises,
  };
}

// ============================================================================
// SELECTORS (for common derived state)
// ============================================================================

// Cached empty values to prevent infinite re-renders from new object references
const EMPTY_PROGRESS = { current: 0, total: 0 } as const;
const EMPTY_SETS: SetLog[] = [];

export const selectCurrentExercise = (state: WorkoutState): WorkoutExercise | null => {
  if (!state.activeSession) return null;
  return state.activeSession.workout.exercises[state.activeSession.currentExerciseIndex] || null;
};

// Cache progress objects to prevent creating new references
const progressCache = new Map<string, { current: number; total: number }>();

export const selectExerciseProgress = (state: WorkoutState): { current: number; total: number } => {
  if (!state.activeSession) return EMPTY_PROGRESS;

  const current = state.activeSession.currentExerciseIndex + 1;
  const total = state.activeSession.workout.exercises.length;
  const key = `${current}-${total}`;

  let cached = progressCache.get(key);
  if (!cached) {
    cached = { current, total };
    progressCache.set(key, cached);
  }
  return cached;
};

export const selectSetsLoggedForCurrentExercise = (state: WorkoutState): SetLog[] => {
  if (!state.activeSession) return EMPTY_SETS;
  const currentExercise = selectCurrentExercise(state);
  if (!currentExercise) return EMPTY_SETS;
  return state.activeSession.exerciseLogs[currentExercise.exerciseId] || EMPTY_SETS;
};

export const selectElapsedTime = (state: WorkoutState): number => {
  if (!state.activeSession) return 0;
  const start = new Date(state.activeSession.startedAt).getTime();
  const now = new Date().getTime();
  const paused = state.activeSession.totalPausedTime;

  if (state.activeSession.isPaused && state.activeSession.pausedAt) {
    const currentPauseDuration = now - new Date(state.activeSession.pausedAt).getTime();
    return Math.round((now - start - paused - currentPauseDuration) / 1000);
  }

  return Math.round((now - start - paused) / 1000);
};

export const selectRestTimeRemaining = (state: WorkoutState): number | null => {
  if (!state.activeSession?.restTimerEnd) return null;
  const end = new Date(state.activeSession.restTimerEnd).getTime();
  const now = new Date().getTime();
  const remaining = Math.max(0, Math.round((end - now) / 1000));
  return remaining > 0 ? remaining : null;
};

export const selectIsLastExercise = (state: WorkoutState): boolean => {
  if (!state.activeSession) return false;
  return state.activeSession.currentExerciseIndex >= state.activeSession.workout.exercises.length - 1;
};

export const selectTotalVolume = (state: WorkoutState): number => {
  if (!state.activeSession) return 0;
  let total = 0;
  Object.values(state.activeSession.exerciseLogs).forEach(sets => {
    sets.forEach(set => {
      if (set.weightUsed && !set.isWarmup) {
        total += set.repsCompleted * set.weightUsed;
      }
    });
  });
  return total;
};
