# A Noobie's Guide: From Zero to Exercise Recommendation System

*Or: How I Stopped Worrying and Learned to Love the Gym (API)*

---

Look, I'm going to be honest with you. When I started this project, I thought "exercise recommendation" meant telling people to do burpees. Spoiler alert: it's a bit more involved than that. But here's the thing - it's also not rocket science. It's more like... really organized common sense, wrapped in TypeScript, sprinkled with some semantic search magic.

By the end of this post, you'll have built a system that:
1. Understands who a user is (their goals, experience, injuries)
2. Uses **semantic search** to find exercises (not just keyword matching!)
3. Scores exercises with multi-factor algorithms
4. Structures those exercises into a complete weekly plan
5. Gets smarter with embeddings and vector search

Let's go.

---

## Part 0: The "Aha!" Moment

Before we write any code, let's think about what a personal trainer actually does. I watched a few trainers at my gym (not in a creepy way, I promise), and noticed they basically run this algorithm in their heads:

```
1. Who is this person? (age, experience, goals)
2. What can they physically do? (injuries, limitations)
3. What equipment do they have access to?
4. What should they work on today? (muscle groups, split)
5. Which specific exercises match all the above?
6. In what order? (compound first, isolation later)
7. How many sets/reps? (depends on goal)
```

That's... literally the algorithm we're going to build. A trainer in a function.

But here's where it gets interesting: we're going to add something trainers can't easily do — **semantic understanding**. When a user says "I want exercises for building a bigger chest at home without equipment", we'll actually understand what they mean, not just match keywords.

---

## Part 1: The Tech Stack (What We're Building With)

Before diving in, here's what we're using:

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js + TypeScript | Type safety, async everywhere |
| **API** | Express.js | Simple, battle-tested |
| **Database** | PostgreSQL + Prisma | Relational + great ORM |
| **Vector Search** | pgvector | Semantic search in Postgres |
| **Embeddings** | Gemini (FREE) or OpenAI | Turn text into vectors |
| **AI** | Claude API | Natural language coaching |
| **Mobile** | React Native (Expo) | Cross-platform |
| **Web** | Next.js 14 | React with SSR |

The secret sauce? **pgvector** + **Gemini embeddings**. Gemini's embedding API is FREE, and pgvector lets us do similarity search right in PostgreSQL. No separate vector database needed.

---

## Part 2: The Data Model (Boring But Important)

Okay, let's start with the unsexy stuff - data modeling. I know, I know, you want to write the cool recommendation algorithm. But trust me, if you get the data model wrong, everything else becomes 10x harder.

### The Exercise Schema

Here's what an exercise looks like in our system:

```prisma
// Prisma schema - this defines our exercise structure

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector", schema: "public")]  // 👈 The magic
}

model Exercise {
  id                    String   @id @default(uuid())

  // The basics
  name                  String   // "Barbell Bench Press"
  slug                  String   @unique // "barbell-bench-press"
  description           String   // "The king of chest exercises..."
  instructions          String   // Step-by-step how-to

  // Classification - THIS IS KEY
  category              ExerciseCategory    // STRENGTH, CARDIO, etc.
  movementPattern       MovementPattern     // HORIZONTAL_PUSH, SQUAT, etc.
  exerciseType          ExerciseType        // COMPOUND vs ISOLATION

  // Muscle targeting
  primaryMuscles        String[]  // ["chest"]
  secondaryMuscles      String[]  // ["triceps", "front_delts"]
  muscleActivationMap   Json      // { chest: 0.9, triceps: 0.6 }

  // Difficulty & Prerequisites
  difficultyLevel       Int       // 1-5 scale
  isBeginnerFriendly    Boolean

  // Equipment & Location
  equipmentRequired     String[]  // ["barbell", "bench"]
  suitableLocations     String[]  // ["gym"]

  // Safety
  contraindications     String[]  // ["shoulder_injury"]

  // 🔥 THE NEW STUFF - Semantic Search
  embedding             Float[]   @default([])  // Vector embedding
  searchText            String?   @db.Text      // Text that was embedded

  // Goal effectiveness (how good is this exercise for each goal?)
  goalEffectiveness     Json      // { muscleGain: 0.9, weightLoss: 0.6, ... }

  // Location compatibility scores
  homeCompatibility     Float     @default(0.5)
  gymCompatibility      Float     @default(0.8)
  outdoorCompatibility  Float     @default(0.3)

  // ... more fields
}
```

