/**
 * Exercise Suggestion Service
 *
 * Generates personalized exercise recommendations based on user's onboarding data.
 * Uses semantic search (embeddings) + rule-based scoring to find the best exercises.
 */

import { prisma } from '../lib/prisma.js';
import { embeddingService } from './embedding.service.js';
import {
  FitnessGoal,
  FitnessLevel,
  ExperienceLevel,
  WorkoutLocation,
  ExerciseCategory,
  MovementPattern,
  WorkoutSplitType,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  fitnessLevel: FitnessLevel | null;
  experienceLevel: ExperienceLevel | null;
  primaryGoal: FitnessGoal | null;
  secondaryGoal: FitnessGoal | null;
  age: number | null;
  pushupCapacity: string | null;
  plankCapacity: string | null;
  squatComfort: string | null;
}

interface UserPreferences {
  workoutLocation: WorkoutLocation | null;
  availableEquipment: string[];
  workoutDaysPerWeek: number;
  sessionDurationMin: number;
  preferredExerciseTypes: string[];
  restPreference: string;
}

interface UserHealth {
  injuries: string[];
  chronicConditions: string[];
  isPregnant: boolean;
  recentSurgery: boolean;
  contraindicatedMovements: string[];
  contraindicatedExercises: string[];
}

interface ScoredExercise {
  id: string;
  name: string;
  slug: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  difficultyLevel: number;
  equipmentRequired: string[];
  score: number;
  scoreBreakdown: {
    goalMatch: number;
    difficultyMatch: number;
    equipmentMatch: number;
    locationMatch: number;
    experienceMatch: number;
    semanticMatch: number;
  };
}

interface WorkoutDay {
  dayIndex: number;
  dayName: string;
  splitType: WorkoutSplitType;
  focusMuscles: string[];
  exercises: {
    exerciseId: string;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    order: number;
  }[];
  estimatedDuration: number;
}

interface WeeklyPlanResult {
  splitType: string;
  daysPerWeek: number;
  days: WorkoutDay[];
  totalExercises: number;
  generatedAt: Date;
}

// ============================================================================
// WORKOUT SPLIT CONFIGURATIONS
// ============================================================================

