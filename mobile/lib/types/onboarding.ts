/**
 * Onboarding API Types
 *
 * Shared type definitions for the onboarding flow.
 * These types are used by both the store and API service.
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type PrimaryGoal = 'lose_weight' | 'build_muscle' | 'get_fitter' | 'maintain';

export type PastObstacle = 'no_plan' | 'no_guidance' | 'gave_up' | 'inconsistent' | 'first_attempt';

export type Challenge =
  | 'finding_time'
  | 'not_knowing_exercises'
  | 'staying_motivated'
  | 'no_accountability'
  | 'tracking_food'
  | 'planning_workouts';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Equipment =
  | 'barbells'
  | 'dumbbells'
  | 'kettlebells'
  | 'gym_machines'
  | 'resistance_bands'
  | 'bodyweight_only';

export type Day =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'super_active';

export type UnitSystem = 'metric' | 'imperial';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface OnboardingRequest {
  name: string;
  primaryGoal: PrimaryGoal;
  pastObstacle: PastObstacle;
  challenges: Challenge[];
  fitnessLevel: FitnessLevel;
  workoutPreferences: {
    durationMinutes: number;
    equipment: Equipment[];
    preferredTime: string;
    preferredDays: Day[];
  };
  bodyMetrics: {
    gender: Gender;
    age: number;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number;
    activityLevel: ActivityLevel;
    weeklyWeightChangeKg: number;
  };
  unitSystem: UnitSystem;
}

export interface WorkoutScheduleItem {
  day: Day;
  workoutType: string;
  durationMinutes: number;
}

export interface PersonalizedPlan {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  weeklyWorkouts: number;
  workoutSchedule: WorkoutScheduleItem[];
  bmr: number;
  tdee: number;
  estimatedEndDate: string;
  weeklyWeightChange: number;
}

export interface OnboardingUser {
  id: string;
  name: string;
  email: string;
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: string | null;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  data: {
    user: OnboardingUser;
    plan: PersonalizedPlan;
  };
}

export interface OnboardingStatusResponse {
  success: boolean;
  data: {
    hasCompletedOnboarding: boolean;
    completedAt: string | null;
    currentStep: number | null;
  };
}

export interface OnboardingProgressResponse {
  success: boolean;
  data: {
    currentStep: number;
    partialData: Partial<OnboardingRequest>;
    savedAt: string;
  } | null;
}

export interface SaveProgressResponse {
  success: boolean;
  data: {
    savedAt: string;
    currentStep: number;
  };
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALID_DURATIONS = [15, 30, 45, 60, 90] as const;
export const VALID_WEIGHT_RATES = [0.25, 0.5, 0.75, 1.0, 1.5] as const;
export const AGE_RANGE = { min: 16, max: 80 } as const;
export const HEIGHT_RANGE_CM = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE_KG = { min: 30, max: 300 } as const;

// ============================================================================
// UNIT CONVERSION HELPERS
// ============================================================================

export const unitConversion = {
  // Height: inches to cm
  inchesToCm: (inches: number): number => inches * 2.54,
  cmToInches: (cm: number): number => cm / 2.54,

  // Weight: lb to kg
  lbToKg: (lb: number): number => lb / 2.205,
  kgToLb: (kg: number): number => kg * 2.205,

  // Height: feet and inches to cm
  feetInchesToCm: (feet: number, inches: number): number => (feet * 12 + inches) * 2.54,
  cmToFeetInches: (cm: number): { feet: number; inches: number } => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  },
};
