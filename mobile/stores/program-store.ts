/**
 * Program Store
 *
 * Zustand store for managing the 28-day workout program state including:
 * - Program data and generation
 * - Day completion tracking
 * - Progress statistics
 * - Persistence with SecureStore
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Program, ProgramDay, ProgramStats, getPhaseForDay, PHASE_COLORS } from '@/lib/types/program';
import { generate28DayProgram, ProgramGeneratorOptions, generateProgramPreview, ProgramPreview } from '@/lib/services/program-generator';
import { DetailedExercise } from '@/lib/data/exercises-database';

// Storage keys
const PROGRAM_KEY = 'user_program_28day';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ProgramState {
  // Data
  program: Program | null;
  selectedDay: number; // 1-28
  preview: ProgramPreview | null;

  // UI State
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions - Program
  generateProgram: (options: ProgramGeneratorOptions) => Promise<Program>;
  loadProgram: () => Promise<void>;
  clearProgram: () => Promise<void>;
  generatePreview: (options: Omit<ProgramGeneratorOptions, 'userId' | 'userName'>) => void;

  // Actions - Navigation
  setSelectedDay: (day: number) => void;
  goToToday: () => void;

  // Actions - Day Management
  completeDay: (dayNumber: number) => Promise<void>;
  skipDay: (dayNumber: number) => Promise<void>;
  uncompleteDay: (dayNumber: number) => Promise<void>;

  // Actions - Exercise Management
  completeExercise: (dayNumber: number, exerciseId: string) => void;
  skipExercise: (dayNumber: number, exerciseId: string) => void;

  // Selectors
  getTodayDayNumber: () => number;
  getCurrentDay: () => ProgramDay | null;
  getSelectedDayData: () => ProgramDay | null;
  getDayByNumber: (dayNumber: number) => ProgramDay | null;
  getWeekDays: (weekNumber: number) => ProgramDay[];
  getStats: () => ProgramStats;
  getPhaseProgress: () => { phase: string; color: string; progress: number };
  getStreakInfo: () => { current: number; longest: number };

  // Utility
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useProgramStore = create<ProgramState>((set, get) => ({
  // Initial state
  program: null,
  selectedDay: 1,
  preview: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  // ============================================================================
  // PROGRAM ACTIONS
  // ============================================================================

  generateProgram: async (options: ProgramGeneratorOptions) => {
    set({ isGenerating: true, error: null });

    try {
      const program = generate28DayProgram(options);

      // Save to storage
      await SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(program));

      // Calculate which day is today
      const today = new Date();
      const startDate = new Date(program.startDate);
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const todayDayNumber = Math.min(28, Math.max(1, diffDays + 1));

      set({
        program,
        selectedDay: todayDayNumber,
        isGenerating: false,
      });

      return program;
    } catch (error) {
      console.error('[ProgramStore] generateProgram error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate program';
      set({ error: message, isGenerating: false });
      throw error;
    }
  },

  loadProgram: async () => {
    set({ isLoading: true, error: null });

    try {
      const stored = await SecureStore.getItemAsync(PROGRAM_KEY);

      if (stored) {
        const program = JSON.parse(stored) as Program;

        // Calculate which day is today
        const today = new Date();
        const startDate = new Date(program.startDate);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const todayDayNumber = Math.min(28, Math.max(1, diffDays + 1));

        set({
          program,
          selectedDay: todayDayNumber,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[ProgramStore] loadProgram error:', error);
      set({ error: 'Failed to load program', isLoading: false });
    }
  },

  clearProgram: async () => {
    try {
      await SecureStore.deleteItemAsync(PROGRAM_KEY);
      set({ program: null, selectedDay: 1, preview: null });
    } catch (error) {
      console.error('[ProgramStore] clearProgram error:', error);
    }
  },

  generatePreview: (options) => {
    const preview = generateProgramPreview(options);
    set({ preview });
  },

  // ============================================================================
  // NAVIGATION ACTIONS
  // ============================================================================

  setSelectedDay: (day: number) => {
    set({ selectedDay: Math.min(28, Math.max(1, day)) });
  },

  goToToday: () => {
    const { program } = get();
    if (!program) return;

    const today = new Date();
    const startDate = new Date(program.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const todayDayNumber = Math.min(28, Math.max(1, diffDays + 1));

    set({ selectedDay: todayDayNumber });
  },

  // ============================================================================
  // DAY MANAGEMENT ACTIONS
  // ============================================================================

  completeDay: async (dayNumber: number) => {
    const { program } = get();
    if (!program) return;

    const updatedDays = program.days.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            isCompleted: true,
            completedAt: new Date().toISOString(),
            exercises: day.exercises.map((ex) => ({ ...ex, isCompleted: true })),
          }
        : day
    );

    // Calculate new stats
    const completedDays = updatedDays.filter((d) => d.isCompleted).length;
    const completedWorkouts = updatedDays.filter((d) => !d.isRestDay && d.isCompleted).length;

    // Calculate streak
    let streak = 0;
    for (let i = dayNumber - 1; i >= 0; i--) {
      if (updatedDays[i]?.isCompleted) {
        streak++;
      } else if (!updatedDays[i]?.isRestDay) {
        break;
      } else {
        streak++; // Count rest days as part of streak
      }
    }

    const updatedProgram: Program = {
      ...program,
      days: updatedDays,
      completedDays,
      completedWorkouts,
      streakDays: Math.max(program.streakDays, streak),
      currentDay: Math.max(program.currentDay, dayNumber),
      updatedAt: new Date().toISOString(),
    };

    set({ program: updatedProgram });
    await SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(updatedProgram));
  },

  skipDay: async (dayNumber: number) => {
    const { program } = get();
    if (!program) return;

    const updatedDays = program.days.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            isCompleted: true,
            exercises: day.exercises.map((ex) => ({ ...ex, isSkipped: true })),
          }
        : day
    );

    const completedDays = updatedDays.filter((d) => d.isCompleted).length;

    const updatedProgram: Program = {
      ...program,
      days: updatedDays,
      completedDays,
      currentDay: Math.max(program.currentDay, dayNumber),
      streakDays: 0, // Skipping breaks the streak
      updatedAt: new Date().toISOString(),
    };

    set({ program: updatedProgram });
    await SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(updatedProgram));
  },

  uncompleteDay: async (dayNumber: number) => {
    const { program } = get();
    if (!program) return;

    const updatedDays = program.days.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            isCompleted: false,
            completedAt: undefined,
            exercises: day.exercises.map((ex) => ({ ...ex, isCompleted: false, isSkipped: false })),
          }
        : day
    );

    const completedDays = updatedDays.filter((d) => d.isCompleted).length;
    const completedWorkouts = updatedDays.filter((d) => !d.isRestDay && d.isCompleted).length;

    const updatedProgram: Program = {
      ...program,
      days: updatedDays,
      completedDays,
      completedWorkouts,
      updatedAt: new Date().toISOString(),
    };

    set({ program: updatedProgram });
    await SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(updatedProgram));
  },

  // ============================================================================
  // EXERCISE MANAGEMENT ACTIONS
  // ============================================================================

  completeExercise: (dayNumber: number, exerciseId: string) => {
    const { program } = get();
    if (!program) return;

    const updatedDays = program.days.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.exerciseId === exerciseId ? { ...ex, isCompleted: true, isSkipped: false } : ex
            ),
          }
        : day
    );

    const updatedProgram: Program = {
      ...program,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    set({ program: updatedProgram });
    SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(updatedProgram));
  },

  skipExercise: (dayNumber: number, exerciseId: string) => {
    const { program } = get();
    if (!program) return;

    const updatedDays = program.days.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.exerciseId === exerciseId ? { ...ex, isSkipped: true, isCompleted: false } : ex
            ),
          }
        : day
    );

    const updatedProgram: Program = {
      ...program,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    set({ program: updatedProgram });
    SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(updatedProgram));
  },

  // ============================================================================
  // SELECTORS
  // ============================================================================

  getTodayDayNumber: () => {
    const { program } = get();
    if (!program) return 1;

    const today = new Date();
    const startDate = new Date(program.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(28, Math.max(1, diffDays + 1));
  },

  getCurrentDay: () => {
    const { program } = get();
    if (!program) return null;

    const todayDayNumber = get().getTodayDayNumber();
    return program.days.find((d) => d.dayNumber === todayDayNumber) || null;
  },

  getSelectedDayData: () => {
    const { program, selectedDay } = get();
    if (!program) return null;
    return program.days.find((d) => d.dayNumber === selectedDay) || null;
  },

  getDayByNumber: (dayNumber: number) => {
    const { program } = get();
    if (!program) return null;
    return program.days.find((d) => d.dayNumber === dayNumber) || null;
  },

  getWeekDays: (weekNumber: number) => {
    const { program } = get();
    if (!program) return [];
    return program.days.filter((d) => d.weekNumber === weekNumber);
  },

  getStats: (): ProgramStats => {
    const { program } = get();
    if (!program) {
      return {
        totalDays: 28,
        completedDays: 0,
        completedWorkouts: 0,
        skippedWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageWorkoutDuration: 0,
        completionPercentage: 0,
        weeklyStats: [],
      };
    }

    const completedWorkoutDays = program.days.filter((d) => !d.isRestDay && d.isCompleted);
    const skippedWorkoutDays = program.days.filter(
      (d) => !d.isRestDay && d.exercises.some((ex) => ex.isSkipped) && !d.exercises.some((ex) => ex.isCompleted)
    );

    const totalMinutes = completedWorkoutDays.reduce((sum, d) => sum + (d.actualDuration || d.estimatedDuration), 0);
    const totalCalories = completedWorkoutDays.reduce((sum, d) => sum + d.estimatedCalories, 0);

    // Calculate weekly stats
    const weeklyStats = [1, 2, 3, 4].map((weekNum) => {
      const weekDays = program.days.filter((d) => d.weekNumber === weekNum);
      const workoutDays = weekDays.filter((d) => !d.isRestDay);
      const completedInWeek = workoutDays.filter((d) => d.isCompleted);

      return {
        weekNumber: weekNum,
        completedWorkouts: completedInWeek.length,
        totalWorkouts: workoutDays.length,
        totalMinutes: completedInWeek.reduce((sum, d) => sum + (d.actualDuration || d.estimatedDuration), 0),
        totalCalories: completedInWeek.reduce((sum, d) => sum + d.estimatedCalories, 0),
      };
    });

    // Calculate current streak
    let currentStreak = 0;
    const todayDayNum = get().getTodayDayNumber();
    for (let i = todayDayNum - 1; i >= 0; i--) {
      const day = program.days[i];
      if (!day) break;
      if (day.isCompleted) {
        currentStreak++;
      } else if (!day.isRestDay) {
        break;
      } else {
        currentStreak++;
      }
    }

    return {
      totalDays: 28,
      completedDays: program.completedDays,
      completedWorkouts: program.completedWorkouts,
      skippedWorkouts: skippedWorkoutDays.length,
      totalMinutes,
      totalCalories,
      currentStreak,
      longestStreak: Math.max(program.streakDays, currentStreak),
      averageWorkoutDuration: completedWorkoutDays.length > 0 ? Math.round(totalMinutes / completedWorkoutDays.length) : 0,
      completionPercentage: Math.round((program.completedDays / 28) * 100),
      weeklyStats,
    };
  },

  getPhaseProgress: () => {
    const { program } = get();
    if (!program) {
      return { phase: 'Foundation', color: PHASE_COLORS.FOUNDATION, progress: 0 };
    }

    const todayDayNum = get().getTodayDayNumber();
    const phaseInfo = getPhaseForDay(todayDayNum);

    // Calculate progress within the phase
    const phaseDays = program.days.filter((d) => phaseInfo.weekNumbers.includes(d.weekNumber));
    const completedPhaseDays = phaseDays.filter((d) => d.isCompleted).length;
    const progress = phaseDays.length > 0 ? Math.round((completedPhaseDays / phaseDays.length) * 100) : 0;

    return {
      phase: phaseInfo.name,
      color: PHASE_COLORS[phaseInfo.phase],
      progress,
    };
  },

  getStreakInfo: () => {
    const { program } = get();
    if (!program) {
      return { current: 0, longest: 0 };
    }

    const stats = get().getStats();
    return {
      current: stats.currentStreak,
      longest: stats.longestStreak,
    };
  },

  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================

  clearError: () => set({ error: null }),

  reset: () => {
    SecureStore.deleteItemAsync(PROGRAM_KEY);
    set({
      program: null,
      selectedDay: 1,
      preview: null,
      isLoading: false,
      isGenerating: false,
      error: null,
    });
  },
}));

// ============================================================================
// STANDALONE SELECTORS
// ============================================================================

export const selectProgram = (state: ProgramState) => state.program;
export const selectSelectedDay = (state: ProgramState) => state.selectedDay;
export const selectIsLoading = (state: ProgramState) => state.isLoading;
export const selectIsGenerating = (state: ProgramState) => state.isGenerating;
export const selectError = (state: ProgramState) => state.error;
export const selectPreview = (state: ProgramState) => state.preview;