const WORKOUT_SPLITS: Record<number, {
  name: string;
  days: { splitType: WorkoutSplitType; focusMuscles: string[]; dayName: string }[];
}> = {
  2: {
    name: 'FULL_BODY',
    days: [
      { splitType: WorkoutSplitType.FULL_BODY, focusMuscles: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'], dayName: 'Full Body A' },
      { splitType: WorkoutSplitType.FULL_BODY, focusMuscles: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'], dayName: 'Full Body B' },
    ],
  },
  3: {
    name: 'FULL_BODY',
    days: [
      { splitType: WorkoutSplitType.FULL_BODY, focusMuscles: ['chest', 'back', 'legs', 'shoulders'], dayName: 'Full Body A' },
      { splitType: WorkoutSplitType.FULL_BODY, focusMuscles: ['chest', 'back', 'legs', 'arms'], dayName: 'Full Body B' },
      { splitType: WorkoutSplitType.FULL_BODY, focusMuscles: ['chest', 'back', 'legs', 'core'], dayName: 'Full Body C' },
    ],
  },
  4: {
    name: 'UPPER_LOWER',
    days: [
      { splitType: WorkoutSplitType.UPPER_BODY, focusMuscles: ['chest', 'back', 'shoulders', 'triceps', 'biceps'], dayName: 'Upper Body A' },
      { splitType: WorkoutSplitType.LOWER_BODY, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Lower Body A' },
      { splitType: WorkoutSplitType.UPPER_BODY, focusMuscles: ['chest', 'back', 'shoulders', 'triceps', 'biceps'], dayName: 'Upper Body B' },
      { splitType: WorkoutSplitType.LOWER_BODY, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Lower Body B' },
    ],
  },
  5: {
    name: 'PUSH_PULL_LEGS',
    days: [
      { splitType: WorkoutSplitType.PUSH, focusMuscles: ['chest', 'shoulders', 'triceps'], dayName: 'Push' },
      { splitType: WorkoutSplitType.PULL, focusMuscles: ['back', 'biceps', 'rear_delts'], dayName: 'Pull' },
      { splitType: WorkoutSplitType.LEGS, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Legs' },
      { splitType: WorkoutSplitType.UPPER_BODY, focusMuscles: ['chest', 'back', 'shoulders'], dayName: 'Upper' },
      { splitType: WorkoutSplitType.CORE, focusMuscles: ['abs', 'obliques', 'lower_back'], dayName: 'Core & Conditioning' },
    ],
  },
  6: {
    name: 'PPL_2X',
    days: [
      { splitType: WorkoutSplitType.PUSH, focusMuscles: ['chest', 'shoulders', 'triceps'], dayName: 'Push A' },
      { splitType: WorkoutSplitType.PULL, focusMuscles: ['back', 'biceps', 'rear_delts'], dayName: 'Pull A' },
      { splitType: WorkoutSplitType.LEGS, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Legs A' },
      { splitType: WorkoutSplitType.PUSH, focusMuscles: ['chest', 'shoulders', 'triceps'], dayName: 'Push B' },
      { splitType: WorkoutSplitType.PULL, focusMuscles: ['back', 'biceps', 'rear_delts'], dayName: 'Pull B' },
      { splitType: WorkoutSplitType.LEGS, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Legs B' },
    ],
  },
  7: {
    name: 'BRO_SPLIT',
    days: [
      { splitType: WorkoutSplitType.CHEST_TRICEPS, focusMuscles: ['chest', 'triceps'], dayName: 'Chest & Triceps' },
      { splitType: WorkoutSplitType.BACK_BICEPS, focusMuscles: ['back', 'biceps'], dayName: 'Back & Biceps' },
      { splitType: WorkoutSplitType.LEGS, focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], dayName: 'Legs' },
      { splitType: WorkoutSplitType.SHOULDERS_ARMS, focusMuscles: ['shoulders', 'triceps', 'biceps'], dayName: 'Shoulders & Arms' },
      { splitType: WorkoutSplitType.CORE, focusMuscles: ['abs', 'obliques', 'lower_back'], dayName: 'Core' },
      { splitType: WorkoutSplitType.CARDIO, focusMuscles: [], dayName: 'Cardio' },
      { splitType: WorkoutSplitType.ACTIVE_RECOVERY, focusMuscles: [], dayName: 'Active Recovery' },
    ],
  },
};

// Injury → Contraindicated movements mapping
const INJURY_CONTRAINDICATIONS: Record<string, string[]> = {
  neck: ['VERTICAL_PUSH', 'shoulder_press', 'behind_neck'],
  shoulder: ['VERTICAL_PUSH', 'HORIZONTAL_PUSH', 'overhead', 'lateral_raise'],
  upper_back: ['VERTICAL_PULL', 'HORIZONTAL_PULL', 'deadlift', 'row'],
  lower_back: ['HINGE', 'deadlift', 'squat', 'good_morning', 'bent_over'],
  elbow: ['FLEXION', 'EXTENSION', 'curl', 'tricep', 'push_up'],
  wrist: ['push_up', 'front_squat', 'clean', 'plank'],
  hip: ['HINGE', 'SQUAT', 'LUNGE', 'hip_thrust', 'deadlift'],
  knee: ['SQUAT', 'LUNGE', 'leg_press', 'leg_extension', 'jump'],
  ankle: ['SQUAT', 'LUNGE', 'calf_raise', 'jump', 'running'],
};

// ============================================================================
// SUGGESTION SERVICE
// ============================================================================

export class SuggestionService {
  /**
   * Get complete user context for suggestions
   */
  async getUserContext(userId: string): Promise<{
    profile: UserProfile | null;
    preferences: UserPreferences | null;
    health: UserHealth | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        health: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      profile: user.profile ? {
        fitnessLevel: user.profile.fitnessLevel,
        experienceLevel: user.profile.experienceLevel,
        primaryGoal: user.profile.primaryGoal,
        secondaryGoal: user.profile.secondaryGoal,
        age: user.profile.age,
        pushupCapacity: user.profile.pushupCapacity,
        plankCapacity: user.profile.plankCapacity,
        squatComfort: user.profile.squatComfort,
      } : null,
      preferences: user.preferences ? {
        workoutLocation: user.preferences.workoutLocation,
        availableEquipment: user.preferences.availableEquipment,
        workoutDaysPerWeek: user.preferences.workoutDaysPerWeek,
        sessionDurationMin: user.preferences.sessionDurationMin,
        preferredExerciseTypes: user.preferences.preferredExerciseTypes,
        restPreference: user.preferences.restPreference,
      } : null,
      health: user.health ? {
        injuries: user.health.injuries,
        chronicConditions: user.health.chronicConditions,
        isPregnant: user.health.isPregnant,
        recentSurgery: user.health.recentSurgery,
        contraindicatedMovements: user.health.contraindicatedMovements,
        contraindicatedExercises: user.health.contraindicatedExercises,
      } : null,
    };
  }

  /**
   * Calculate max difficulty based on user profile
   */
  private calculateMaxDifficulty(profile: UserProfile): number {
    let maxDiff = 3; // Default moderate

    // Adjust based on experience
    switch (profile.experienceLevel) {
      case ExperienceLevel.NEVER:
        maxDiff = 2;
        break;
      case ExperienceLevel.BEGINNER:
        maxDiff = 2;
        break;
      case ExperienceLevel.INTERMEDIATE:
        maxDiff = 3;
        break;
      case ExperienceLevel.ADVANCED:
        maxDiff = 4;
        break;
      case ExperienceLevel.EXPERT:
        maxDiff = 5;
        break;
    }

    // Adjust based on fitness level
    switch (profile.fitnessLevel) {
      case FitnessLevel.SEDENTARY:
        maxDiff = Math.min(maxDiff, 2);
        break;
      case FitnessLevel.LIGHTLY_ACTIVE:
        maxDiff = Math.min(maxDiff, 3);
        break;
      case FitnessLevel.ATHLETE:
        maxDiff = Math.max(maxDiff, 4);
        break;
    }

    // Adjust for age
    if (profile.age && profile.age > 60) {
      maxDiff = Math.min(maxDiff, 3);
    }

    return maxDiff;
  }

  /**
   * Get contraindicated movements based on injuries
   */
  private getContraindications(health: UserHealth): Set<string> {
    const contraindicated = new Set<string>();

    // Add from injuries
    for (const injury of health.injuries) {
      const movements = INJURY_CONTRAINDICATIONS[injury.toLowerCase()] || [];
      movements.forEach((m) => contraindicated.add(m.toLowerCase()));
    }

    // Add explicit contraindications
    health.contraindicatedMovements.forEach((m) => contraindicated.add(m.toLowerCase()));
    health.contraindicatedExercises.forEach((e) => contraindicated.add(e.toLowerCase()));

    // Special conditions
    if (health.isPregnant) {
      contraindicated.add('lying_on_back');
      contraindicated.add('high_impact');
      contraindicated.add('twisting');
    }

    if (health.recentSurgery) {
      contraindicated.add('heavy_compound');
    }

    return contraindicated;
  }

  /**
   * Score an exercise based on user profile
   */
  private scoreExercise(
    exercise: any,
    profile: UserProfile,
    preferences: UserPreferences,
    health: UserHealth,
    contraindications: Set<string>,
    semanticScore: number = 0.5
  ): ScoredExercise | null {
    const scoreBreakdown = {
      goalMatch: 0,
      difficultyMatch: 0,
      equipmentMatch: 0,
      locationMatch: 0,
      experienceMatch: 0,
      semanticMatch: semanticScore,
    };

    // Check contraindications - return null if exercise is contraindicated
    const exerciseName = exercise.name.toLowerCase();
    const exerciseSlug = exercise.slug.toLowerCase();
    const movementPattern = exercise.movementPattern?.toLowerCase() || '';

    for (const contra of contraindications) {
      if (
        exerciseName.includes(contra) ||
        exerciseSlug.includes(contra) ||
        movementPattern.includes(contra)
      ) {
        return null; // Skip this exercise
      }
    }

    // 1. Goal Match (0-1)
    if (profile.primaryGoal && exercise.goalEffectiveness) {
      const goalKey = this.goalToKey(profile.primaryGoal);
      scoreBreakdown.goalMatch = exercise.goalEffectiveness[goalKey] || 0.5;
    } else {
      scoreBreakdown.goalMatch = 0.5;
    }

    // 2. Difficulty Match (0-1)
    const maxDiff = this.calculateMaxDifficulty(profile);
    if (exercise.difficultyLevel <= maxDiff) {
      // Perfect if at or below max
      scoreBreakdown.difficultyMatch = 1 - (Math.abs(maxDiff - exercise.difficultyLevel) * 0.2);
    } else {
      // Penalize if too hard
      scoreBreakdown.difficultyMatch = Math.max(0, 1 - (exercise.difficultyLevel - maxDiff) * 0.3);
    }

    // 3. Equipment Match (0-1)
    const requiredEquipment = exercise.equipmentRequired || [];
    if (requiredEquipment.length === 0 || preferences.availableEquipment.includes('full_gym')) {
      scoreBreakdown.equipmentMatch = 1;
    } else if (preferences.availableEquipment.includes('none') && requiredEquipment.length > 0) {
      scoreBreakdown.equipmentMatch = 0;
    } else {
      const hasAll = requiredEquipment.every((eq: string) =>
        preferences.availableEquipment.some((avail) =>
          avail.toLowerCase().includes(eq.toLowerCase()) ||
          eq.toLowerCase().includes(avail.toLowerCase())
        )
      );
      scoreBreakdown.equipmentMatch = hasAll ? 1 : 0.3;
    }

    // 4. Location Match (0-1)
    switch (preferences.workoutLocation) {
      case WorkoutLocation.HOME:
        scoreBreakdown.locationMatch = exercise.homeCompatibility || 0.5;
        break;
      case WorkoutLocation.GYM:
        scoreBreakdown.locationMatch = exercise.gymCompatibility || 0.5;
        break;
      case WorkoutLocation.OUTDOOR:
        scoreBreakdown.locationMatch = exercise.outdoorCompatibility || 0.5;
        break;
      case WorkoutLocation.MIXED:
        scoreBreakdown.locationMatch = Math.max(
          exercise.homeCompatibility || 0.5,
          exercise.gymCompatibility || 0.5
        );
        break;
      default:
        scoreBreakdown.locationMatch = 0.5;
    }

    // 5. Experience Match (0-1)
    if (profile.experienceLevel && exercise.experienceLevelSuitability) {
      const expKey = this.experienceToKey(profile.experienceLevel);
      const suitability = exercise.experienceLevelSuitability[expKey] || 3;
      scoreBreakdown.experienceMatch = suitability / 5; // Convert 1-5 to 0-1
    } else {
      scoreBreakdown.experienceMatch = 0.6;
    }

    // Calculate final weighted score
    const weights = {
      goalMatch: 0.25,
      difficultyMatch: 0.20,
      equipmentMatch: 0.20,
      locationMatch: 0.15,
      experienceMatch: 0.10,
      semanticMatch: 0.10,
    };

    const totalScore =
      scoreBreakdown.goalMatch * weights.goalMatch +
      scoreBreakdown.difficultyMatch * weights.difficultyMatch +
      scoreBreakdown.equipmentMatch * weights.equipmentMatch +
      scoreBreakdown.locationMatch * weights.locationMatch +
      scoreBreakdown.experienceMatch * weights.experienceMatch +
      scoreBreakdown.semanticMatch * weights.semanticMatch;

    return {
      id: exercise.id,
      name: exercise.name,
      slug: exercise.slug,
      category: exercise.category,
      movementPattern: exercise.movementPattern,
      primaryMuscles: exercise.primaryMuscles,
      difficultyLevel: exercise.difficultyLevel,
      equipmentRequired: exercise.equipmentRequired || [],
      score: totalScore,
      scoreBreakdown,
    };
  }

  private goalToKey(goal: FitnessGoal): string {
    const map: Record<FitnessGoal, string> = {
      WEIGHT_LOSS: 'weightLoss',
      MUSCLE_GAIN: 'muscleGain',
      STRENGTH: 'strength',
      ENDURANCE: 'endurance',
      FLEXIBILITY: 'flexibility',
      GENERAL_FITNESS: 'generalFitness',
      SPORT_SPECIFIC: 'generalFitness',
      REHABILITATION: 'flexibility',
      MAINTAIN: 'generalFitness',
    };
    return map[goal] || 'generalFitness';
  }

  private experienceToKey(level: ExperienceLevel): string {
    const map: Record<ExperienceLevel, string> = {
      NEVER: 'never',
      BEGINNER: 'lessThan6Mo',
      INTERMEDIATE: 'sixTo24Mo',
      ADVANCED: 'twoTo5Yr',
      EXPERT: 'fivePlusYr',
    };
    return map[level] || 'sixTo24Mo';
  }

  /**
   * Get scored exercises for a specific muscle group
   */
  async getExercisesForMuscles(
    userId: string,
    targetMuscles: string[],
    limit: number = 20
  ): Promise<ScoredExercise[]> {
    const context = await this.getUserContext(userId);

    if (!context.profile || !context.preferences) {
      throw new Error('User profile not complete. Please complete onboarding first.');
    }

    const contraindications = context.health
      ? this.getContraindications(context.health)
      : new Set<string>();

    // Build semantic search query
    const goalText = context.profile.primaryGoal?.toLowerCase().replace('_', ' ') || 'general fitness';
    const muscleText = targetMuscles.join(' and ');
    const query = `${muscleText} exercises for ${goalText}`;

    // Use semantic search
    let exercises: any[] = [];

    if (embeddingService.isAvailable()) {
      const semanticResults = await embeddingService.searchSimilarExercises(query, {
        limit: limit * 2, // Get extra for filtering
        threshold: 0.4,
      });

      // Get full exercise data
      const exerciseIds = semanticResults.map((r) => r.id);
      exercises = await prisma.exercise.findMany({
        where: {
          id: { in: exerciseIds },
          isActive: true,
        },
      });

      // Attach semantic scores
      const scoreMap = new Map(semanticResults.map((r) => [r.id, r.similarity]));
      exercises = exercises.map((e) => ({
        ...e,
        semanticScore: scoreMap.get(e.id) || 0.5,
      }));
    } else {
      // Fallback: Query by muscle groups directly
      exercises = await prisma.exercise.findMany({
        where: {
          isActive: true,
          OR: [
            { primaryMuscles: { hasSome: targetMuscles } },
            { secondaryMuscles: { hasSome: targetMuscles } },
          ],
        },
        take: limit * 2,
      });

      exercises = exercises.map((e) => ({ ...e, semanticScore: 0.5 }));
    }

    // Score and filter exercises
    const scoredExercises: ScoredExercise[] = [];

    for (const exercise of exercises) {
      const scored = this.scoreExercise(
        exercise,
        context.profile,
        context.preferences,
        context.health || { injuries: [], chronicConditions: [], isPregnant: false, recentSurgery: false, contraindicatedMovements: [], contraindicatedExercises: [] },
        contraindications,
        exercise.semanticScore
      );

      if (scored && scored.score > 0.3) {
        scoredExercises.push(scored);
      }
    }

    // Sort by score and return top results
    scoredExercises.sort((a, b) => b.score - a.score);
    return scoredExercises.slice(0, limit);
  }

  /**
   * Generate a complete weekly workout plan
   */
  async generateWeeklyPlan(userId: string): Promise<WeeklyPlanResult> {
    const context = await this.getUserContext(userId);

    if (!context.profile || !context.preferences) {
      throw new Error('User profile not complete. Please complete onboarding first.');
    }

    const daysPerWeek = context.preferences.workoutDaysPerWeek;
    const sessionDuration = context.preferences.sessionDurationMin;

    // Get workout split configuration
    const splitConfig = WORKOUT_SPLITS[daysPerWeek] || WORKOUT_SPLITS[3];
    const days: WorkoutDay[] = [];

    // Calculate exercises per day based on session duration
    const exercisesPerDay = this.calculateExercisesPerDay(sessionDuration, context.preferences.restPreference);

    for (let i = 0; i < splitConfig.days.length; i++) {
      const dayConfig = splitConfig.days[i];

      // Get exercises for this day's muscle focus
      const scoredExercises = await this.getExercisesForMuscles(
        userId,
        dayConfig.focusMuscles,
        exercisesPerDay * 2 // Get extra for variety
      );

      // Select exercises ensuring variety in movement patterns
      const selectedExercises = this.selectBalancedExercises(
        scoredExercises,
        exercisesPerDay,
        dayConfig.focusMuscles
      );

      // Build workout day
      const workoutExercises = selectedExercises.map((ex, index) => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: this.getSetsForGoal(context.profile!.primaryGoal),
        reps: this.getRepsForGoal(context.profile!.primaryGoal, ex.category),
        restSeconds: this.getRestSeconds(context.preferences!.restPreference, ex.category),
        order: index + 1,
      }));

      days.push({
        dayIndex: i,
        dayName: dayConfig.dayName,
        splitType: dayConfig.splitType,
        focusMuscles: dayConfig.focusMuscles,
        exercises: workoutExercises,
        estimatedDuration: this.estimateDuration(workoutExercises),
      });
    }

    return {
      splitType: splitConfig.name,
      daysPerWeek,
      days,
      totalExercises: days.reduce((sum, d) => sum + d.exercises.length, 0),
      generatedAt: new Date(),
    };
  }

  /**
   * Save weekly plan to database
   */
  async saveWeeklyPlan(userId: string, plan: WeeklyPlanResult): Promise<string> {
    // Deactivate previous active plans
    await prisma.weeklyPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Get next week number
    const lastPlan = await prisma.weeklyPlan.findFirst({
      where: { userId },
      orderBy: { weekNumber: 'desc' },
    });
    const weekNumber = (lastPlan?.weekNumber || 0) + 1;

    // Create new plan
    const newPlan = await prisma.weeklyPlan.create({
      data: {
        userId,
        weekNumber,
        startDate: this.getNextMonday(),
        splitType: plan.splitType,
        days: plan.days as any,
        isActive: true,
      },
    });

    // Create workout entries for each day
    for (const day of plan.days) {
      const scheduledDate = this.getDateForDayIndex(day.dayIndex);

      await prisma.workout.create({
        data: {
          userId,
          scheduledDate,
          dayOfWeek: day.dayIndex,
          weekNumber,
          workoutType: day.splitType,
          focusMuscles: day.focusMuscles,
          title: day.dayName,
          estimatedDuration: day.estimatedDuration,
          status: 'SCHEDULED',
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              orderIndex: ex.order,
              targetSets: ex.sets,
              targetReps: ex.reps,
              restSeconds: ex.restSeconds,
            })),
          },
        },
      });
    }

    // Track suggestions for ML improvement
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        await prisma.exerciseSuggestion.create({
          data: {
            userId,
            exerciseId: ex.exerciseId,
            suggestionType: 'initial_plan',
            dayOfWeek: day.dayIndex,
            weekNumber,
          },
        });
      }
    }

    return newPlan.id;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateExercisesPerDay(duration: number, restPreference: string): number {
    // Average time per exercise (including rest): 5-8 minutes
    const avgTimePerExercise = restPreference === 'MINIMAL' ? 5 : restPreference === 'FULL' ? 8 : 6;
    return Math.floor(duration / avgTimePerExercise);
  }

  private selectBalancedExercises(
    exercises: ScoredExercise[],
    count: number,
    focusMuscles: string[]
  ): ScoredExercise[] {
    const selected: ScoredExercise[] = [];
    const usedPatterns = new Set<MovementPattern>();
    const usedMuscles = new Set<string>();

    // First pass: ensure variety
    for (const exercise of exercises) {
      if (selected.length >= count) break;

      // Prefer exercises we haven't selected similar ones for
      if (!usedPatterns.has(exercise.movementPattern)) {
        selected.push(exercise);
        usedPatterns.add(exercise.movementPattern);
        exercise.primaryMuscles.forEach((m) => usedMuscles.add(m));
      }
    }

    // Second pass: fill remaining slots with best scores
    for (const exercise of exercises) {
      if (selected.length >= count) break;
      if (!selected.includes(exercise)) {
        selected.push(exercise);
      }
    }

    return selected;
  }

  private getSetsForGoal(goal: FitnessGoal | null): number {
    switch (goal) {
      case FitnessGoal.STRENGTH:
        return 4;
      case FitnessGoal.MUSCLE_GAIN:
        return 4;
      case FitnessGoal.WEIGHT_LOSS:
        return 3;
      case FitnessGoal.ENDURANCE:
        return 3;
      default:
        return 3;
    }
  }

  private getRepsForGoal(goal: FitnessGoal | null, category: ExerciseCategory): string {
    if (category === ExerciseCategory.CARDIO) {
      return '30-60 sec';
    }

    switch (goal) {
      case FitnessGoal.STRENGTH:
        return '4-6';
      case FitnessGoal.MUSCLE_GAIN:
        return '8-12';
      case FitnessGoal.WEIGHT_LOSS:
        return '12-15';
      case FitnessGoal.ENDURANCE:
        return '15-20';
      default:
        return '10-12';
    }
  }

  private getRestSeconds(restPreference: string, category: ExerciseCategory): number {
    if (category === ExerciseCategory.CARDIO) {
      return 30;
    }

    switch (restPreference) {
      case 'MINIMAL':
        return 45;
      case 'FULL':
        return 120;
      default:
        return 90;
    }
  }

  private estimateDuration(exercises: { sets: number; restSeconds: number }[]): number {
    let totalSeconds = 0;
    for (const ex of exercises) {
      const timePerSet = 45; // seconds for actual exercise
      totalSeconds += ex.sets * (timePerSet + ex.restSeconds);
    }
    return Math.ceil(totalSeconds / 60); // Convert to minutes
  }

  private getNextMonday(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  }

  private getDateForDayIndex(dayIndex: number): Date {
    const monday = this.getNextMonday();
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return date;
  }
}

export const suggestionService = new SuggestionService();
