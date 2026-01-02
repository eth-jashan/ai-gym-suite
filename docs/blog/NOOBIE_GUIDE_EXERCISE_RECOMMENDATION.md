# A Noobie's Guide: From Zero to Exercise Recommendation System

*Or: How I Stopped Worrying and Learned to Love the Gym (API)*

---

Look, I'm going to be honest with you. When I started this project, I thought "exercise recommendation" meant telling people to do burpees. Spoiler alert: it's a bit more involved than that. But here's the thing - it's also not rocket science. It's more like... really organized common sense, wrapped in TypeScript.

By the end of this post, you'll have built a system that:
1. Understands who a user is (their goals, experience, injuries)
2. Picks the right exercises for them (not just random ones)
3. Structures those exercises into an actual workout
4. Gets smarter over time (well, sort of)

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

---

## Part 1: The Data Model (Boring But Important)

Okay, let's start with the unsexy stuff - data modeling. I know, I know, you want to write the cool recommendation algorithm. But trust me, if you get the data model wrong, everything else becomes 10x harder.

### The Exercise Schema

Here's what an exercise looks like in our system:

```typescript
// This is a Prisma schema, but think of it as "what does an exercise look like?"

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

  // ... more fields
}
```

Notice the `movementPattern` field. This is gold. Instead of just knowing "bench press works chest", we know it's a `HORIZONTAL_PUSH`. Why does this matter? Because when someone can't do bench press (maybe they have a shoulder injury), we can find another `HORIZONTAL_PUSH` as a substitute. Same movement pattern, different exercise.

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

This is the kind of domain modeling that makes recommendations actually work. You're encoding how trainers think into your data structure.

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
}

model UserPreferences {
  // Logistics
  workoutDaysPerWeek    Int      // 2-7
  sessionDurationMin    Int      // 20-90
  workoutLocation       String   // HOME, GYM, OUTDOOR
  availableEquipment    String[] // ["dumbbells", "barbell", "pull_up_bar"]
}

