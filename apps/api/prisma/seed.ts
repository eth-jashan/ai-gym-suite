import { PrismaClient, QuestionType } from '@prisma/client';
// Old exercises removed - use 'npm run import:exercises' for the new 360 generated exercises

const prisma = new PrismaClient();

const ONBOARDING_QUESTIONS_SEED = [
  // Phase 1: Basic Profile
  { phase: 1, order: 1, questionKey: 'first_name', questionText: "What's your first name?", questionType: QuestionType.TEXT, isRequired: true },
  { phase: 1, order: 2, questionKey: 'age', questionText: 'How old are you?', questionType: QuestionType.NUMBER, validation: { min: 13, max: 100 }, isRequired: true },
  { phase: 1, order: 3, questionKey: 'gender', questionText: 'What is your gender?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }], isRequired: true },
  { phase: 1, order: 4, questionKey: 'height_cm', questionText: 'What is your height (cm)?', questionType: QuestionType.NUMBER, isRequired: true },
  { phase: 1, order: 5, questionKey: 'current_weight_kg', questionText: 'Current weight (kg)?', questionType: QuestionType.NUMBER, isRequired: true },
  { phase: 1, order: 6, questionKey: 'target_weight_kg', questionText: 'Target weight (kg)?', questionType: QuestionType.NUMBER, isRequired: true },

  // Phase 2: Goals
  { phase: 2, order: 1, questionKey: 'primary_goal', questionText: 'Primary fitness goal?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'WEIGHT_LOSS', label: 'Lose Weight' }, { value: 'MUSCLE_GAIN', label: 'Build Muscle' }, { value: 'STRENGTH', label: 'Get Stronger' }, { value: 'ENDURANCE', label: 'Endurance' }, { value: 'GENERAL_FITNESS', label: 'General Fitness' }], isRequired: true },
  { phase: 2, order: 2, questionKey: 'motivation', questionText: 'What motivates you?', questionType: QuestionType.MULTI_SELECT, options: [{ value: 'look_better', label: 'Look Better' }, { value: 'feel_stronger', label: 'Feel Stronger' }, { value: 'health', label: 'Health' }, { value: 'stress_relief', label: 'Stress Relief' }], isRequired: true },

  // Phase 3: Fitness Assessment
  { phase: 3, order: 1, questionKey: 'fitness_level', questionText: 'Current activity level?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'SEDENTARY', label: 'Sedentary' }, { value: 'LIGHTLY_ACTIVE', label: 'Light' }, { value: 'MODERATELY_ACTIVE', label: 'Moderate' }, { value: 'VERY_ACTIVE', label: 'Very Active' }], isRequired: true },
  { phase: 3, order: 2, questionKey: 'experience_level', questionText: 'Exercise experience?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'NEVER', label: 'Never' }, { value: 'BEGINNER', label: 'Beginner' }, { value: 'INTERMEDIATE', label: 'Intermediate' }, { value: 'ADVANCED', label: 'Advanced' }], isRequired: true },
  { phase: 3, order: 3, questionKey: 'pushup_capacity', questionText: 'Push-ups in one set?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: '0', label: '0' }, { value: '1-5', label: '1-5' }, { value: '6-15', label: '6-15' }, { value: '16-30', label: '16-30' }, { value: '30+', label: '30+' }], isRequired: true },

  // Phase 4: Logistics
  { phase: 4, order: 1, questionKey: 'workout_location', questionText: 'Where do you work out?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'HOME', label: 'Home' }, { value: 'GYM', label: 'Gym' }, { value: 'OUTDOOR', label: 'Outdoor' }, { value: 'MIXED', label: 'Mixed' }], isRequired: true },
  { phase: 4, order: 2, questionKey: 'available_equipment', questionText: 'Available equipment?', questionType: QuestionType.MULTI_SELECT, options: [{ value: 'none', label: 'None' }, { value: 'dumbbells', label: 'Dumbbells' }, { value: 'barbell', label: 'Barbell' }, { value: 'resistance_bands', label: 'Bands' }, { value: 'full_gym', label: 'Full Gym' }], isRequired: true },
  { phase: 4, order: 3, questionKey: 'workout_days_per_week', questionText: 'Days per week?', questionType: QuestionType.SLIDER, validation: { min: 1, max: 7 }, isRequired: true },
  { phase: 4, order: 4, questionKey: 'session_duration', questionText: 'Session duration?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: '20-30', label: '20-30 min' }, { value: '30-45', label: '30-45 min' }, { value: '45-60', label: '45-60 min' }, { value: '60+', label: '60+ min' }], isRequired: true },

  // Phase 5: Health
  { phase: 5, order: 1, questionKey: 'has_injuries', questionText: 'Any injuries?', questionType: QuestionType.BOOLEAN, isRequired: true },
  { phase: 5, order: 2, questionKey: 'injuries', questionText: 'Affected areas?', questionType: QuestionType.MULTI_SELECT, options: [{ value: 'shoulder', label: 'Shoulder' }, { value: 'back', label: 'Back' }, { value: 'knee', label: 'Knee' }, { value: 'hip', label: 'Hip' }], isRequired: false, dependsOn: 'has_injuries' },

  // Phase 6: Personalization
  { phase: 6, order: 1, questionKey: 'preferred_exercise_types', questionText: 'Preferred exercises?', questionType: QuestionType.MULTI_SELECT, options: [{ value: 'strength', label: 'Strength' }, { value: 'cardio', label: 'Cardio' }, { value: 'hiit', label: 'HIIT' }, { value: 'yoga', label: 'Yoga' }], isRequired: true },
  { phase: 6, order: 2, questionKey: 'rest_preference', questionText: 'Rest preference?', questionType: QuestionType.SINGLE_SELECT, options: [{ value: 'MINIMAL', label: 'Minimal' }, { value: 'MODERATE', label: 'Moderate' }, { value: 'FULL', label: 'Full' }], isRequired: true },
];

async function seedOnboardingQuestions() {
  console.log('🔄 Seeding onboarding questions...');

  for (const question of ONBOARDING_QUESTIONS_SEED) {
    await prisma.onboardingQuestion.upsert({
      where: { questionKey: question.questionKey },
      update: question,
      create: question,
    });
  }

  console.log(`✅ Seeded ${ONBOARDING_QUESTIONS_SEED.length} onboarding questions`);
}

async function seedAchievements() {
  console.log('🔄 Seeding achievements...');

  const achievements = [
    {
      key: 'first_workout',
      name: 'First Steps',
      description: 'Complete your first workout',
      category: 'milestone',
      points: 10,
      criteria: { type: 'workout_count', value: 1 },
    },
    {
      key: 'week_warrior',
      name: 'Week Warrior',
      description: 'Complete 7 workouts in a week',
      category: 'consistency',
      points: 50,
      criteria: { type: 'weekly_workouts', value: 7 },
    },
    {
      key: 'month_master',
      name: 'Month Master',
      description: 'Work out consistently for 30 days',
      category: 'consistency',
      points: 100,
      criteria: { type: 'streak', value: 30 },
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ Seeded ${achievements.length} achievements`);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedOnboardingQuestions();
    await seedAchievements();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('📝 Note: Run "npm run import:exercises" to import the 360 generated exercises');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
