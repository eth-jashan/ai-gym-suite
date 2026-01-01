# Exercise Suggestion System - Implementation Plan

## Overview

This document outlines how to suggest personalized exercises based on onboarding responses, with a focus on initial 3-4 day workout plans and progress-based progression.

---

## Part 1: Initial Exercise Suggestion Strategy (Days 1-4)

### 1.1 Onboarding-to-Exercise Mapping

Based on the 30 onboarding questions collected, here's how each factor influences exercise selection:

#### Primary Decision Factors

| Onboarding Data | Impact on Exercise Selection |
|----------------|------------------------------|
| **Primary Goal** | Determines rep ranges, rest periods, exercise types |
| **Fitness Level** | Filters difficulty (1-5 scale) |
| **Experience Level** | Determines skill requirement threshold |
| **Available Equipment** | Hard filter on exercises |
| **Workout Location** | Hard filter on suitable locations |
| **Days Per Week** | Determines workout split pattern |
| **Session Duration** | Determines exercise count per workout |
| **Injuries/Limitations** | Excludes contraindicated exercises |

#### Secondary Decision Factors

| Onboarding Data | Impact on Exercise Selection |
|----------------|------------------------------|
| **Push-up/Plank/Squat Capacity** | Fine-tunes difficulty selection |
| **Preferred Exercise Types** | Prioritizes matching categories |
| **Rest Preference** | Adjusts rest periods |
| **Age** | Adjusts intensity factor |
| **Chronic Conditions** | Additional safety filters |

### 1.2 Initial Week Workout Split Strategy

```
Days Per Week → Split Assignment:

1 day:  [FULL_BODY]
2 days: [FULL_BODY, FULL_BODY]
3 days: [PUSH, PULL, LEGS] or [FULL_BODY × 3] for beginners
4 days: [UPPER, LOWER, UPPER, LOWER] or [PUSH, PULL, LEGS, FULL_BODY]
5 days: [PUSH, PULL, LEGS, UPPER, LOWER]
6 days: [PUSH, PULL, LEGS, PUSH, PULL, LEGS]
7 days: [PUSH, PULL, LEGS, UPPER, LOWER, FULL_BODY, ACTIVE_RECOVERY]
```

### 1.3 First Week - Conservative Approach

For the first 3-4 workouts, apply these principles:

1. **Lower Intensity Multiplier**: Start at 70% of calculated capacity
2. **Beginner-Friendly First**: Prioritize `isBeginnerFriendly: true` exercises
3. **Compound Focus**: 60% compound, 40% isolation movements
4. **Shorter Sessions**: Reduce exercise count by 1-2 from normal
5. **Extended Rest**: Add 15-30 seconds to base rest periods

```typescript
// Example: First week adjustment
const FIRST_WEEK_MODIFIERS = {
  intensityMultiplier: 0.7,
  exerciseCountReduction: 1,
  restSecondsBonus: 15,
  preferBeginnerFriendly: true,
  maxDifficultyLevel: userDifficulty - 1, // One level below max
};
```

### 1.4 Exercise Selection Algorithm (Enhanced)

```typescript
interface ExerciseSelectionCriteria {
  // Hard Filters (must match)
  targetMuscles: string[];
  availableEquipment: string[];
  workoutLocation: WorkoutLocation;
  contraindicatedMuscles: string[];

  // Soft Filters (score-based)
  preferredExerciseTypes: ExerciseCategory[];
  maxDifficultyLevel: number;
  maxSkillRequirement: number;
  isFirstWeek: boolean;

  // Scoring Weights
  weights: {
    goalAlignment: number;      // 0.3
    difficultyMatch: number;    // 0.2
    popularityScore: number;    // 0.2
    varietyBonus: number;       // 0.15
    preferenceMatch: number;    // 0.15
  };
}
```

---

## Part 2: Progress-Based Suggestions

### 2.1 Progress Metrics to Track

