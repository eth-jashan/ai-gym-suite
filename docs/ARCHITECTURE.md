# AI Gym Suite - Architecture & Flow Design

## 🎯 Vision
An AI-powered fitness app that creates hyper-personalized workout plans, similar to BetterMe/Cal AI, but with smarter recommendations using vector-based exercise matching and adaptive progression.

---

## 📊 Core User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Sign Up  │───▶│  Onboarding  │───▶│  AI Profile  │───▶│ First Workout │  │
│  └──────────┘    │ Questionnaire│    │  Generation  │    │   Generated   │  │
│                  └──────────────┘    └──────────────┘    └───────────────┘  │
│                         │                                        │          │
│                         ▼                                        ▼          │
│                  ┌──────────────┐                        ┌───────────────┐  │
│                  │ 8-12 Smart   │                        │ Daily Workout │  │
│                  │  Questions   │                        │    Dashboard  │  │
│                  └──────────────┘                        └───────────────┘  │
│                                                                  │          │
│                                                                  ▼          │
│                                              ┌───────────────────────────┐  │
│                                              │  Track → Adapt → Improve  │  │
│                                              └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Onboarding Questionnaire (Smart Flow)

### Phase 1: Basic Profile (Required)
| Question | Purpose | Data Type |
|----------|---------|-----------|
| Age | Exercise intensity calibration | Integer |
| Gender | Physiological considerations | Enum |
| Height | BMI, exercise scaling | Float (cm) |
| Current Weight | Baseline metrics | Float (kg) |
| Target Weight | Goal setting | Float (kg) |

### Phase 2: Goals & Motivation
| Question | Purpose | Options |
|----------|---------|---------|
| Primary Fitness Goal | Workout type selection | Weight Loss, Muscle Gain, Endurance, Flexibility, General Fitness, Sport-Specific |
| Secondary Goal | Balanced programming | Same as above |
| What motivates you? | Engagement strategy | Look Better, Feel Stronger, Health Reasons, Athletic Performance, Stress Relief |
| Timeline Expectation | Intensity calibration | 1 month, 3 months, 6 months, 1 year, Lifestyle change |

### Phase 3: Fitness Assessment
| Question | Purpose | Options |
|----------|---------|---------|
| Current Activity Level | Baseline fitness | Sedentary, Lightly Active, Moderately Active, Very Active, Athlete |
| Exercise Experience | Complexity level | Never, <6 months, 6mo-2yr, 2-5yr, 5+ years |
| Can you do a push-up? | Upper body baseline | 0, 1-5, 6-15, 16-30, 30+ |
| Can you hold a plank? | Core strength baseline | <15s, 15-30s, 30-60s, 1-2min, 2+ min |
| Comfortable with squats? | Lower body baseline | No, Bodyweight only, Light weight, Moderate, Heavy |

### Phase 4: Logistics & Preferences
| Question | Purpose | Options |
|----------|---------|---------|
| Workout Location | Equipment availability | Home, Gym, Outdoor, Mixed |
| Available Equipment | Exercise filtering | None, Dumbbells, Barbell, Full Gym, Resistance Bands |
| Days per Week | Split determination | 2, 3, 4, 5, 6 |
| Time per Session | Volume calculation | 15-20min, 20-30min, 30-45min, 45-60min, 60+ min |
| Preferred Workout Time | Energy optimization | Early Morning, Morning, Afternoon, Evening, Night |

### Phase 5: Health & Limitations (Critical)
| Question | Purpose | Data Type |
|----------|---------|-----------|
| Any injuries? | Exercise exclusion | Multi-select body parts |
| Chronic conditions? | Safety modifications | Multi-select conditions |
| Pregnancy status? | Special programming | Boolean |
| Recent surgery? | Recovery consideration | Text + timeframe |

### Phase 6: Personalization (Optional but Valuable)
| Question | Purpose | Options |
|----------|---------|---------|
| Music preference during workout | Spotify integration | Genre selection |
| Preferred exercise types | Variety management | Compound, Isolation, HIIT, Steady State, Mixed |
| Rest time preference | Workout pacing | Minimal, Moderate, Full recovery |
| Do you track nutrition? | Holistic approach | Yes/No |

---

## 🏋️ Exercise Vector Database Design

