/**
 * Workout API Types
 *
 * Shared type definitions for the workout flow.
 * These types are used by the workout store, API service, and components.
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type SplitType =
  | 'FULL_BODY'
  | 'UPPER_BODY'
  | 'LOWER_BODY'
  | 'PUSH'
  | 'PULL'
  | 'LEGS'
  | 'CHEST_TRICEPS'
  | 'BACK_BICEPS'
  | 'SHOULDERS_ARMS'
  | 'CORE'
  | 'CARDIO'
  | 'HIIT'
  | 'ACTIVE_RECOVERY';

export type ExerciseCategory =
  | 'STRENGTH'
  | 'CARDIO'
  | 'FLEXIBILITY'
  | 'BALANCE'
  | 'PLYOMETRIC'
  | 'CALISTHENICS';

export type MovementPattern =
  | 'HORIZONTAL_PUSH'
  | 'HORIZONTAL_PULL'
  | 'VERTICAL_PUSH'
  | 'VERTICAL_PULL'
  | 'SQUAT'
  | 'HINGE'
  | 'LUNGE'
  | 'CARRY'
  | 'ROTATION'
  | 'ANTI_ROTATION'
  | 'FLEXION'
  | 'EXTENSION'
  | 'ISOLATION'
  | 'CARDIO';

export type WorkoutStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'PARTIAL';

export type ExerciseStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficultyLevel: number; // 1-5
  equipmentRequired: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  formCues?: string[];
  commonMistakes?: string[];
}

export interface WorkoutExercise {
  id?: string;
  exerciseId: string;
  // Exercise name - either flat (from API) or nested in exercise object (from mock)
  name?: string;
  exercise?: Exercise; // Optional - full exercise details
  // Sets/reps - API uses sets/reps, mock uses targetSets/targetReps
  sets?: number;
  reps?: string; // e.g., "8-12" or "12"
  targetSets?: number;
  targetReps?: string;
  restSeconds: number;
  // Order - API uses order, mock uses orderIndex
  order?: number;
  orderIndex?: number;
  status?: ExerciseStatus;
  notes?: string;
}

export interface WorkoutDay {
  dayIndex: number;
  dayName: string;
  splitType: SplitType;
  focusMuscles: string[];
  exercises: WorkoutExercise[];
  estimatedDuration: number; // minutes
}

export interface WeeklyPlan {
  id: string;
  splitType: string;
  daysPerWeek: number;
  days: WorkoutDay[];
  totalExercises: number;
  generatedAt: string;
  weekNumber: number;
  startDate: string;
}

export interface Workout {
  id: string;
  scheduledDate: string;
  dayOfWeek: number; // 0-6
  workoutType: SplitType;
  title: string;
  focusMuscles: string[];
  estimatedDuration: number;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];
  startedAt?: string;
  completedAt?: string;
  totalVolume?: number;
  averageRpe?: number;
  userNotes?: string;
}

// ============================================================================
// SET LOGGING TYPES
// ============================================================================

export interface SetLog {
  setNumber: number;
  repsCompleted: number;
  weightUsed: number | null;
  rpe: number | null; // 1-10
  isWarmup: boolean;
  notes?: string;
  loggedAt: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  totalVolume: number;
  personalBest?: {
    weight: number;
    reps: number;
    date: string;
  };
}

// ============================================================================
// ACTIVE WORKOUT SESSION
// ============================================================================

export interface ActiveWorkoutSession {
  workoutId: string;
  workout: Workout;
  startedAt: string;
  currentExerciseIndex: number;
  currentSetNumber: number;
  exerciseLogs: Map<string, SetLog[]>;
  isPaused: boolean;
  pausedAt?: string;
  totalPausedTime: number; // milliseconds
  restTimerEnd?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SuggestionStatusResponse {
  embedding: {
    provider: string;
    dimensions: number;
    available: boolean;
  };
  user: {
    hasProfile: boolean;
    hasPreferences: boolean;
    hasHealth: boolean;
    ready: boolean;
  };
}

export interface WeeklyPlanResponse {
  success: boolean;
  plan: WeeklyPlan;
  planId?: string;
  message?: string;
}

export interface WorkoutListResponse {
  workouts: Workout[];
}

export interface LogSetRequest {
  setNumber: number;
  repsCompleted: number;
  weightUsed?: number;
  rpe?: number;
  formRating?: number;
  notes?: string;
}

export interface LogSetResponse {
  success: boolean;
  setId: string;
  exerciseLog: {
    totalSets: number;
    totalVolume: number;
  };
}

export interface CompleteWorkoutRequest {
  userNotes?: string;
  averageRpe?: number;
}

export interface CompleteWorkoutResponse {
  success: boolean;
  workout: Workout;
  stats: WorkoutStats;
}

export interface WorkoutStats {
  duration: number; // seconds
  exercisesCompleted: number;
  totalSets: number;
  totalVolume: number;
  averageRpe: number;
  caloriesBurned: number;
  personalRecords: PersonalRecord[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'volume';
  newValue: number;
  previousValue: number;
  improvement: number;
}

export interface SimilarExercisesResponse {
  exerciseId: string;
  count: number;
  similar: Array<{
    id: string;
    name: string;
    primaryMuscles: string[];
    similarity: number;
    difficultyLevel: number;
    equipmentRequired: string[];
  }>;
}

export interface SearchExercisesRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SearchExercisesResponse {
  query: string;
  count: number;
  results: Array<Exercise & { similarity: number }>;
}

export interface ScoredExercisesResponse {
  muscles: string[];
  count: number;
  exercises: Array<{
    id: string;
    name: string;
    score: number;
    scoreBreakdown: {
      goalMatch: number;
      difficultyMatch: number;
      equipmentMatch: number;
      locationMatch: number;
      experienceMatch: number;
      semanticMatch: number;
    };
  }>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface MuscleGroup {
  id: string;
  name: string;
  color: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', color: '#EF4444' },
  { id: 'back', name: 'Back', color: '#3B82F6' },
  { id: 'shoulders', name: 'Shoulders', color: '#8B5CF6' },
  { id: 'biceps', name: 'Biceps', color: '#EC4899' },
  { id: 'triceps', name: 'Triceps', color: '#F97316' },
  { id: 'forearms', name: 'Forearms', color: '#84CC16' },
  { id: 'core', name: 'Core', color: '#14B8A6' },
  { id: 'quadriceps', name: 'Quads', color: '#06B6D4' },
  { id: 'hamstrings', name: 'Hamstrings', color: '#6366F1' },
  { id: 'glutes', name: 'Glutes', color: '#A855F7' },
  { id: 'calves', name: 'Calves', color: '#F43F5E' },
];

export const SPLIT_TYPE_COLORS: Record<SplitType, string> = {
  FULL_BODY: '#10B981',
  UPPER_BODY: '#3B82F6',
  LOWER_BODY: '#8B5CF6',
  PUSH: '#F97316',
  PULL: '#06B6D4',
  LEGS: '#A855F7',
  CHEST_TRICEPS: '#EF4444',
  BACK_BICEPS: '#3B82F6',
  SHOULDERS_ARMS: '#EC4899',
  CORE: '#14B8A6',
  CARDIO: '#F43F5E',
  HIIT: '#EAB308',
  ACTIVE_RECOVERY: '#22C55E',
};

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  FULL_BODY: 'Full Body',
  UPPER_BODY: 'Upper Body',
  LOWER_BODY: 'Lower Body',
  PUSH: 'Push',
  PULL: 'Pull',
  LEGS: 'Legs',
  CHEST_TRICEPS: 'Chest & Triceps',
  BACK_BICEPS: 'Back & Biceps',
  SHOULDERS_ARMS: 'Shoulders & Arms',
  CORE: 'Core',
  CARDIO: 'Cardio',
  HIIT: 'HIIT',
  ACTIVE_RECOVERY: 'Active Recovery',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatRestTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  return `${secs}s`;
}

export function calculateVolume(sets: SetLog[]): number {
  return sets.reduce((total, set) => {
    if (set.weightUsed && !set.isWarmup) {
      return total + set.repsCompleted * set.weightUsed;
    }
    return total;
  }, 0);
}

export function parseRepsRange(reps: string): { min: number; max: number } {
  if (reps.includes('-')) {
    const [min, max] = reps.split('-').map(Number);
    return { min, max };
  }
  const value = parseInt(reps, 10);
  return { min: value, max: value };
}

export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
}

export function getShortDayName(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex] || '';
}