```typescript
interface UserProgressMetrics {
  // Workout Completion
  workoutsCompleted: number;
  workoutCompletionRate: number; // % of scheduled workouts done
  averageWorkoutDuration: number;

  // Performance
  totalVolumeLifted: number;
  volumeProgressRate: number; // Week over week
  averageRpe: number;
  rpeDeclineRate: number; // Lower RPE = getting easier

  // Exercise Specific
  exerciseHistory: Map<string, ExercisePerformance>;
  muscleGroupFrequency: Map<string, number>;

  // Consistency
  currentStreak: number;
  longestStreak: number;
  preferredWorkoutDays: number[];
  missedWorkoutPatterns: string[];
}

interface ExercisePerformance {
  timesCompleted: number;
  lastWeight: number;
  lastReps: number;
  personalRecords: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number;
  };
  averageFormRating: number;
  progressionRate: number; // % increase per week
}
```

### 2.2 Progressive Overload Rules

```typescript
const PROGRESSION_RULES = {
  // When to increase difficulty
  volumeProgression: {
    ifAverageRpe: '<= 7',
    andCompletionRate: '>= 90%',
    andFormRating: '>= 4',
    then: 'increase weight by 2.5-5%',
  },

  // When to add exercises
  exerciseCountProgression: {
    ifConsecutiveWorkouts: '>= 8',
    andSessionDurationUtilization: '< 80%',
    then: 'add 1 exercise',
  },

  // When to progress to harder variations
  exerciseVariationProgression: {
    ifTimesCompleted: '>= 10',
    andAverageFormRating: '>= 4.5',
    andRpeDecline: '>= 15%',
    then: 'suggest harderVariation',
  },

  // When to deload
  deloadTriggers: {
    ifRpeIncrease: '>= 20% over 2 weeks',
    orMissedWorkouts: '>= 3 consecutive',
    orFormRatingDecline: '>= 1 point average',
    then: 'reduce volume by 40% for 1 week',
  },
};
```

### 2.3 Adaptive Workout Generation

After the first week, workouts adapt based on:

```typescript
interface AdaptiveFactors {
  // From completed workouts
  preferredExercises: string[];       // High form rating, completed all sets
  strugglingExercises: string[];      // Low form rating, incomplete sets
  skippedExercises: string[];         // User consistently skips these

  // Time patterns
  actualSessionDuration: number;      // May differ from preference
  optimalTimeOfDay: string;           // When user performs best

  // Goal progress
  goalProgressRate: number;           // Towards target weight/strength
  shouldIntensify: boolean;           // Ahead of schedule
  shouldDeload: boolean;              // Behind or overtraining signs
}
```

---

## Part 3: Enhanced Exercise Schema

### 3.1 Proposed Schema Additions

```prisma
model Exercise {
  // ... existing fields ...

  // NEW: AI Generation Metadata
  generatedBy           String?           // "claude-3.5-sonnet", "manual"
  generationPromptHash  String?           // For reproducibility
  verifiedByExpert      Boolean           @default(false)

  // NEW: Enhanced Categorization
  fitnessLevel          FitnessLevel[]    // [BEGINNER, INTERMEDIATE, ADVANCED]
  bodySection           BodySection       // UPPER, LOWER, CORE, FULL_BODY
  force                 ForceType         // PUSH, PULL, STATIC, DYNAMIC
  mechanics             MechanicsType     // COMPOUND, ISOLATION
  laterality            Laterality        // BILATERAL, UNILATERAL, ALTERNATING
  plane                 MovementPlane[]   // [SAGITTAL, FRONTAL, TRANSVERSE]

  // NEW: Progression Chain
  prerequisiteExercises String[]          // Exercises to master first
  progressionLevel      Int               // 1-10 within movement pattern

  // NEW: Detailed Instructions
  setupInstructions     String[]          // Step-by-step setup
  executionPhases       Json              // { eccentric: "...", concentric: "...", isometric: "..." }
  breathingPattern      String            // "exhale on push, inhale on lower"
  tempoRecommendation   String            // "3-1-2-0" (eccentric-pause-concentric-pause)

  // NEW: Advanced Parameters
  timeUnderTension      Int?              // Seconds per rep
  rangeOfMotion         ROMType           // FULL, PARTIAL, ISOMETRIC
  loadingPattern        LoadingPattern    // LINEAR, UNDULATING, WAVE

  // NEW: Beginner Modifications
  beginnerModifications Json              // { modification: "...", equipment: [...] }
  scalingOptions        Json[]            // [{ name: "Assisted", description: "..." }]

  // NEW: Integration
  warmupFor             String[]          // Exercise slugs this warms up for
  supersetsWith         String[]          // Good superset pairings
  circuitCompatible     Boolean           @default(true)

  // NEW: Real-world Factors
  spaceRequired         SpaceSize         // MINIMAL, MODERATE, LARGE
  noiseLevel            NoiseLevel        // SILENT, QUIET, MODERATE, LOUD
  sweatFactor           Int               // 1-5
}

enum BodySection {
  UPPER_PUSH
  UPPER_PULL
  LOWER_PUSH
  LOWER_PULL
  CORE_ANTERIOR
  CORE_POSTERIOR
  CORE_LATERAL
  FULL_BODY
}

enum ForceType {
  PUSH
  PULL
  STATIC_HOLD
  DYNAMIC
  EXPLOSIVE
}

enum Laterality {
  BILATERAL
  UNILATERAL_LEFT
  UNILATERAL_RIGHT
  ALTERNATING
}

enum MovementPlane {
  SAGITTAL    // Forward/backward
  FRONTAL     // Side to side
  TRANSVERSE  // Rotational
}

enum SpaceSize {
  MINIMAL     // Standing in place
  MODERATE    // Arm span
  LARGE       // Running, jumping
}
```

