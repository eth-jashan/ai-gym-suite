/**
 * Exercise Import Script
 *
 * This script imports exercises from JSON files into the database.
 *
 * Usage:
 *   npx ts-node scripts/import-exercises.ts
 *
 * Or with npm script:
 *   npm run import:exercises
 *
 * Place JSON files in: prisma/data/generated-exercises/
 */

import { PrismaClient, ExerciseCategory, MovementPattern, ExerciseType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Directory containing exercise JSON files
// Check multiple possible locations
const POSSIBLE_DIRS = [
  path.join(__dirname, '../../../generated-exercise'),           // Root level
  path.join(__dirname, '../prisma/data/generated-exercises'),    // Prisma data folder
  path.join(__dirname, '../generated-exercise'),                 // API folder
];

const EXERCISES_DIR = POSSIBLE_DIRS.find(dir => fs.existsSync(dir)) || POSSIBLE_DIRS[0];

// Valid enum values for validation
const VALID_CATEGORIES = Object.values(ExerciseCategory);
const VALID_MOVEMENT_PATTERNS = Object.values(MovementPattern);
const VALID_EXERCISE_TYPES = Object.values(ExerciseType);

interface RawExercise {
  name: string;
  slug: string;
  description: string;
  instructions: string[] | string;
  category: string;
  movementPattern: string;
  exerciseType: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  muscleActivationMap?: Record<string, number>;
  difficultyLevel: number;
  skillRequirement: number;
  isBeginnerFriendly: boolean;
  equipmentRequired?: string[];
  equipmentOptional?: string[];
  suitableLocations?: string[];
  repRanges?: Record<string, { min: number; max: number }>;
  typicalSets?: { min: number; max: number };
  restSeconds?: Record<string, number>;
  metValue?: number;
  intensityFactor?: number;
  contraindications?: string[];
  formCues?: string[];
  commonMistakes?: string[];
  easierVariation?: string | null;
  harderVariation?: string | null;
  alternativeExercises?: string[];
  tags?: string[];
  suitableGoals?: string[];
  fitnessLevelSuitability?: Record<string, number>;
  experienceLevelSuitability?: Record<string, number>;
  goalEffectiveness?: Record<string, number>;
  estimatedTimePerSet?: number;
  setupTimeSeconds?: number;
  homeCompatibility?: number;
  gymCompatibility?: number;
  outdoorCompatibility?: number;
  progressionOrder?: number;
  progressionChainId?: string;
}

function generateSearchText(exercise: RawExercise): string {
  const parts = [
    exercise.name,
    exercise.description,
    exercise.category,
    exercise.movementPattern,
    exercise.exerciseType,
    ...(exercise.primaryMuscles || []),
    ...(exercise.secondaryMuscles || []),
    ...(exercise.tags || []),
    ...(exercise.suitableGoals || []),
    ...(exercise.equipmentRequired || []),
    ...(exercise.suitableLocations || []),
    `difficulty level ${exercise.difficultyLevel}`,
    exercise.isBeginnerFriendly ? 'beginner friendly' : 'advanced',
    ...(exercise.formCues || []),
  ];

  return parts.filter(Boolean).join(' | ');
}

function validateExercise(exercise: RawExercise, index: number, filename: string): string[] {
  const errors: string[] = [];

  if (!exercise.name) {
    errors.push(`Exercise ${index}: missing name`);
  }

  if (!exercise.slug) {
    errors.push(`Exercise ${index} (${exercise.name}): missing slug`);
  }

  if (!exercise.category || !VALID_CATEGORIES.includes(exercise.category as ExerciseCategory)) {
    errors.push(
      `Exercise ${index} (${exercise.name}): invalid category "${exercise.category}". Valid: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  if (!exercise.movementPattern || !VALID_MOVEMENT_PATTERNS.includes(exercise.movementPattern as MovementPattern)) {
    errors.push(
      `Exercise ${index} (${exercise.name}): invalid movementPattern "${exercise.movementPattern}". Valid: ${VALID_MOVEMENT_PATTERNS.join(', ')}`
    );
  }

  if (!exercise.exerciseType || !VALID_EXERCISE_TYPES.includes(exercise.exerciseType as ExerciseType)) {
    errors.push(
      `Exercise ${index} (${exercise.name}): invalid exerciseType "${exercise.exerciseType}". Valid: ${VALID_EXERCISE_TYPES.join(', ')}`
    );
  }

  if (!exercise.primaryMuscles || exercise.primaryMuscles.length === 0) {
    errors.push(`Exercise ${index} (${exercise.name}): missing primaryMuscles`);
  }

  return errors;
}

function transformExercise(raw: RawExercise) {
  // Handle instructions - can be array or string
  const instructions = Array.isArray(raw.instructions)
    ? raw.instructions.join('\n')
    : raw.instructions;

  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description || '',
    instructions: instructions || '',
    category: raw.category as ExerciseCategory,
    movementPattern: raw.movementPattern as MovementPattern,
    exerciseType: raw.exerciseType as ExerciseType,
    primaryMuscles: raw.primaryMuscles || [],
    secondaryMuscles: raw.secondaryMuscles || [],
    muscleActivationMap: raw.muscleActivationMap || {},
    difficultyLevel: raw.difficultyLevel || 3,
    skillRequirement: raw.skillRequirement || 2,
    isBeginnerFriendly: raw.isBeginnerFriendly ?? false,
    equipmentRequired: raw.equipmentRequired || [],
    equipmentOptional: raw.equipmentOptional || [],
    suitableLocations: raw.suitableLocations || ['gym'],
    repRanges: raw.repRanges || {},
    typicalSets: raw.typicalSets || { min: 3, max: 4 },
    restSeconds: raw.restSeconds || { strength: 120, hypertrophy: 60, endurance: 45 },
    metValue: raw.metValue || 5.0,
    intensityFactor: raw.intensityFactor || 0.7,
    contraindications: raw.contraindications || [],
    formCues: raw.formCues || [],
    commonMistakes: raw.commonMistakes || [],
    easierVariation: raw.easierVariation || null,
    harderVariation: raw.harderVariation || null,
    alternativeExercises: raw.alternativeExercises || [],
    tags: raw.tags || [],
    suitableGoals: raw.suitableGoals || ['GENERAL_FITNESS'],
    fitnessLevelSuitability: raw.fitnessLevelSuitability || {
      sedentary: 3,
      lightlyActive: 4,
      moderatelyActive: 5,
      veryActive: 5,
      athlete: 5,
    },
    experienceLevelSuitability: raw.experienceLevelSuitability || {
      never: 3,
      lessThan6Mo: 4,
      sixTo24Mo: 5,
      twoTo5Yr: 5,
      fivePlusYr: 5,
    },
    goalEffectiveness: raw.goalEffectiveness || {
      weightLoss: 0.5,
      muscleGain: 0.5,
      strength: 0.5,
      endurance: 0.5,
      flexibility: 0.3,
      generalFitness: 0.6,
    },
    estimatedTimePerSet: raw.estimatedTimePerSet || 45,
    setupTimeSeconds: raw.setupTimeSeconds || 30,
    homeCompatibility: raw.homeCompatibility ?? calculateLocationCompatibility(raw, 'home'),
    gymCompatibility: raw.gymCompatibility ?? calculateLocationCompatibility(raw, 'gym'),
    outdoorCompatibility: raw.outdoorCompatibility ?? calculateLocationCompatibility(raw, 'outdoor'),
    progressionOrder: raw.progressionOrder || null,
    progressionChainId: raw.progressionChainId || null,
    searchText: generateSearchText(raw),
    isActive: true,
    popularityScore: 0.5,
    effectivenessRating: 4.0,
  };
}

function calculateLocationCompatibility(exercise: RawExercise, location: string): number {
  const locations = exercise.suitableLocations || [];

  if (locations.includes(location)) {
    return 1.0;
  }

  // Check equipment requirements
  const equipment = exercise.equipmentRequired || [];

  if (location === 'home') {
    const homeEquipment = ['dumbbells', 'dumbbell', 'resistance_band', 'pull_up_bar', 'kettlebell', 'yoga_mat', 'none'];
    const hasHomeEquipment = equipment.length === 0 || equipment.every((e) => homeEquipment.includes(e.toLowerCase()));
    return hasHomeEquipment ? 0.8 : 0.2;
  }

  if (location === 'outdoor') {
    const outdoorEquipment = ['pull_up_bar', 'resistance_band', 'none'];
    const hasOutdoorEquipment =
      equipment.length === 0 || equipment.every((e) => outdoorEquipment.includes(e.toLowerCase()));
    return hasOutdoorEquipment ? 0.7 : 0.1;
  }

  // Gym - most equipment available
  return 0.9;
}

async function loadJsonFiles(): Promise<{ filename: string; exercises: RawExercise[] }[]> {
  if (!fs.existsSync(EXERCISES_DIR)) {
    console.error(`Directory not found: ${EXERCISES_DIR}`);
    console.log('\nPlease create the directory and add your exercise JSON files:');
    console.log(`  mkdir -p ${EXERCISES_DIR}`);
    console.log(`  # Copy your JSON files there`);
    process.exit(1);
  }

  const files = fs.readdirSync(EXERCISES_DIR).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.error(`No JSON files found in: ${EXERCISES_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} JSON files to import:\n`);

  const results: { filename: string; exercises: RawExercise[] }[] = [];

  for (const file of files) {
    const filePath = path.join(EXERCISES_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle both array and object with exercises property
      const exercises = Array.isArray(data) ? data : data.exercises || [];

      console.log(`  - ${file}: ${exercises.length} exercises`);
      results.push({ filename: file, exercises });
    } catch (err) {
      console.error(`  - ${file}: ERROR parsing JSON - ${(err as Error).message}`);
    }
  }

  return results;
}

async function importExercises() {
  console.log('='.repeat(60));
  console.log('Exercise Import Script');
  console.log('='.repeat(60));
  console.log();

  // Load all JSON files
  const allFiles = await loadJsonFiles();

  // Flatten all exercises
  const allExercises: { exercise: RawExercise; filename: string; index: number }[] = [];
  for (const { filename, exercises } of allFiles) {
    exercises.forEach((exercise, index) => {
      allExercises.push({ exercise, filename, index });
    });
  }

  console.log(`\nTotal exercises to import: ${allExercises.length}\n`);

  // Validate all exercises
  console.log('Validating exercises...\n');
  const allErrors: string[] = [];
  const validExercises: ReturnType<typeof transformExercise>[] = [];
  const slugsSeen = new Set<string>();
  const duplicateSlugs: string[] = [];

  for (const { exercise, filename, index } of allExercises) {
    const errors = validateExercise(exercise, index, filename);

    if (errors.length > 0) {
      allErrors.push(`[${filename}] ${errors.join('; ')}`);
    } else {
      // Check for duplicate slugs
      if (slugsSeen.has(exercise.slug)) {
        duplicateSlugs.push(`${exercise.slug} (in ${filename})`);
      } else {
        slugsSeen.add(exercise.slug);
        validExercises.push(transformExercise(exercise));
      }
    }
  }

  if (allErrors.length > 0) {
    console.log('Validation errors found:\n');
    allErrors.forEach((err) => console.log(`  ❌ ${err}`));
    console.log();
  }

  if (duplicateSlugs.length > 0) {
    console.log('Duplicate slugs (skipped):\n');
    duplicateSlugs.forEach((slug) => console.log(`  ⚠️  ${slug}`));
    console.log();
  }

  console.log(`Valid exercises: ${validExercises.length}`);
  console.log(`Skipped (errors): ${allErrors.length}`);
  console.log(`Skipped (duplicates): ${duplicateSlugs.length}`);
  console.log();

  if (validExercises.length === 0) {
    console.log('No valid exercises to import. Exiting.');
    process.exit(1);
  }

  // Import to database
  console.log('Importing to database...\n');

  let imported = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of validExercises) {
    try {
      // Upsert - update if exists, create if not
      await prisma.exercise.upsert({
        where: { slug: exercise.slug },
        update: {
          ...exercise,
          updatedAt: new Date(),
        },
        create: exercise,
      });

      // Check if it was an update or create
      const existing = await prisma.exercise.findUnique({
        where: { slug: exercise.slug },
        select: { createdAt: true, updatedAt: true },
      });

      if (existing && existing.createdAt < existing.updatedAt) {
        updated++;
      } else {
        imported++;
      }

      process.stdout.write(`\r  Progress: ${imported + updated + failed}/${validExercises.length}`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ Failed to import "${exercise.name}": ${(err as Error).message}`);
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('Import Complete!');
  console.log('='.repeat(60));
  console.log(`  ✅ Created: ${imported}`);
  console.log(`  🔄 Updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log();

  // Show total in database
  const totalCount = await prisma.exercise.count();
  console.log(`Total exercises in database: ${totalCount}`);
}

async function main() {
  try {
    await importExercises();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
