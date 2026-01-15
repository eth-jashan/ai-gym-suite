/**
 * 28-Day Program Types
 *
 * Type definitions for the 28-day workout program feature.
 * Supports program phases, progressive overload, and detailed exercise information.
 */

import { SplitType, ExerciseCategory, MovementPattern, WorkoutExercise } from './workout';

// ============================================================================
// PROGRAM PHASES
// ============================================================================

export type ProgramPhase = 'FOUNDATION' | 'BUILD' | 'INTENSITY' | 'DELOAD';

export interface PhaseInfo {
  phase: ProgramPhase;
  name: string;
  description: string;
  weekNumbers: number[];
  intensity: number; // 1-10
  volume: number; // 1-10
  focus: string;
}

export const PROGRAM_PHASES: PhaseInfo[] = [
  {
    phase: 'FOUNDATION',
    name: 'Foundation',
    description: 'Build proper form and establish training habits',
    weekNumbers: [1, 2],
    intensity: 6,
    volume: 7,
    focus: 'Form & Consistency',
  },
  {
    phase: 'BUILD',
    name: 'Build',
    description: 'Progressive strength and muscle development',
    weekNumbers: [3, 4],
    intensity: 7,
    volume: 8,
    focus: 'Strength & Size',
  },
  {
    phase: 'INTENSITY',
    name: 'Intensity',
    description: 'Push your limits with challenging workouts',
    weekNumbers: [5, 6],
    intensity: 9,
    volume: 8,
    focus: 'Peak Performance',
  },
  {
    phase: 'DELOAD',
    name: 'Deload',
    description: 'Active recovery to consolidate gains',
    weekNumbers: [7, 8],
    intensity: 5,
    volume: 5,
    focus: 'Recovery & Growth',
  },
];

// ============================================================================
// EXERCISE DETAIL TYPES
// ============================================================================

export interface ExerciseInstruction {
  step: number;
  text: string;
}

export interface ExerciseTip {
  type: 'form' | 'breathing' | 'common_mistake' | 'progression';
  text: string;
}

export interface DetailedExercise {
  id: string;
  name: string;
  slug: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficultyLevel: number; // 1-5
  equipmentRequired: string[];

  // Detailed instructions
  description: string;
  setupInstructions: string;
  executionSteps: ExerciseInstruction[];
  tips: ExerciseTip[];

  // Form cues
  formCues: string[];
  commonMistakes: string[];

  // Media (placeholder URLs for now)
  thumbnailUrl?: string;
  videoUrl?: string;
  animationUrl?: string;

  // Metrics
  caloriesPerMinute: number;
  recommendedSets: { min: number; max: number };
  recommendedReps: { min: number; max: number };
  restSeconds: { min: number; max: number };
}

// ============================================================================
// PROGRAM DAY TYPES
// ============================================================================

export interface ProgramDayExercise extends WorkoutExercise {
  exerciseDetails?: DetailedExercise;
  isCompleted: boolean;
  isSkipped: boolean;
  notes?: string;
}

export interface ProgramDay {
  dayNumber: number; // 1-28
  weekNumber: number; // 1-4
  dayOfWeek: number; // 0-6 (Sun-Sat)
  date: string; // ISO date

  isRestDay: boolean;
  isCompleted: boolean;

  // Workout info (if not rest day)
  splitType?: SplitType;
  title: string;
  subtitle: string;
  focusMuscles: string[];
  exercises: ProgramDayExercise[];
  estimatedDuration: number; // minutes
  estimatedCalories: number;

  // Phase info
  phase: ProgramPhase;
  phaseWeek: number; // Week within phase (1 or 2)

  // Progress
  completedAt?: string;
  actualDuration?: number;
}

// ============================================================================
// 28-DAY PROGRAM
// ============================================================================

export interface Program {
  id: string;
  userId: string;
  name: string;
  description: string;

  // Schedule
  startDate: string;
  endDate: string;
  daysPerWeek: number;
  workoutDays: number[]; // 0-6 array

  // Content
  days: ProgramDay[];
  totalWorkouts: number;
  totalRestDays: number;

  // Progress
  currentDay: number;
  completedDays: number;
  completedWorkouts: number;
  streakDays: number;

  // Meta
  generatedAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ============================================================================
// PROGRAM STATS
// ============================================================================

export interface ProgramStats {
  totalDays: number;
  completedDays: number;
  completedWorkouts: number;
  skippedWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  currentStreak: number;
  longestStreak: number;
  averageWorkoutDuration: number;
  completionPercentage: number;

  // Weekly breakdown
  weeklyStats: {
    weekNumber: number;
    completedWorkouts: number;
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
  }[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getPhaseForDay(dayNumber: number): PhaseInfo {
  const weekNumber = Math.ceil(dayNumber / 7);
  const phase = PROGRAM_PHASES.find(p => p.weekNumbers.includes(weekNumber));
  return phase || PROGRAM_PHASES[0];
}

export function getPhaseForWeek(weekNumber: number): PhaseInfo {
  const phase = PROGRAM_PHASES.find(p => p.weekNumbers.includes(weekNumber));
  return phase || PROGRAM_PHASES[0];
}

export function getDayProgress(day: ProgramDay): number {
  if (day.isRestDay || day.isCompleted) return 100;
  if (!day.exercises.length) return 0;

  const completed = day.exercises.filter(e => e.isCompleted).length;
  return Math.round((completed / day.exercises.length) * 100);
}

export function getProgramProgress(program: Program): number {
  return Math.round((program.completedDays / 28) * 100);
}

export const PHASE_COLORS: Record<ProgramPhase, string> = {
  FOUNDATION: '#10B981', // Green
  BUILD: '#3B82F6', // Blue
  INTENSITY: '#F97316', // Orange
  DELOAD: '#8B5CF6', // Purple
};

export const PHASE_ICONS: Record<ProgramPhase, string> = {
  FOUNDATION: 'leaf',
  BUILD: 'trending-up',
  INTENSITY: 'flame',
  DELOAD: 'sparkles',
};