### 3.2 Recommended New Fields Summary

| Field | Purpose | Priority |
|-------|---------|----------|
| `fitnessLevel[]` | Multi-level suitability | High |
| `bodySection` | Better split categorization | High |
| `progressionLevel` | Order exercises in progression | High |
| `prerequisiteExercises` | Ensure readiness | Medium |
| `beginnerModifications` | Safe alternatives | Medium |
| `tempoRecommendation` | Time under tension control | Medium |
| `warmupFor` | Smart warmup suggestions | Low |
| `supersetsWith` | Workout optimization | Low |
| `spaceRequired` | Home workout filtering | Low |

---

## Part 4: Exercise Generation Prompt Guide

### 4.1 Master Prompt for Generating Exercise Database

```markdown
# Exercise Database Generation Prompt

You are a certified strength and conditioning specialist (CSCS) and physical
therapist creating a comprehensive exercise database for a fitness app.

## Context
- Target users range from complete beginners to advanced athletes
- App supports: Home workouts (no equipment), Home gym (basic equipment), Full gym
- Must consider injury prevention and proper progression

## Output Format
Generate exercises in the following JSON schema (see Section 4.2).

## Generation Guidelines

### For Each Exercise, Provide:

1. **Clear, Unique Name**: Use standard industry naming
   - Good: "Barbell Back Squat", "Dumbbell Romanian Deadlift"
   - Bad: "Squat", "RDL" (too generic)

2. **Detailed Description** (2-3 sentences):
   - What muscles it targets
   - Why it's effective
   - Who it's best for

3. **Step-by-Step Instructions** (4-6 steps):
   - Start with setup/starting position
   - Include the movement phases
   - End with return to start
   - Be specific about body positioning

4. **Accurate Muscle Targeting**:
   - Primary: Muscles doing >50% of work
   - Secondary: Muscles assisting (20-50%)
   - Use exact muscle names: "quads" not "legs"

5. **Muscle Activation Map** (0.0-1.0):
   - Sum should roughly equal total muscle involvement
   - Primary muscles: 0.7-1.0
   - Secondary muscles: 0.3-0.6
   - Stabilizers: 0.1-0.3

6. **Difficulty Assessment**:
   - Level 1: No coordination/strength needed, anyone can do
   - Level 2: Basic coordination, some strength
   - Level 3: Moderate skill, moderate strength
   - Level 4: High skill or high strength required
   - Level 5: Expert level, years of training needed

7. **Form Cues** (3-5 key points):
   - Focus on common mistakes to avoid
   - Include breathing cues where important
   - Prioritize safety cues

8. **Contraindications**:
   - List specific injury types, not body parts
   - Format: "{body_part}_injury" (e.g., "shoulder_injury", "lower_back_injury")
   - Include chronic conditions where applicable

9. **Progression Chain**:
   - easierVariation: What exercise builds up to this one
   - harderVariation: What comes next in progression
   - Must reference actual exercise names in the database

### Categories to Cover

Generate exercises for ALL of the following categories:

**STRENGTH (Compound)**
- Horizontal Push: Bench press variations, push-up variations
- Horizontal Pull: Row variations
- Vertical Push: Overhead press variations
- Vertical Pull: Pull-up, pulldown variations
- Squat: Squat variations
- Hinge: Deadlift, good morning variations
- Lunge: Lunge, split squat variations
- Carry: Farmer's walk, overhead carry

**STRENGTH (Isolation)**
- Biceps: Curl variations
- Triceps: Extension, pushdown variations
- Shoulders: Raise variations
- Chest: Fly variations
- Back: Pullover, reverse fly variations
- Quads: Leg extension, sissy squat
- Hamstrings: Leg curl variations
- Glutes: Hip thrust, kickback variations
- Calves: Raise variations
- Forearms: Curl, grip variations

**CORE**
- Anti-extension: Plank, rollout variations
- Anti-rotation: Pallof press, bird dog
- Anti-lateral flexion: Side plank, suitcase carry
- Flexion: Crunch, leg raise variations
- Rotation: Russian twist, woodchop variations

**CARDIO/PLYOMETRIC**
- Low impact: Walking, cycling, elliptical
- High impact: Running, jumping
- HIIT: Burpees, mountain climbers, jump squats
- Sport-specific: Box jumps, lateral bounds

**FLEXIBILITY/MOBILITY**
- Upper body stretches
- Lower body stretches
- Hip mobility
- Shoulder mobility
- Spine mobility

### Equipment Variants

For each base exercise, generate variants for:
- No equipment (bodyweight)
- Dumbbells
- Barbell
- Kettlebell
- Resistance bands
- Cable machine
- Machines (where applicable)

### Location Suitability
- "home": No noise, minimal space, basic/no equipment
- "gym": Any equipment, noise OK
- "outdoor": Weather-proof, portable or no equipment
```