model UserHealth {
  // What to avoid
  injuries              String[]  // ["shoulder", "lower_back"]
  chronicConditions     String[]
  // ... more safety stuff
}
```

The key insight here: **your recommendation is only as good as what you know about the user**. This is why we have a 6-phase onboarding questionnaire. More data = better recommendations.

---

## Part 2: The Recommendation Engine

Okay, NOW we get to the fun part. Let's build the actual recommendation system.

### Step 1: Determine Today's Workout Split

First question: what body parts should we train today?

This depends on how many days per week someone works out. Here's our split logic:

```typescript
// The holy grail of workout programming
const SPLIT_TEMPLATES: Record<number, WorkoutSplitType[]> = {
  2: ['FULL_BODY', 'FULL_BODY'],
  3: ['PUSH', 'PULL', 'LEGS'],
  4: ['UPPER_BODY', 'LOWER_BODY', 'UPPER_BODY', 'LOWER_BODY'],
  5: ['PUSH', 'PULL', 'LEGS', 'UPPER_BODY', 'LOWER_BODY'],
  6: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS'],
  7: ['PUSH', 'PULL', 'LEGS', 'UPPER_BODY', 'LOWER_BODY', 'FULL_BODY', 'ACTIVE_RECOVERY'],
};
```

If you work out 3 days, you get Push/Pull/Legs. If you work out 6 days, you get PPL twice. This isn't random - it's based on actual exercise science about recovery times.

Now map each split to the muscle groups we're targeting:

```typescript
const SPLIT_MUSCLES: Record<WorkoutSplitType, string[]> = {
  PUSH: ['chest', 'shoulders', 'triceps'],
  PULL: ['back', 'lats', 'biceps', 'rear_delts'],
  LEGS: ['quads', 'hamstrings', 'glutes', 'calves'],
  UPPER_BODY: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  LOWER_BODY: ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors'],
  FULL_BODY: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'core'],
  // ... etc
};
```

### Step 2: Filter Exercises

Here's where it gets interesting. We need to find exercises that match:
- The target muscle groups
- The user's equipment
- The user's location (home/gym)
- The user's experience level
- NOT contraindicated by their injuries

Let's build the query:

```typescript
async generateWorkout(config: WorkoutConfig) {
  const { userId, dayOfWeek, weekNumber } = config;

  // Get everything we know about this user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preferences: true,
      health: true,
    },
  });

  const { profile, preferences, health } = user;

  // What split are we doing today?
  const daysPerWeek = preferences.workoutDaysPerWeek;
  const splitTemplate = SPLIT_TEMPLATES[daysPerWeek];
  const todaysSplit = splitTemplate[dayOfWeek % splitTemplate.length];

  // What muscles are we hitting?
  const targetMuscles = SPLIT_MUSCLES[todaysSplit];

  // Build our filters
  const difficultyFilter = this.buildDifficultyFilter(profile.experienceLevel);
  const contraindicationFilter = this.buildContraindicationFilter(health?.injuries || []);

  // Query exercises that match ALL criteria
  const exercises = await prisma.exercise.findMany({
    where: {
      isActive: true,
      primaryMuscles: { hasSome: targetMuscles },  // Must hit at least one target muscle
      difficultyLevel: { lte: difficultyFilter },   // Not too hard
      NOT: {
        contraindications: { hasSome: contraindicationFilter },  // Not dangerous for them
      },
    },
    orderBy: [
      { exerciseType: 'asc' },       // Compound exercises first
      { popularityScore: 'desc' },    // Prefer popular ones
    ],
    take: exerciseCount * 2,  // Get more than we need for variety
  });

  // ...
}
```

The `NOT: contraindications` clause is crucial. If a user has a shoulder injury, we automatically exclude exercises like bench press that list `shoulder_injury` in their contraindications. Safety first.

### Step 3: Difficulty Filtering

Not every exercise is for everyone. Here's how we map experience to difficulty:

```typescript
private buildDifficultyFilter(experience: ExperienceLevel): number {
  switch (experience) {
    case 'NEVER':
    case 'BEGINNER':
      return 2;  // Only easy exercises
    case 'INTERMEDIATE':
      return 3;  // Medium difficulty max
    case 'ADVANCED':
      return 4;  // Can handle hard stuff
    case 'EXPERT':
      return 5;  // Bring it on
    default:
      return 3;
  }
}
```

A beginner won't get barbell back squats (difficulty 4). They'll get goblet squats (difficulty 2) instead. Same movement pattern, more appropriate.

### Step 4: Smart Exercise Selection

Here's where most systems fail. They just grab random exercises. We need to be smarter:

```typescript
private selectExercises(exercises: Exercise[], count: number, targetMuscles: string[]): Exercise[] {
  const selected: Exercise[] = [];
  const musclesCovered: Set<string> = new Set();

  // FIRST PASS: Make sure each target muscle gets at least one exercise
  for (const muscle of targetMuscles) {
    const exerciseForMuscle = exercises.find(
      (ex) => ex.primaryMuscles.includes(muscle) && !selected.includes(ex)
    );
    if (exerciseForMuscle && selected.length < count) {
      selected.push(exerciseForMuscle);
      musclesCovered.add(muscle);
    }
  }

  // SECOND PASS: Fill remaining slots with variety
  for (const exercise of exercises) {
    if (selected.length >= count) break;
    if (!selected.includes(exercise)) {
      selected.push(exercise);
    }
  }

  // FINALLY: Sort compound exercises first, isolation last
  selected.sort((a, b) => {
    if (a.exerciseType === 'COMPOUND' && b.exerciseType !== 'COMPOUND') return -1;
    if (a.exerciseType !== 'COMPOUND' && b.exerciseType === 'COMPOUND') return 1;
    return 0;
  });

  return selected;
}
```

Why compound first? Because compound exercises (bench press, squats, deadlifts) work multiple muscle groups and require the most energy. You want to do them when you're fresh. Isolation exercises (bicep curls, tricep extensions) come last when you're more fatigued but the exercises are simpler.

This is exactly what a trainer would do.

### Step 5: Sets, Reps, and Rest (The Science-y Part)

Different goals require different programming:

```typescript
// Rep ranges based on fitness goal
const GOAL_REP_RANGES: Record<string, { min: number; max: number; sets: number }> = {
  STRENGTH: { min: 3, max: 6, sets: 5 },      // Heavy weight, low reps
  MUSCLE_GAIN: { min: 8, max: 12, sets: 4 },  // Moderate weight, moderate reps
  ENDURANCE: { min: 15, max: 20, sets: 3 },   // Light weight, high reps
  WEIGHT_LOSS: { min: 12, max: 15, sets: 3 }, // Keep heart rate up
  GENERAL_FITNESS: { min: 10, max: 15, sets: 3 },
};