### Exercise Schema
```python
{
    "id": "uuid",
    "name": "Barbell Bench Press",
    "description": "Compound pushing movement...",
    "category": "strength",

    # Muscle Targeting (0.0 - 1.0 intensity)
    "primary_muscles": ["chest"],
    "secondary_muscles": ["triceps", "front_delts"],
    "muscle_activation_map": {
        "chest": 0.9,
        "triceps": 0.6,
        "front_delts": 0.4,
        "core": 0.2
    },

    # Classification
    "movement_pattern": "horizontal_push",  # push, pull, hinge, squat, carry, rotation
    "exercise_type": "compound",            # compound, isolation, cardio, flexibility
    "difficulty_level": 3,                  # 1-5 scale
    "skill_requirement": 2,                 # 1-5 scale

    # Equipment & Location
    "equipment_required": ["barbell", "bench"],
    "equipment_optional": ["rack", "spotter"],
    "suitable_locations": ["gym"],

    # Performance Metrics
    "typical_rep_ranges": {
        "strength": {"min": 3, "max": 6},
        "hypertrophy": {"min": 8, "max": 12},
        "endurance": {"min": 15, "max": 20}
    },
    "typical_sets": {"min": 3, "max": 5},
    "rest_seconds": {"strength": 180, "hypertrophy": 90, "endurance": 45},

    # Calories & Intensity
    "met_value": 6.0,  # Metabolic Equivalent of Task
    "intensity_factor": 0.85,

    # Safety & Modifications
    "contraindications": ["shoulder_injury", "chest_injury"],
    "modifications": {
        "easier": "Incline Push-ups",
        "harder": "Decline Bench Press"
    },
    "form_cues": ["Retract shoulder blades", "Arch upper back slightly", ...],

    # Media
    "video_url": "...",
    "image_urls": ["...", "..."],
    "animation_url": "...",

    # AI Embedding (generated)
    "embedding": [0.123, -0.456, ...],  # 384-dim vector

    # Metadata
    "tags": ["push", "upper_body", "powerlifting", "beginner_friendly"],
    "popularity_score": 0.95,
    "effectiveness_rating": 4.8
}
```

### Embedding Strategy
```
Exercise Text = f"""
{name}. {description}.
Primary muscles: {primary_muscles}.
Movement pattern: {movement_pattern}.
Good for: {goals}.
Difficulty: {difficulty_level}/5.
Equipment: {equipment}.
"""

# Use sentence-transformers for embedding
embedding = model.encode(exercise_text)
```

---

## 🤖 AI Recommendation Engine

### Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI RECOMMENDATION ENGINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐   │
│  │ User Profile │────▶│ Profile Analyzer │────▶│ Daily Workout Context  │   │
│  │   Vector     │     │                  │     │  • Today's focus       │   │
│  └──────────────┘     └──────────────────┘     │  • Fatigue state       │   │
│                                                 │  • Available time      │   │
│                                                 └───────────┬────────────┘   │
│                                                             │                │
│                                                             ▼                │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐   │
│  │  Exercise    │────▶│  Vector Search   │────▶│  Candidate Exercises   │   │
│  │  Database    │     │  + Filtering     │     │     (Top 50)           │   │
│  └──────────────┘     └──────────────────┘     └───────────┬────────────┘   │
│                                                             │                │
│                                                             ▼                │
│                                   ┌─────────────────────────────────────┐   │
│                                   │         RANKING ALGORITHM            │   │
│                                   │  • Muscle balance score              │   │
│                                   │  • Recovery compatibility            │   │
│                                   │  • Progressive overload fit          │   │
│                                   │  • User preference match             │   │
│                                   │  • Variety score                     │   │
│                                   └───────────────────┬─────────────────┘   │
│                                                       │                      │
│                                                       ▼                      │
│                                   ┌─────────────────────────────────────┐   │
│                                   │        WORKOUT COMPOSER              │   │
│                                   │  • Select 4-8 exercises              │   │
│                                   │  • Assign sets/reps/weight           │   │
│                                   │  • Order by compound → isolation     │   │
│                                   │  • Add warm-up & cool-down           │   │
│                                   └───────────────────┬─────────────────┘   │
│                                                       │                      │
│                                                       ▼                      │
│                                   ┌─────────────────────────────────────┐   │
│                                   │         FINAL WORKOUT                │   │
│                                   └─────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workout Split Logic
```python
SPLIT_TEMPLATES = {
    2: "full_body",           # Full Body x2
    3: "push_pull_legs",       # Push, Pull, Legs
    4: "upper_lower",          # Upper, Lower, Upper, Lower
    5: "ppl_upper_lower",      # Push, Pull, Legs, Upper, Lower
    6: "ppl_ppl",              # Push, Pull, Legs x2
}

MUSCLE_GROUP_MAPPING = {
    "push": ["chest", "shoulders", "triceps"],
    "pull": ["back", "biceps", "rear_delts"],
    "legs": ["quads", "hamstrings", "glutes", "calves"],
    "upper": ["chest", "back", "shoulders", "biceps", "triceps"],
    "lower": ["quads", "hamstrings", "glutes", "calves", "hip_flexors"],
    "full_body": ["all"]
}
```