### 4.2 Exercise JSON Schema for Generation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Exercise",
  "type": "object",
  "required": [
    "name",
    "slug",
    "description",
    "instructions",
    "category",
    "movementPattern",
    "exerciseType",
    "primaryMuscles",
    "secondaryMuscles",
    "muscleActivationMap",
    "difficultyLevel",
    "skillRequirement",
    "isBeginnerFriendly",
    "equipmentRequired",
    "suitableLocations",
    "repRanges",
    "typicalSets",
    "restSeconds",
    "metValue",
    "contraindications",
    "formCues",
    "tags",
    "suitableGoals"
  ],
  "properties": {
    "name": {
      "type": "string",
      "description": "Full exercise name",
      "examples": ["Barbell Back Squat", "Dumbbell Chest Press"]
    },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "URL-friendly identifier",
      "examples": ["barbell-back-squat", "dumbbell-chest-press"]
    },
    "description": {
      "type": "string",
      "minLength": 50,
      "maxLength": 500,
      "description": "2-3 sentence description of the exercise"
    },
    "instructions": {
      "type": "string",
      "description": "Numbered step-by-step instructions",
      "examples": ["1. Stand with feet shoulder-width apart. 2. ..."]
    },
    "category": {
      "type": "string",
      "enum": ["STRENGTH", "CARDIO", "FLEXIBILITY", "BALANCE", "PLYOMETRIC", "CALISTHENICS"]
    },
    "movementPattern": {
      "type": "string",
      "enum": [
        "HORIZONTAL_PUSH", "HORIZONTAL_PULL",
        "VERTICAL_PUSH", "VERTICAL_PULL",
        "SQUAT", "HINGE", "LUNGE",
        "CARRY", "ROTATION", "ANTI_ROTATION",
        "FLEXION", "EXTENSION", "ISOLATION", "CARDIO"
      ]
    },
    "exerciseType": {
      "type": "string",
      "enum": [
        "COMPOUND", "ISOLATION",
        "CARDIO_STEADY", "CARDIO_HIIT",
        "FLEXIBILITY", "MOBILITY",
        "WARMUP", "COOLDOWN"
      ]
    },
    "primaryMuscles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "chest", "back", "lats", "shoulders", "front_delts", "rear_delts",
          "biceps", "triceps", "forearms",
          "core", "obliques", "lower_back",
          "quads", "hamstrings", "glutes", "calves", "hip_flexors",
          "full_body"
        ]
      },
      "minItems": 1,
      "maxItems": 3
    },
    "secondaryMuscles": {
      "type": "array",
      "items": { "type": "string" }
    },
    "muscleActivationMap": {
      "type": "object",
      "additionalProperties": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      },
      "examples": [{ "chest": 0.9, "triceps": 0.6, "front_delts": 0.4 }]
    },
    "difficultyLevel": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "1=Easiest, 5=Expert only"
    },
    "skillRequirement": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "Technical skill needed"
    },
    "isBeginnerFriendly": {
      "type": "boolean"
    },
    "equipmentRequired": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "none", "dumbbells", "barbell", "kettlebell",
          "resistance_bands", "pull_up_bar", "bench",
          "cable_machine", "squat_rack", "leg_press_machine",
          "dip_bars", "yoga_mat", "medicine_ball",
          "stability_ball", "foam_roller", "trx"
        ]
      }
    },
    "equipmentOptional": {
      "type": "array",
      "items": { "type": "string" }
    },
    "suitableLocations": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["home", "gym", "outdoor"]
      },
      "minItems": 1
    },
    "repRanges": {
      "type": "object",
      "properties": {
        "strength": {
          "type": "object",
          "properties": {
            "min": { "type": "integer" },
            "max": { "type": "integer" }
          }
        },
        "hypertrophy": {
          "type": "object",
          "properties": {
            "min": { "type": "integer" },
            "max": { "type": "integer" }
          }
        },
        "endurance": {
          "type": "object",
          "properties": {
            "min": { "type": "integer" },
            "max": { "type": "integer" }
          }
        }
      }
    },
    "typicalSets": {
      "type": "object",
      "properties": {
        "min": { "type": "integer" },
        "max": { "type": "integer" }
      }
    },
    "restSeconds": {
      "type": "object",
      "properties": {
        "strength": { "type": "integer" },
        "hypertrophy": { "type": "integer" },
        "endurance": { "type": "integer" }
      }
    },
    "metValue": {
      "type": "number",
      "minimum": 1,
      "maximum": 15,
      "description": "Metabolic Equivalent for calorie calculation"
    },
    "intensityFactor": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0.5
    },
    "contraindications": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z_]+_injury$|^[a-z_]+$",
        "examples": ["shoulder_injury", "lower_back_injury", "pregnancy"]
      }
    },
    "formCues": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 3,
      "maxItems": 6,
      "examples": [["Keep chest up", "Brace core", "Drive through heels"]]
    },
    "commonMistakes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "easierVariation": {
      "type": "string",
      "description": "Slug of easier exercise variation"
    },
    "harderVariation": {
      "type": "string",
      "description": "Slug of harder exercise variation"
    },
    "alternativeExercises": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Slugs of similar exercises"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "examples": [["compound", "push", "beginner_friendly", "mass_builder"]]
    },
    "suitableGoals": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "WEIGHT_LOSS", "MUSCLE_GAIN", "STRENGTH",
          "ENDURANCE", "FLEXIBILITY", "GENERAL_FITNESS",
          "SPORT_SPECIFIC", "REHABILITATION"
        ]
      }
    },
    "videoUrl": { "type": "string", "format": "uri" },
    "thumbnailUrl": { "type": "string", "format": "uri" },
    "animationUrl": { "type": "string", "format": "uri" }
  }
}
```

### 4.3 Batch Generation Prompts

Use these prompts to generate exercises in batches:

#### Batch 1: Upper Body Push (40-50 exercises)

```
Generate 45 upper body PUSH exercises covering:
- Bench press variations (flat, incline, decline) × (barbell, dumbbell, machine)
- Push-up variations (standard, wide, narrow, elevated, decline, plyometric)
- Dip variations
- Overhead press variations (barbell, dumbbell, machine, landmine)
- Chest fly variations (dumbbell, cable, machine)
- Tricep isolation (pushdowns, extensions, kickbacks)
- Shoulder raises (front, lateral)