Notice the `embedding` field. That's a 768-dimensional vector (if using Gemini) that represents the "meaning" of this exercise. More on that later.

Also notice `movementPattern`. This is gold. Instead of just knowing "bench press works chest", we know it's a `HORIZONTAL_PUSH`. Why does this matter? Because when someone can't do bench press (maybe they have a shoulder injury), we can find another `HORIZONTAL_PUSH` as a substitute.

```typescript
enum MovementPattern {
  HORIZONTAL_PUSH   // bench press, push-ups
  HORIZONTAL_PULL   // rows
  VERTICAL_PUSH     // overhead press
  VERTICAL_PULL     // pull-ups, lat pulldown
  SQUAT             // squats, leg press
  HINGE             // deadlifts, RDL
  LUNGE             // lunges, split squats
  // ... etc
}
```

This is domain modeling that makes recommendations actually work. You're encoding how trainers think into your data structure.

### The User Schema

Users are even more interesting:

```typescript
model UserProfile {
  // Who are they?
  age               Int
  gender            Gender
  heightCm          Float
  currentWeightKg   Float
  targetWeightKg    Float

  // What's their goal?
  primaryGoal       FitnessGoal  // MUSCLE_GAIN, WEIGHT_LOSS, STRENGTH, etc.

  // How experienced?
  fitnessLevel      FitnessLevel     // SEDENTARY to ATHLETE
  experienceLevel   ExperienceLevel  // NEVER to EXPERT

  // Baseline assessments
  pushupCapacity    String   // "0", "1-5", "6-15", "16-30", "30+"
  plankCapacity     String   // How long can they plank?
  squatComfort      String   // Squat mobility assessment
}

model UserPreferences {
  workoutDaysPerWeek    Int      // 2-7
  sessionDurationMin    Int      // 20-90
  workoutLocation       String   // HOME, GYM, OUTDOOR, MIXED
  availableEquipment    String[] // ["dumbbells", "barbell", "pull_up_bar"]
  restPreference        String   // MINIMAL, MODERATE, FULL
}

model UserHealth {
  injuries              String[]  // ["shoulder", "lower_back"]
  chronicConditions     String[]
  isPregnant            Boolean
  recentSurgery         Boolean
  // AI-derived from above:
  contraindicatedMovements  String[]
  contraindicatedExercises  String[]
}
```

The key insight: **your recommendation is only as good as what you know about the user**. This is why we have a 6-phase onboarding questionnaire. More data = better recommendations.

---

## Part 3: Semantic Search with pgvector (The Fun Part)

This is where it gets spicy. Traditional search is keyword-based:
- User searches: "chest exercises"
- System finds: exercises with "chest" in the name or description

That's... fine. But what if the user searches "exercises to build a bigger chest at home without equipment"? Keyword search fails miserably.

### Enter: Embeddings

An embedding is a way to represent text as a vector of numbers. The magic is that **similar meanings = similar vectors**.

```
"Push-ups"           → [0.21, -0.43, 0.87, ...]
"Chest press"        → [0.19, -0.41, 0.85, ...]  // Similar! Close in vector space
"Barbell back squat" → [0.65, 0.12, -0.34, ...]  // Different! Far in vector space
```

We can then use **cosine similarity** to find exercises that are semantically similar to a query.

### The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query                                │
│            "good exercises for chest at home"                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Embedding Provider (Gemini or OpenAI)               │
│                                                                  │
│   Gemini: text-embedding-004 (768 dims) - FREE 🎉               │
│   OpenAI: text-embedding-3-small (1536 dims) - Paid             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Query Embedding                             │
│                  [0.023, -0.041, 0.087, ...]                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pgvector                         │
│                                                                  │
│   SELECT * FROM exercises                                        │
│   ORDER BY embedding <=> query_embedding  -- Cosine distance    │
│   LIMIT 10;                                                      │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ranked Results                                │
│                                                                  │
│   1. Push-up (similarity: 0.89)                                 │
│   2. Dumbbell Chest Press (similarity: 0.85)                    │
│   3. Diamond Push-up (similarity: 0.82)                         │
└─────────────────────────────────────────────────────────────────┘
```

### The Embedding Service

Here's the actual code. We support both Gemini (FREE!) and OpenAI:

```typescript
// services/embedding.service.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const PROVIDERS = {
  gemini: {
    model: 'text-embedding-004',
    dimensions: 768,
  },
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
};