// Rest periods (in seconds)
const GOAL_REST_PERIODS: Record<string, number> = {
  STRENGTH: 180,      // 3 minutes - need full recovery
  MUSCLE_GAIN: 90,    // 1.5 minutes - partial recovery
  ENDURANCE: 45,      // Quick - keep heart rate up
  WEIGHT_LOSS: 45,    // Quick - metabolic effect
  GENERAL_FITNESS: 60,
};
```

This is based on actual exercise science:
- **Strength training** needs long rest because you're lifting near your max
- **Hypertrophy (muscle gain)** needs moderate rest for metabolic stress
- **Endurance** needs short rest to keep cardiovascular demand high

We're encoding decades of sports science into a lookup table. Beautiful.

### Step 6: RPE - The Secret Sauce

RPE stands for "Rate of Perceived Exertion" - basically, how hard does this feel on a scale of 1-10?

```typescript
private calculateTargetRpe(experience: ExperienceLevel, exerciseIndex: number): number {
  // Base RPE based on experience
  let baseRpe = 7;
  switch (experience) {
    case 'NEVER':
    case 'BEGINNER':
      baseRpe = 6;  // Leave more in the tank
      break;
    case 'INTERMEDIATE':
      baseRpe = 7;
      break;
    case 'ADVANCED':
    case 'EXPERT':
      baseRpe = 8;  // Push harder
      break;
  }

  // Lower RPE for later exercises (fatigue management)
  if (exerciseIndex > 4) {
    baseRpe -= 1;
  }

  return Math.max(5, Math.min(9, baseRpe));
}
```

Beginners get an RPE target of 6 (they could do 4 more reps after their set). Experts get 8 (only 2 reps left in the tank). And for the 5th, 6th, 7th exercise, we lower the target because they're already fatigued.

This prevents injury and burnout. A good recommendation system doesn't just tell you what to do - it tells you how hard to do it.

---

## Part 3: Putting It All Together

Here's the complete workout generation function:

```typescript
async generateWorkout(config: WorkoutConfig) {
  const { userId, dayOfWeek, weekNumber } = config;

  // 1. Get user context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, preferences: true, health: true },
  });

  const { profile, preferences, health } = user;

  // 2. Determine today's split
  const daysPerWeek = preferences.workoutDaysPerWeek;
  const splitTemplate = SPLIT_TEMPLATES[daysPerWeek];
  const todaysSplit = splitTemplate[dayOfWeek % splitTemplate.length];
  const targetMuscles = SPLIT_MUSCLES[todaysSplit];

  // 3. Calculate how many exercises based on session length
  const sessionDuration = preferences.sessionDurationMin;
  let exerciseCount = 6;
  if (sessionDuration <= 20) exerciseCount = 4;
  else if (sessionDuration <= 30) exerciseCount = 5;
  else if (sessionDuration <= 45) exerciseCount = 6;
  else if (sessionDuration <= 60) exerciseCount = 8;
  else exerciseCount = 10;

  // 4. Get rep range based on goal
  const goal = profile.primaryGoal || 'GENERAL_FITNESS';
  const repRange = GOAL_REP_RANGES[goal];
  const restPeriod = GOAL_REST_PERIODS[goal];

  // 5. Query matching exercises
  const exercises = await prisma.exercise.findMany({
    where: {
      isActive: true,
      primaryMuscles: { hasSome: targetMuscles },
      difficultyLevel: { lte: this.buildDifficultyFilter(profile.experienceLevel) },
      NOT: {
        contraindications: { hasSome: this.buildContraindicationFilter(health?.injuries || []) },
      },
    },
    orderBy: [
      { exerciseType: 'asc' },
      { popularityScore: 'desc' },
    ],
    take: exerciseCount * 2,
  });

  // 6. Smart selection
  const selectedExercises = this.selectExercises(exercises, exerciseCount, targetMuscles);

  // 7. Build the workout
  const workoutExercises = selectedExercises.map((exercise, index) => ({
    exerciseId: exercise.id,
    orderIndex: index + 1,
    targetSets: repRange.sets,
    targetReps: `${repRange.min}-${repRange.max}`,
    targetRpe: this.calculateTargetRpe(profile.experienceLevel, index),
    restSeconds: restPeriod,
  }));

  // 8. Create in database
  const workout = await prisma.workout.create({
    data: {
      userId,
      scheduledDate: new Date(),
      dayOfWeek,
      weekNumber,
      workoutType: todaysSplit,
      focusMuscles: targetMuscles,
      title: this.generateWorkoutTitle(todaysSplit),
      exercises: {
        create: workoutExercises,
      },
    },
    include: { exercises: { include: { exercise: true } } },
  });

  return workout;
}
```

And just like that, we have a personalized workout recommendation.

---

## Part 4: The Exercise Database (You Need Good Data)

The algorithm is only as good as the data. Here's what one of our exercise entries looks like:

```typescript
{
  name: 'Barbell Bench Press',
  slug: 'barbell-bench-press',
  description: 'The king of chest exercises. A compound movement that builds overall chest mass and pressing strength.',
  instructions: '1. Lie on bench with feet flat on floor. 2. Grip bar slightly wider than shoulder width. 3. Unrack and lower bar to mid-chest. 4. Press up explosively to starting position.',

  category: 'STRENGTH',
  movementPattern: 'HORIZONTAL_PUSH',
  exerciseType: 'COMPOUND',

  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'front_delts'],
  muscleActivationMap: { chest: 0.9, triceps: 0.6, front_delts: 0.4 },

  difficultyLevel: 3,
  isBeginnerFriendly: false,

  equipmentRequired: ['barbell', 'bench'],
  suitableLocations: ['gym'],

  repRanges: {
    strength: { min: 3, max: 6 },
    hypertrophy: { min: 8, max: 12 },
    endurance: { min: 15, max: 20 }
  },
  restSeconds: { strength: 180, hypertrophy: 90, endurance: 60 },

  contraindications: ['shoulder_injury', 'chest_injury'],
  formCues: ['Retract shoulder blades', 'Keep feet flat', 'Arch upper back slightly'],

  easierVariation: 'Dumbbell Bench Press',
  harderVariation: 'Paused Bench Press',

  tags: ['compound', 'push', 'powerlifting', 'mass_builder'],
  suitableGoals: ['MUSCLE_GAIN', 'STRENGTH'],
}
```

See that `muscleActivationMap`? That's a float between 0-1 representing how much each muscle is activated. Chest is 0.9 (primary mover), triceps is 0.6 (significant secondary), front delts is 0.4 (assists). This could be used for more advanced recommendations later (balancing total muscle group volume across the week).

The `easierVariation` and `harderVariation` fields let us swap exercises for progressions. Can't do bench press? Try the easier variation. Too easy? Try the harder one.

---

## Part 5: Adding AI (The Claude Sprinkles)

Now for the fun part. We have a solid rule-based system, but we can add AI for the soft, fuzzy stuff humans are good at.

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  /**
   * Generate personalized motivation based on user context
   */
  async generateMotivation(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const context = {
      name: user.profile.firstName,
      goal: user.profile.primaryGoal,
      fitnessLevel: user.profile.fitnessLevel,
      experienceLevel: user.profile.experienceLevel,
    };

    const message = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',  // Fast and cheap
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Generate a short, personalized workout motivation message (2-3 sentences) for:
Name: ${context.name}
Goal: ${context.goal}
Fitness Level: ${context.fitnessLevel}
Experience: ${context.experienceLevel}

Be encouraging, specific to their goal, and energetic. Don't use emojis.`,
      }],
    });

    return message.content[0].text;
  }

  /**
   * Analyze workout performance and suggest adjustments
   */
  async analyzePerformance(userId: string, workoutId: string) {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            exercise: true,
            logs: { include: { sets: true } },
          },
        },
      },
    });

    const performance = workout.exercises.map((we) => ({
      name: we.exercise.name,
      targetSets: we.targetSets,
      completedSets: we.logs.reduce((sum, l) => sum + l.sets.length, 0),
      averageRpe: we.logs[0]?.averageRpe || 0,
      skipped: we.skipped,
    }));

    const message = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `Analyze this workout performance and provide brief feedback:
${JSON.stringify(performance, null, 2)}

Provide:
1. A short overall assessment (1-2 sentences)
2. 2-3 specific adjustments for next session

Format as JSON: { "feedback": "...", "adjustments": ["...", "..."] }`,
      }],
    });

    return JSON.parse(message.content[0].text);
  }
}
```

The key insight: **AI for the squishy stuff, rules for the structured stuff**.

- Rules: What exercises to include, sets/reps, rest periods
- AI: Motivation, natural language summaries, coaching tips

This is a hybrid approach. The rules are fast, deterministic, and debuggable. The AI adds personality and handles the cases where rigid rules feel robotic.

---

## Part 6: The API Layer

Let's expose this as a REST API:

```typescript
import { Router } from 'express';
import { workoutGeneratorService } from '../services/workout-generator.service.js';
import { authenticate } from '../middleware/auth.js';