Include 3 difficulty levels for each movement pattern.
Equipment variants: bodyweight, dumbbells, barbell, cables, machines.
```

#### Batch 2: Upper Body Pull (40-50 exercises)

```
Generate 45 upper body PULL exercises covering:
- Pull-up/chin-up variations
- Row variations (bent-over, seated, machine, cable)
- Lat pulldown variations
- Face pulls and rear delt work
- Bicep curl variations (barbell, dumbbell, cable, hammer, preacher)
- Forearm exercises (wrist curls, reverse curls)
- Shrug variations

Include 3 difficulty levels for each movement pattern.
Equipment variants: bodyweight, dumbbells, barbell, cables, machines.
```

#### Batch 3: Lower Body (50-60 exercises)

```
Generate 55 lower body exercises covering:
- Squat variations (back, front, goblet, split, Bulgarian, pistol)
- Deadlift variations (conventional, sumo, Romanian, single-leg)
- Lunge variations (forward, reverse, walking, lateral)
- Hip hinge patterns (good mornings, hip thrusts, glute bridges)
- Leg press and machine variations
- Leg curl and extension variations
- Calf raise variations
- Glute isolation (kickbacks, abductions)

Include 3 difficulty levels for each movement pattern.
Equipment variants: bodyweight, dumbbells, barbell, cables, machines.
```

#### Batch 4: Core (30-40 exercises)

```
Generate 35 core exercises covering:
- Plank variations (front, side, dynamic)
- Anti-rotation (Pallof press, bird dogs)
- Flexion (crunches, leg raises, sit-ups)
- Rotation (Russian twists, woodchops, cable rotations)
- Carry variations (farmer's walk, suitcase carry, overhead)
- Lower back (back extensions, supermans)
- Dynamic core (mountain climbers, dead bugs, hollow holds)

Include 3 difficulty levels for each movement pattern.
Focus on home-friendly and gym variations.
```

#### Batch 5: Cardio & HIIT (25-35 exercises)

```
Generate 30 cardio and HIIT exercises covering:
- Bodyweight HIIT (burpees, jumping jacks, high knees, etc.)
- Plyometrics (box jumps, bounds, jumps)
- Low-impact cardio (marching, step-ups, elliptical movements)
- Sprint variations
- Jump rope variations
- Battle rope exercises
- Rowing movements

Include modifications for different fitness levels.
Focus on exercises that can be done at home and gym.
```

#### Batch 6: Flexibility & Mobility (30-40 exercises)

```
Generate 35 flexibility and mobility exercises covering:
- Upper body stretches (chest, shoulders, arms, neck)
- Lower body stretches (quads, hamstrings, hip flexors, calves)
- Hip mobility drills (90/90, pigeon, frog)
- Shoulder mobility (wall slides, arm circles, band work)
- Spine mobility (cat-cow, thread the needle, rotations)
- Dynamic warm-up movements
- Foam rolling sequences

All should be beginner-friendly with progression options.
```

---

## Part 5: PGVector Integration for Semantic Search

### 5.1 Embedding Strategy

```typescript
// Generate embeddings for each exercise
const generateExerciseEmbedding = async (exercise: Exercise) => {
  const textForEmbedding = [
    exercise.name,
    exercise.description,
    exercise.primaryMuscles.join(' '),
    exercise.secondaryMuscles.join(' '),
    exercise.category,
    exercise.movementPattern,
    exercise.tags.join(' '),
    exercise.suitableGoals.join(' '),
    exercise.formCues.join(' '),
  ].join(' ');

  // Use OpenAI text-embedding-3-small (1536 dimensions)
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: textForEmbedding,
  });

  return embedding.data[0].embedding;
};
```

### 5.2 Semantic Search Use Cases

1. **Find Similar Exercises**
   ```sql
   SELECT * FROM exercises
   ORDER BY embedding <=> $1  -- User's current exercise embedding
   LIMIT 5;
   ```

2. **Natural Language Exercise Search**
   ```
   User: "I want something for my back that I can do at home"
   → Embed query → Find similar exercises → Filter by location
   ```

3. **Profile-Based Recommendations**
   ```typescript
   // Generate user profile embedding from onboarding answers
   const userProfileEmbedding = await generateUserProfileEmbedding({
     goals: user.profile.primaryGoal,
     experience: user.profile.experienceLevel,
     equipment: user.preferences.availableEquipment,
     preferredTypes: user.preferences.preferredExerciseTypes,
   });

   // Find exercises closest to user profile
   const recommendations = await prisma.$queryRaw`
     SELECT * FROM exercises
     WHERE is_active = true
     ORDER BY embedding <=> ${userProfileEmbedding}::vector
     LIMIT 20
   `;
   ```

---

## Part 6: Implementation Phases

### Phase 1: Database Enhancement (Week 1)
- [ ] Add new fields to Exercise model (priority fields only)
- [ ] Create migration
- [ ] Update seed data with new fields

### Phase 2: Exercise Database Generation (Week 2)
- [ ] Generate exercises using Claude with batch prompts
- [ ] Review and validate generated exercises
- [ ] Add to seed file
- [ ] Generate embeddings for all exercises

### Phase 3: Enhanced Workout Generator (Week 3)
- [ ] Implement first-week conservative approach
- [ ] Add progress tracking metrics
- [ ] Implement adaptive workout generation

### Phase 4: Semantic Search (Week 4)
- [ ] Set up pgvector queries
- [ ] Implement natural language search endpoint
- [ ] Add "find similar" functionality

---

## Appendix A: Exercise Count Targets

| Category | Movement Patterns | Target Count |
|----------|-------------------|--------------|
| Upper Push | 8 patterns × 5 variants | ~40 |
| Upper Pull | 8 patterns × 5 variants | ~40 |
| Lower Body | 10 patterns × 5 variants | ~50 |
| Core | 7 patterns × 5 variants | ~35 |
| Cardio/HIIT | 6 patterns × 5 variants | ~30 |
| Flexibility | 8 patterns × 4 variants | ~32 |
| **Total** | | **~230 exercises** |

## Appendix B: Example Generated Exercise

```json
{
  "name": "Incline Dumbbell Press",
  "slug": "incline-dumbbell-press",
  "description": "An upper chest focused pressing movement that builds the clavicular head of the pectoralis major. The incline angle shifts emphasis to the upper chest and front deltoids, making it essential for complete chest development.",
  "instructions": "1. Set bench to 30-45 degree incline. 2. Sit back with dumbbells at shoulder level, palms facing forward. 3. Press dumbbells up and together until arms are extended. 4. Lower with control to starting position, feeling stretch in upper chest.",
  "category": "STRENGTH",
  "movementPattern": "HORIZONTAL_PUSH",
  "exerciseType": "COMPOUND",
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["front_delts", "triceps"],
  "muscleActivationMap": {
    "chest": 0.85,
    "front_delts": 0.5,
    "triceps": 0.45
  },
  "difficultyLevel": 2,
  "skillRequirement": 2,
  "isBeginnerFriendly": true,
  "equipmentRequired": ["dumbbells", "bench"],
  "equipmentOptional": [],
  "suitableLocations": ["gym", "home"],
  "repRanges": {
    "strength": { "min": 4, "max": 6 },
    "hypertrophy": { "min": 8, "max": 12 },
    "endurance": { "min": 15, "max": 20 }
  },
  "typicalSets": { "min": 3, "max": 4 },
  "restSeconds": {
    "strength": 150,
    "hypertrophy": 75,
    "endurance": 45
  },
  "metValue": 5.0,
  "intensityFactor": 0.6,
  "contraindications": ["shoulder_injury"],
  "formCues": [
    "Keep shoulder blades pinched together",
    "Control the descent - 2-3 seconds",
    "Don't let elbows flare past 45 degrees",
    "Press in slight arc, bringing dumbbells together at top"
  ],
  "commonMistakes": [
    "Setting incline too steep (becomes shoulder press)",
    "Bouncing at bottom",
    "Not using full range of motion"
  ],
  "easierVariation": "incline-push-ups",
  "harderVariation": "incline-barbell-press",
  "alternativeExercises": ["low-cable-fly", "incline-machine-press"],
  "tags": ["compound", "push", "chest", "upper_chest", "dumbbell"],
  "suitableGoals": ["MUSCLE_GAIN", "STRENGTH", "GENERAL_FITNESS"]
}
```
