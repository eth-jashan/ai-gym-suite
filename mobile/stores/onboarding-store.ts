import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export type PrimaryGoal = 'lose_weight' | 'build_muscle' | 'get_fitter' | 'maintain';
export type PastObstacle = 'no_plan' | 'no_guidance' | 'gave_up' | 'inconsistent' | 'first_attempt';
export type Challenge = 'finding_time' | 'not_knowing_exercises' | 'staying_motivated' | 'no_accountability' | 'tracking_food' | 'planning_workouts';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'barbells' | 'dumbbells' | 'kettlebells' | 'gym_machines' | 'resistance_bands' | 'bodyweight_only';
export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'super_active';

export interface WorkoutDay {
  day: Day;
  workoutType: string;
  durationMinutes: number;
}

export interface CalculatedPlan {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  weeklyWorkouts: number;
  workoutSchedule: WorkoutDay[];
  estimatedEndDate: Date;
  bmr: number;
  tdee: number;
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  super_active: 1.9,
};

// ============================================================================
// STORE
// ============================================================================

interface OnboardingState {
  // Progress
  currentStep: number;
  totalSteps: number;

  // User Data
  name: string;

  // Goals & Motivation
  primaryGoal: PrimaryGoal | null;
  pastObstacle: PastObstacle | null;
  challenges: Challenge[];

  // Experience
  fitnessLevel: FitnessLevel | null;

  // Workout Preferences
  workoutDuration: number | null;
  equipment: Equipment[];
  workoutTime: string | null;
  workoutDays: Day[];

  // Body Metrics
  gender: Gender | null;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  activityLevel: ActivityLevel | null;
  weightLossRate: number | null;

  // Preferences
  unitSystem: 'metric' | 'imperial';

  // Computed
  calculatedPlan: CalculatedPlan | null;

  // Actions
  setName: (name: string) => void;
  setPrimaryGoal: (goal: PrimaryGoal) => void;
  setPastObstacle: (obstacle: PastObstacle) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setFitnessLevel: (level: FitnessLevel) => void;
  setWorkoutDuration: (duration: number) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setWorkoutTime: (time: string) => void;
  setWorkoutDays: (days: Day[]) => void;
  setGender: (gender: Gender) => void;
  setAge: (age: number) => void;
  setHeight: (height: number) => void;
  setCurrentWeight: (weight: number) => void;
  setTargetWeight: (weight: number) => void;
  setActivityLevel: (level: ActivityLevel) => void;
  setWeightLossRate: (rate: number) => void;
  setUnitSystem: (system: 'metric' | 'imperial') => void;

  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  calculatePlan: () => void;
  resetOnboarding: () => void;
}

const TOTAL_STEPS = 22;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  // Initial State
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  name: '',
  primaryGoal: null,
  pastObstacle: null,
  challenges: [],
  fitnessLevel: null,
  workoutDuration: null,
  equipment: [],
  workoutTime: '08:00',
  workoutDays: [],
  gender: null,
  age: null,
  height: null,
  currentWeight: null,
  targetWeight: null,
  activityLevel: null,
  weightLossRate: 0.5,
  unitSystem: 'metric',
  calculatedPlan: null,

  // Setters
  setName: (name) => set({ name }),
  setPrimaryGoal: (primaryGoal) => set({ primaryGoal }),
  setPastObstacle: (pastObstacle) => set({ pastObstacle }),
  setChallenges: (challenges) => set({ challenges }),
  setFitnessLevel: (fitnessLevel) => set({ fitnessLevel }),
  setWorkoutDuration: (workoutDuration) => set({ workoutDuration }),
  setEquipment: (equipment) => set({ equipment }),
  setWorkoutTime: (workoutTime) => set({ workoutTime }),
  setWorkoutDays: (workoutDays) => set({ workoutDays }),
  setGender: (gender) => set({ gender }),
  setAge: (age) => set({ age }),
  setHeight: (height) => set({ height }),
  setCurrentWeight: (currentWeight) => set({ currentWeight }),
  setTargetWeight: (targetWeight) => set({ targetWeight }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
  setWeightLossRate: (weightLossRate) => set({ weightLossRate }),
  setUnitSystem: (unitSystem) => set({ unitSystem }),

  // Navigation
  goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  // Calculate personalized plan
  calculatePlan: () => {
    const state = get();
    const { gender, age, height, currentWeight, targetWeight, activityLevel, weightLossRate, workoutDays, workoutDuration, primaryGoal } = state;

    if (!gender || !age || !height || !currentWeight || !targetWeight || !activityLevel || !weightLossRate) {
      return;
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE
    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

    // Calculate daily calorie deficit/surplus
    const weeklyChange = weightLossRate * 7700; // 7700 kcal = 1kg
    const dailyChange = weeklyChange / 7;

    let dailyCalories: number;
    if (primaryGoal === 'lose_weight') {
      dailyCalories = Math.round(tdee - dailyChange);
    } else if (primaryGoal === 'build_muscle') {
      dailyCalories = Math.round(tdee + 300); // Slight surplus for muscle gain
    } else {
      dailyCalories = Math.round(tdee);
    }

    // Calculate macros (standard distribution)
    const protein = Math.round(currentWeight * 2); // 2g per kg
    const fat = Math.round((dailyCalories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);

    // Calculate estimated end date
    const weightToChange = Math.abs(currentWeight - targetWeight);
    const weeksToGoal = weightToChange / weightLossRate;
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + weeksToGoal * 7);

    // Generate workout schedule
    const workoutTypes = ['Upper Body', 'Lower Body', 'Full Body', 'Cardio + Core', 'Push', 'Pull'];
    const workoutSchedule: WorkoutDay[] = workoutDays.map((day, index) => ({
      day,
      workoutType: workoutTypes[index % workoutTypes.length],
      durationMinutes: workoutDuration || 45,
    }));

    set({
      calculatedPlan: {
        dailyCalories,
        protein,
        carbs,
        fat,
        weeklyWorkouts: workoutDays.length,
        workoutSchedule,
        estimatedEndDate,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      },
    });
  },

  // Reset
  resetOnboarding: () =>
    set({
      currentStep: 1,
      name: '',
      primaryGoal: null,
      pastObstacle: null,
      challenges: [],
      fitnessLevel: null,
      workoutDuration: null,
      equipment: [],
      workoutTime: '08:00',
      workoutDays: [],
      gender: null,
      age: null,
      height: null,
      currentWeight: null,
      targetWeight: null,
      activityLevel: null,
      weightLossRate: 0.5,
      unitSystem: 'metric',
      calculatedPlan: null,
    }),
}));
