# Mobile UI Integration Guide

Complete guide for integrating the AI Gym Suite backend with mobile applications (React Native, Flutter, etc.).

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Onboarding Flow](#onboarding-flow)
4. [Exercise Suggestions Flow](#exercise-suggestions-flow)
5. [Workout Management](#workout-management)
6. [API Reference](#api-reference)
7. [Data Types](#data-types)
8. [Error Handling](#error-handling)

---

## Overview

### Base URL
```
Development: http://localhost:3001/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication
All endpoints (except `/auth/*`) require a Bearer token:
```
Authorization: Bearer <access_token>
```

### Response Format
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "error": "Error type",
  "message": "Human readable message"
}
```

---

## Authentication Flow

### 1. Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "onboardingCompleted": false
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 1800
  }
}
```

### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 3. Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

### 4. Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "onboardingCompleted": true,
  "profile": {
    "firstName": "John",
    "fitnessLevel": "MODERATELY_ACTIVE",
    "primaryGoal": "MUSCLE_GAIN"
  }
}
```

---

## Onboarding Flow

The onboarding consists of 6 phases with 27 total questions. Users must complete onboarding before receiving workout suggestions.

### Onboarding Phases

| Phase | Title | Questions |
|-------|-------|-----------|
| 1 | Basic Profile | name, age, gender, height, weight, target weight |
| 2 | Goals & Motivation | primary goal, secondary goal, motivation, timeline |
| 3 | Fitness Assessment | fitness level, experience, pushup/plank/squat capacity |
| 4 | Logistics | location, equipment, days/week, duration, time preference |
| 5 | Health & Safety | injuries, conditions, pregnancy, surgery |
| 6 | Personalization | exercise types, rest preference, music, reminders |

### 1. Get Onboarding Status

```http
GET /onboarding/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "currentPhase": 1,
  "totalPhases": 6,
  "completed": false,
  "phases": [
    { "phase": 1, "title": "Basic Profile", "completed": false },
    { "phase": 2, "title": "Goals & Motivation", "completed": false },
    ...
  ]
}
```

### 2. Get Questions for Phase

```http
GET /onboarding/phase/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "phase": 1,
  "title": "Basic Profile",
  "questions": [
    {
      "key": "first_name",
      "question": "What's your first name?",
      "type": "text",
      "validation": { "required": true, "minLength": 1, "maxLength": 50 },
      "helpText": "We'll use this to personalize your experience"
    },
    {
      "key": "age",
      "question": "How old are you?",
      "type": "number",
      "validation": { "required": true, "min": 13, "max": 100 }
    },
    {
      "key": "gender",
      "question": "What is your gender?",
      "type": "single_select",
      "options": [
        { "value": "MALE", "label": "Male", "icon": "👨" },
        { "value": "FEMALE", "label": "Female", "icon": "👩" },
        { "value": "OTHER", "label": "Other", "icon": "🧑" },
        { "value": "PREFER_NOT_TO_SAY", "label": "Prefer not to say", "icon": "🤐" }
      ]
    },
    {
      "key": "primary_goal",
      "question": "What is your primary fitness goal?",
      "type": "single_select",
      "options": [
        { "value": "WEIGHT_LOSS", "label": "Lose Weight", "description": "Burn fat and get leaner", "icon": "🔥" },
        { "value": "MUSCLE_GAIN", "label": "Build Muscle", "description": "Gain size and strength", "icon": "💪" },
        { "value": "STRENGTH", "label": "Get Stronger", "icon": "🏋️" },
        { "value": "ENDURANCE", "label": "Improve Endurance", "icon": "🏃" },
        { "value": "FLEXIBILITY", "label": "Increase Flexibility", "icon": "🧘" },
        { "value": "GENERAL_FITNESS", "label": "General Fitness", "icon": "❤️" }
      ]
    },
    {
      "key": "available_equipment",
      "question": "What equipment do you have access to?",
      "type": "multi_select",
      "options": [
        { "value": "none", "label": "No equipment", "icon": "🤸" },
        { "value": "dumbbells", "label": "Dumbbells", "icon": "🏋️" },
        { "value": "barbell", "label": "Barbell & Plates", "icon": "💪" },
        { "value": "full_gym", "label": "Full Gym Access", "icon": "🏢" }
      ]
    },
    {
      "key": "workout_days_per_week",
      "question": "How many days per week can you work out?",
      "type": "slider",
      "validation": { "min": 1, "max": 7 }
    }
  ]
}
```

### 3. Submit Phase Responses

```http
POST /onboarding/phase/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "responses": {
    "first_name": "John",
    "age": 28,
    "gender": "MALE",
    "height_cm": 180,
    "current_weight_kg": 75,
    "target_weight_kg": 80
  }
}
```

### 4. Complete Onboarding

After all phases are submitted:

```http
POST /onboarding/complete
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed!",
  "profile": {
    "firstName": "John",
    "fitnessLevel": "MODERATELY_ACTIVE",
    "primaryGoal": "MUSCLE_GAIN",
    "workoutDaysPerWeek": 4
  }
}
```

---

## Exercise Suggestions Flow

After onboarding, users can get personalized exercise suggestions.

### Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP FLOW                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login/    │     │  Complete   │     │  Generate   │     │   Start     │
│  Register   │ ──► │  Onboarding │ ──► │   Weekly    │ ──► │  Workout    │
│             │     │  (6 phases) │     │    Plan     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                          ┌───────────────────────────────────┐
                          │         Weekly Plan               │
                          │                                   │
                          │  Day 1: Push (Chest, Shoulders)   │
                          │  Day 2: Pull (Back, Biceps)       │
                          │  Day 3: Legs (Quads, Glutes)      │
                          │  Day 4: Upper Body                │
                          └───────────────────────────────────┘
```

### 1. Check Suggestion Readiness

```http
GET /suggestions/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "embedding": {
    "provider": "gemini",
    "dimensions": 768,
    "available": true
  },
  "user": {
    "hasProfile": true,
    "hasPreferences": true,
    "hasHealth": true,
    "ready": true
  }
}
```

### 2. Generate Weekly Plan (Preview)

Get a preview without saving:

```http
GET /suggestions/weekly-plan
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "plan": {
    "splitType": "UPPER_LOWER",
    "daysPerWeek": 4,
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Upper Body A",
        "splitType": "UPPER_BODY",
        "focusMuscles": ["chest", "back", "shoulders", "triceps", "biceps"],
        "exercises": [
          {
            "exerciseId": "uuid-1",
            "name": "Barbell Bench Press",
            "sets": 4,
            "reps": "8-12",
            "restSeconds": 90,
            "order": 1
          },
          {
            "exerciseId": "uuid-2",
            "name": "Bent Over Row",
            "sets": 4,
            "reps": "8-12",
            "restSeconds": 90,
            "order": 2
          },
          {
            "exerciseId": "uuid-3",
            "name": "Overhead Press",
            "sets": 3,
            "reps": "8-12",
            "restSeconds": 90,
            "order": 3
          }
        ],
        "estimatedDuration": 45
      },
      {
        "dayIndex": 1,
        "dayName": "Lower Body A",
        "splitType": "LOWER_BODY",
        "focusMuscles": ["quadriceps", "hamstrings", "glutes", "calves"],
        "exercises": [
          {
            "exerciseId": "uuid-4",
            "name": "Barbell Squat",
            "sets": 4,
            "reps": "8-12",
            "restSeconds": 120,
            "order": 1
          }
        ],
        "estimatedDuration": 50
      }
    ],
    "totalExercises": 24,
    "generatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 3. Generate and Save Weekly Plan

```http
POST /suggestions/weekly-plan
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "planId": "uuid-plan",
  "plan": { ... },
  "message": "Weekly plan created and workouts scheduled"
}
```

### 4. Search Exercises (Natural Language)

```http
POST /suggestions/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "chest exercises I can do at home without equipment",
  "limit": 10,
  "threshold": 0.5
}
```

**Response:**
```json
{
  "query": "chest exercises I can do at home without equipment",
  "count": 8,
  "results": [
    {
      "id": "uuid",
      "name": "Push-up",
      "slug": "push-up",
      "description": "Classic bodyweight chest exercise...",
      "category": "CALISTHENICS",
      "primaryMuscles": ["chest", "triceps"],
      "difficultyLevel": 2,
      "equipmentRequired": [],
      "similarity": 0.91
    },
    {
      "id": "uuid",
      "name": "Diamond Push-up",
      "slug": "diamond-push-up",
      "similarity": 0.87
    }
  ]
}
```

### 5. Get Exercises for Specific Muscles

```http
GET /suggestions/exercises?muscles=chest,triceps&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "muscles": ["chest", "triceps"],
  "count": 10,
  "exercises": [
    {
      "id": "uuid",
      "name": "Bench Press",
      "score": 0.92,
      "scoreBreakdown": {
        "goalMatch": 0.9,
        "difficultyMatch": 0.95,
        "equipmentMatch": 1.0,
        "locationMatch": 0.9,
        "experienceMatch": 0.85,
        "semanticMatch": 0.88
      }
    }
  ]
}
```

### 6. Find Similar Exercises

Useful for suggesting alternatives:

```http
GET /suggestions/similar/uuid-exercise-id?limit=5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "exerciseId": "uuid",
  "count": 5,
  "similar": [
    {
      "id": "uuid-2",
      "name": "Incline Bench Press",
      "similarity": 0.94
    },
    {
      "id": "uuid-3",
      "name": "Dumbbell Bench Press",
      "similarity": 0.91
    }
  ]
}
```

### 7. Multi-Criteria Recommendations

```http
POST /suggestions/recommend
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetMuscles": ["chest", "shoulders"],
  "goals": ["muscle gain", "strength"],
  "difficulty": 3,
  "location": "gym",
  "equipment": ["barbell", "dumbbells"],
  "excludeExerciseIds": ["uuid-already-in-workout"],
  "limit": 5
}
```

---

## Workout Management

### 1. Get Scheduled Workouts

```http
GET /workouts?status=SCHEDULED
Authorization: Bearer <token>
```

**Response:**
```json
{
  "workouts": [
    {
      "id": "uuid",
      "scheduledDate": "2024-01-15",
      "dayOfWeek": 0,
      "workoutType": "PUSH",
      "title": "Push Day",
      "focusMuscles": ["chest", "shoulders", "triceps"],
      "estimatedDuration": 45,
      "status": "SCHEDULED",
      "exercises": [
        {
          "id": "uuid",
          "exerciseId": "uuid",
          "exercise": {
            "name": "Bench Press",
            "description": "...",
            "instructions": "...",
            "videoUrl": null
          },
          "targetSets": 4,
          "targetReps": "8-12",
          "restSeconds": 90,
          "orderIndex": 1
        }
      ]
    }
  ]
}
```

### 2. Start Workout

```http
POST /workouts/:id/start
Authorization: Bearer <token>
```

### 3. Log Exercise Set

```http
POST /workouts/:workoutId/exercises/:exerciseId/log
Authorization: Bearer <token>
Content-Type: application/json

{
  "setNumber": 1,
  "repsCompleted": 10,
  "weightUsed": 60,
  "rpe": 7,
  "formRating": 4
}
```

### 4. Complete Workout

```http
POST /workouts/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "userNotes": "Felt strong today!",
  "averageRpe": 7
}
```

---

## API Reference

### All Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | | |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| **Onboarding** | | |
| GET | `/onboarding/status` | Get onboarding status |
| GET | `/onboarding/phase/:phase` | Get questions for phase |
| POST | `/onboarding/phase/:phase` | Submit phase responses |
| POST | `/onboarding/complete` | Complete onboarding |
| **Suggestions** | | |
| GET | `/suggestions/status` | Check readiness |
| GET | `/suggestions/weekly-plan` | Generate plan (preview) |
| POST | `/suggestions/weekly-plan` | Generate and save plan |
| POST | `/suggestions/search` | Semantic search |
| GET | `/suggestions/exercises` | Get exercises for muscles |
| GET | `/suggestions/similar/:id` | Find similar exercises |
| POST | `/suggestions/recommend` | Multi-criteria recommendations |
| **Workouts** | | |
| GET | `/workouts` | List workouts |
| GET | `/workouts/:id` | Get workout details |
| POST | `/workouts/:id/start` | Start workout |
| POST | `/workouts/:id/complete` | Complete workout |
| POST | `/workouts/:wid/exercises/:eid/log` | Log exercise set |
| **Exercises** | | |
| GET | `/exercises` | List all exercises |
| GET | `/exercises/:id` | Get exercise details |
| GET | `/exercises/search?q=` | Search exercises |
| **Progress** | | |
| GET | `/progress/stats` | Get user stats |
| GET | `/progress/history` | Get workout history |
| POST | `/progress/snapshot` | Log body measurements |

---

## Data Types

### Enums

```typescript
// Fitness Goals
type FitnessGoal =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH'
  | 'ENDURANCE'
  | 'FLEXIBILITY'
  | 'GENERAL_FITNESS'
  | 'SPORT_SPECIFIC'
  | 'REHABILITATION'
  | 'MAINTAIN';

// Fitness Level
type FitnessLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'ATHLETE';

// Experience Level
type ExperienceLevel =
  | 'NEVER'
  | 'BEGINNER'      // < 6 months
  | 'INTERMEDIATE'  // 6 months - 2 years
  | 'ADVANCED'      // 2-5 years
  | 'EXPERT';       // 5+ years

// Workout Location
type WorkoutLocation = 'HOME' | 'GYM' | 'OUTDOOR' | 'MIXED';

// Workout Split Type
type WorkoutSplitType =
  | 'FULL_BODY'
  | 'UPPER_BODY'
  | 'LOWER_BODY'
  | 'PUSH'
  | 'PULL'
  | 'LEGS'
  | 'CHEST_TRICEPS'
  | 'BACK_BICEPS'
  | 'SHOULDERS_ARMS'
  | 'CORE'
  | 'CARDIO'
  | 'HIIT'
  | 'ACTIVE_RECOVERY';

// Exercise Category
type ExerciseCategory =
  | 'STRENGTH'
  | 'CARDIO'
  | 'FLEXIBILITY'
  | 'BALANCE'
  | 'PLYOMETRIC'
  | 'CALISTHENICS';

// Workout Status
type WorkoutStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'PARTIAL';
```

### Key Interfaces

```typescript
interface User {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile?: UserProfile;
  preferences?: UserPreferences;
}

interface UserProfile {
  firstName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  fitnessLevel: FitnessLevel;
  experienceLevel: ExperienceLevel;
  primaryGoal: FitnessGoal;
  secondaryGoal?: FitnessGoal;
}

interface UserPreferences {
  workoutLocation: WorkoutLocation;
  availableEquipment: string[];
  workoutDaysPerWeek: number;
  sessionDurationMin: number;
  preferredExerciseTypes: string[];
  restPreference: 'MINIMAL' | 'MODERATE' | 'FULL';
}

interface Exercise {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  category: ExerciseCategory;
  movementPattern: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficultyLevel: number;  // 1-5
  equipmentRequired: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface WorkoutDay {
  dayIndex: number;
  dayName: string;
  splitType: WorkoutSplitType;
  focusMuscles: string[];
  exercises: WorkoutExercise[];
  estimatedDuration: number;
}

interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  order: number;
}

interface WeeklyPlan {
  splitType: string;
  daysPerWeek: number;
  days: WorkoutDay[];
  totalExercises: number;
  generatedAt: Date;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - No permission |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |
| 503 | Service Unavailable (e.g., embedding not configured) |

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "received": "not-an-email"
  }
}
```

### Common Errors

```typescript
// Not authenticated
{ "error": "Unauthorized", "message": "No token provided" }

// Onboarding not complete
{ "error": "OnboardingRequired", "message": "Please complete onboarding first" }

// Semantic search unavailable
{
  "error": "ServiceUnavailable",
  "message": "Embedding provider not configured. Set GEMINI_API_KEY."
}

// Rate limited
{ "error": "TooManyRequests", "message": "Rate limit exceeded. Try again in 60 seconds." }
```

---

## Mobile Implementation Tips

### 1. Token Management

```typescript
// Store tokens securely
import * as SecureStore from 'expo-secure-store';

async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
}

// Auto-refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { tokens } = await api.post('/auth/refresh', { refreshToken });
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      // Retry original request
      error.config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api.request(error.config);
    }
    throw error;
  }
);
```

### 2. Onboarding State Machine

```typescript
const onboardingMachine = {
  states: {
    loading: { on: { LOADED: 'phase1' } },
    phase1: { on: { NEXT: 'phase2', SUBMIT: 'submitting' } },
    phase2: { on: { NEXT: 'phase3', BACK: 'phase1' } },
    // ... phases 3-6
    phase6: { on: { COMPLETE: 'completing' } },
    completing: { on: { SUCCESS: 'done' } },
    done: { type: 'final' }
  }
};
```

### 3. Offline Support

```typescript
// Cache weekly plan locally
import AsyncStorage from '@react-native-async-storage/async-storage';

async function cacheWeeklyPlan(plan: WeeklyPlan) {
  await AsyncStorage.setItem('weeklyPlan', JSON.stringify(plan));
  await AsyncStorage.setItem('planCachedAt', Date.now().toString());
}

async function getWeeklyPlan() {
  const cached = await AsyncStorage.getItem('weeklyPlan');
  const cachedAt = await AsyncStorage.getItem('planCachedAt');

  // Use cached if less than 1 hour old and offline
  if (cached && Date.now() - parseInt(cachedAt) < 3600000) {
    return JSON.parse(cached);
  }

  // Fetch fresh from API
  const { plan } = await api.get('/suggestions/weekly-plan');
  await cacheWeeklyPlan(plan);
  return plan;
}
```

### 4. Workout Timer Component

```typescript
// Track rest periods between sets
function useRestTimer(defaultSeconds: number) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (seconds === 0) {
      // Vibrate/notify when rest is over
      Vibration.vibrate();
    }
  }, [isRunning, seconds]);

  return {
    seconds,
    isRunning,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: () => { setSeconds(defaultSeconds); setIsRunning(false); }
  };
}
```

---

## Example Mobile Screens

### 1. Onboarding Screen Flow

```
┌─────────────────────────────────────┐
│  ← Back                    Skip →   │
│                                     │
│  Phase 1 of 6                       │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                     │
│  What's your first name?            │
│  ┌─────────────────────────────────┐│
│  │ John                            ││
│  └─────────────────────────────────┘│
│                                     │
│  How old are you?                   │
│  ┌─────────────────────────────────┐│
│  │ 28                              ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │           Continue →            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 2. Weekly Plan Screen

```
┌─────────────────────────────────────┐
│  ☰  Your Weekly Plan          ⚙️   │
├─────────────────────────────────────┤
│                                     │
│  Week 3 · Upper/Lower Split         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ MON  Upper Body A      45 min  ││
│  │      Chest, Back, Shoulders     ││
│  │      6 exercises         [Start]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ TUE  Lower Body A      50 min  ││
│  │      Quads, Glutes, Calves     ││
│  │      5 exercises         [Start]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ WED  Rest Day           ✓      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ THU  Upper Body B      45 min  ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 3. Active Workout Screen

```
┌─────────────────────────────────────┐
│  ✕ Cancel              Upper Body A │
├─────────────────────────────────────┤
│                                     │
│  Exercise 2 of 6                    │
│                                     │
│         ┌───────────────┐           │
│         │               │           │
│         │   [Exercise   │           │
│         │    Video/     │           │
│         │   Animation]  │           │
│         │               │           │
│         └───────────────┘           │
│                                     │
│  Bent Over Row                      │
│  Set 2 of 4 · 8-12 reps            │
│                                     │
│  Weight:  ┌────────────────────┐    │
│           │  60 kg         +/- │    │
│           └────────────────────┘    │
│                                     │
│  Reps:    ┌────────────────────┐    │
│           │  10              +/- │   │
│           └────────────────────┘    │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Complete Set            ││
│  └─────────────────────────────────┘│
│                                     │
│          ⏱️ Rest: 1:30              │
│                                     │
└─────────────────────────────────────┘
```

---

## Next Steps

1. Set up API client in mobile app
2. Implement authentication flow with secure token storage
3. Build onboarding screens for all 6 phases
4. Create weekly plan display and workout screens
5. Add exercise detail views with video/animation support
6. Implement set logging with timer
7. Add offline caching for workouts
8. Build progress tracking screens
