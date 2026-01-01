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

class OnboardingService {
  /**
   * Complete onboarding with all collected data
   * Returns personalized fitness plan
   */
  async completeOnboarding(data: OnboardingRequest): Promise<OnboardingCompleteResponse> {
    return api.post<OnboardingCompleteResponse>('/onboarding/complete', data as unknown as Record<string, unknown>);
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
