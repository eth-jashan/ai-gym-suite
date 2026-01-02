/**
 * Onboarding API Service
 *
 * Handles all onboarding-related API calls including:
 * - Completing onboarding
 * - Getting onboarding status
 * - Saving/retrieving progress (optional)
 */

import { api } from '../api';
import {
  OnboardingRequest,
  OnboardingCompleteResponse,
  OnboardingStatusResponse,
  OnboardingProgressResponse,
  SaveProgressResponse,
  PersonalizedPlan,
} from '../types/onboarding';

// Mapping from mobile app values to backend enum values
const GOAL_MAP: Record<string, string> = {
  lose_weight: 'WEIGHT_LOSS',
  build_muscle: 'MUSCLE_GAIN',
  get_fitter: 'GENERAL_FITNESS',
  maintain: 'MAINTAIN',
};

const FITNESS_LEVEL_MAP: Record<string, string> = {
  beginner: 'LIGHTLY_ACTIVE',
  intermediate: 'MODERATELY_ACTIVE',
  advanced: 'VERY_ACTIVE',
};

const EXPERIENCE_LEVEL_MAP: Record<string, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
};

const EQUIPMENT_MAP: Record<string, string> = {
  barbells: 'barbell',
  dumbbells: 'dumbbells',
  kettlebells: 'kettlebell',
  gym_machines: 'full_gym',
  resistance_bands: 'resistance_bands',
  bodyweight_only: 'none',
};

const DURATION_MAP: Record<number, string> = {
  15: '15-20',
  30: '20-30',
  45: '30-45',
  60: '45-60',
  90: '60+',
};

class OnboardingService {
  /**
   * Transform mobile app data to backend expected format
   */
  private transformToBackendFormat(data: OnboardingRequest): Record<string, unknown> {
    const { name, primaryGoal, fitnessLevel, workoutPreferences, bodyMetrics } = data;

    return {
      // Phase 1: Basic Profile
      first_name: name,
      age: bodyMetrics.age,
      gender: bodyMetrics.gender.toUpperCase(),
      height_cm: Math.round(bodyMetrics.heightCm),
      current_weight_kg: Math.round(bodyMetrics.currentWeightKg),
      target_weight_kg: Math.round(bodyMetrics.targetWeightKg),

      // Phase 2: Goals & Motivation
      primary_goal: GOAL_MAP[primaryGoal] || 'GENERAL_FITNESS',
      secondary_goal: 'NONE',
      motivation: ['look_better', 'feel_stronger', 'health_reasons'],
      timeline: '3_months',

      // Phase 3: Fitness Assessment
      fitness_level: FITNESS_LEVEL_MAP[fitnessLevel] || 'MODERATELY_ACTIVE',
      experience_level: EXPERIENCE_LEVEL_MAP[fitnessLevel] || 'INTERMEDIATE',
      pushup_capacity: fitnessLevel === 'beginner' ? '1-5' : fitnessLevel === 'intermediate' ? '6-15' : '16-30',
      plank_capacity: fitnessLevel === 'beginner' ? '15-30s' : fitnessLevel === 'intermediate' ? '30-60s' : '1-2min',
      squat_comfort: fitnessLevel === 'beginner' ? 'bodyweight' : fitnessLevel === 'intermediate' ? 'light' : 'moderate',

      // Phase 4: Logistics
      workout_location: workoutPreferences.equipment.includes('gym_machines') ? 'GYM' : 'HOME',
      available_equipment: workoutPreferences.equipment.map((e) => EQUIPMENT_MAP[e] || e),
      workout_days_per_week: workoutPreferences.preferredDays.length,
      session_duration: DURATION_MAP[workoutPreferences.durationMinutes] || '30-45',
      preferred_workout_time: 'MORNING',

      // Phase 5: Health
      has_injuries: false,
      injuries: [],
      has_conditions: false,
      chronic_conditions: [],
      is_pregnant: false,
      recent_surgery: false,

      // Phase 6: Personalization
      preferred_exercise_types: ['strength', 'cardio'],
      rest_preference: 'MODERATE',
      music_genre: 'hip_hop',
      workout_reminders: true,
    };
  }

