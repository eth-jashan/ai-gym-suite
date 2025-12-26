import { prisma } from '../lib/prisma.js';
import { WorkoutSplitType, FitnessGoal, ExperienceLevel } from '@prisma/client';

// Workout split templates based on training days
const SPLIT_TEMPLATES: Record<number, WorkoutSplitType[]> = {
  2: [WorkoutSplitType.FULL_BODY, WorkoutSplitType.FULL_BODY],
  3: [WorkoutSplitType.PUSH, WorkoutSplitType.PULL, WorkoutSplitType.LEGS],
  4: [WorkoutSplitType.UPPER_BODY, WorkoutSplitType.LOWER_BODY, WorkoutSplitType.UPPER_BODY, WorkoutSplitType.LOWER_BODY],
  5: [WorkoutSplitType.PUSH, WorkoutSplitType.PULL, WorkoutSplitType.LEGS, WorkoutSplitType.UPPER_BODY, WorkoutSplitType.LOWER_BODY],
  6: [WorkoutSplitType.PUSH, WorkoutSplitType.PULL, WorkoutSplitType.LEGS, WorkoutSplitType.PUSH, WorkoutSplitType.PULL, WorkoutSplitType.LEGS],
  7: [WorkoutSplitType.PUSH, WorkoutSplitType.PULL, WorkoutSplitType.LEGS, WorkoutSplitType.UPPER_BODY, WorkoutSplitType.LOWER_BODY, WorkoutSplitType.FULL_BODY, WorkoutSplitType.ACTIVE_RECOVERY],
};

// Muscle groups for each split type
const SPLIT_MUSCLES: Record<WorkoutSplitType, string[]> = {
  [WorkoutSplitType.PUSH]: ['chest', 'shoulders', 'triceps'],
  [WorkoutSplitType.PULL]: ['back', 'lats', 'biceps', 'rear_delts'],
  [WorkoutSplitType.LEGS]: ['quads', 'hamstrings', 'glutes', 'calves'],
  [WorkoutSplitType.UPPER_BODY]: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  [WorkoutSplitType.LOWER_BODY]: ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors'],
  [WorkoutSplitType.FULL_BODY]: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'core'],
  [WorkoutSplitType.CHEST_TRICEPS]: ['chest', 'triceps'],
  [WorkoutSplitType.BACK_BICEPS]: ['back', 'lats', 'biceps'],
  [WorkoutSplitType.SHOULDERS_ARMS]: ['shoulders', 'biceps', 'triceps'],
  [WorkoutSplitType.CORE]: ['core', 'obliques'],
  [WorkoutSplitType.CARDIO]: [],
  [WorkoutSplitType.HIIT]: [],
  [WorkoutSplitType.ACTIVE_RECOVERY]: [],
};

// Rep ranges based on goals
const GOAL_REP_RANGES: Record<string, { min: number; max: number; sets: number }> = {
  STRENGTH: { min: 3, max: 6, sets: 5 },
  MUSCLE_GAIN: { min: 8, max: 12, sets: 4 },
  ENDURANCE: { min: 15, max: 20, sets: 3 },
  WEIGHT_LOSS: { min: 12, max: 15, sets: 3 },
  GENERAL_FITNESS: { min: 10, max: 15, sets: 3 },
};

// Rest periods based on goals (seconds)
const GOAL_REST_PERIODS: Record<string, number> = {
  STRENGTH: 180,
  MUSCLE_GAIN: 90,
  ENDURANCE: 45,
  WEIGHT_LOSS: 45,
  GENERAL_FITNESS: 60,
};

// Exercise count based on session duration
const DURATION_EXERCISE_COUNT: Record<string, number> = {
  '15-20': 4,
  '20-30': 5,
  '30-45': 6,
  '45-60': 8,
  '60+': 10,
};

interface WorkoutConfig {
  userId: string;
  dayOfWeek: number; // 0-6
  weekNumber: number;
}

interface GeneratedExercise {
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  targetRpe: number;
  restSeconds: number;
}

