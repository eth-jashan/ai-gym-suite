import { prisma } from '../lib/prisma.js';
import { FitnessGoal, FitnessLevel, ExperienceLevel, WorkoutLocation, Gender } from '@prisma/client';

// Onboarding question definitions
export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface OnboardingQuestionDef {
  key: string;
  phase: number;
  order: number;
  question: string;
  type: 'text' | 'number' | 'single_select' | 'multi_select' | 'slider' | 'boolean';
  options?: QuestionOption[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  helpText?: string;
  dependsOn?: { key: string; value: string | string[] };
}

// Complete onboarding questionnaire definition
export const ONBOARDING_QUESTIONS: OnboardingQuestionDef[] = [
  // ===== PHASE 1: Basic Profile =====
  {
    key: 'first_name',
    phase: 1,
    order: 1,
    question: "What's your first name?",
    type: 'text',
    validation: { required: true, minLength: 1, maxLength: 50 },
    helpText: "We'll use this to personalize your experience",
  },
  {
    key: 'age',
    phase: 1,
    order: 2,
    question: 'How old are you?',
    type: 'number',
    validation: { required: true, min: 13, max: 100 },
    helpText: 'This helps us calibrate exercise intensity',
  },
  {
    key: 'gender',
    phase: 1,
    order: 3,
    question: 'What is your gender?',
    type: 'single_select',
    options: [
      { value: 'MALE', label: 'Male', icon: '👨' },
      { value: 'FEMALE', label: 'Female', icon: '👩' },
      { value: 'OTHER', label: 'Other', icon: '🧑' },
      { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say', icon: '🤐' },
    ],
    validation: { required: true },
  },
  {
    key: 'height_cm',
    phase: 1,
    order: 4,
    question: 'What is your height?',
    type: 'number',
    validation: { required: true, min: 100, max: 250 },
    helpText: 'Enter height in centimeters',
  },
  {
    key: 'current_weight_kg',
    phase: 1,
    order: 5,
    question: 'What is your current weight?',
    type: 'number',
    validation: { required: true, min: 30, max: 300 },
    helpText: 'Enter weight in kilograms',
  },
  {
    key: 'target_weight_kg',
    phase: 1,
    order: 6,
    question: 'What is your target weight?',
    type: 'number',
    validation: { required: true, min: 30, max: 300 },
    helpText: 'Enter your goal weight in kilograms',
  },

  // ===== PHASE 2: Goals & Motivation =====
  {
    key: 'primary_goal',
    phase: 2,
    order: 1,
    question: 'What is your primary fitness goal?',
    type: 'single_select',
    options: [
      { value: 'WEIGHT_LOSS', label: 'Lose Weight', description: 'Burn fat and get leaner', icon: '🔥' },
      { value: 'MUSCLE_GAIN', label: 'Build Muscle', description: 'Gain size and strength', icon: '💪' },
      { value: 'STRENGTH', label: 'Get Stronger', description: 'Increase raw strength', icon: '🏋️' },
      { value: 'ENDURANCE', label: 'Improve Endurance', description: 'Better cardio fitness', icon: '🏃' },
      { value: 'FLEXIBILITY', label: 'Increase Flexibility', description: 'Better mobility', icon: '🧘' },
      { value: 'GENERAL_FITNESS', label: 'General Fitness', description: 'Overall health', icon: '❤️' },
      { value: 'SPORT_SPECIFIC', label: 'Sport Performance', description: 'Excel at a sport', icon: '🏆' },
      { value: 'MAINTAIN', label: 'Maintain Fitness', description: 'Keep current level', icon: '⚖️' },
    ],
    validation: { required: true },
  },
  {
    key: 'secondary_goal',
    phase: 2,
    order: 2,
    question: 'Do you have a secondary goal?',
    type: 'single_select',
    options: [
      { value: 'WEIGHT_LOSS', label: 'Lose Weight', icon: '🔥' },
      { value: 'MUSCLE_GAIN', label: 'Build Muscle', icon: '💪' },
      { value: 'STRENGTH', label: 'Get Stronger', icon: '🏋️' },
      { value: 'ENDURANCE', label: 'Improve Endurance', icon: '🏃' },
      { value: 'FLEXIBILITY', label: 'Increase Flexibility', icon: '🧘' },
      { value: 'NONE', label: 'No secondary goal', icon: '➖' },
    ],
    validation: { required: false },
  },
  {
    key: 'motivation',
    phase: 2,
    order: 3,
    question: 'What motivates you to work out?',
    type: 'multi_select',
    options: [
      { value: 'look_better', label: 'Look Better', icon: '✨' },
      { value: 'feel_stronger', label: 'Feel Stronger', icon: '💪' },
      { value: 'health_reasons', label: 'Health Reasons', icon: '❤️' },
      { value: 'athletic_performance', label: 'Athletic Performance', icon: '🏆' },
      { value: 'stress_relief', label: 'Stress Relief', icon: '😌' },
      { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
      { value: 'social', label: 'Social Aspect', icon: '👥' },
      { value: 'confidence', label: 'Build Confidence', icon: '🌟' },
    ],
    validation: { required: true },
    helpText: 'Select all that apply',
  },
  {
    key: 'timeline',
    phase: 2,
    order: 4,
    question: 'What is your timeline for achieving your goal?',
    type: 'single_select',
    options: [
      { value: '1_month', label: '1 Month', description: 'Quick results' },
      { value: '3_months', label: '3 Months', description: 'Short term' },
      { value: '6_months', label: '6 Months', description: 'Medium term' },
      { value: '1_year', label: '1 Year', description: 'Long term' },
      { value: 'lifestyle', label: 'Lifestyle Change', description: 'No specific timeline' },
    ],
    validation: { required: true },
  },

  // ===== PHASE 3: Fitness Assessment =====
  {
    key: 'fitness_level',
    phase: 3,
    order: 1,
    question: 'How would you describe your current activity level?',
    type: 'single_select',
    options: [
      { value: 'SEDENTARY', label: 'Sedentary', description: 'Little to no exercise', icon: '🛋️' },
      { value: 'LIGHTLY_ACTIVE', label: 'Lightly Active', description: '1-2 workouts/week', icon: '🚶' },
      { value: 'MODERATELY_ACTIVE', label: 'Moderately Active', description: '3-4 workouts/week', icon: '🏃' },
      { value: 'VERY_ACTIVE', label: 'Very Active', description: '5-6 workouts/week', icon: '🔥' },
      { value: 'ATHLETE', label: 'Athlete', description: 'Daily intense training', icon: '🏆' },
    ],
    validation: { required: true },
  },
  {
    key: 'experience_level',
    phase: 3,
    order: 2,
    question: 'How long have you been exercising regularly?',
    type: 'single_select',
    options: [
      { value: 'NEVER', label: 'Never', description: "I'm just starting" },
      { value: 'BEGINNER', label: 'Less than 6 months', description: 'Still learning' },
      { value: 'INTERMEDIATE', label: '6 months - 2 years', description: 'Getting comfortable' },
      { value: 'ADVANCED', label: '2 - 5 years', description: 'Experienced' },
      { value: 'EXPERT', label: '5+ years', description: 'Very experienced' },
    ],
    validation: { required: true },
  },
  {
    key: 'pushup_capacity',
    phase: 3,
    order: 3,
    question: 'How many push-ups can you do in one set?',
    type: 'single_select',
    options: [
      { value: '0', label: "Can't do any", icon: '😅' },
      { value: '1-5', label: '1-5 push-ups', icon: '💪' },
      { value: '6-15', label: '6-15 push-ups', icon: '👍' },
      { value: '16-30', label: '16-30 push-ups', icon: '🔥' },
      { value: '30+', label: '30+ push-ups', icon: '🏆' },
    ],
    validation: { required: true },
    helpText: 'This helps us gauge your upper body strength',
  },
  {
    key: 'plank_capacity',
    phase: 3,
    order: 4,
    question: 'How long can you hold a plank?',
    type: 'single_select',
    options: [
      { value: '<15s', label: 'Less than 15 seconds' },
      { value: '15-30s', label: '15-30 seconds' },
      { value: '30-60s', label: '30-60 seconds' },
      { value: '1-2min', label: '1-2 minutes' },
      { value: '2min+', label: 'Over 2 minutes' },
    ],
    validation: { required: true },
    helpText: 'This helps us assess your core strength',
  },
  {
    key: 'squat_comfort',
    phase: 3,
    order: 5,
    question: 'How comfortable are you with squats?',
    type: 'single_select',
    options: [
      { value: 'none', label: "Can't do squats", description: 'Need to learn' },
      { value: 'bodyweight', label: 'Bodyweight only', description: 'No added weight' },
      { value: 'light', label: 'Light weight', description: 'Comfortable with some weight' },
      { value: 'moderate', label: 'Moderate weight', description: 'Good form with weight' },
      { value: 'heavy', label: 'Heavy weight', description: 'Confident with heavy loads' },
    ],
    validation: { required: true },
  },

  // ===== PHASE 4: Logistics & Preferences =====
  {
    key: 'workout_location',
    phase: 4,
    order: 1,
    question: 'Where do you prefer to work out?',
    type: 'single_select',
    options: [
      { value: 'HOME', label: 'At Home', description: 'Home workouts', icon: '🏠' },
      { value: 'GYM', label: 'At the Gym', description: 'Full equipment', icon: '🏋️' },
      { value: 'OUTDOOR', label: 'Outdoors', description: 'Parks, trails', icon: '🌳' },
      { value: 'MIXED', label: 'Mixed', description: 'Varies by day', icon: '🔄' },
    ],
    validation: { required: true },
  },
  {
    key: 'available_equipment',
    phase: 4,
    order: 2,
    question: 'What equipment do you have access to?',
    type: 'multi_select',
    options: [
      { value: 'none', label: 'No equipment', icon: '🤸' },
      { value: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
      { value: 'barbell', label: 'Barbell & Plates', icon: '💪' },
      { value: 'kettlebell', label: 'Kettlebells', icon: '🔔' },
      { value: 'resistance_bands', label: 'Resistance Bands', icon: '🎗️' },
      { value: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔩' },
      { value: 'bench', label: 'Weight Bench', icon: '🛋️' },
      { value: 'cable_machine', label: 'Cable Machine', icon: '⚙️' },
      { value: 'full_gym', label: 'Full Gym Access', icon: '🏢' },
      { value: 'cardio_machines', label: 'Cardio Machines', icon: '🏃' },
    ],
    validation: { required: true },
    helpText: 'Select all equipment you can use',
  },
  {
    key: 'workout_days_per_week',
    phase: 4,
    order: 3,
    question: 'How many days per week can you work out?',
    type: 'slider',
    validation: { required: true, min: 1, max: 7 },
    helpText: 'We recommend 3-5 days for best results',
  },
  {
    key: 'session_duration',
    phase: 4,
    order: 4,
    question: 'How long can you work out per session?',
    type: 'single_select',
    options: [
      { value: '15-20', label: '15-20 minutes', description: 'Quick sessions' },
      { value: '20-30', label: '20-30 minutes', description: 'Short sessions' },
      { value: '30-45', label: '30-45 minutes', description: 'Standard sessions' },
      { value: '45-60', label: '45-60 minutes', description: 'Full sessions' },
      { value: '60+', label: '60+ minutes', description: 'Extended sessions' },
    ],
    validation: { required: true },
  },
  {
    key: 'preferred_workout_time',
    phase: 4,
    order: 5,
    question: 'When do you prefer to work out?',
    type: 'single_select',
    options: [
      { value: 'EARLY_MORNING', label: 'Early Morning (5-7am)', icon: '🌅' },
      { value: 'MORNING', label: 'Morning (7-10am)', icon: '☀️' },
      { value: 'MIDDAY', label: 'Midday (10am-2pm)', icon: '🌤️' },
      { value: 'AFTERNOON', label: 'Afternoon (2-5pm)', icon: '⛅' },
      { value: 'EVENING', label: 'Evening (5-8pm)', icon: '🌆' },
      { value: 'NIGHT', label: 'Night (8pm+)', icon: '🌙' },
    ],
    validation: { required: true },
  },

  // ===== PHASE 5: Health & Limitations =====
  {
    key: 'has_injuries',
    phase: 5,
    order: 1,
    question: 'Do you have any current injuries or pain?',
    type: 'boolean',
    validation: { required: true },
  },
  {
    key: 'injuries',
    phase: 5,
    order: 2,
    question: 'Which areas are affected?',
    type: 'multi_select',
    options: [
      { value: 'neck', label: 'Neck' },
      { value: 'shoulder', label: 'Shoulder' },
      { value: 'upper_back', label: 'Upper Back' },
      { value: 'lower_back', label: 'Lower Back' },
      { value: 'elbow', label: 'Elbow' },
      { value: 'wrist', label: 'Wrist' },
      { value: 'hip', label: 'Hip' },
      { value: 'knee', label: 'Knee' },
      { value: 'ankle', label: 'Ankle' },
      { value: 'other', label: 'Other' },
    ],
    dependsOn: { key: 'has_injuries', value: 'true' },
    validation: { required: false },
  },
  {
    key: 'has_conditions',
    phase: 5,
    order: 3,
    question: 'Do you have any chronic health conditions?',
    type: 'boolean',
    validation: { required: true },
  },
  {
    key: 'chronic_conditions',
    phase: 5,
    order: 4,
    question: 'Select any conditions that apply:',
    type: 'multi_select',
    options: [
      { value: 'heart_condition', label: 'Heart Condition' },
      { value: 'high_blood_pressure', label: 'High Blood Pressure' },
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'asthma', label: 'Asthma' },
      { value: 'arthritis', label: 'Arthritis' },
      { value: 'osteoporosis', label: 'Osteoporosis' },
      { value: 'other', label: 'Other' },
    ],
    dependsOn: { key: 'has_conditions', value: 'true' },
    validation: { required: false },
  },
  {
    key: 'is_pregnant',
    phase: 5,
    order: 5,
    question: 'Are you currently pregnant?',
    type: 'boolean',
    validation: { required: true },
    dependsOn: { key: 'gender', value: 'FEMALE' },
  },
  {
    key: 'recent_surgery',
    phase: 5,
    order: 6,
    question: 'Have you had surgery in the last 6 months?',
    type: 'boolean',
    validation: { required: true },
  },

  // ===== PHASE 6: Personalization =====
  {
    key: 'preferred_exercise_types',
    phase: 6,
    order: 1,
    question: 'What types of exercises do you enjoy?',
    type: 'multi_select',
    options: [
      { value: 'strength', label: 'Strength Training', icon: '🏋️' },
      { value: 'cardio', label: 'Cardio', icon: '🏃' },
      { value: 'hiit', label: 'HIIT', icon: '⚡' },
      { value: 'yoga', label: 'Yoga', icon: '🧘' },
      { value: 'pilates', label: 'Pilates', icon: '🤸' },
      { value: 'calisthenics', label: 'Calisthenics', icon: '💪' },
      { value: 'stretching', label: 'Stretching', icon: '🙆' },
      { value: 'sports', label: 'Sports', icon: '⚽' },
    ],
    validation: { required: true },
    helpText: 'Select all that you enjoy or want to try',
  },
  {
    key: 'rest_preference',
    phase: 6,
    order: 2,
    question: 'How do you prefer your rest periods?',
    type: 'single_select',
    options: [
      { value: 'MINIMAL', label: 'Minimal Rest', description: 'Keep heart rate up' },
      { value: 'MODERATE', label: 'Moderate Rest', description: 'Balanced approach' },
      { value: 'FULL', label: 'Full Recovery', description: 'Complete rest between sets' },
    ],
    validation: { required: true },
  },
  {
    key: 'music_genre',
    phase: 6,
    order: 3,
    question: 'What music pumps you up during workouts?',
    type: 'single_select',
    options: [
      { value: 'hip_hop', label: 'Hip Hop', icon: '🎤' },
      { value: 'edm', label: 'EDM', icon: '🎧' },
      { value: 'rock', label: 'Rock', icon: '🎸' },
      { value: 'pop', label: 'Pop', icon: '🎵' },
      { value: 'metal', label: 'Metal', icon: '🤘' },
      { value: 'latin', label: 'Latin', icon: '💃' },
      { value: 'none', label: 'No music', icon: '🔇' },
    ],
    validation: { required: false },
  },
  {
    key: 'workout_reminders',
    phase: 6,
    order: 4,
    question: 'Would you like workout reminders?',
    type: 'boolean',
    validation: { required: true },
  },
];

export class OnboardingService {
  // Get questions for a specific phase
  getQuestionsForPhase(phase: number): OnboardingQuestionDef[] {
    return ONBOARDING_QUESTIONS.filter(q => q.phase === phase);
  }

  // Get all phases info
  getPhasesInfo() {
    return [
      { phase: 1, title: 'Basic Profile', description: 'Tell us about yourself', questions: 6 },
      { phase: 2, title: 'Goals & Motivation', description: 'What do you want to achieve?', questions: 4 },
      { phase: 3, title: 'Fitness Assessment', description: 'Your current fitness level', questions: 5 },
      { phase: 4, title: 'Logistics', description: 'When and where you work out', questions: 5 },
      { phase: 5, title: 'Health & Safety', description: 'Any limitations we should know', questions: 6 },
      { phase: 6, title: 'Personalization', description: 'Make it yours', questions: 4 },
    ];
  }

  // Get total phases
  getTotalPhases(): number {
    return 6;
  }

  // Validate a single response
  validateResponse(questionKey: string, value: unknown): { valid: boolean; error?: string } {
    const question = ONBOARDING_QUESTIONS.find(q => q.key === questionKey);
    if (!question) {
      return { valid: false, error: 'Unknown question' };
    }

    const { validation, type, options } = question;

    if (validation?.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: 'This field is required' };
    }

    if (type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Must be a number' };
      }
      if (validation?.min !== undefined && num < validation.min) {
        return { valid: false, error: `Minimum value is ${validation.min}` };
      }
      if (validation?.max !== undefined && num > validation.max) {
        return { valid: false, error: `Maximum value is ${validation.max}` };
      }
    }

    if (type === 'text') {
      const str = String(value);
      if (validation?.minLength !== undefined && str.length < validation.minLength) {
        return { valid: false, error: `Minimum length is ${validation.minLength}` };
      }
      if (validation?.maxLength !== undefined && str.length > validation.maxLength) {
        return { valid: false, error: `Maximum length is ${validation.maxLength}` };
      }
    }

    if (type === 'single_select' && options) {
      const validValues = options.map(o => o.value);
      if (!validValues.includes(String(value))) {
        return { valid: false, error: 'Invalid selection' };
      }
    }

    if (type === 'multi_select' && options) {
      const validValues = options.map(o => o.value);
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        if (!validValues.includes(String(v))) {
          return { valid: false, error: 'Invalid selection' };
        }
      }
    }

    return { valid: true };
  }

  // Save responses and update user profile
  async saveResponses(userId: string, responses: Record<string, unknown>) {
    // Validate all responses
    for (const [key, value] of Object.entries(responses)) {
      const result = this.validateResponse(key, value);
      if (!result.valid) {
        throw new Error(`Invalid response for ${key}: ${result.error}`);
      }
    }

    // Save individual responses
    for (const [key, value] of Object.entries(responses)) {
      const question = await prisma.onboardingQuestion.findUnique({
        where: { questionKey: key },
      });

      if (question) {
        await prisma.onboardingResponse.upsert({
          where: {
            userId_questionId: {
              userId,
              questionId: question.id,
            },
          },
          update: {
            response: value as any,
          },
          create: {
            userId,
            questionId: question.id,
            response: value as any,
          },
        });
      }
    }

    // Update user's onboarding step
    const currentStep = await this.getCurrentStep(userId);
    const newStep = Math.min(currentStep + 1, this.getTotalPhases());

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: newStep },
    });

    return { success: true, currentStep: newStep };
  }

  // Get current onboarding step for user
  async getCurrentStep(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    });
    return user?.onboardingStep ?? 0;
  }

  // Complete onboarding and generate profile
  async completeOnboarding(userId: string) {
    // Get all responses
    const responses = await prisma.onboardingResponse.findMany({
      where: { userId },
      include: { question: true },
    });

    // Build response map
    const responseMap: Record<string, unknown> = {};
    for (const r of responses) {
      responseMap[r.question.questionKey] = r.response;
    }

    // Create/update user profile
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: responseMap.first_name as string,
        age: responseMap.age as number,
        gender: responseMap.gender as Gender,
        heightCm: responseMap.height_cm as number,
        currentWeightKg: responseMap.current_weight_kg as number,
        targetWeightKg: responseMap.target_weight_kg as number,
        fitnessLevel: responseMap.fitness_level as FitnessLevel,
        experienceLevel: responseMap.experience_level as ExperienceLevel,
        primaryGoal: responseMap.primary_goal as FitnessGoal,
        secondaryGoal: responseMap.secondary_goal as FitnessGoal,
        motivation: responseMap.motivation as string[],
        pushupCapacity: responseMap.pushup_capacity as string,
        plankCapacity: responseMap.plank_capacity as string,
        squatComfort: responseMap.squat_comfort as string,
      },
      create: {
        userId,
        firstName: responseMap.first_name as string,
        age: responseMap.age as number,
        gender: responseMap.gender as Gender,
        heightCm: responseMap.height_cm as number,
        currentWeightKg: responseMap.current_weight_kg as number,
        targetWeightKg: responseMap.target_weight_kg as number,
        fitnessLevel: responseMap.fitness_level as FitnessLevel,
        experienceLevel: responseMap.experience_level as ExperienceLevel,
        primaryGoal: responseMap.primary_goal as FitnessGoal,
        secondaryGoal: responseMap.secondary_goal as FitnessGoal,
        motivation: responseMap.motivation as string[],
        pushupCapacity: responseMap.pushup_capacity as string,
        plankCapacity: responseMap.plank_capacity as string,
        squatComfort: responseMap.squat_comfort as string,
      },
    });

    // Create user preferences
    const sessionDuration = responseMap.session_duration as string;
    const durationMap: Record<string, number> = {
      '15-20': 20,
      '20-30': 30,
      '30-45': 45,
      '45-60': 60,
      '60+': 75,
    };

    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        workoutDaysPerWeek: responseMap.workout_days_per_week as number,
        sessionDurationMin: durationMap[sessionDuration] || 45,
        preferredWorkoutTime: responseMap.preferred_workout_time as any,
        workoutLocation: responseMap.workout_location as WorkoutLocation,
        availableEquipment: responseMap.available_equipment as string[],
        preferredExerciseTypes: responseMap.preferred_exercise_types as string[],
        restPreference: responseMap.rest_preference as any,
        workoutReminders: responseMap.workout_reminders as boolean,
        musicGenre: responseMap.music_genre as string,
      },
      create: {
        userId,
        workoutDaysPerWeek: responseMap.workout_days_per_week as number,
        sessionDurationMin: durationMap[sessionDuration] || 45,
        preferredWorkoutTime: responseMap.preferred_workout_time as any,
        workoutLocation: responseMap.workout_location as WorkoutLocation,
        availableEquipment: responseMap.available_equipment as string[],
        preferredExerciseTypes: responseMap.preferred_exercise_types as string[],
        restPreference: responseMap.rest_preference as any,
        workoutReminders: responseMap.workout_reminders as boolean,
        musicGenre: responseMap.music_genre as string,
      },
    });

    // Create user health record
    await prisma.userHealth.upsert({
      where: { userId },
      update: {
        injuries: responseMap.injuries as string[] || [],
        chronicConditions: responseMap.chronic_conditions as string[] || [],
        isPregnant: responseMap.is_pregnant as boolean || false,
        recentSurgery: responseMap.recent_surgery as boolean || false,
      },
      create: {
        userId,
        injuries: responseMap.injuries as string[] || [],
        chronicConditions: responseMap.chronic_conditions as string[] || [],
        isPregnant: responseMap.is_pregnant as boolean || false,
        recentSurgery: responseMap.recent_surgery as boolean || false,
      },
    });

    // Mark onboarding as completed
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return { success: true, message: 'Onboarding completed!' };
  }
}

export const onboardingService = new OnboardingService();