export class EmbeddingService {
  private gemini: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private provider: 'gemini' | 'openai';

  constructor() {
    // Prefer Gemini (it's FREE!)
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.provider = 'gemini';
    } else if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.provider = 'openai';
    }
  }

  /**
   * Generate embedding for a text string
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.provider === 'gemini' && this.gemini) {
      const model = this.gemini.getGenerativeModel({
        model: PROVIDERS.gemini.model
      });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.embeddings.create({
        model: PROVIDERS.openai.model,
        input: text,
      });
      return response.data[0].embedding;
    }

    throw new Error('No embedding provider configured');
  }

  /**
   * Semantic search for exercises
   */
  async searchSimilarExercises(
    query: string,
    options: { threshold?: number; limit?: number } = {}
  ): Promise<ExerciseSearchResult[]> {
    const { threshold = 0.6, limit = 10 } = options;

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Format as PostgreSQL array
    const embeddingArray = `[${queryEmbedding.join(',')}]`;

    // Use pgvector for similarity search
    const results = await prisma.$queryRawUnsafe(`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector <=> '${embeddingArray}'::vector) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.embedding IS NOT NULL
        AND 1 - (e.embedding::vector <=> '${embeddingArray}'::vector) > ${threshold}
      ORDER BY e.embedding::vector <=> '${embeddingArray}'::vector
      LIMIT ${limit}
    `);

    return results;
  }
}
```

### What Do We Embed?

We don't just embed the exercise name. We create a rich `searchText` that captures everything relevant:

```typescript
function generateSearchText(exercise: Exercise): string {
  const parts = [
    exercise.name,
    exercise.description,
    exercise.category,
    exercise.movementPattern,
    exercise.exerciseType,
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
    ...exercise.tags,
    ...exercise.suitableGoals,
    ...exercise.equipmentRequired,
    ...exercise.suitableLocations,
    `difficulty level ${exercise.difficultyLevel}`,
    exercise.isBeginnerFriendly ? 'beginner friendly' : 'intermediate to advanced',
    ...exercise.formCues,
  ];

  return parts.filter(Boolean).join(' | ');
}
```

**Example output:**
```
Bench Press | Lie on a flat bench and press the barbell upward... |
STRENGTH | HORIZONTAL_PUSH | COMPOUND | chest | pectoralis major |
triceps | anterior deltoids | barbell | bench | gym | strength |
muscle gain | difficulty level 3 | intermediate
```

This rich text gets embedded, so when someone searches "pushing exercise for chest", we match even though they didn't use the word "bench press".

---

## Part 4: The Multi-Factor Scoring System

Semantic search gets us candidates. But we need to **rank** them based on the user's specific situation. Enter: multi-factor scoring.

```typescript
// services/suggestion.service.ts

interface ScoreBreakdown {
  goalMatch: number;        // 0-1: Does this exercise help their goal?
  difficultyMatch: number;  // 0-1: Is it appropriate for their level?
  equipmentMatch: number;   // 0-1: Do they have the equipment?
  locationMatch: number;    // 0-1: Can they do it where they work out?
  experienceMatch: number;  // 0-1: Suitable for their experience?
  semanticMatch: number;    // 0-1: How relevant to the query?
}