export class WorkoutGeneratorService {
  /**
   * Generate a personalized workout for a user
   */
  async generateWorkout(config: WorkoutConfig) {
    const { userId, dayOfWeek, weekNumber } = config;

    // Get user profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        health: true,
      },
    });

    if (!user?.profile || !user?.preferences) {
      throw new Error('User profile not complete. Please finish onboarding.');
    }

    const { profile, preferences, health } = user;

    // Determine workout split for today
    const daysPerWeek = preferences.workoutDaysPerWeek;
    const splitTemplate = SPLIT_TEMPLATES[daysPerWeek] || SPLIT_TEMPLATES[3];
    const todaysSplit = splitTemplate[dayOfWeek % splitTemplate.length];

    // Get target muscles for today
    const targetMuscles = SPLIT_MUSCLES[todaysSplit];

    // Calculate exercise count based on session duration
    const sessionDuration = preferences.sessionDurationMin;
    let exerciseCount = 6; // default
    if (sessionDuration <= 20) exerciseCount = 4;
    else if (sessionDuration <= 30) exerciseCount = 5;
    else if (sessionDuration <= 45) exerciseCount = 6;
    else if (sessionDuration <= 60) exerciseCount = 8;
    else exerciseCount = 10;

    // Get rep range based on goal
    const goal = profile.primaryGoal || 'GENERAL_FITNESS';
    const repRange = GOAL_REP_RANGES[goal] || GOAL_REP_RANGES.GENERAL_FITNESS;
    const restPeriod = GOAL_REST_PERIODS[goal] || 60;

    // Build exercise query filters
    const equipmentFilter = this.buildEquipmentFilter(preferences.availableEquipment);
    const locationFilter = this.buildLocationFilter(preferences.workoutLocation);
    const difficultyFilter = this.buildDifficultyFilter(profile.experienceLevel);
    const contraindicationFilter = this.buildContraindicationFilter(health?.injuries || []);

    // Query exercises matching criteria
    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        primaryMuscles: { hasSome: targetMuscles },
        difficultyLevel: { lte: difficultyFilter },
        ...(equipmentFilter && { equipmentRequired: { hasSome: equipmentFilter } }),
        ...(locationFilter && { suitableLocations: { has: locationFilter } }),
        NOT: {
          contraindications: { hasSome: contraindicationFilter },
        },
      },
      orderBy: [
        { exerciseType: 'asc' }, // Compound first
        { popularityScore: 'desc' },
      ],
      take: exerciseCount * 2, // Get more than needed for variety
    });

    // Select and order exercises
    const selectedExercises = this.selectExercises(exercises, exerciseCount, targetMuscles);

    // Generate workout exercises with sets/reps
    const workoutExercises: GeneratedExercise[] = selectedExercises.map((exercise, index) => ({
      exerciseId: exercise.id,
      orderIndex: index + 1,
      targetSets: repRange.sets,
      targetReps: `${repRange.min}-${repRange.max}`,
      targetRpe: this.calculateTargetRpe(profile.experienceLevel, index),
      restSeconds: restPeriod,
    }));

    // Calculate estimated duration
    const estimatedDuration = this.calculateDuration(workoutExercises, restPeriod);

    // Create workout title
    const title = this.generateWorkoutTitle(todaysSplit, targetMuscles);

    // Create the workout
    const workout = await prisma.workout.create({
      data: {
        userId,
        scheduledDate: new Date(),
        dayOfWeek,
        weekNumber,
        workoutType: todaysSplit,
        focusMuscles: targetMuscles,
        title,
        description: `AI-generated ${todaysSplit.toLowerCase().replace('_', ' ')} workout targeting ${targetMuscles.slice(0, 3).join(', ')}`,
        estimatedDuration,
        exercises: {
          create: workoutExercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRpe: ex.targetRpe,
            restSeconds: ex.restSeconds,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return workout;
  }

  /**
   * Get today's workout or generate a new one
   */
  async getTodaysWorkout(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for existing workout today
    let workout = await prisma.workout.findFirst({
      where: {
        userId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    // Generate new workout if none exists
    if (!workout) {
      const dayOfWeek = today.getDay();
      const weekNumber = this.getWeekNumber(today);

      workout = await this.generateWorkout({
        userId,
        dayOfWeek,
        weekNumber,
      });
    }

    return workout;
  }

  /**
   * Swap an exercise for an alternative
   */
  async swapExercise(workoutExerciseId: string, userId: string) {
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: {
        exercise: true,
        workout: true,
      },
    });

    if (!workoutExercise || workoutExercise.workout.userId !== userId) {
      throw new Error('Exercise not found');
    }

    const currentExercise = workoutExercise.exercise;

    // Find alternative exercise
    const alternative = await prisma.exercise.findFirst({
      where: {
        id: { not: currentExercise.id },
        primaryMuscles: { hasSome: currentExercise.primaryMuscles },
        movementPattern: currentExercise.movementPattern,
        isActive: true,
      },
      orderBy: {
        popularityScore: 'desc',
      },
    });

    if (!alternative) {
      throw new Error('No alternative exercise found');
    }

    // Update the workout exercise
    const updated = await prisma.workoutExercise.update({
      where: { id: workoutExerciseId },
      data: {
        exerciseId: alternative.id,
      },
      include: {
        exercise: true,
      },
    });

    return updated;
  }

  // ==================== HELPER METHODS ====================

  private buildEquipmentFilter(equipment: string[]): string[] | null {
    if (!equipment || equipment.length === 0 || equipment.includes('full_gym')) {
      return null; // No filter needed
    }
    if (equipment.includes('none')) {
      return []; // Bodyweight only
    }
    return equipment;
  }

  private buildLocationFilter(location: string | null): string | null {
    if (!location || location === 'MIXED') {
      return null;
    }
    return location.toLowerCase();
  }

  private buildDifficultyFilter(experience: ExperienceLevel | null): number {
    switch (experience) {
      case 'NEVER':
      case 'BEGINNER':
        return 2;
      case 'INTERMEDIATE':
        return 3;
      case 'ADVANCED':
        return 4;
      case 'EXPERT':
        return 5;
      default:
        return 3;
    }
  }

  private buildContraindicationFilter(injuries: string[]): string[] {
    const contraindicationMap: Record<string, string[]> = {
      shoulder: ['shoulder_injury'],
      back: ['lower_back_injury', 'upper_back_injury'],
      lower_back: ['lower_back_injury'],
      knee: ['knee_injury'],
      hip: ['hip_injury'],
      wrist: ['wrist_injury'],
      elbow: ['elbow_injury'],
      ankle: ['ankle_injury'],
      neck: ['neck_injury'],
    };

    const contraindications: string[] = [];
    for (const injury of injuries) {
      const mapped = contraindicationMap[injury];
      if (mapped) {
        contraindications.push(...mapped);
      }
    }
    return contraindications;
  }

  private selectExercises(exercises: any[], count: number, targetMuscles: string[]): any[] {
    const selected: any[] = [];
    const musclesCovered: Set<string> = new Set();

    // First pass: ensure each target muscle has at least one exercise
    for (const muscle of targetMuscles) {
      const exerciseForMuscle = exercises.find(
        (ex) => ex.primaryMuscles.includes(muscle) && !selected.includes(ex)
      );
      if (exerciseForMuscle && selected.length < count) {
        selected.push(exerciseForMuscle);
        musclesCovered.add(muscle);
      }
    }

    // Second pass: fill remaining slots with variety
    for (const exercise of exercises) {
      if (selected.length >= count) break;
      if (!selected.includes(exercise)) {
        selected.push(exercise);
      }
    }

    // Sort: compound exercises first, then isolation
    selected.sort((a, b) => {
      if (a.exerciseType === 'COMPOUND' && b.exerciseType !== 'COMPOUND') return -1;
      if (a.exerciseType !== 'COMPOUND' && b.exerciseType === 'COMPOUND') return 1;
      return 0;
    });

    return selected;
  }

  private calculateTargetRpe(experience: ExperienceLevel | null, exerciseIndex: number): number {
    // Base RPE based on experience
    let baseRpe = 7;
    switch (experience) {
      case 'NEVER':
      case 'BEGINNER':
        baseRpe = 6;
        break;
      case 'INTERMEDIATE':
        baseRpe = 7;
        break;
      case 'ADVANCED':
      case 'EXPERT':
        baseRpe = 8;
        break;
    }

    // Slightly lower RPE for later exercises (fatigue)
    if (exerciseIndex > 4) {
      baseRpe -= 1;
    }

    return Math.max(5, Math.min(9, baseRpe));
  }

  private calculateDuration(exercises: GeneratedExercise[], restSeconds: number): number {
    // Estimate: 45 seconds per set + rest between sets
    const totalSets = exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
    const timePerSet = 45; // seconds
    const totalTime = totalSets * (timePerSet + restSeconds);

    // Add 5 minutes for warmup/cooldown
    return Math.round((totalTime / 60) + 10);
  }

  private generateWorkoutTitle(splitType: WorkoutSplitType, muscles: string[]): string {
    const titles: Record<WorkoutSplitType, string> = {
      [WorkoutSplitType.PUSH]: 'Push Day - Chest, Shoulders & Triceps',
      [WorkoutSplitType.PULL]: 'Pull Day - Back & Biceps',
      [WorkoutSplitType.LEGS]: 'Leg Day - Quads, Hamstrings & Glutes',
      [WorkoutSplitType.UPPER_BODY]: 'Upper Body Workout',
      [WorkoutSplitType.LOWER_BODY]: 'Lower Body Workout',
      [WorkoutSplitType.FULL_BODY]: 'Full Body Workout',
      [WorkoutSplitType.CHEST_TRICEPS]: 'Chest & Triceps',
      [WorkoutSplitType.BACK_BICEPS]: 'Back & Biceps',
      [WorkoutSplitType.SHOULDERS_ARMS]: 'Shoulders & Arms',
      [WorkoutSplitType.CORE]: 'Core Workout',
      [WorkoutSplitType.CARDIO]: 'Cardio Session',
      [WorkoutSplitType.HIIT]: 'HIIT Workout',
      [WorkoutSplitType.ACTIVE_RECOVERY]: 'Active Recovery',
    };

    return titles[splitType] || 'Workout';
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
}

export const workoutGeneratorService = new WorkoutGeneratorService();