### Progressive Overload Algorithm
```python
def calculate_progression(user, exercise, last_performance):
    """
    Determine next session's target based on performance
    """
    if last_performance.completed_all_sets:
        if last_performance.rpe < 7:  # Too easy
            return increase_weight(5%)
        elif last_performance.rpe < 9:  # Just right
            return increase_reps_or_weight()
        else:  # Very hard but completed
            return maintain()
    else:
        if failed_on_last_set:
            return maintain()  # Try again
        else:
            return decrease_weight(5%)  # Deload
```

### Recovery & Fatigue Management
```python
RECOVERY_MATRIX = {
    # muscle_group: recovery_hours
    "chest": 48,
    "back": 48,
    "shoulders": 48,
    "biceps": 36,
    "triceps": 36,
    "quads": 72,
    "hamstrings": 72,
    "glutes": 72,
    "calves": 24,
    "core": 24,
}

def calculate_fatigue_score(user, muscle_group):
    last_workout = get_last_workout_for_muscle(user, muscle_group)
    hours_since = (now - last_workout.completed_at).hours
    recovery_needed = RECOVERY_MATRIX[muscle_group]

    if hours_since >= recovery_needed:
        return 0  # Fully recovered
    else:
        return 1 - (hours_since / recovery_needed)  # 0-1 fatigue
```

---

## 📱 API Endpoints Design