private scoreExercise(
  exercise: Exercise,
  profile: UserProfile,
  preferences: UserPreferences,
  health: UserHealth,
  contraindications: Set<string>,
  semanticScore: number
): ScoredExercise | null {

  // First: Check contraindications (instant rejection)
  const exerciseName = exercise.name.toLowerCase();
  const movementPattern = exercise.movementPattern.toLowerCase();

  for (const contra of contraindications) {
    if (exerciseName.includes(contra) || movementPattern.includes(contra)) {
      return null;  // Skip this exercise entirely
    }
  }

  const scores: ScoreBreakdown = {
    goalMatch: 0,
    difficultyMatch: 0,
    equipmentMatch: 0,
    locationMatch: 0,
    experienceMatch: 0,
    semanticMatch: semanticScore,
  };

  // 1. Goal Match
  if (profile.primaryGoal && exercise.goalEffectiveness) {
    scores.goalMatch = exercise.goalEffectiveness[profile.primaryGoal] || 0.5;
  }

  // 2. Difficulty Match
  const maxDiff = this.calculateMaxDifficulty(profile);
  if (exercise.difficultyLevel <= maxDiff) {
    scores.difficultyMatch = 1 - (Math.abs(maxDiff - exercise.difficultyLevel) * 0.2);
  } else {
    scores.difficultyMatch = Math.max(0, 1 - (exercise.difficultyLevel - maxDiff) * 0.3);
  }

  // 3. Equipment Match
  const required = exercise.equipmentRequired || [];
  if (required.length === 0 || preferences.availableEquipment.includes('full_gym')) {
    scores.equipmentMatch = 1;
  } else if (preferences.availableEquipment.includes('none') && required.length > 0) {
    scores.equipmentMatch = 0;  // They have no equipment but exercise needs some
  } else {
    const hasAll = required.every(eq =>
      preferences.availableEquipment.includes(eq)
    );
    scores.equipmentMatch = hasAll ? 1 : 0.3;
  }

  // 4. Location Match
  switch (preferences.workoutLocation) {
    case 'HOME':
      scores.locationMatch = exercise.homeCompatibility;
      break;
    case 'GYM':
      scores.locationMatch = exercise.gymCompatibility;
      break;
    case 'OUTDOOR':
      scores.locationMatch = exercise.outdoorCompatibility;
      break;
    case 'MIXED':
      scores.locationMatch = Math.max(
        exercise.homeCompatibility,
        exercise.gymCompatibility
      );
      break;
  }

  // 5. Experience Match
  if (exercise.experienceLevelSuitability) {
    scores.experienceMatch = exercise.experienceLevelSuitability[profile.experienceLevel] / 5;
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
    scores.goalMatch * weights.goalMatch +
    scores.difficultyMatch * weights.difficultyMatch +
    scores.equipmentMatch * weights.equipmentMatch +
    scores.locationMatch * weights.locationMatch +
    scores.experienceMatch * weights.experienceMatch +
    scores.semanticMatch * weights.semanticMatch;

  return {
    ...exercise,
    score: totalScore,
    scoreBreakdown: scores,
  };
}
```

### Why Weighted Scoring?

Different factors matter more than others:
- **Goal match (25%)**: No point doing cardio if you want to build muscle
- **Difficulty (20%)**: Safety first - don't give beginners advanced moves
- **Equipment (20%)**: Can't do barbell squats without a barbell
- **Location (15%)**: Pull-ups are hard in a park without a bar
- **Experience (10%)**: Some exercises need more skill
- **Semantic (10%)**: Bonus for matching the user's intent

The weights are tunable. In production, you might A/B test different weightings.

---

## Part 5: Injury-Aware Recommendations

This is where most fitness apps fail miserably. They'll happily recommend bench press to someone with a shoulder injury. We don't do that.

```typescript
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

private getContraindications(health: UserHealth): Set<string> {
  const contraindicated = new Set<string>();

  // Add from injuries
  for (const injury of health.injuries) {
    const movements = INJURY_CONTRAINDICATIONS[injury.toLowerCase()] || [];
    movements.forEach(m => contraindicated.add(m.toLowerCase()));
  }

  // Add explicit contraindications from health profile
  health.contraindicatedMovements.forEach(m => contraindicated.add(m));
  health.contraindicatedExercises.forEach(e => contraindicated.add(e));

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
```

Now when we score exercises, anything matching a contraindication returns `null` and is excluded entirely. Safety first.

---

## Part 6: Generating a Complete Weekly Plan

Individual exercise recommendations are nice, but users want a **complete plan**. Here's how we generate an entire week:

```typescript
// services/suggestion.service.ts

const WORKOUT_SPLITS: Record<number, {
  name: string;
  days: { splitType: WorkoutSplitType; focusMuscles: string[]; dayName: string }[];
}> = {
  2: {
    name: 'FULL_BODY',
    days: [
      { splitType: 'FULL_BODY', focusMuscles: ['chest', 'back', 'legs', 'shoulders'], dayName: 'Full Body A' },
      { splitType: 'FULL_BODY', focusMuscles: ['chest', 'back', 'legs', 'arms'], dayName: 'Full Body B' },
    ],
  },
  3: {
    name: 'PUSH_PULL_LEGS',
    days: [
      { splitType: 'PUSH', focusMuscles: ['chest', 'shoulders', 'triceps'], dayName: 'Push' },
      { splitType: 'PULL', focusMuscles: ['back', 'biceps', 'rear_delts'], dayName: 'Pull' },
      { splitType: 'LEGS', focusMuscles: ['quads', 'hamstrings', 'glutes'], dayName: 'Legs' },
    ],
  },
  4: {
    name: 'UPPER_LOWER',
    days: [
      { splitType: 'UPPER_BODY', focusMuscles: ['chest', 'back', 'shoulders'], dayName: 'Upper A' },
      { splitType: 'LOWER_BODY', focusMuscles: ['quads', 'hamstrings', 'glutes'], dayName: 'Lower A' },
      { splitType: 'UPPER_BODY', focusMuscles: ['chest', 'back', 'shoulders'], dayName: 'Upper B' },
      { splitType: 'LOWER_BODY', focusMuscles: ['quads', 'hamstrings', 'glutes'], dayName: 'Lower B' },
    ],
  },
  // ... 5, 6, 7 day splits
};

async generateWeeklyPlan(userId: string): Promise<WeeklyPlanResult> {
  const context = await this.getUserContext(userId);
  const daysPerWeek = context.preferences.workoutDaysPerWeek;
  const splitConfig = WORKOUT_SPLITS[daysPerWeek];

  const days: WorkoutDay[] = [];

  for (let i = 0; i < splitConfig.days.length; i++) {
    const dayConfig = splitConfig.days[i];

    // Get scored exercises for this day's muscle focus
    const scoredExercises = await this.getExercisesForMuscles(
      userId,
      dayConfig.focusMuscles,
      20  // Get extra for variety
    );

    // Select balanced exercises (different movement patterns)
    const selectedExercises = this.selectBalancedExercises(
      scoredExercises,
      this.calculateExercisesPerDay(context.preferences.sessionDurationMin),
      dayConfig.focusMuscles
    );

    // Build the day's workout
    days.push({
      dayIndex: i,
      dayName: dayConfig.dayName,
      splitType: dayConfig.splitType,
      focusMuscles: dayConfig.focusMuscles,
      exercises: selectedExercises.map((ex, index) => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: this.getSetsForGoal(context.profile.primaryGoal),
        reps: this.getRepsForGoal(context.profile.primaryGoal),
        restSeconds: this.getRestSeconds(context.preferences.restPreference),
        order: index + 1,
      })),
      estimatedDuration: this.estimateDuration(selectedExercises),
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
```

### Ensuring Variety

We don't just pick the top-scored exercises. We ensure **movement pattern variety**:

```typescript
private selectBalancedExercises(
  exercises: ScoredExercise[],
  count: number,
  focusMuscles: string[]
): ScoredExercise[] {
  const selected: ScoredExercise[] = [];
  const usedPatterns = new Set<MovementPattern>();

  // First pass: ensure variety in movement patterns
  for (const exercise of exercises) {
    if (selected.length >= count) break;

    if (!usedPatterns.has(exercise.movementPattern)) {
      selected.push(exercise);
      usedPatterns.add(exercise.movementPattern);
    }
  }

  // Second pass: fill remaining with best scores
  for (const exercise of exercises) {
    if (selected.length >= count) break;
    if (!selected.includes(exercise)) {
      selected.push(exercise);
    }
  }

  return selected;
}
```

This prevents a push day from being all bench press variations. You get horizontal push, vertical push, isolation, etc.

---

## Part 7: Goal-Specific Programming

Different goals = different rep ranges, sets, and rest periods. This is exercise science 101:

```typescript
private getSetsForGoal(goal: FitnessGoal): number {
  switch (goal) {
    case 'STRENGTH':     return 5;   // Heavy, need more sets
    case 'MUSCLE_GAIN':  return 4;   // Moderate
    case 'WEIGHT_LOSS':  return 3;   // Keep it moving
    case 'ENDURANCE':    return 3;   // High reps > high sets
    default:             return 3;
  }
}

private getRepsForGoal(goal: FitnessGoal): string {
  switch (goal) {
    case 'STRENGTH':     return '3-5';    // Heavy weight, low reps
    case 'MUSCLE_GAIN':  return '8-12';   // Hypertrophy range
    case 'WEIGHT_LOSS':  return '12-15';  // Metabolic stress
    case 'ENDURANCE':    return '15-20';  // Muscular endurance
    default:             return '10-12';
  }
}

private getRestSeconds(restPreference: string): number {
  switch (restPreference) {
    case 'MINIMAL':   return 45;    // Keep heart rate up
    case 'MODERATE':  return 90;    // Balanced recovery
    case 'FULL':      return 120;   // Full ATP recovery
    default:          return 90;
  }
}
```

We're encoding decades of sports science into lookup tables. Beautiful.

---

## Part 8: Adding AI (The Claude Sprinkles)

We have a solid rule-based system, but we can add AI for the soft, fuzzy stuff humans are good at.

```typescript
// services/ai.service.ts

import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  /**
   * Analyze workout and suggest adjustments
   */
  async analyzePerformance(userId: string, workoutId: string) {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { exercises: { include: { logs: true } } },
    });

    const performance = workout.exercises.map(ex => ({
      name: ex.exercise.name,
      targetSets: ex.targetSets,
      completedSets: ex.logs.length,
      averageRpe: ex.logs.reduce((sum, l) => sum + l.rpe, 0) / ex.logs.length,
      skipped: ex.skipped,
    }));

    const message = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',  // Fast and cheap
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `Analyze this workout and provide brief feedback:
${JSON.stringify(performance, null, 2)}

Provide:
1. A short overall assessment (1-2 sentences)
2. 2-3 specific adjustments for next session

Format as JSON: { "feedback": "...", "adjustments": ["...", "..."] }`,
      }],
    });

    return JSON.parse(message.content[0].text);
  }

  /**
   * Generate personalized motivation
   */
  async generateMotivation(context: UserContext): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Generate a short, personalized workout motivation (2-3 sentences) for:
Name: ${context.name}
Goal: ${context.goal}
Current streak: ${context.streak} days

Be encouraging and specific to their goal.`,
      }],
    });

    return message.content[0].text;
  }
}
```

The key insight: **AI for the squishy stuff, rules for the structured stuff**.

- **Rules**: What exercises to include, sets/reps, rest periods
- **AI**: Motivation, natural language summaries, coaching tips

This is a hybrid approach. The rules are fast, deterministic, and debuggable. The AI adds personality.

---

## Part 9: The Complete Architecture

Here's what we built:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile/Web)                       │
│                    React Native / Next.js                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Express)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Auth Routes │ │  Workout    │ │ Suggestions │ │  Progress   ││
│  │  /auth/*    │ │ /workouts/* │ │/suggestions/*│ │ /progress/* ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ SuggestionService│  │ EmbeddingService │  │   AIService    │ │
│  │ - scoring        │  │ - Gemini/OpenAI  │  │   - Claude     │ │
│  │ - weekly plans   │  │ - vector search  │  │   - coaching   │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│            │                    │                               │
│            └────────────────────┼───────────────────────────────│
│                                 ▼                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL + pgvector                  │   │
│  │                                                           │   │
│  │   exercises table                                         │   │
│  │   ├── id, name, description, ...                         │   │
│  │   ├── embedding (768-dim vector)  ← Gemini               │   │
│  │   └── goalEffectiveness, homeCompatibility, ...          │   │
│  │                                                           │   │
│  │   Similarity: embedding <=> query_embedding               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 10: Generating Embeddings (Setup Script)

Before semantic search works, you need to generate embeddings for all exercises:

```typescript
// scripts/generate-embeddings.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = gemini.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbeddings() {
  const exercises = await prisma.exercise.findMany({
    where: { searchText: { not: null } },
  });

  console.log(`Generating embeddings for ${exercises.length} exercises...`);

  // Batch process (Gemini supports batch embedding)
  const batchSize = 100;
  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);

    const result = await model.batchEmbedContents({
      requests: batch.map(ex => ({
        content: { parts: [{ text: ex.searchText! }], role: 'user' },
      })),
    });

    // Update database
    for (let j = 0; j < batch.length; j++) {
      await prisma.exercise.update({
        where: { id: batch[j].id },
        data: { embedding: result.embeddings[j].values },
      });
    }

    console.log(`Processed ${i + batch.length}/${exercises.length}`);
  }

  console.log('Done!');
}

generateEmbeddings();
```

Run once after seeding exercises. Takes about 30 seconds for 300+ exercises.

---

## Part 11: What Makes This Actually Good?

Looking back, here's what separates a good recommendation system from a bad one:

### 1. Semantic Understanding
We don't just match keywords. "Building a bigger chest at home" understands the intent.

### 2. Multi-Factor Scoring
We filter by: goal, difficulty, equipment, location, experience, injuries. Each filter alone isn't impressive. Together, they create personalization.

### 3. Safety First
Contraindications are checked before anything else. We never recommend an exercise that could hurt someone.

### 4. Movement Pattern Variety
We ensure balanced workouts, not just high-scoring exercises.

### 5. Goal-Specific Programming
Sets, reps, rest all change based on what the user wants to achieve.

### 6. Fallbacks Everywhere
No Gemini key? Falls back to keyword search. No OpenAI? Use Gemini. No AI at all? Rule-based works fine.

---

## Part 12: The API Endpoints

Here's what the mobile/web app calls:

```typescript
// Suggestion Routes

// Get exercises for specific muscles
GET /api/v1/suggestions/exercises?muscles=chest,triceps&limit=10

// Generate complete weekly plan
POST /api/v1/suggestions/weekly-plan

// Search exercises semantically
GET /api/v1/suggestions/search?q=chest+exercises+at+home

// Get similar exercises (for swaps)
GET /api/v1/suggestions/similar/:exerciseId
```

---

## Part 13: Running It Locally

```bash
# 1. Clone and install
git clone <repo>
cd ai-gym-suite
npm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env

# Add your keys:
# GEMINI_API_KEY=your-free-gemini-key  (get from ai.google.dev)
# ANTHROPIC_API_KEY=optional-for-ai-coaching

# 3. Set up database (uses Supabase PostgreSQL)
npm run db:push
npm run db:seed

# 4. Generate embeddings
npm run embeddings:generate

# 5. Run it
npm run dev

# API: http://localhost:3001
# Web: http://localhost:3000
```

---

## Conclusion

Building an exercise recommendation system isn't about complex ML models (though they help). It's about:

1. **Understanding the domain** - How do trainers actually think?
2. **Encoding knowledge in data** - Movement patterns, contraindications, goal effectiveness
3. **Semantic search** - Understanding intent, not just keywords
4. **Multi-factor scoring** - Multiple constraints that work together
5. **Safety first** - Never recommend something dangerous
6. **AI for polish** - Human-like text and nuanced feedback

The code isn't magical. It's organized common sense + embeddings + vector search.

Now go build something cool. And maybe do some actual exercise while you're at it.

---

*If you made it this far, you're either really interested in fitness apps or really bored. Either way, thanks for reading.*

---

## Quick Reference: Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Vector Search** | pgvector extension |
| **Embeddings** | Gemini (FREE) / OpenAI |
| **AI Coaching** | Claude (Haiku for speed) |
| **Mobile** | React Native (Expo SDK 52) |
| **Web** | Next.js 14 |
| **State** | Zustand |
| **Styling** | Tailwind CSS / NativeWind |

**Total Lines of Code:** ~3500 for the recommendation engine
**Exercises in Database:** 300+ and growing
**Embedding Dimensions:** 768 (Gemini) or 1536 (OpenAI)
**Cost:** $0 for embeddings (Gemini is free!)

---

*Happy lifting.* 🏋️
