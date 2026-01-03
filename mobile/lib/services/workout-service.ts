/**
 * Workout API Service
 *
 * Handles all workout-related API calls including:
 * - Weekly plan generation and retrieval
 * - Workout management (start, complete)
 * - Exercise logging and tracking
 * - Exercise search and alternatives
 */

import { api } from '../api';
import {
  WeeklyPlan,
  WeeklyPlanResponse,
  Workout,
  WorkoutExercise,
  WorkoutListResponse,
  SuggestionStatusResponse,
  LogSetRequest,
  LogSetResponse,
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  SimilarExercisesResponse,
  SearchExercisesRequest,
  SearchExercisesResponse,
  ScoredExercisesResponse,
  WorkoutStats,
  SplitType,
} from '../types/workout';

class WorkoutService {
  // ============================================================================
  // SUGGESTION ENDPOINTS
  // ============================================================================

  /**
   * Check if suggestion engine is ready (embeddings configured, user profile complete)
   */
  async getSuggestionStatus(): Promise<SuggestionStatusResponse> {
    return api.get<SuggestionStatusResponse>('/suggestions/status');
  }

  /**
   * Get weekly plan preview (does not save)
   */
  async getWeeklyPlan(): Promise<WeeklyPlanResponse> {
    return api.get<WeeklyPlanResponse>('/suggestions/weekly-plan');
  }

  /**
   * Generate and save a new weekly plan
   */
  async generateWeeklyPlan(): Promise<WeeklyPlanResponse> {
    return api.post<WeeklyPlanResponse>('/suggestions/weekly-plan', {});
  }

  /**
   * Search exercises using natural language
   */
  async searchExercises(params: SearchExercisesRequest): Promise<SearchExercisesResponse> {
    return api.post<SearchExercisesResponse>('/suggestions/search', params as unknown as Record<string, unknown>);
  }

  /**
   * Get exercises for specific muscles with scoring
   */
  async getExercisesForMuscles(muscles: string[], limit = 10): Promise<ScoredExercisesResponse> {
    return api.get<ScoredExercisesResponse>('/suggestions/exercises', {
      muscles: muscles.join(','),
      limit,
    });
  }

  /**
   * Get similar exercises for swap functionality
   */
  async getSimilarExercises(exerciseId: string, limit = 5): Promise<SimilarExercisesResponse> {
    return api.get<SimilarExercisesResponse>(`/suggestions/similar/${exerciseId}`, { limit });
  }

  // ============================================================================
  // WORKOUT ENDPOINTS
  // ============================================================================

  /**
   * Get list of workouts with optional status filter
   */
  async getWorkouts(params?: { status?: string; limit?: number }): Promise<WorkoutListResponse> {
    return api.get<WorkoutListResponse>('/workouts', params);
  }

  /**
   * Get a specific workout by ID
   */
  async getWorkout(workoutId: string): Promise<{ workout: Workout }> {
    return api.get<{ workout: Workout }>(`/workouts/${workoutId}`);
  }