export const workoutRouter = Router();

// All routes require authentication
workoutRouter.use(authenticate);

/**
 * GET /workouts/today
 * Get today's workout (generates if needed)
 */
workoutRouter.get('/today', async (req, res) => {
  const userId = req.user.id;
  const workout = await workoutGeneratorService.getTodaysWorkout(userId);
  res.json(workout);
});

/**
 * POST /workouts/:id/start
 * Mark a workout as started
 */
workoutRouter.post('/:id/start', async (req, res) => {
  const { id } = req.params;

  const workout = await prisma.workout.update({
    where: { id, userId: req.user.id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  res.json(workout);
});

/**
 * POST /workouts/:wid/exercises/:eid/log
 * Log a completed set
 */
workoutRouter.post('/:wid/exercises/:eid/log', async (req, res) => {
  const { wid, eid } = req.params;
  const { setNumber, repsCompleted, weightUsed, rpe } = req.body;

  // Create the set log
  const log = await prisma.setLog.create({
    data: {
      exerciseLog: {
        connectOrCreate: {
          where: { workoutExerciseId: eid },
          create: {
            userId: req.user.id,
            workoutExerciseId: eid,
            exerciseId: // ... get from workout exercise
          },
        },
      },
      setNumber,
      repsCompleted,
      weightUsed,
      rpe,
    },
  });

  res.json(log);
});

/**
 * POST /workouts/:id/complete
 * Mark workout as completed
 */
workoutRouter.post('/:id/complete', async (req, res) => {
  const { id } = req.params;

  const workout = await prisma.workout.update({
    where: { id, userId: req.user.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      actualDuration: // calculate from startedAt
    },
  });

  // Trigger AI analysis in background
  aiService.analyzePerformance(req.user.id, id);

  res.json(workout);
});
```

---

## Part 7: The Architecture Diagram

Here's what we built:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile/Web)                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Express)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Auth Routes │ │  Workout    │ │  Progress   │ │  Exercise   ││
│  │  /auth/*    │ │  /workouts/*│ │  /progress/*│ │ /exercises/*││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  WorkoutGenerator    │  │     AIService        │             │
│  │  - generateWorkout() │  │  - motivation()      │             │
│  │  - getTodaysWorkout()│  │  - weeklySummary()   │             │
│  │  - swapExercise()    │  │  - analyzePerf()     │             │
│  └──────────────────────┘  └──────────────────────┘             │
│           │                         │                            │
│           │    ┌────────────────────┘                            │
│           ▼    ▼                                                 │
│  ┌────────────────────┐    ┌────────────────────┐               │
│  │   Rule Engine      │    │   Claude API       │               │
│  │ - Split templates  │    │ - Haiku model      │               │
│  │ - Rep ranges       │    │ - Natural language │               │
│  │ - Contraindications│    │ - Personalization  │               │
│  └────────────────────┘    └────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (Prisma + PostgreSQL)             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Users  │ │Exercises│ │Workouts │ │ Logs    │ │Progress │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 8: What Makes This Actually Good?

Looking back, here's what separates a good recommendation system from a bad one:

### 1. Domain Knowledge Encoded in Data

We didn't just store exercise names. We stored movement patterns, muscle activation maps, contraindications. The data model IS the domain knowledge.

### 2. Multi-Factor Filtering

We filter by: muscle groups, equipment, location, experience, injuries. Each filter alone isn't impressive. Together, they create personalization.

### 3. Ordering Matters

Compound before isolation. Higher priority exercises when you're fresh. This isn't just about WHAT to recommend, but WHEN.

### 4. Contextual Parameters

Sets, reps, rest, and RPE all change based on the user's goal. Same exercise, different prescription.

### 5. Fallbacks and Safety

If someone has an injury, we don't show exercises that could hurt them. If they're a beginner, we don't give them advanced movements. Safety is built into the algorithm.

### 6. AI for the Edges

Rule-based systems are great until they're not. AI fills the gaps with natural language, personalized motivation, and nuanced feedback.

---

## Part 9: What's Next?

This is a solid v1, but here's how you could make it better:

### Progressive Overload Tracking
```typescript
// Track performance over time and automatically increase difficulty
const lastPerformance = await getLastExercisePerformance(userId, exerciseId);
if (lastPerformance.avgRpe < 7 && lastPerformance.completedAllSets) {
  suggestedWeight = lastPerformance.weight * 1.05;  // 5% increase
}
```

### Similarity-Based Alternatives
Use embeddings to find similar exercises:
```typescript
// Store exercise embeddings
embedding Float[]  // Vector from description + tags

// Find similar exercises using pgvector
SELECT * FROM exercises
ORDER BY embedding <-> $queryEmbedding
LIMIT 5;
```

### Periodization
Structure training over weeks/months:
```typescript
const PERIODIZATION = {
  week1: { volume: 'low', intensity: 'medium' },    // Deload
  week2: { volume: 'medium', intensity: 'medium' }, // Build
  week3: { volume: 'high', intensity: 'medium' },   // Peak volume
  week4: { volume: 'medium', intensity: 'high' },   // Peak intensity
};
```

### Social Features
See what exercises are popular among similar users (collaborative filtering).

---

## Conclusion

Building an exercise recommendation system isn't about complex ML models (though they help). It's about:

1. **Understanding the domain** - How do trainers actually think?
2. **Encoding knowledge in data** - Movement patterns, contraindications, rep ranges
3. **Layered filtering** - Multiple constraints that work together
4. **Contextual output** - Same exercise, different prescriptions
5. **AI for polish** - Human-like text and nuanced feedback

The code isn't magical. It's just organized common sense, carefully structured.

Now go build something cool. And maybe do some actual exercise while you're at it.

---

*If you made it this far, you're either really interested in fitness apps or really bored. Either way, thanks for reading. The full code is in the repo. Star it, fork it, make it better.*

*And remember: the best recommendation system is the one that gets people to actually work out. Metrics don't matter if nobody uses it.*

---

**Tech Stack:**
- Node.js + Express + TypeScript
- Prisma + PostgreSQL (with pgvector for embeddings)
- Claude API (Haiku for speed, Sonnet for complexity)
- React Native (Expo) for mobile
- Next.js for web

**Total Lines of Code:** ~2000 for the recommendation engine

**Time to Build:** One very caffeinated weekend

**Exercises in Database:** 30+ and growing

---

*Happy lifting.*
