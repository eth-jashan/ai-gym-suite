/**
 * 28-Day Program Generator
 *
 * Generates personalized 28-day workout programs based on user preferences,
 * fitness level, goals, and available equipment.
 */

import { SplitType } from '../types/workout';
import {
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramPhase,
  getPhaseForDay,
  PROGRAM_PHASES,
} from '../types/program';
import {
  EXERCISES_DATABASE,
  getExercisesByMuscle,
  getExercisesByEquipment,
  getExercisesByDifficulty,
  DetailedExercise,
} from '../data/exercises-database';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgramGeneratorOptions {
  userId: string;
  userName: string;
  daysPerWeek: number; // 3-6
  workoutDays: number[]; // 0-6 (Sun=0)
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'lose_weight' | 'build_muscle' | 'get_fitter' | 'maintain';
  workoutDuration: number; // minutes
  equipment: string[];
  startDate?: Date;
}

interface WorkoutTemplate {
  splitType: SplitType;
  title: string;
  focusMuscles: string[];
  exerciseCount: number;
}

// ============================================================================
// SPLIT CONFIGURATIONS
// ============================================================================

const SPLIT_CONFIGS: Record<number, WorkoutTemplate[]> = {
  3: [
    { splitType: 'FULL_BODY', title: 'Full Body A', focusMuscles: ['Chest', 'Back', 'Quadriceps'], exerciseCount: 6 },
    { splitType: 'FULL_BODY', title: 'Full Body B', focusMuscles: ['Shoulders', 'Hamstrings', 'Core'], exerciseCount: 6 },
    { splitType: 'FULL_BODY', title: 'Full Body C', focusMuscles: ['Back', 'Glutes', 'Biceps'], exerciseCount: 6 },
  ],
  4: [
    { splitType: 'UPPER_BODY', title: 'Upper Body A', focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseCount: 6 },
    { splitType: 'LOWER_BODY', title: 'Lower Body A', focusMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'], exerciseCount: 6 },
    { splitType: 'UPPER_BODY', title: 'Upper Body B', focusMuscles: ['Back', 'Biceps', 'Shoulders'], exerciseCount: 6 },
    { splitType: 'LOWER_BODY', title: 'Lower Body B', focusMuscles: ['Glutes', 'Hamstrings', 'Calves'], exerciseCount: 6 },
  ],
  5: [
    { splitType: 'PUSH', title: 'Push Day', focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseCount: 6 },
    { splitType: 'PULL', title: 'Pull Day', focusMuscles: ['Back', 'Biceps'], exerciseCount: 6 },
    { splitType: 'LEGS', title: 'Leg Day', focusMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'], exerciseCount: 6 },
    { splitType: 'UPPER_BODY', title: 'Upper Strength', focusMuscles: ['Chest', 'Back', 'Shoulders'], exerciseCount: 5 },
    { splitType: 'CORE', title: 'Core & Conditioning', focusMuscles: ['Core'], exerciseCount: 5 },
  ],
  6: [
    { splitType: 'PUSH', title: 'Push A', focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseCount: 6 },
    { splitType: 'PULL', title: 'Pull A', focusMuscles: ['Back', 'Biceps'], exerciseCount: 6 },
    { splitType: 'LEGS', title: 'Legs A', focusMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'], exerciseCount: 6 },
    { splitType: 'PUSH', title: 'Push B', focusMuscles: ['Shoulders', 'Chest', 'Triceps'], exerciseCount: 5 },
    { splitType: 'PULL', title: 'Pull B', focusMuscles: ['Back', 'Biceps', 'Core'], exerciseCount: 5 },
    { splitType: 'LEGS', title: 'Legs B', focusMuscles: ['Glutes', 'Calves', 'Core'], exerciseCount: 5 },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDifficultyForPhase(phase: ProgramPhase, fitnessLevel: string): number {
  const baseDifficulty: Record<string, number> = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
  };

  const phaseModifier: Record<ProgramPhase, number> = {
    FOUNDATION: 0,
    BUILD: 1,
    INTENSITY: 1,
    DELOAD: -1,
  };

  const base = baseDifficulty[fitnessLevel] || 2;
  const modifier = phaseModifier[phase] || 0;
  return Math.min(5, Math.max(1, base + modifier));
}

function getSetsForPhase(phase: ProgramPhase, goal: string): number {
  const baseSets: Record<string, number> = {
    lose_weight: 3,
    build_muscle: 4,
    get_fitter: 3,
    maintain: 3,
  };

  const phaseModifier: Record<ProgramPhase, number> = {
    FOUNDATION: 0,
    BUILD: 1,
    INTENSITY: 1,
    DELOAD: -1,
  };

  return Math.max(2, (baseSets[goal] || 3) + (phaseModifier[phase] || 0));
}

function getRepsForGoal(goal: string, phase: ProgramPhase): string {
  const repsConfig: Record<string, Record<ProgramPhase, string>> = {
    lose_weight: {
      FOUNDATION: '12-15',
      BUILD: '10-12',
      INTENSITY: '15-20',
      DELOAD: '12-15',
    },
    build_muscle: {
      FOUNDATION: '10-12',
      BUILD: '8-10',
      INTENSITY: '6-8',
      DELOAD: '12-15',
    },
    get_fitter: {
      FOUNDATION: '12-15',
      BUILD: '10-12',
      INTENSITY: '8-10',
      DELOAD: '12-15',
    },
    maintain: {
      FOUNDATION: '10-12',
      BUILD: '10-12',
      INTENSITY: '10-12',
      DELOAD: '12-15',
    },
  };

  return repsConfig[goal]?.[phase] || '10-12';
}

function getRestForGoal(goal: string): number {
  const restConfig: Record<string, number> = {
    lose_weight: 45,
    build_muscle: 90,
    get_fitter: 60,
    maintain: 60,
  };
  return restConfig[goal] || 60;
}

function selectExercisesForMuscles(
  muscles: string[],
  count: number,
  equipment: string[],
  difficulty: number,
  usedExerciseIds: Set<string>
): DetailedExercise[] {
  const selected: DetailedExercise[] = [];
  const availableExercises = getExercisesByDifficulty(difficulty);

  // Filter by equipment
  const filteredByEquipment = availableExercises.filter((ex) => {
    if (ex.equipmentRequired.length === 0) return true;
    return ex.equipmentRequired.every((req) =>
      equipment.some((eq) => eq.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase() === 'body weight')
    );
  });

  // Get exercises for each target muscle
  for (const muscle of muscles) {
    const muscleExercises = filteredByEquipment.filter(
      (ex) =>
        !usedExerciseIds.has(ex.id) &&
        (ex.primaryMuscles.some((m) => m.toLowerCase().includes(muscle.toLowerCase())) ||
          ex.secondaryMuscles.some((m) => m.toLowerCase().includes(muscle.toLowerCase())))
    );

    // Prioritize primary muscle exercises
    const primaryMuscleExercises = muscleExercises.filter((ex) =>
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(muscle.toLowerCase()))
    );

    const exercisePool = primaryMuscleExercises.length > 0 ? primaryMuscleExercises : muscleExercises;

    // Pick exercises for this muscle
    const exercisesPerMuscle = Math.ceil(count / muscles.length);
    for (let i = 0; i < exercisesPerMuscle && selected.length < count; i++) {
      const available = exercisePool.filter((ex) => !selected.includes(ex));
      if (available.length > 0) {
        const randomIndex = Math.floor(Math.random() * available.length);
        selected.push(available[randomIndex]);
        usedExerciseIds.add(available[randomIndex].id);
      }
    }
  }

  // Fill remaining slots with any available exercises
  while (selected.length < count) {
    const remaining = filteredByEquipment.filter(
      (ex) => !selected.includes(ex) && !usedExerciseIds.has(ex.id)
    );
    if (remaining.length === 0) break;
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
    usedExerciseIds.add(remaining[randomIndex].id);
  }

  return selected;
}

function getWarmupExercises(): DetailedExercise[] {
  const warmupIds = ['ex_jumping_jacks', 'ex_high_knees', 'ex_dynamic_stretching'];
  return warmupIds
    .map((id) => EXERCISES_DATABASE.find((ex) => ex.id === id))
    .filter((ex): ex is DetailedExercise => ex !== undefined)
    .slice(0, 2);
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export function generate28DayProgram(options: ProgramGeneratorOptions): Program {
  const {
    userId,
    userName,
    daysPerWeek,
    workoutDays,
    fitnessLevel,
    primaryGoal,
    workoutDuration,
    equipment,
    startDate = new Date(),
  } = options;

  // Ensure daysPerWeek is between 3-6
  const effectiveDaysPerWeek = Math.min(6, Math.max(3, daysPerWeek));

  // Get split configuration
  const splitConfig = SPLIT_CONFIGS[effectiveDaysPerWeek] || SPLIT_CONFIGS[4];

  // Calculate start date (next day if today is too late)
  const programStartDate = new Date(startDate);
  programStartDate.setHours(0, 0, 0, 0);

  // Calculate end date
  const programEndDate = new Date(programStartDate);
  programEndDate.setDate(programEndDate.getDate() + 27);

  // Generate program days
  const days: ProgramDay[] = [];
  const usedExerciseIds = new Set<string>();
  let workoutIndex = 0;
  let completedWorkouts = 0;

  for (let dayNum = 1; dayNum <= 28; dayNum++) {
    const date = new Date(programStartDate);
    date.setDate(programStartDate.getDate() + dayNum - 1);
    const dayOfWeek = date.getDay();

    const isWorkoutDay = workoutDays.includes(dayOfWeek);
    const weekNumber = Math.ceil(dayNum / 7);
    const phaseInfo = getPhaseForDay(dayNum);

    if (!isWorkoutDay) {
      // Rest day
      days.push({
        dayNumber: dayNum,
        weekNumber,
        dayOfWeek,
        date: date.toISOString(),
        isRestDay: true,
        isCompleted: false,
        title: 'Rest Day',
        subtitle: 'Recovery & Growth',
        focusMuscles: [],
        exercises: [],
        estimatedDuration: 0,
        estimatedCalories: 0,
        phase: phaseInfo.phase,
        phaseWeek: phaseInfo.weekNumbers.indexOf(weekNumber) + 1,
      });
      continue;
    }

    // Workout day
    const template = splitConfig[workoutIndex % splitConfig.length];
    const difficulty = getDifficultyForPhase(phaseInfo.phase, fitnessLevel);
    const sets = getSetsForPhase(phaseInfo.phase, primaryGoal);
    const reps = getRepsForGoal(primaryGoal, phaseInfo.phase);
    const rest = getRestForGoal(primaryGoal);

    // Clear used exercises at start of each week to allow variety
    if (dayNum % 7 === 1) {
      usedExerciseIds.clear();
    }

    // Get warmup exercises
    const warmupExercises = getWarmupExercises();

    // Get main exercises
    const mainExercises = selectExercisesForMuscles(
      template.focusMuscles,
      template.exerciseCount,
      equipment,
      difficulty,
      usedExerciseIds
    );

    // Build program day exercises
    const programExercises: ProgramDayExercise[] = [];

    // Add warmup
    warmupExercises.forEach((ex, index) => {
      programExercises.push({
        exerciseId: ex.id,
        name: ex.name,
        sets: 1,
        reps: ex.category === 'CARDIO' ? '30-60 sec' : '10-15',
        restSeconds: 30,
        order: index,
        exerciseDetails: ex,
        isCompleted: false,
        isSkipped: false,
      });
    });

    // Add main exercises
    mainExercises.forEach((ex, index) => {
      programExercises.push({
        exerciseId: ex.id,
        name: ex.name,
        sets,
        reps,
        restSeconds: rest,
        order: warmupExercises.length + index,
        exerciseDetails: ex,
        isCompleted: false,
        isSkipped: false,
      });
    });

    // Calculate estimated duration and calories
    const totalExercises = programExercises.length;
    const avgTimePerSet = 1.5; // minutes
    const estimatedDuration = Math.round(totalExercises * sets * avgTimePerSet + totalExercises * (rest / 60));
    const estimatedCalories = Math.round(estimatedDuration * 7);

    days.push({
      dayNumber: dayNum,
      weekNumber,
      dayOfWeek,
      date: date.toISOString(),
      isRestDay: false,
      isCompleted: false,
      splitType: template.splitType,
      title: template.title,
      subtitle: `${phaseInfo.name} Phase`,
      focusMuscles: template.focusMuscles,
      exercises: programExercises,
      estimatedDuration: Math.min(estimatedDuration, workoutDuration + 10),
      estimatedCalories,
      phase: phaseInfo.phase,
      phaseWeek: phaseInfo.weekNumbers.indexOf(weekNumber) + 1,
    });

    workoutIndex++;
    completedWorkouts++;
  }

  // Count totals
  const totalWorkouts = days.filter((d) => !d.isRestDay).length;
  const totalRestDays = days.filter((d) => d.isRestDay).length;

  return {
    id: `program_${userId}_${Date.now()}`,
    userId,
    name: `${userName}'s 28-Day Program`,
    description: `A personalized ${effectiveDaysPerWeek}-day per week program designed for ${fitnessLevel} fitness level with focus on ${primaryGoal.replace('_', ' ')}.`,
    startDate: programStartDate.toISOString(),
    endDate: programEndDate.toISOString(),
    daysPerWeek: effectiveDaysPerWeek,
    workoutDays,
    days,
    totalWorkouts,
    totalRestDays,
    currentDay: 1,
    completedDays: 0,
    completedWorkouts: 0,
    streakDays: 0,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
}

// ============================================================================
// PREVIEW GENERATOR (For showing during onboarding)
// ============================================================================

export interface ProgramPreview {
  totalDays: number;
  totalWorkouts: number;
  totalRestDays: number;
  weeklySchedule: {
    dayName: string;
    isWorkout: boolean;
    title?: string;
    focusMuscles?: string[];
  }[];
  phases: {
    name: string;
    weeks: string;
    focus: string;
  }[];
}

export function generateProgramPreview(options: Omit<ProgramGeneratorOptions, 'userId' | 'userName'>): ProgramPreview {
  const { daysPerWeek, workoutDays } = options;
  const effectiveDaysPerWeek = Math.min(6, Math.max(3, daysPerWeek));
  const splitConfig = SPLIT_CONFIGS[effectiveDaysPerWeek] || SPLIT_CONFIGS[4];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const weeklySchedule = dayNames.map((dayName, index) => {
    const isWorkout = workoutDays.includes(index);
    if (!isWorkout) {
      return { dayName, isWorkout: false };
    }

    const workoutIndex = workoutDays.filter((d) => d < index).length;
    const template = splitConfig[workoutIndex % splitConfig.length];

    return {
      dayName,
      isWorkout: true,
      title: template.title,
      focusMuscles: template.focusMuscles,
    };
  });

  const phases = PROGRAM_PHASES.map((phase) => ({
    name: phase.name,
    weeks: `Week ${phase.weekNumbers[0]}${phase.weekNumbers.length > 1 ? `-${phase.weekNumbers[phase.weekNumbers.length - 1]}` : ''}`,
    focus: phase.focus,
  }));

  return {
    totalDays: 28,
    totalWorkouts: daysPerWeek * 4,
    totalRestDays: 28 - daysPerWeek * 4,
    weeklySchedule,
    phases,
  };
}
