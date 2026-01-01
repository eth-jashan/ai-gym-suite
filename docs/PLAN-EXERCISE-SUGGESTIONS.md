# Exercise Suggestion System - Implementation Plan

## Overview

This document outlines the comprehensive plan for building an AI-powered exercise suggestion system that leverages onboarding data, pgvector for semantic search, and a rich exercise database generated via Claude.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Phase 1: Exercise Database Enhancement](#phase-1-exercise-database-enhancement)
3. [Phase 2: Exercise Generation Strategy](#phase-2-exercise-generation-strategy)
4. [Phase 3: Master Prompt Guide](#phase-3-master-prompt-guide)
5. [Phase 4: Pgvector Integration](#phase-4-pgvector-integration)
6. [Phase 5: Suggestion Algorithm](#phase-5-suggestion-algorithm)
7. [Phase 6: API Implementation](#phase-6-api-implementation)
8. [Exercise JSON Schema](#exercise-json-schema)
9. [Onboarding to Exercise Mapping](#onboarding-to-exercise-mapping)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │  Onboarding  │───▶│   Profile    │───▶│ Initial 3-4 Day Plan │  │
│   │  (27 Q's)    │    │   Created    │    │    (Week 1)          │  │
│   └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                    │                 │
│                                                    ▼                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │   Workout    │◀───│  Exercise    │◀───│  Progress Tracking   │  │
│   │  Execution   │    │  Suggestions │    │   & Adaptation       │  │
│   └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                    EXERCISE DATABASE                        │    │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │    │
│   │  │  Exercise   │  │   Vector    │  │   Category Index    │ │    │
│   │  │  Catalog    │  │  Embeddings │  │   (Fast Filtering)  │ │    │
│   │  │  (500+)     │  │  (pgvector) │  │                     │ │    │
│   │  └─────────────┘  └─────────────┘  └─────────────────────┘ │    │
│   └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │              SUGGESTION ENGINE                              │    │
│   │  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐  │    │
│   │  │  Profile   │  │   Semantic   │  │   Progressive     │  │    │
│   │  │  Matcher   │  │   Search     │  │   Overload Logic  │  │    │
│   │  └────────────┘  └──────────────┘  └───────────────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Exercise Database Enhancement

### Current State
- 30+ exercises in seed data
- Exercise model has 45 fields (comprehensive)
- `embedding` field exists but unused

### Required Changes to Exercise Model

Add these new fields to the Exercise schema:

```prisma
model Exercise {
  // ... existing 45 fields ...

  // NEW FIELDS FOR BETTER SUGGESTIONS

  // Fitness Level Suitability (1-5 scale arrays)
  fitnessLevelSuitability    Json      // {sedentary: 3, lightlyActive: 4, moderatelyActive: 5, veryActive: 5, athlete: 5}
  experienceLevelSuitability Json      // {never: 2, lessThan6Mo: 3, sixTo24Mo: 4, twoTo5Yr: 5, fivePlusYr: 5}

  // Goal-Specific Effectiveness (0.0-1.0)
  goalEffectiveness          Json      // {weightLoss: 0.7, muscleGain: 0.9, strength: 0.95, endurance: 0.4, flexibility: 0.1}

  // Time/Logistics
  estimatedTimePerSet        Int       // seconds (including rest between reps)
  setupTimeSeconds           Int       // time to set up equipment

  // Body Part Safety Mapping
  safeWithInjury             String[]  // injuries that DON'T affect this exercise
  modificationsByInjury      Json      // {shoulderInjury: "reduce ROM", lowerBackInjury: "use lighter weight"}

  // Progression Metadata
  progressionOrder           Int?      // order in progression chain (1=easiest)
  progressionChainId         String?   // groups exercises in same progression

  // Onboarding Compatibility Scores (pre-computed)
  homeCompatibility          Float     @default(0.5) // 0-1 score for home workout
  gymCompatibility           Float     @default(0.5) // 0-1 score for gym workout
  outdoorCompatibility       Float     @default(0.5) // 0-1 score for outdoor

  // Semantic Search Text (for embedding generation)
  searchText                 String?   @db.Text // Concatenated searchable text
}
```

### New Tables Required

```prisma
// User's relationship with specific exercises
model UserExerciseHistory {
  id              String    @id @default(uuid())
  userId          String
  exerciseId      String

  // Performance tracking
  timesPerformed  Int       @default(0)
  lastPerformed   DateTime?
  personalBest    Json?     // {weight: 100, reps: 12, date: "2024-01-15"}
  averageRPE      Float?    // average Rate of Perceived Exertion

  // Preference
  isFavorite      Boolean   @default(false)
  isDisliked      Boolean   @default(false)
  userDifficulty  Int?      // 1-5 user-rated difficulty

  // Notes
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise        Exercise  @relation(fields: [exerciseId], references: [id])

  @@unique([userId, exerciseId])
  @@index([userId])
  @@index([exerciseId])
}

// Suggestion tracking for ML improvement
model ExerciseSuggestion {
  id              String    @id @default(uuid())
  userId          String
  exerciseId      String

  // Context
  suggestionType  String    // "initial_plan", "progression", "variety", "weakness_focus"
  dayOfWeek       Int?      // 0-6 (which day in plan)
  weekNumber      Int?      // which week of training

  // Outcome
  wasAccepted     Boolean?
  wasCompleted    Boolean?
  performance     Json?     // {sets, reps, weight, rpe, duration}
  userFeedback    String?   // "too_easy", "too_hard", "enjoyed", "boring"

  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise        Exercise  @relation(fields: [exerciseId], references: [id])

  @@index([userId])
  @@index([exerciseId])
  @@index([suggestionType])
}

// Weekly training plan
model WeeklyPlan {
  id              String    @id @default(uuid())
  userId          String
  weekNumber      Int       // sequential week (1, 2, 3...)
  startDate       DateTime

  // Plan structure
  days            Json      // [{dayIndex: 0, muscles: ["chest", "triceps"], exercises: [...]}]
  splitType       String    // "PPL", "ULUL", "FULL_BODY", etc.

  // Progress
  isActive        Boolean   @default(true)
  completedDays   Int[]     @default([])

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, weekNumber])
}
```

---

## Phase 2: Exercise Generation Strategy

### Target Exercise Count by Category

| Category | Count | Priority |
|----------|-------|----------|
| Strength - Compound | 80 | High |
| Strength - Isolation | 120 | High |
| Cardio - HIIT | 40 | Medium |
| Cardio - Steady State | 30 | Medium |
| Calisthenics/Bodyweight | 60 | High |
| Flexibility/Mobility | 50 | Medium |
| Plyometrics | 30 | Low |
| Balance | 20 | Low |
| **TOTAL** | **430+** | |

### Exercise Breakdown by Muscle Group

```
UPPER BODY (200 exercises)
├── Chest (35)
│   ├── Compound: Bench Press variations, Push-ups, Dips
│   └── Isolation: Flies, Cable crossovers, Pullovers
├── Back (40)
│   ├── Compound: Rows, Pull-ups, Deadlifts
│   └── Isolation: Pullovers, Shrugs, Face pulls
├── Shoulders (35)
│   ├── Compound: Overhead press, Push press, Arnold press
│   └── Isolation: Raises (front, lateral, rear), Face pulls
├── Biceps (25)
│   └── Isolation: Curls (barbell, dumbbell, cable, hammer)
├── Triceps (25)
│   └── Isolation: Extensions, Pushdowns, Dips, Skull crushers
├── Forearms (15)
│   └── Isolation: Wrist curls, Reverse curls, Farmer carries
└── Core (25)
    └── Planks, Crunches, Leg raises, Russian twists, Ab wheel

LOWER BODY (100 exercises)
├── Quads (30)
│   ├── Compound: Squats, Lunges, Leg press
│   └── Isolation: Leg extensions, Sissy squats
├── Hamstrings (25)
│   ├── Compound: Deadlifts, Good mornings
│   └── Isolation: Leg curls, Nordic curls
├── Glutes (25)
│   ├── Compound: Hip thrusts, Squats, Lunges
│   └── Isolation: Kickbacks, Clamshells, Hip abduction
└── Calves (20)
    └── Isolation: Calf raises (standing, seated, donkey)

CARDIO & CONDITIONING (80 exercises)
├── HIIT Movements (40)
│   └── Burpees, Mountain climbers, Jump squats, Box jumps
├── Steady State (20)
│   └── Running, Cycling, Rowing, Swimming, Walking
└── Conditioning (20)
    └── Sled pushes, Battle ropes, Kettlebell swings

FLEXIBILITY & MOBILITY (50 exercises)
├── Dynamic Stretches (20)
├── Static Stretches (20)
└── Mobility Drills (10)
```

### Equipment Variations to Generate

For each base exercise, generate variations for:
- **Barbell** (standard, EZ bar, trap bar)
- **Dumbbell** (single, pairs)
- **Kettlebell**
- **Cable/Machine**
- **Resistance Band**
- **Bodyweight**
- **Smith Machine**

---

## Phase 3: Master Prompt Guide

### MASTER PROMPT FOR EXERCISE GENERATION

Use this prompt with Claude to generate exercises in batches:

```markdown
# Exercise Generation Prompt

You are an expert exercise physiologist and strength coach creating a comprehensive exercise database for a fitness app. Generate exercises in valid JSON format following the exact schema provided.

## Context
- Target audience: All fitness levels (beginner to advanced)
- Equipment availability: Home (minimal), Gym (full), Outdoor
- Goals: Weight Loss, Muscle Gain, Strength, Endurance, Flexibility, General Fitness

## Schema (MUST follow exactly)

```json
{
  "name": "string - Clear, specific exercise name",
  "slug": "string - URL-friendly lowercase with hyphens",
  "description": "string - 2-3 sentences explaining the exercise and its benefits",
  "instructions": ["string array - Step-by-step instructions, 4-8 steps"],

  "category": "STRENGTH | CARDIO | FLEXIBILITY | BALANCE | PLYOMETRIC | CALISTHENICS",
  "movementPattern": "HORIZONTAL_PUSH | HORIZONTAL_PULL | VERTICAL_PUSH | VERTICAL_PULL | SQUAT | HINGE | LUNGE | CARRY | ROTATION | ANTI_ROTATION | FLEXION | EXTENSION | ISOLATION | CARDIO",
  "exerciseType": "COMPOUND | ISOLATION | CARDIO_STEADY | CARDIO_HIIT | FLEXIBILITY | MOBILITY | WARMUP | COOLDOWN",

  "primaryMuscles": ["string array - main muscles worked, use: chest, back, lats, shoulders, biceps, triceps, forearms, core, obliques, quads, hamstrings, glutes, calves, hip_flexors"],
  "secondaryMuscles": ["string array - supporting muscles"],
  "muscleActivationMap": {"muscle_name": 0.0-1.0},

  "difficultyLevel": "1-5 integer (1=very easy, 5=very hard)",
  "skillRequirement": "1-5 integer",
  "isBeginnerFriendly": "boolean",

  "equipmentRequired": ["string array - equipment needed, empty for bodyweight"],
  "equipmentOptional": ["string array - optional equipment for variations"],
  "suitableLocations": ["home", "gym", "outdoor"],

  "repRanges": {
    "strength": {"min": 3, "max": 6},
    "hypertrophy": {"min": 8, "max": 12},
    "endurance": {"min": 15, "max": 20}
  },
  "typicalSets": {"min": 3, "max": 5},
  "restSeconds": {
    "strength": 180,
    "hypertrophy": 90,
    "endurance": 45
  },

  "metValue": "float - Metabolic Equivalent (2.0-12.0 typically)",
  "intensityFactor": "float 0.1-1.0",

  "contraindications": ["string array - injuries/conditions to avoid: shoulder_injury, elbow_injury, wrist_injury, lower_back_injury, upper_back_injury, neck_injury, knee_injury, ankle_injury, hip_injury, heart_condition, high_blood_pressure, pregnancy"],
  "formCues": ["string array - 3-5 key form tips"],
  "commonMistakes": ["string array - 3-5 common mistakes to avoid"],

  "easierVariation": "string - slug of easier exercise or null",
  "harderVariation": "string - slug of harder exercise or null",
  "alternativeExercises": ["string array - slugs of alternatives"],

  "tags": ["string array - descriptive tags"],
  "suitableGoals": ["WEIGHT_LOSS", "MUSCLE_GAIN", "STRENGTH", "ENDURANCE", "FLEXIBILITY", "GENERAL_FITNESS"],

  "fitnessLevelSuitability": {
    "sedentary": 1-5,
    "lightlyActive": 1-5,
    "moderatelyActive": 1-5,
    "veryActive": 1-5,
    "athlete": 1-5
  },
  "experienceLevelSuitability": {
    "never": 1-5,
    "lessThan6Mo": 1-5,
    "sixTo24Mo": 1-5,
    "twoTo5Yr": 1-5,
    "fivePlusYr": 1-5
  },
  "goalEffectiveness": {
    "weightLoss": 0.0-1.0,
    "muscleGain": 0.0-1.0,
    "strength": 0.0-1.0,
    "endurance": 0.0-1.0,
    "flexibility": 0.0-1.0,
    "generalFitness": 0.0-1.0
  },

  "estimatedTimePerSet": "integer - seconds including rest between reps",
  "setupTimeSeconds": "integer - equipment setup time",

  "homeCompatibility": 0.0-1.0,
  "gymCompatibility": 0.0-1.0,
  "outdoorCompatibility": 0.0-1.0,

  "searchText": "string - concatenated searchable text for embeddings"
}
```

## Generation Rules

1. **Accuracy**: Use scientifically accurate muscle activation and biomechanics
2. **Specificity**: Be specific about exercise variations (e.g., "Incline Dumbbell Bench Press" not just "Bench Press")
3. **Safety First**: Include comprehensive contraindications and form cues
4. **Progression Chains**: Link exercises to easier/harder variations
5. **Equipment Awareness**: Clearly specify required vs optional equipment
6. **Goal Alignment**: Rate each exercise's effectiveness for different goals

## Batch Request Format

Generate [NUMBER] exercises for [CATEGORY/MUSCLE GROUP].

Example: "Generate 15 chest exercises focusing on compound movements suitable for both home and gym settings."

## Output Format

Return ONLY a valid JSON array of exercise objects. No markdown, no explanations, just the JSON array.

```json
[
  { exercise1 },
  { exercise2 },
  ...
]
```
```

### BATCH GENERATION PROMPTS

Use these specific prompts to generate exercises in batches:

#### Batch 1: Chest Exercises (35 exercises)
```
Generate 35 chest exercises with the following distribution:
- 10 barbell exercises (bench variations)
- 10 dumbbell exercises (press and fly variations)
- 8 bodyweight exercises (push-up variations)
- 4 cable/machine exercises
- 3 resistance band exercises

Include exercises for all difficulty levels (1-5) and ensure home-friendly options.
```

#### Batch 2: Back Exercises (40 exercises)
```
Generate 40 back exercises with the following distribution:
- 12 barbell exercises (rows, deadlift variations)
- 12 dumbbell exercises (rows, pullovers)
- 8 bodyweight exercises (pull-ups, inverted rows)
- 5 cable/machine exercises
- 3 resistance band exercises

Ensure proper lat, upper back, and lower back coverage.
```

#### Batch 3: Leg Exercises - Quads & Hamstrings (55 exercises)
```
Generate 55 leg exercises:

QUADS (30):
- 8 squat variations (barbell, dumbbell, goblet, etc.)
- 8 lunge variations
- 8 single-leg exercises
- 6 machine/bodyweight (leg press, extensions, sissy squats)

HAMSTRINGS (25):
- 8 deadlift variations
- 8 curl variations (lying, seated, Nordic)
- 6 hip hinge movements
- 3 bodyweight options
```

#### Batch 4: Shoulders & Arms (85 exercises)
```
Generate 85 exercises for shoulders and arms:

SHOULDERS (35):
- 12 pressing movements
- 12 raise variations (front, lateral, rear)
- 6 rotator cuff exercises
- 5 compound/functional

BICEPS (25):
- All curl variations across equipment types

TRICEPS (25):
- Extensions, pushdowns, dips, skull crushers across equipment
```

#### Batch 5: Core & Abs (25 exercises)
```
Generate 25 core exercises:
- 8 anti-extension (planks, ab wheel)
- 6 anti-rotation (pallof press, bird dog)
- 6 flexion (crunches, leg raises)
- 5 rotation (Russian twists, woodchops)

Include exercises for all fitness levels with clear progressions.
```

#### Batch 6: HIIT & Cardio (70 exercises)
```
Generate 70 cardio and conditioning exercises:

HIIT MOVEMENTS (40):
- 15 jump-based (box jumps, jump squats, burpees)
- 15 bodyweight circuits (mountain climbers, high knees)
- 10 equipment-based (kettlebell swings, battle ropes)

STEADY STATE (20):
- Running/jogging variations
- Cycling variations
- Rowing variations
- Low-impact options

CONDITIONING (10):
- Sled work
- Carries
- Complexes
```

#### Batch 7: Flexibility & Mobility (50 exercises)
```
Generate 50 flexibility and mobility exercises:

DYNAMIC STRETCHES (20):
- Upper body
- Lower body
- Full body warm-up movements

STATIC STRETCHES (20):
- Major muscle group stretches
- Post-workout cooldown

MOBILITY DRILLS (10):
- Joint-specific mobility (hip, ankle, shoulder, thoracic spine)
```

#### Batch 8: Glutes & Calves (45 exercises)
```
Generate 45 lower body isolation exercises:

GLUTES (25):
- 8 hip thrust variations
- 8 kickback/abduction movements
- 6 bridge variations
- 3 machine exercises

CALVES (20):
- Standing calf raise variations
- Seated calf raise variations
- Single-leg options
- Bodyweight options
```

---

## Phase 4: Pgvector Integration

### Setting Up Pgvector

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to Exercise table (if not exists)
ALTER TABLE "Exercise"
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS exercise_embedding_idx
ON "Exercise"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Generating Embeddings

Create `searchText` for each exercise by concatenating:

```typescript
function generateSearchText(exercise: Exercise): string {
  return [
    exercise.name,
    exercise.description,
    exercise.category,
    exercise.movementPattern,
    exercise.exerciseType,
    exercise.primaryMuscles.join(', '),
    exercise.secondaryMuscles.join(', '),
    exercise.tags.join(', '),
    exercise.suitableGoals.join(', '),
    exercise.equipmentRequired.join(', '),
    exercise.suitableLocations.join(', '),
    `difficulty level ${exercise.difficultyLevel}`,
    exercise.isBeginnerFriendly ? 'beginner friendly' : 'advanced',
    exercise.formCues.join('. '),
  ].filter(Boolean).join(' | ');
}
```

### Embedding Generation Service

```typescript
// services/embedding.service.ts
import OpenAI from 'openai';

const openai = new OpenAI();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // or text-embedding-ada-002
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateExerciseEmbeddings(exercises: Exercise[]) {
  const batchSize = 100;

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);

    const texts = batch.map(e => e.searchText || generateSearchText(e));

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    // Update exercises with embeddings
    for (let j = 0; j < batch.length; j++) {
      await prisma.exercise.update({
        where: { id: batch[j].id },
        data: {
          embedding: response.data[j].embedding,
          searchText: texts[j]
        }
      });
    }
  }
}
```

### Semantic Search Query

```typescript
// Search for exercises similar to user profile
async function findSimilarExercises(
  queryEmbedding: number[],
  filters: {
    category?: string;
    equipmentAvailable?: string[];
    location?: string;
    maxDifficulty?: number;
    contraindications?: string[];
  },
  limit: number = 20
): Promise<Exercise[]> {

  const filterConditions: string[] = [];

  if (filters.category) {
    filterConditions.push(`category = '${filters.category}'`);
  }

  if (filters.location) {
    filterConditions.push(`'${filters.location}' = ANY(suitable_locations)`);
  }

  if (filters.maxDifficulty) {
    filterConditions.push(`difficulty_level <= ${filters.maxDifficulty}`);
  }

  // Exclude exercises with contraindications matching user injuries
  if (filters.contraindications?.length) {
    const injuries = filters.contraindications.map(i => `'${i}'`).join(', ');
    filterConditions.push(`NOT (contraindications && ARRAY[${injuries}])`);
  }

  const whereClause = filterConditions.length
    ? `WHERE ${filterConditions.join(' AND ')}`
    : '';

  const query = `
    SELECT *,
           1 - (embedding <=> $1::vector) as similarity
    FROM "Exercise"
    ${whereClause}
    ORDER BY embedding <=> $1::vector
    LIMIT ${limit}
  `;

  return prisma.$queryRawUnsafe(query, `[${queryEmbedding.join(',')}]`);
}
```

---

## Phase 5: Suggestion Algorithm

### Initial Plan Generation (Week 1)

```typescript
interface UserOnboardingData {
  // From onboarding
  primaryGoal: string;
  secondaryGoal?: string;
  fitnessLevel: string;
  experienceLevel: string;
  workoutLocation: string;
  availableEquipment: string[];
  workoutDaysPerWeek: number;
  sessionDuration: string; // "30-45", "45-60", etc.
  injuries: string[];
  chronicConditions: string[];
  preferredExerciseTypes: string[];
}

async function generateInitialPlan(userId: string, onboarding: UserOnboardingData) {
  // 1. Determine workout split based on days/week
  const split = getWorkoutSplit(onboarding.workoutDaysPerWeek);

  // 2. Calculate session parameters
  const sessionMinutes = parseSessionDuration(onboarding.sessionDuration);
  const exercisesPerSession = Math.floor(sessionMinutes / 8); // ~8 min per exercise avg

  // 3. Map user profile to exercise query embedding
  const profileEmbedding = await generateProfileEmbedding(onboarding);

  // 4. Generate each day's exercises
  const days = [];

  for (let dayIndex = 0; dayIndex < Math.min(onboarding.workoutDaysPerWeek, 4); dayIndex++) {
    const dayConfig = split.days[dayIndex];

    // Get exercises for this day's muscle groups
    const exercises = await selectExercisesForDay({
      muscleGroups: dayConfig.muscles,
      profileEmbedding,
      equipment: onboarding.availableEquipment,
      location: onboarding.workoutLocation,
      fitnessLevel: onboarding.fitnessLevel,
      experienceLevel: onboarding.experienceLevel,
      injuries: onboarding.injuries,
      goal: onboarding.primaryGoal,
      count: exercisesPerSession,
      preferredTypes: onboarding.preferredExerciseTypes,
    });

    days.push({
      dayIndex,
      dayName: dayConfig.name,
      muscles: dayConfig.muscles,
      exercises: exercises.map(e => ({
        exerciseId: e.id,
        sets: e.typicalSets.min,
        reps: e.repRanges[mapGoalToRepRange(onboarding.primaryGoal)],
        restSeconds: e.restSeconds[mapGoalToRestRange(onboarding.primaryGoal)],
      }))
    });
  }

  // 5. Save the weekly plan
  return prisma.weeklyPlan.create({
    data: {
      userId,
      weekNumber: 1,
      startDate: new Date(),
      days,
      splitType: split.name,
    }
  });
}
```

### Workout Split Templates

```typescript
const WORKOUT_SPLITS = {
  2: {
    name: 'FULL_BODY_2',
    days: [
      { name: 'Full Body A', muscles: ['chest', 'back', 'quads', 'shoulders', 'core'] },
      { name: 'Full Body B', muscles: ['back', 'glutes', 'hamstrings', 'biceps', 'triceps', 'core'] }
    ]
  },
  3: {
    name: 'PPL',
    days: [
      { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', muscles: ['back', 'lats', 'biceps', 'forearms'] },
      { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] }
    ]
  },
  4: {
    name: 'UPPER_LOWER',
    days: [
      { name: 'Upper A', muscles: ['chest', 'back', 'shoulders'] },
      { name: 'Lower A', muscles: ['quads', 'hamstrings', 'glutes'] },
      { name: 'Upper B', muscles: ['back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower B', muscles: ['glutes', 'hamstrings', 'calves', 'core'] }
    ]
  },
  5: {
    name: 'PPL_UL',
    days: [
      { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', muscles: ['back', 'lats', 'biceps'] },
      { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { name: 'Upper', muscles: ['chest', 'back', 'shoulders'] },
      { name: 'Lower', muscles: ['quads', 'glutes', 'hamstrings', 'core'] }
    ]
  },
  6: {
    name: 'PPL_PPL',
    days: [
      { name: 'Push A', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull A', muscles: ['back', 'lats', 'biceps'] },
      { name: 'Legs A', muscles: ['quads', 'hamstrings', 'glutes'] },
      { name: 'Push B', muscles: ['shoulders', 'chest', 'triceps'] },
      { name: 'Pull B', muscles: ['lats', 'back', 'biceps', 'forearms'] },
      { name: 'Legs B', muscles: ['glutes', 'hamstrings', 'calves', 'core'] }
    ]
  },
  7: {
    name: 'BROSPLIT_PLUS',
    days: [
      { name: 'Chest', muscles: ['chest', 'triceps'] },
      { name: 'Back', muscles: ['back', 'lats', 'biceps'] },
      { name: 'Shoulders', muscles: ['shoulders', 'traps'] },
      { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes'] },
      { name: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
      { name: 'Lower Body', muscles: ['glutes', 'calves', 'core'] },
      { name: 'Active Recovery', muscles: ['core', 'flexibility'] }
    ]
  }
};
```

### Exercise Selection Algorithm

```typescript
async function selectExercisesForDay(params: {
  muscleGroups: string[];
  profileEmbedding: number[];
  equipment: string[];
  location: string;
  fitnessLevel: string;
  experienceLevel: string;
  injuries: string[];
  goal: string;
  count: number;
  preferredTypes: string[];
}): Promise<Exercise[]> {

  const selected: Exercise[] = [];
  const usedExerciseIds = new Set<string>();

  // Calculate exercises per muscle group
  const exercisesPerMuscle = Math.ceil(params.count / params.muscleGroups.length);

  for (const muscle of params.muscleGroups) {
    // Query exercises for this muscle with filters
    const candidates = await prisma.$queryRaw`
      SELECT e.*,
             1 - (e.embedding <=> ${params.profileEmbedding}::vector) as profile_match,
             e.goal_effectiveness->>${params.goal} as goal_score,
             e.fitness_level_suitability->>${params.fitnessLevel} as fitness_score,
             e.experience_level_suitability->>${params.experienceLevel} as exp_score
      FROM "Exercise" e
      WHERE ${muscle} = ANY(e.primary_muscles)
        AND (e.equipment_required = '{}' OR e.equipment_required <@ ${params.equipment})
        AND ${params.location} = ANY(e.suitable_locations)
        AND NOT (e.contraindications && ${params.injuries})
        AND e.is_active = true
      ORDER BY
        -- Prioritize compound movements first
        CASE WHEN e.exercise_type = 'COMPOUND' THEN 0 ELSE 1 END,
        -- Then by combined score
        (
          COALESCE(e.goal_effectiveness->>${params.goal}, 0.5)::float * 0.3 +
          COALESCE(e.fitness_level_suitability->>${params.fitnessLevel}, 3)::float / 5 * 0.2 +
          COALESCE(e.experience_level_suitability->>${params.experienceLevel}, 3)::float / 5 * 0.2 +
          (1 - (e.embedding <=> ${params.profileEmbedding}::vector)) * 0.3
        ) DESC
      LIMIT ${exercisesPerMuscle * 2}
    `;

    // Select from candidates, avoiding duplicates
    for (const exercise of candidates) {
      if (!usedExerciseIds.has(exercise.id) && selected.length < params.count) {
        selected.push(exercise);
        usedExerciseIds.add(exercise.id);

        if (selected.filter(e => e.primaryMuscles.includes(muscle)).length >= exercisesPerMuscle) {
          break;
        }
      }
    }
  }

  return selected;
}
```

### Progress-Based Adaptation (Week 2+)

```typescript
async function generateAdaptedPlan(userId: string, weekNumber: number) {
  // 1. Get previous week's data
  const lastWeek = await prisma.weeklyPlan.findFirst({
    where: { userId, weekNumber: weekNumber - 1 }
  });

  const performance = await prisma.exerciseLog.findMany({
    where: {
      userId,
      completedAt: {
        gte: lastWeek.startDate,
        lt: new Date()
      }
    },
    include: { setLogs: true }
  });

  // 2. Analyze performance
  const analysis = analyzePerformance(performance);

  // 3. Generate adapted plan
  const adaptations = [];

  // If user consistently hit all reps - increase difficulty
  if (analysis.completionRate > 0.9 && analysis.averageRPE < 7) {
    adaptations.push({ type: 'INCREASE_WEIGHT', amount: 2.5 });
    adaptations.push({ type: 'SWAP_HARDER_VARIATION', threshold: 0.3 });
  }

  // If user struggled - reduce difficulty
  if (analysis.completionRate < 0.7 || analysis.averageRPE > 9) {
    adaptations.push({ type: 'DECREASE_WEIGHT', amount: 2.5 });
    adaptations.push({ type: 'SWAP_EASIER_VARIATION', threshold: 0.5 });
  }

  // If exercises were marked as disliked - swap for alternatives
  const dislikedExercises = await prisma.userExerciseHistory.findMany({
    where: { userId, isDisliked: true }
  });

  for (const disliked of dislikedExercises) {
    adaptations.push({
      type: 'SWAP_ALTERNATIVE',
      exerciseId: disliked.exerciseId
    });
  }

  // 4. Apply adaptations to generate new plan
  return applyAdaptationsToplan(lastWeek, adaptations);
}
```

---

## Phase 6: API Implementation

### New Endpoints

```typescript
// routes/exercise-suggestions.routes.ts

router.get('/exercises/initial-plan', auth, async (req, res) => {
  // Generate initial 3-4 day plan based on onboarding
  const plan = await generateInitialPlan(req.userId);
  res.json(plan);
});

router.get('/exercises/weekly-plan', auth, async (req, res) => {
  // Get current week's plan (or generate if needed)
  const plan = await getCurrentWeeklyPlan(req.userId);
  res.json(plan);
});

router.post('/exercises/feedback', auth, async (req, res) => {
  // Submit feedback on suggested exercise
  const { exerciseId, feedback, performance } = req.body;
  await recordExerciseFeedback(req.userId, exerciseId, feedback, performance);
  res.json({ success: true });
});

router.get('/exercises/suggest/next', auth, async (req, res) => {
  // Get next exercise suggestion during workout
  const { currentExercises, targetMuscle, remainingTime } = req.query;
  const suggestion = await suggestNextExercise(req.userId, {
    currentExercises: currentExercises?.split(','),
    targetMuscle,
    remainingTime: Number(remainingTime)
  });
  res.json(suggestion);
});

router.get('/exercises/suggest/swap', auth, async (req, res) => {
  // Get alternative exercise for swap
  const { exerciseId, reason } = req.query;
  const alternatives = await suggestExerciseSwap(exerciseId, reason);
  res.json(alternatives);
});

router.post('/exercises/history/:exerciseId', auth, async (req, res) => {
  // Update user's relationship with exercise
  const { isFavorite, isDisliked, userDifficulty, notes } = req.body;
  await updateExerciseHistory(req.userId, req.params.exerciseId, {
    isFavorite, isDisliked, userDifficulty, notes
  });
  res.json({ success: true });
});
```

---

## Exercise JSON Schema

### Complete TypeScript Interface

```typescript
interface Exercise {
  // Identification
  id: string;
  name: string;
  slug: string;

  // Description
  description: string;
  instructions: string[];

  // Classification
  category: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'BALANCE' | 'PLYOMETRIC' | 'CALISTHENICS';
  movementPattern: 'HORIZONTAL_PUSH' | 'HORIZONTAL_PULL' | 'VERTICAL_PUSH' | 'VERTICAL_PULL' |
                   'SQUAT' | 'HINGE' | 'LUNGE' | 'CARRY' | 'ROTATION' | 'ANTI_ROTATION' |
                   'FLEXION' | 'EXTENSION' | 'ISOLATION' | 'CARDIO';
  exerciseType: 'COMPOUND' | 'ISOLATION' | 'CARDIO_STEADY' | 'CARDIO_HIIT' |
                'FLEXIBILITY' | 'MOBILITY' | 'WARMUP' | 'COOLDOWN';

  // Muscles
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleActivationMap: Record<string, number>; // 0.0-1.0

  // Difficulty
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  skillRequirement: 1 | 2 | 3 | 4 | 5;
  isBeginnerFriendly: boolean;

  // Equipment & Location
  equipmentRequired: string[];
  equipmentOptional: string[];
  suitableLocations: ('home' | 'gym' | 'outdoor')[];

  // Performance Parameters
  repRanges: {
    strength: { min: number; max: number };
    hypertrophy: { min: number; max: number };
    endurance: { min: number; max: number };
  };
  typicalSets: { min: number; max: number };
  restSeconds: {
    strength: number;
    hypertrophy: number;
    endurance: number;
  };

  // Intensity
  metValue: number;
  intensityFactor: number;

  // Safety
  contraindications: string[];
  formCues: string[];
  commonMistakes: string[];

  // Variations
  easierVariation: string | null;
  harderVariation: string | null;
  alternativeExercises: string[];

  // Media
  videoUrl?: string;
  thumbnailUrl?: string;
  animationUrl?: string;

  // Metadata
  tags: string[];
  suitableGoals: ('WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH' | 'ENDURANCE' | 'FLEXIBILITY' | 'GENERAL_FITNESS')[];

  // Suitability Scores (NEW)
  fitnessLevelSuitability: {
    sedentary: number;
    lightlyActive: number;
    moderatelyActive: number;
    veryActive: number;
    athlete: number;
  };
  experienceLevelSuitability: {
    never: number;
    lessThan6Mo: number;
    sixTo24Mo: number;
    twoTo5Yr: number;
    fivePlusYr: number;
  };
  goalEffectiveness: {
    weightLoss: number;
    muscleGain: number;
    strength: number;
    endurance: number;
    flexibility: number;
    generalFitness: number;
  };

  // Time
  estimatedTimePerSet: number;
  setupTimeSeconds: number;

  // Compatibility Scores
  homeCompatibility: number;
  gymCompatibility: number;
  outdoorCompatibility: number;

  // Vector Search
  searchText: string;
  embedding?: number[];
}
```

---

## Onboarding to Exercise Mapping

### Direct Mapping Table

| Onboarding Field | Exercise Filter/Score |
|------------------|----------------------|
| `primary_goal` | `goalEffectiveness[goal]` sorting |
| `fitness_level` | `fitnessLevelSuitability[level]` >= 3 |
| `experience_level` | `experienceLevelSuitability[level]` >= 3 |
| `workout_location` | `suitableLocations.includes(location)` |
| `available_equipment` | `equipmentRequired ⊆ available` |
| `injuries` | `NOT contraindications.overlaps(injuries)` |
| `workout_days_per_week` | Determines split template |
| `session_duration` | Determines exercise count |
| `preferred_exercise_types` | Category filter / boost |

### Scoring Formula

```typescript
function calculateExerciseScore(exercise: Exercise, profile: UserProfile): number {
  let score = 0;

  // Goal effectiveness (30%)
  score += (exercise.goalEffectiveness[profile.primaryGoal] || 0.5) * 0.30;

  // Fitness level suitability (20%)
  const fitnessScore = exercise.fitnessLevelSuitability[profile.fitnessLevel] / 5;
  score += fitnessScore * 0.20;

  // Experience level suitability (20%)
  const expScore = exercise.experienceLevelSuitability[profile.experienceLevel] / 5;
  score += expScore * 0.20;

  // Location compatibility (15%)
  const locationScore = exercise[`${profile.workoutLocation}Compatibility`];
  score += locationScore * 0.15;

  // Preference match (15%) - boost if matches preferred types
  const prefMatch = profile.preferredExerciseTypes.includes(exercise.category) ? 1 : 0.5;
  score += prefMatch * 0.15;

  return score;
}
```

---

## Implementation Checklist

### Phase 1: Database & Schema
- [ ] Add new fields to Exercise model
- [ ] Create UserExerciseHistory table
- [ ] Create ExerciseSuggestion table
- [ ] Create WeeklyPlan table
- [ ] Run migrations

### Phase 2: Exercise Generation
- [ ] Generate Chest exercises (35)
- [ ] Generate Back exercises (40)
- [ ] Generate Leg exercises (55)
- [ ] Generate Shoulder & Arm exercises (85)
- [ ] Generate Core exercises (25)
- [ ] Generate Cardio exercises (70)
- [ ] Generate Flexibility exercises (50)
- [ ] Generate Glute & Calf exercises (45)
- [ ] Import all exercises to database

### Phase 3: Pgvector Setup
- [ ] Enable pgvector extension
- [ ] Add embedding column
- [ ] Create vector index
- [ ] Generate embeddings for all exercises
- [ ] Test similarity search

### Phase 4: Suggestion Engine
- [ ] Implement initial plan generation
- [ ] Implement exercise selection algorithm
- [ ] Implement progress-based adaptation
- [ ] Implement swap/alternative suggestions

### Phase 5: API Implementation
- [ ] Create exercise-suggestions routes
- [ ] Integrate with existing workout system
- [ ] Add feedback endpoints
- [ ] Test all endpoints

### Phase 6: Mobile Integration
- [ ] Display initial plan after onboarding
- [ ] Show daily workout with exercises
- [ ] Implement exercise swap UI
- [ ] Add exercise feedback UI
- [ ] Track completion and progress

---

## Next Steps

1. **Immediate**: Generate exercises using the batch prompts above via Claude web interface
2. **Short-term**: Implement database schema changes and import exercises
3. **Medium-term**: Set up pgvector and generate embeddings
4. **Long-term**: Build and test the full suggestion engine

Would you like me to start with any specific phase or provide more details on any section?