  /**
   * Complete onboarding with all collected data
   * Sends responses to backend, then completes onboarding
   */
  async completeOnboarding(data: OnboardingRequest): Promise<OnboardingCompleteResponse> {
    // Transform mobile data to backend format
    const responses = this.transformToBackendFormat(data);

    console.log('Submitting onboarding responses:', JSON.stringify(responses, null, 2));

    // Step 1: Send all responses
    await api.post('/onboarding/responses', { responses });

    // Step 2: Complete onboarding
    const result = await api.post<{ success: boolean; message: string }>('/onboarding/complete', {});

    // Return in expected format
    return {
      success: result.success,
      data: {
        user: {
          id: 'user',
          name: data.name,
          email: '',
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
        plan: this.mockCompleteOnboarding(data).data.plan,
      },
    };
  }

  /**
   * Get current onboarding status for the user
   */
  async getStatus(): Promise<OnboardingStatusResponse> {
    return api.get<OnboardingStatusResponse>('/onboarding/status');
  }

  /**
   * Save partial onboarding progress (for resume functionality)
   */
  async saveProgress(currentStep: number, partialData: Partial<OnboardingRequest>): Promise<SaveProgressResponse> {
    return api.post<SaveProgressResponse>('/onboarding/progress', {
      currentStep,
      partialData,
    } as unknown as Record<string, unknown>);
  }

  /**
   * Get saved onboarding progress (for resume functionality)
   */
  async getProgress(): Promise<OnboardingProgressResponse> {
    return api.get<OnboardingProgressResponse>('/onboarding/progress');
  }

  /**
   * Mock API response for UI testing (when backend is not available)
   * This simulates what the backend would return
   */
  mockCompleteOnboarding(data: OnboardingRequest): OnboardingCompleteResponse {
    const { bodyMetrics, workoutPreferences, primaryGoal } = data;
    const { gender, age, heightCm, currentWeightKg, targetWeightKg, activityLevel, weeklyWeightChangeKg } = bodyMetrics;

    // Activity level multipliers for TDEE calculation
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      super_active: 1.9,
    };

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Calculate TDEE
    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

    // Calculate daily calorie target based on goal
    const weeklyCalorieChange = weeklyWeightChangeKg * 7700; // 7700 kcal = 1kg
    const dailyCalorieChange = weeklyCalorieChange / 7;

    let dailyCalories: number;
    if (primaryGoal === 'lose_weight') {
      dailyCalories = Math.round(tdee - dailyCalorieChange);
    } else if (primaryGoal === 'build_muscle') {
      dailyCalories = Math.round(tdee + 300); // Slight surplus for muscle gain
    } else {
      dailyCalories = Math.round(tdee);
    }

    // Ensure minimum calories
    dailyCalories = Math.max(dailyCalories, gender === 'male' ? 1500 : 1200);

    // Calculate macros
    const protein = Math.round(currentWeightKg * 2); // 2g per kg
    const fat = Math.round((dailyCalories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);

    // Calculate estimated end date
    const weightToChange = Math.abs(currentWeightKg - targetWeightKg);
    const weeksToGoal = weeklyWeightChangeKg > 0 ? weightToChange / weeklyWeightChangeKg : 0;
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + Math.round(weeksToGoal * 7));

    // Generate workout schedule
    const workoutTypes = ['Upper Body', 'Lower Body', 'Full Body', 'Cardio + Core', 'Push', 'Pull'];
    const workoutSchedule = workoutPreferences.preferredDays.map((day, index) => ({
      day,
      workoutType: workoutTypes[index % workoutTypes.length],
      durationMinutes: workoutPreferences.durationMinutes,
    }));

    const plan: PersonalizedPlan = {
      dailyCalories,
      macros: { protein, carbs, fat },
      weeklyWorkouts: workoutPreferences.preferredDays.length,
      workoutSchedule,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      estimatedEndDate: estimatedEndDate.toISOString(),
      weeklyWeightChange: weeklyWeightChangeKg,
    };

    return {
      success: true,
      data: {
        user: {
          id: 'mock-user-id',
          name: data.name,
          email: 'user@example.com',
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
        plan,
      },
    };
  }
}

export const onboardingService = new OnboardingService();