  /**
   * Get today's scheduled workout (convenience method)
   */
  async getTodayWorkout(): Promise<Workout | null> {
    try {
      const response = await api.get<{ workouts: Workout[] }>('/workouts', {
        status: 'SCHEDULED',
        limit: 1,
      });
      // Return the first scheduled workout for today
      const today = new Date().toISOString().split('T')[0];
      return response.workouts.find(w => w.scheduledDate.startsWith(today)) || response.workouts[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Start a workout session
   */
  async startWorkout(workoutId: string): Promise<{ success: boolean; workout: Workout }> {
    return api.post<{ success: boolean; workout: Workout }>(`/workouts/${workoutId}/start`, {});
  }

  /**
   * Log a set for an exercise during active workout
   */
  async logSet(
    workoutId: string,
    exerciseId: string,
    setData: LogSetRequest
  ): Promise<LogSetResponse> {
    return api.post<LogSetResponse>(
      `/workouts/${workoutId}/exercises/${exerciseId}/log`,
      setData as unknown as Record<string, unknown>
    );
  }

  /**
   * Skip an exercise during workout
   */
  async skipExercise(
    workoutId: string,
    exerciseId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(
      `/workouts/${workoutId}/exercises/${exerciseId}/skip`,
      { reason }
    );
  }

  /**
   * Complete a workout session
   */
  async completeWorkout(
    workoutId: string,
    data?: CompleteWorkoutRequest
  ): Promise<CompleteWorkoutResponse> {
    return api.post<CompleteWorkoutResponse>(
      `/workouts/${workoutId}/complete`,
      (data || {}) as Record<string, unknown>
    );
  }

  // ============================================================================
  // MOCK DATA FOR UI TESTING
  // ============================================================================

  /**
   * Generate mock weekly plan for UI testing when backend is unavailable
   */
  mockGetWeeklyPlan(): WeeklyPlanResponse {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start from Sunday

    const mockPlan: WeeklyPlan = {
      id: 'mock-plan-1',
      splitType: 'UPPER_LOWER',
      daysPerWeek: 4,
      weekNumber: 1,
      startDate: startDate.toISOString(),
      generatedAt: new Date().toISOString(),
      totalExercises: 24,
      days: [
        {
          dayIndex: 1, // Monday
          dayName: 'Upper Body A',
          splitType: 'UPPER_BODY' as SplitType,
          focusMuscles: ['chest', 'back', 'shoulders', 'triceps', 'biceps'],
          estimatedDuration: 45,
          exercises: this.getMockExercises('upper_a'),
        },
        {
          dayIndex: 2, // Tuesday
          dayName: 'Lower Body A',
          splitType: 'LOWER_BODY' as SplitType,
          focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
          estimatedDuration: 50,
          exercises: this.getMockExercises('lower_a'),
        },
        {
          dayIndex: 4, // Thursday
          dayName: 'Upper Body B',
          splitType: 'UPPER_BODY' as SplitType,
          focusMuscles: ['back', 'shoulders', 'chest', 'biceps', 'triceps'],
          estimatedDuration: 45,
          exercises: this.getMockExercises('upper_b'),
        },
        {
          dayIndex: 5, // Friday
          dayName: 'Lower Body B',
          splitType: 'LOWER_BODY' as SplitType,
          focusMuscles: ['glutes', 'hamstrings', 'quadriceps', 'calves', 'core'],
          estimatedDuration: 50,
          exercises: this.getMockExercises('lower_b'),
        },
      ],
    };

    return {
      success: true,
      plan: mockPlan,
      planId: mockPlan.id,
    };
  }

  /**
   * Generate mock workout list
   */
  mockGetWorkouts(): WorkoutListResponse {
    const today = new Date();
    const plan = this.mockGetWeeklyPlan().plan;

    const workouts: Workout[] = plan.days.map((day, index) => {
      const workoutDate = new Date(today);
      workoutDate.setDate(today.getDate() + (day.dayIndex - today.getDay()));

      return {
        id: `mock-workout-${index + 1}`,
        scheduledDate: workoutDate.toISOString().split('T')[0],
        dayOfWeek: day.dayIndex,
        workoutType: day.splitType,
        title: day.dayName,
        focusMuscles: day.focusMuscles,
        estimatedDuration: day.estimatedDuration,
        status: index === 0 ? 'SCHEDULED' : 'SCHEDULED',
        exercises: day.exercises,
      };
    });

    return { workouts };
  }

  /**
   * Generate mock workout stats after completion
   */
  mockCompleteWorkout(workoutId: string, durationSeconds: number): WorkoutStats {
    return {
      duration: durationSeconds,
      exercisesCompleted: 6,
      totalSets: 18,
      totalVolume: 4500,
      averageRpe: 7.5,
      caloriesBurned: Math.round(durationSeconds * 0.15),
      personalRecords: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Bench Press',
          type: 'weight',
          newValue: 85,
          previousValue: 80,
          improvement: 6.25,
        },
      ],
    };
  }

  /**
   * Helper to generate mock exercises
   */
  private getMockExercises(type: string): WorkoutExercise[] {
    const exercises: Record<string, WorkoutExercise[]> = {
      upper_a: [
        {
          id: 'we-1',
          exerciseId: 'ex-1',
          exercise: {
            id: 'ex-1',
            name: 'Barbell Bench Press',
            slug: 'barbell-bench-press',
            description: 'A compound exercise targeting the chest, shoulders, and triceps.',
            instructions: 'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to chest, press up.',
            category: 'STRENGTH',
            movementPattern: 'HORIZONTAL_PUSH',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders', 'triceps'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell', 'bench'],
          },
          targetSets: 4,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 1,
          status: 'PENDING',
        },
        {
          id: 'we-2',
          exerciseId: 'ex-2',
          exercise: {
            id: 'ex-2',
            name: 'Bent Over Row',
            slug: 'bent-over-row',
            description: 'A compound back exercise that also engages biceps and core.',
            instructions: 'Hinge at hips, pull barbell to lower chest, squeeze shoulder blades together.',
            category: 'STRENGTH',
            movementPattern: 'HORIZONTAL_PULL',
            primaryMuscles: ['back'],
            secondaryMuscles: ['biceps', 'core'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell'],
          },
          targetSets: 4,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 2,
          status: 'PENDING',
        },
        {
          id: 'we-3',
          exerciseId: 'ex-3',
          exercise: {
            id: 'ex-3',
            name: 'Overhead Press',
            slug: 'overhead-press',
            description: 'A shoulder-focused pressing movement.',
            instructions: 'Stand with feet shoulder-width, press bar overhead, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'VERTICAL_PUSH',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['triceps', 'core'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell'],
          },
          targetSets: 3,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 3,
          status: 'PENDING',
        },
        {
          id: 'we-4',
          exerciseId: 'ex-4',
          exercise: {
            id: 'ex-4',
            name: 'Dumbbell Curl',
            slug: 'dumbbell-curl',
            description: 'An isolation exercise for the biceps.',
            instructions: 'Stand with dumbbells at sides, curl up, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            difficultyLevel: 2,
            equipmentRequired: ['dumbbells'],
          },
          targetSets: 3,
          targetReps: '10-15',
          restSeconds: 60,
          orderIndex: 4,
          status: 'PENDING',
        },
        {
          id: 'we-5',
          exerciseId: 'ex-5',
          exercise: {
            id: 'ex-5',
            name: 'Tricep Pushdown',
            slug: 'tricep-pushdown',
            description: 'A cable exercise isolating the triceps.',
            instructions: 'Stand at cable machine, push bar down until arms are straight.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['triceps'],
            secondaryMuscles: [],
            difficultyLevel: 2,
            equipmentRequired: ['cable machine'],
          },
          targetSets: 3,
          targetReps: '12-15',
          restSeconds: 60,
          orderIndex: 5,
          status: 'PENDING',
        },
        {
          id: 'we-6',
          exerciseId: 'ex-6',
          exercise: {
            id: 'ex-6',
            name: 'Lateral Raise',
            slug: 'lateral-raise',
            description: 'An isolation exercise for the side delts.',
            instructions: 'Stand with dumbbells at sides, raise arms to shoulder height.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: [],
            difficultyLevel: 2,
            equipmentRequired: ['dumbbells'],
          },
          targetSets: 3,
          targetReps: '12-15',
          restSeconds: 60,
          orderIndex: 6,
          status: 'PENDING',
        },
      ],
      lower_a: [
        {
          id: 'we-7',
          exerciseId: 'ex-7',
          exercise: {
            id: 'ex-7',
            name: 'Barbell Squat',
            slug: 'barbell-squat',
            description: 'The king of leg exercises, targeting quads, glutes, and hamstrings.',
            instructions: 'Bar on upper back, feet shoulder-width, squat until thighs parallel, drive up.',
            category: 'STRENGTH',
            movementPattern: 'SQUAT',
            primaryMuscles: ['quadriceps', 'glutes'],
            secondaryMuscles: ['hamstrings', 'core'],
            difficultyLevel: 4,
            equipmentRequired: ['barbell', 'squat rack'],
          },
          targetSets: 4,
          targetReps: '6-10',
          restSeconds: 120,
          orderIndex: 1,
          status: 'PENDING',
        },
        {
          id: 'we-8',
          exerciseId: 'ex-8',
          exercise: {
            id: 'ex-8',
            name: 'Romanian Deadlift',
            slug: 'romanian-deadlift',
            description: 'A hip hinge movement targeting hamstrings and glutes.',
            instructions: 'Hold barbell, hinge at hips, keep slight knee bend, lower until stretch.',
            category: 'STRENGTH',
            movementPattern: 'HINGE',
            primaryMuscles: ['hamstrings', 'glutes'],
            secondaryMuscles: ['back', 'core'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell'],
          },
          targetSets: 4,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 2,
          status: 'PENDING',
        },
        {
          id: 'we-9',
          exerciseId: 'ex-9',
          exercise: {
            id: 'ex-9',
            name: 'Leg Press',
            slug: 'leg-press',
            description: 'A machine exercise for quads and glutes.',
            instructions: 'Sit in leg press, push platform away, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'SQUAT',
            primaryMuscles: ['quadriceps'],
            secondaryMuscles: ['glutes'],
            difficultyLevel: 2,
            equipmentRequired: ['leg press machine'],
          },
          targetSets: 3,
          targetReps: '10-15',
          restSeconds: 90,
          orderIndex: 3,
          status: 'PENDING',
        },
        {
          id: 'we-10',
          exerciseId: 'ex-10',
          exercise: {
            id: 'ex-10',
            name: 'Leg Curl',
            slug: 'leg-curl',
            description: 'An isolation exercise for the hamstrings.',
            instructions: 'Lie on leg curl machine, curl weight up, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: [],
            difficultyLevel: 2,
            equipmentRequired: ['leg curl machine'],
          },
          targetSets: 3,
          targetReps: '12-15',
          restSeconds: 60,
          orderIndex: 4,
          status: 'PENDING',
        },
        {
          id: 'we-11',
          exerciseId: 'ex-11',
          exercise: {
            id: 'ex-11',
            name: 'Calf Raise',
            slug: 'calf-raise',
            description: 'An isolation exercise for the calves.',
            instructions: 'Stand on platform, raise heels, lower with full stretch.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['calves'],
            secondaryMuscles: [],
            difficultyLevel: 1,
            equipmentRequired: [],
          },
          targetSets: 4,
          targetReps: '15-20',
          restSeconds: 45,
          orderIndex: 5,
          status: 'PENDING',
        },
      ],
      upper_b: [
        {
          id: 'we-12',
          exerciseId: 'ex-12',
          exercise: {
            id: 'ex-12',
            name: 'Pull-up',
            slug: 'pull-up',
            description: 'A bodyweight back exercise.',
            instructions: 'Hang from bar, pull up until chin over bar, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'VERTICAL_PUSH',
            primaryMuscles: ['back'],
            secondaryMuscles: ['biceps', 'core'],
            difficultyLevel: 4,
            equipmentRequired: ['pull-up bar'],
          },
          targetSets: 4,
          targetReps: '6-10',
          restSeconds: 90,
          orderIndex: 1,
          status: 'PENDING',
        },
        {
          id: 'we-13',
          exerciseId: 'ex-13',
          exercise: {
            id: 'ex-13',
            name: 'Incline Dumbbell Press',
            slug: 'incline-dumbbell-press',
            description: 'An upper chest focused pressing movement.',
            instructions: 'Lie on incline bench, press dumbbells up, lower to chest.',
            category: 'STRENGTH',
            movementPattern: 'HORIZONTAL_PUSH',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders', 'triceps'],
            difficultyLevel: 3,
            equipmentRequired: ['dumbbells', 'incline bench'],
          },
          targetSets: 4,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 2,
          status: 'PENDING',
        },
        {
          id: 'we-14',
          exerciseId: 'ex-14',
          exercise: {
            id: 'ex-14',
            name: 'Dumbbell Shoulder Press',
            slug: 'dumbbell-shoulder-press',
            description: 'A shoulder pressing movement with dumbbells.',
            instructions: 'Sit or stand, press dumbbells overhead, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'VERTICAL_PUSH',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['triceps'],
            difficultyLevel: 3,
            equipmentRequired: ['dumbbells'],
          },
          targetSets: 3,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 3,
          status: 'PENDING',
        },
        {
          id: 'we-15',
          exerciseId: 'ex-15',
          exercise: {
            id: 'ex-15',
            name: 'Face Pull',
            slug: 'face-pull',
            description: 'A rear delt and upper back exercise.',
            instructions: 'Pull rope to face level, squeeze rear delts.',
            category: 'STRENGTH',
            movementPattern: 'HORIZONTAL_PULL',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['back'],
            difficultyLevel: 2,
            equipmentRequired: ['cable machine', 'rope attachment'],
          },
          targetSets: 3,
          targetReps: '12-15',
          restSeconds: 60,
          orderIndex: 4,
          status: 'PENDING',
        },
        {
          id: 'we-16',
          exerciseId: 'ex-16',
          exercise: {
            id: 'ex-16',
            name: 'Hammer Curl',
            slug: 'hammer-curl',
            description: 'A bicep curl variation targeting the brachialis.',
            instructions: 'Hold dumbbells with neutral grip, curl up, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            difficultyLevel: 2,
            equipmentRequired: ['dumbbells'],
          },
          targetSets: 3,
          targetReps: '10-15',
          restSeconds: 60,
          orderIndex: 5,
          status: 'PENDING',
        },
        {
          id: 'we-17',
          exerciseId: 'ex-17',
          exercise: {
            id: 'ex-17',
            name: 'Skull Crusher',
            slug: 'skull-crusher',
            description: 'A tricep isolation exercise.',
            instructions: 'Lie on bench, lower weight to forehead, extend arms.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['triceps'],
            secondaryMuscles: [],
            difficultyLevel: 3,
            equipmentRequired: ['barbell', 'bench'],
          },
          targetSets: 3,
          targetReps: '10-12',
          restSeconds: 60,
          orderIndex: 6,
          status: 'PENDING',
        },
      ],
      lower_b: [
        {
          id: 'we-18',
          exerciseId: 'ex-18',
          exercise: {
            id: 'ex-18',
            name: 'Hip Thrust',
            slug: 'hip-thrust',
            description: 'The best exercise for glute development.',
            instructions: 'Back against bench, bar on hips, thrust up, squeeze glutes.',
            category: 'STRENGTH',
            movementPattern: 'HINGE',
            primaryMuscles: ['glutes'],
            secondaryMuscles: ['hamstrings'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell', 'bench'],
          },
          targetSets: 4,
          targetReps: '8-12',
          restSeconds: 90,
          orderIndex: 1,
          status: 'PENDING',
        },
        {
          id: 'we-19',
          exerciseId: 'ex-19',
          exercise: {
            id: 'ex-19',
            name: 'Bulgarian Split Squat',
            slug: 'bulgarian-split-squat',
            description: 'A single-leg squat variation.',
            instructions: 'Rear foot elevated, squat down on front leg, drive up.',
            category: 'STRENGTH',
            movementPattern: 'SQUAT',
            primaryMuscles: ['quadriceps', 'glutes'],
            secondaryMuscles: ['hamstrings'],
            difficultyLevel: 3,
            equipmentRequired: ['dumbbells', 'bench'],
          },
          targetSets: 3,
          targetReps: '10-12',
          restSeconds: 90,
          orderIndex: 2,
          status: 'PENDING',
        },
        {
          id: 'we-20',
          exerciseId: 'ex-20',
          exercise: {
            id: 'ex-20',
            name: 'Good Morning',
            slug: 'good-morning',
            description: 'A hip hinge for hamstrings and lower back.',
            instructions: 'Bar on back, hinge at hips, return to standing.',
            category: 'STRENGTH',
            movementPattern: 'HINGE',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: ['back', 'glutes'],
            difficultyLevel: 3,
            equipmentRequired: ['barbell'],
          },
          targetSets: 3,
          targetReps: '10-12',
          restSeconds: 90,
          orderIndex: 3,
          status: 'PENDING',
        },
        {
          id: 'we-21',
          exerciseId: 'ex-21',
          exercise: {
            id: 'ex-21',
            name: 'Leg Extension',
            slug: 'leg-extension',
            description: 'An isolation exercise for the quadriceps.',
            instructions: 'Sit in machine, extend legs, lower with control.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['quadriceps'],
            secondaryMuscles: [],
            difficultyLevel: 1,
            equipmentRequired: ['leg extension machine'],
          },
          targetSets: 3,
          targetReps: '12-15',
          restSeconds: 60,
          orderIndex: 4,
          status: 'PENDING',
        },
        {
          id: 'we-22',
          exerciseId: 'ex-22',
          exercise: {
            id: 'ex-22',
            name: 'Plank',
            slug: 'plank',
            description: 'A core stability exercise.',
            instructions: 'Hold push-up position on forearms, keep body straight.',
            category: 'STRENGTH',
            movementPattern: 'ISOLATION',
            primaryMuscles: ['core'],
            secondaryMuscles: ['shoulders'],
            difficultyLevel: 2,
            equipmentRequired: [],
          },
          targetSets: 3,
          targetReps: '30-60s',
          restSeconds: 45,
          orderIndex: 5,
          status: 'PENDING',
        },
      ],
    };

    return exercises[type] || exercises['upper_a'];
  }
}

export const workoutService = new WorkoutService();