### Authentication & User
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/users/me
PATCH  /api/v1/users/me
```

### Onboarding
```
GET    /api/v1/onboarding/questions          # Get questionnaire
POST   /api/v1/onboarding/responses          # Submit responses
GET    /api/v1/onboarding/status             # Check completion status
POST   /api/v1/onboarding/generate-profile   # Generate AI profile
```

### Workouts
```
GET    /api/v1/workouts/today               # Get today's workout
POST   /api/v1/workouts/generate            # Generate new workout
GET    /api/v1/workouts/{id}                # Get specific workout
POST   /api/v1/workouts/{id}/start          # Start workout session
POST   /api/v1/workouts/{id}/complete       # Complete workout
POST   /api/v1/workouts/{id}/exercises/{eid}/log  # Log set completion
```

### Exercises
```
GET    /api/v1/exercises                    # List all exercises
GET    /api/v1/exercises/{id}               # Get exercise details
GET    /api/v1/exercises/search             # Vector search
POST   /api/v1/exercises/{id}/swap          # Get alternative exercises
```

### Progress & Analytics
```
GET    /api/v1/progress/dashboard           # Overview stats
GET    /api/v1/progress/strength            # Strength progression
GET    /api/v1/progress/body                # Body measurements
GET    /api/v1/progress/streaks             # Workout streaks
GET    /api/v1/progress/weekly-summary      # AI-generated summary
```

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐       ┌──────────────────┐       ┌───────────────────┐     │
│  │   users     │       │  user_profiles   │       │ user_preferences  │     │
│  │─────────────│       │──────────────────│       │───────────────────│     │
│  │ id          │──────▶│ user_id          │       │ user_id           │     │
│  │ email       │       │ age              │       │ workout_days      │     │
│  │ password    │       │ gender           │       │ session_duration  │     │
│  │ created_at  │       │ height_cm        │       │ preferred_time    │     │
│  └─────────────┘       │ current_weight   │       │ equipment         │     │
│         │              │ target_weight    │       │ location          │     │
│         │              │ fitness_level    │       │ notifications     │     │
│         │              │ experience_years │       └───────────────────┘     │
│         │              │ primary_goal     │                                  │
│         │              │ secondary_goal   │                                  │
│         │              │ limitations      │       ┌───────────────────┐     │
│         │              │ profile_vector   │       │ user_health       │     │
│         │              └──────────────────┘       │───────────────────│     │
│         │                                         │ user_id           │     │
│         │                                         │ injuries          │     │
│         │                                         │ conditions        │     │
│         │                                         │ medications       │     │
│         │                                         └───────────────────┘     │
│         │                                                                    │
│         │              ┌──────────────────┐       ┌───────────────────┐     │
│         │              │    workouts      │       │ workout_exercises │     │
│         └─────────────▶│──────────────────│──────▶│───────────────────│     │
│                        │ id               │       │ id                │     │
│                        │ user_id          │       │ workout_id        │     │
│                        │ scheduled_date   │       │ exercise_id       │     │
│                        │ workout_type     │       │ order_index       │     │
│                        │ focus_muscles    │       │ target_sets       │     │
│                        │ estimated_time   │       │ target_reps       │     │
│                        │ status           │       │ target_weight     │     │
│                        │ started_at       │       │ rest_seconds      │     │
│                        │ completed_at     │       │ status            │     │
│                        │ notes            │       └───────────────────┘     │
│                        └──────────────────┘               │                  │
│                                                           │                  │
│                                                           ▼                  │
│  ┌─────────────┐       ┌──────────────────┐       ┌───────────────────┐     │
│  │ exercises   │       │ exercise_logs    │◀──────│   set_logs        │     │
│  │─────────────│       │──────────────────│       │───────────────────│     │
│  │ id          │──────▶│ id               │       │ id                │     │
│  │ name        │       │ workout_ex_id    │       │ exercise_log_id   │     │
│  │ description │       │ exercise_id      │       │ set_number        │     │
│  │ category    │       │ user_id          │       │ reps_completed    │     │
│  │ muscles     │       │ performed_at     │       │ weight_used       │     │
│  │ equipment   │       │ total_volume     │       │ rpe               │     │
│  │ difficulty  │       │ notes            │       │ rest_taken        │     │
│  │ embedding   │       └──────────────────┘       │ form_rating       │     │
│  │ metadata    │                                  └───────────────────┘     │
│  └─────────────┘                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Adaptive Learning System

### User Behavior Signals
1. **Completion Rate** - Did they finish workouts?
2. **Exercise Swaps** - Which exercises do they replace?
3. **RPE Ratings** - How hard did it feel?
4. **Skipped Exercises** - What do they avoid?
5. **Session Duration** - Faster or slower than expected?
6. **Streak Patterns** - When do they drop off?

### Adaptation Rules
```python
class AdaptiveEngine:
    def adjust_difficulty(self, user):
        recent_rpe = get_avg_rpe(user, days=7)
        if recent_rpe < 6:
            increase_difficulty(10%)
        elif recent_rpe > 8.5:
            decrease_difficulty(10%)

    def adjust_volume(self, user):
        completion_rate = get_completion_rate(user, days=14)
        if completion_rate < 0.7:
            reduce_sets_or_exercises()
        elif completion_rate > 0.95:
            consider_adding_volume()

    def learn_preferences(self, user):
        # Track exercise swap patterns
        swaps = get_swap_history(user)
        # Update user preference vector
        # Reduce recommendation score for avoided exercises
        # Increase score for preferred alternatives
```

---

## 🎮 Gamification & Engagement

### Streak System
- Daily login streak
- Workout completion streak
- Personal record celebrations

### Achievements
- First workout
- First week completed
- Strength milestones (1x, 1.5x, 2x bodyweight lifts)
- Consistency badges

### Social Features (Future)
- Workout sharing
- Challenge friends
- Leaderboards

---

## 🛠️ Tech Stack Recommendation

| Component | Technology | Reason |
|-----------|------------|--------|
| Backend Framework | FastAPI (Python) | Async, type hints, auto docs |
| Database | PostgreSQL + pgvector | Relational + vector search |
| Cache | Redis | Session, rate limiting |
| Task Queue | Celery | Workout generation, analytics |
| ML/Embeddings | sentence-transformers | Local, fast, accurate |
| LLM Integration | Claude/GPT-4 | Workout descriptions, coaching |
| Authentication | JWT + OAuth2 | Industry standard |
| API Docs | OpenAPI/Swagger | Auto-generated |

---

## 📈 Success Metrics

1. **Onboarding Completion Rate** - Target: >80%
2. **First Workout Completion** - Target: >70%
3. **Week 1 Retention** - Target: >60%
4. **Month 1 Retention** - Target: >40%
5. **User Satisfaction (NPS)** - Target: >50
6. **Workout Completion Rate** - Target: >75%
