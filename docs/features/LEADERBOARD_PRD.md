# Leaderboard Feature PRD: "GymRank"

## Philosophy: Personal Excellence, Not Just Competition

> "The only person you should try to be better than is the person you were yesterday."

Traditional fitness leaderboards fail because they favor genetics over effort, discourage beginners, and promote unhealthy competition. **GymRank** takes inspiration from Apple's Activity Rings - celebrating personal progress while enabling meaningful social competition.

---

## Executive Summary

GymRank is a multi-dimensional scoring system that measures **relative improvement** and **consistent effort** rather than absolute performance. A 50-year-old beginner improving their pushups from 5 to 10 earns the same recognition as an athlete going from 50 to 55.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Effort > Genetics** | Score based on % improvement, not absolute numbers |
| **Consistency > Intensity** | Regular training beats sporadic heroics |
| **Balance > Specialization** | Reward well-rounded fitness |
| **Privacy-First** | Opt-in social features, private by default |
| **Inclusive Tiers** | Compete with similar athletes, not outliers |

---

## The GymScore System

### Overview

Every user earns a **weekly GymScore (0-1000 points)** composed of four pillars:

```
GymScore = Dedication (250) + Effort (250) + Progress (250) + Balance (250)
```

### Pillar 1: Dedication Score (D-Score) - Max 250/week

*"The best workout is the one you actually do."*

Measures consistency and commitment to the training plan.

| Metric | Points | Calculation |
|--------|--------|-------------|
| **Workout Completion** | 0-150 | `(completed_workouts / scheduled_workouts) × 150` |
| **Streak Bonus** | 0-50 | `min(current_streak × 5, 50)` |
| **Schedule Adherence** | 0-30 | Bonus for training on planned days |
| **Early Bird/Night Owl** | 0-20 | Bonus for consistent timing preference |

**Example Calculation:**
```
User scheduled 4 workouts, completed 3
Streak: 7 days
Trained on 2/4 planned days

D-Score = (3/4 × 150) + (7 × 5) + (2/4 × 30) + 10
        = 112.5 + 35 + 15 + 10
        = 172.5 points
```

### Pillar 2: Effort Score (E-Score) - Max 250/week

*"It's not about how much you lift, it's about how hard you try."*

Measures intensity relative to personal capacity - NOT absolute performance.

| Metric | Points | Calculation |
|--------|--------|-------------|
| **RPE-Weighted Volume** | 0-120 | Normalized volume with RPE multiplier |
| **Time Under Tension** | 0-50 | Total workout duration vs. target |
| **Set Completion Rate** | 0-50 | Completed sets / Target sets |
| **Progressive Overload Attempts** | 0-30 | Trying heavier weights or more reps |

**RPE-Weighted Volume Formula:**
```javascript
rpeWeightedVolume = sets.reduce((sum, set) => {
  const rpeMultiplier = 0.5 + (set.rpe / 20); // RPE 5 = 0.75x, RPE 10 = 1.0x
  return sum + (set.weight * set.reps * rpeMultiplier);
}, 0);

// Normalize to user's weekly baseline
normalizedVolume = (rpeWeightedVolume / userWeeklyBaseline) * 120;
```

**Why RPE Matters:**
- A beginner doing 3×10 push-ups at RPE 9 shows MORE effort than an advanced athlete doing 3×10 at RPE 5
- This levels the playing field across experience levels

### Pillar 3: Progress Score (P-Score) - Max 250/week

*"Small steps lead to giant leaps."*

Measures improvement rate, not absolute performance.

| Metric | Points | Calculation |
|--------|--------|-------------|
| **Personal Records** | 0-100 | 25 pts per PR (max 4 PRs/week) |
| **Strength Gains** | 0-80 | % increase vs. 4-week average |
| **Rep PRs** | 0-40 | More reps at same weight |
| **Milestone Achievements** | 0-30 | First 100kg squat, first pull-up, etc. |

**PR Types:**
1. **Weight PR** - Heaviest weight for exercise
2. **Volume PR** - Most total volume in single session
3. **Rep PR** - Most reps at a given weight
4. **Streak PR** - New personal longest streak

**Anti-Gaming Measures:**
- PRs only count for exercises done 3+ times previously
- Minimum 95% range of motion (future: video AI)
- Cannot farm PRs by intentionally regressing

### Pillar 4: Balance Score (B-Score) - Max 250/week

*"A chain is only as strong as its weakest link."*

Measures training variety and completeness.

| Metric | Points | Calculation |
|--------|--------|-------------|
| **Muscle Group Coverage** | 0-100 | Points for hitting all major groups |
| **Push/Pull Ratio** | 0-50 | Closer to 1:1 = more points |
| **Movement Pattern Variety** | 0-60 | Diversity of movement types |
| **Recovery Compliance** | 0-40 | Rest days taken when scheduled |

**Muscle Group Scoring:**
```javascript
const muscleGroups = {
  chest: { trained: true, points: 15 },
  back: { trained: true, points: 15 },
  shoulders: { trained: true, points: 12 },
  biceps: { trained: false, points: 0 },
  triceps: { trained: true, points: 10 },
  quads: { trained: true, points: 15 },
  hamstrings: { trained: false, points: 0 },
  glutes: { trained: true, points: 12 },
  core: { trained: true, points: 12 },
  calves: { trained: false, points: 0 },
};

muscleGroupScore = Object.values(muscleGroups).reduce((sum, g) => sum + g.points, 0);
// This week: 91/100 points (missed biceps, hamstrings, calves)
```

---

## Leaderboard Categories

### 1. Overall GymRank

The composite leaderboard showing total GymScore.

**Display:**
```
🏆 OVERALL GYMRANK - This Week

 #   Name           GymScore   Trend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1   Alex T.        892        ↑ +45
 2   Jordan M.      867        ↓ -12
 3   Sam K.         854        →
 4   You            823        ↑ +67  ⭐ Personal Best!
 5   Riley P.       801        ↑ +23
```

### 2. Pillar Leaderboards

Specialized rankings for each scoring pillar:

| Leaderboard | Icon | What It Celebrates |
|-------------|------|-------------------|
| **Dedication Kings** | 👑 | Most consistent trainers |
| **Effort Champions** | 💪 | Hardest workers (by RPE) |
| **Progress Hunters** | 📈 | Fastest improvers |
| **Balanced Athletes** | ⚖️ | Most well-rounded |

### 3. Specialized Leaderboards

| Leaderboard | Description |
|-------------|-------------|
| **Streak Masters** | Longest active streaks |
| **PR Crushers** | Most personal records this month |
| **Volume Kings** | Highest relative training volume |
| **Rising Stars** | Biggest improvement (new users <3 months) |
| **Comeback Kings** | Best return after 2+ week break |

### 4. Exercise-Specific Leaderboards

**Relative Strength Rankings** (normalized by bodyweight):

```
🏋️ BENCH PRESS - Relative Strength

 #   Name         1RM/BW    Weight Class
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1   Mike R.      1.65x     Middleweight
 2   You          1.42x     Lightweight   ⭐ Top 5%
 3   Chris L.     1.38x     Heavyweight
```

**Strength Standards Integration:**
```javascript
const strengthStandards = {
  bench_press: {
    untrained: 0.5,    // 0.5x bodyweight
    beginner: 0.75,
    intermediate: 1.0,
    advanced: 1.25,
    elite: 1.5,
  },
  squat: {
    untrained: 0.75,
    beginner: 1.0,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.25,
  },
  deadlift: {
    untrained: 1.0,
    beginner: 1.25,
    intermediate: 1.5,
    advanced: 2.0,
    elite: 2.5,
  },
};
```

---

## Fair Competition: Cohort System

### The Problem with Open Leaderboards

A 25-year-old male athlete will always out-lift a 55-year-old female beginner. Open competition is discouraging and meaningless.

### The Solution: Smart Cohorts

Users are automatically grouped into cohorts based on:

```javascript
const cohortFactors = {
  experienceLevel: ['beginner', 'intermediate', 'advanced', 'expert'],
  primaryGoal: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general'],
  ageGroup: ['18-29', '30-39', '40-49', '50-59', '60+'],
  trainingFrequency: ['2-3x/week', '4-5x/week', '6-7x/week'],
};
```

**Cohort Matching Algorithm:**
```javascript
function findCohort(user) {
  return users.filter(u =>
    u.experienceLevel === user.experienceLevel &&
    u.primaryGoal === user.primaryGoal &&
    Math.abs(u.age - user.age) <= 10
  );
}
```

### Cohort Display

```
📊 YOUR COHORT: Intermediate • Muscle Gain • 30-39

Competing with 1,247 similar athletes

Your Rank: #89 (Top 7%)

 #   Name           GymScore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1   Marcus T.      912
 2   David K.       898
 ...
89   You            756        ⬆ Climb 12 spots to reach Top 5%
```

---

## League System

### Weekly Leagues

Inspired by Duolingo's league system - weekly competitions with promotion/demotion.

| League | Icon | Percentile | Weekly Retention |
|--------|------|------------|------------------|
| **Diamond** | 💎 | Top 1% | Top 50% stay |
| **Platinum** | 🏆 | Top 5% | Top 50% stay |
| **Gold** | 🥇 | Top 15% | Top 50% stay |
| **Silver** | 🥈 | Top 35% | Top 50% stay |
| **Bronze** | 🥉 | Top 60% | Top 50% stay |
| **Iron** | ⚔️ | Everyone else | Everyone promoted if active |

**Promotion Rules:**
- Top 10 in each league promote to next level
- Bottom 10 demote to previous level
- Middle maintains current league

**League Rewards:**
```javascript
const leagueRewards = {
  diamond: { xpMultiplier: 1.5, badge: 'diamond_league', exclusiveExercises: true },
  platinum: { xpMultiplier: 1.3, badge: 'platinum_league' },
  gold: { xpMultiplier: 1.2, badge: 'gold_league' },
  silver: { xpMultiplier: 1.1, badge: 'silver_league' },
  bronze: { xpMultiplier: 1.05, badge: 'bronze_league' },
  iron: { xpMultiplier: 1.0, badge: null },
};
```

---

## Seasonal Championships

### Quarterly Competitions

Every 3 months, a themed championship runs for 4 weeks:

| Season | Theme | Focus Metric |
|--------|-------|--------------|
| **Q1: New Year Surge** | Fresh starts | Consistency streak |
| **Q2: Summer Shred** | Cutting season | Volume + cardio |
| **Q3: Strength Fall** | Powerlifting | PR count |
| **Q4: Winter Warrior** | Mental toughness | Training despite cold |

### Championship Rewards

```javascript
const championshipRewards = {
  1st: { badge: 'season_champion', profileFrame: 'gold', xpBonus: 5000 },
  2nd: { badge: 'season_runner_up', profileFrame: 'silver', xpBonus: 3000 },
  3rd: { badge: 'season_bronze', profileFrame: 'bronze', xpBonus: 2000 },
  top10: { badge: 'season_elite', xpBonus: 1000 },
  top100: { badge: 'season_competitor', xpBonus: 500 },
  participated: { badge: 'season_participant', xpBonus: 100 },
};
```

---

## Team Competitions: Gym Crews

### Create or Join a Crew

Users can form teams of 5-20 members.

```javascript
const crew = {
  name: "Iron Warriors",
  members: 12,
  totalGymScore: 9847,  // Sum of all member scores
  avgGymScore: 820,     // Average per member
  streak: 45,           // Crew streak (someone works out each day)
  rank: 23,             // Global crew ranking
};
```

### Crew Leaderboards

```
🛡️ CREW RANKINGS - Global

 #   Crew Name           Members   Avg Score   Streak
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1   Pump Palace         18        923         67
 2   Iron Warriors       12        820         45    ⭐ YOUR CREW
 3   Sweat Society       15        812         34
```

### Crew Challenges

Weekly crew vs. crew challenges:

```javascript
const crewChallenge = {
  challenger: "Iron Warriors",
  opponent: "Pump Palace",
  metric: "total_volume",
  duration: "7 days",
  stakes: {
    winner: { xpBonus: 500, badge: 'challenge_victor' },
    loser: { xpBonus: 100 },
  },
};
```

---

## Daily & Weekly Challenges

### Daily Challenges (Rotating)

| Day | Challenge | Points |
|-----|-----------|--------|
| Monday | "Motivation Monday" - Complete any workout | 25 |
| Tuesday | "Two-fer Tuesday" - 2 exercises to failure | 30 |
| Wednesday | "Volume Wednesday" - 20+ total sets | 35 |
| Thursday | "Tempo Thursday" - 3-second negatives | 30 |
| Friday | "PR Friday" - Attempt 1 PR | 40 |
| Saturday | "Superset Saturday" - 3 supersets | 35 |
| Sunday | "Active Recovery" - Mobility/stretching | 25 |

### Weekly Challenges

```javascript
const weeklyChallenge = {
  name: "Push-Up Warrior",
  description: "Complete 500 total push-ups this week",
  progress: 347,
  target: 500,
  reward: { xp: 200, badge: 'pushup_warrior' },
  expiresIn: "3 days",
};
```

---

## Gamification Elements

### XP System

Every action earns XP toward overall level:

| Action | XP |
|--------|-----|
| Complete workout | 100 |
| Personal record | 50 |
| Daily challenge | 25-40 |
| Weekly challenge | 100-200 |
| Streak day | 10 × streak_length |
| Achievement unlocked | varies |

### Level Progression

```
Level = floor(sqrt(totalXP / 100))

Level 1:   0 XP
Level 10:  10,000 XP
Level 25:  62,500 XP
Level 50:  250,000 XP
Level 100: 1,000,000 XP
```

### Achievement Integration

New leaderboard-specific achievements:

```javascript
const leaderboardAchievements = [
  { key: 'first_podium', name: 'Podium Finish', desc: 'Finish top 3 in any leaderboard', points: 50 },
  { key: 'league_promotion', name: 'Moving Up', desc: 'Get promoted to a higher league', points: 30 },
  { key: 'diamond_league', name: 'Diamond Dog', desc: 'Reach Diamond league', points: 200 },
  { key: 'crew_champion', name: 'Team Player', desc: 'Win a crew challenge', points: 75 },
  { key: 'season_champion', name: 'Season Champion', desc: 'Win a seasonal championship', points: 500 },
  { key: 'perfect_week', name: 'Perfect Week', desc: 'Score 900+ GymScore in a week', points: 100 },
  { key: 'consistency_king', name: 'Consistency King', desc: '52-week streak', points: 1000 },
];
```

---

## Privacy & Social Features

### Privacy Controls

```javascript
const privacySettings = {
  profileVisibility: 'friends_only',  // 'public' | 'friends_only' | 'private'
  showOnLeaderboards: true,
  showRealName: false,  // Use display name
  showWorkoutDetails: false,  // Hide specific exercises
  allowCrewInvites: true,
  showStreak: true,
  showLevel: true,
};
```

### Social Features

| Feature | Description |
|---------|-------------|
| **High Fives** | Quick kudos for PR or streak |
| **Challenges** | 1v1 weekly competitions |
| **Follow** | See friends' achievements |
| **Crew Chat** | Team communication |
| **Workout Sharing** | Share completed sessions |

---

## Technical Implementation

### Database Schema Additions

```prisma
model UserScore {
  id                String   @id @default(uuid())
  userId            String   @map("user_id")

  // Weekly Scores
  weekStart         DateTime @map("week_start")
  dedicationScore   Int      @default(0) @map("dedication_score")
  effortScore       Int      @default(0) @map("effort_score")
  progressScore     Int      @default(0) @map("progress_score")
  balanceScore      Int      @default(0) @map("balance_score")
  totalGymScore     Int      @default(0) @map("total_gym_score")

  // Cumulative
  totalXP           Int      @default(0) @map("total_xp")
  currentLevel      Int      @default(1) @map("current_level")
  currentLeague     League   @default(IRON) @map("current_league")
  currentStreak     Int      @default(0) @map("current_streak")
  longestStreak     Int      @default(0) @map("longest_streak")

  // PRs this week
  prsThisWeek       Int      @default(0) @map("prs_this_week")

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id])

  @@unique([userId, weekStart])
  @@index([totalGymScore])
  @@index([currentLeague])
  @@map("user_scores")
}

model Crew {
  id              String   @id @default(uuid())
  name            String   @unique
  description     String?
  avatarUrl       String?  @map("avatar_url")
  createdById     String   @map("created_by_id")
  isPublic        Boolean  @default(true) @map("is_public")
  maxMembers      Int      @default(20) @map("max_members")

  totalScore      Int      @default(0) @map("total_score")
  avgScore        Int      @default(0) @map("avg_score")
  crewStreak      Int      @default(0) @map("crew_streak")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  members         CrewMember[]
  challenges      CrewChallenge[]

  @@map("crews")
}

model CrewMember {
  id        String   @id @default(uuid())
  crewId    String   @map("crew_id")
  userId    String   @map("user_id")
  role      CrewRole @default(MEMBER)
  joinedAt  DateTime @default(now()) @map("joined_at")

  crew      Crew     @relation(fields: [crewId], references: [id])

  @@unique([crewId, userId])
  @@map("crew_members")
}

model PersonalRecord {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  exerciseId    String       @map("exercise_id")
  recordType    PRType       @map("record_type")
  value         Float        // Weight, reps, or volume
  previousValue Float?       @map("previous_value")
  achievedAt    DateTime     @default(now()) @map("achieved_at")

  user          User         @relation(fields: [userId], references: [id])
  exercise      Exercise     @relation(fields: [exerciseId], references: [id])

  @@index([userId, exerciseId])
  @@map("personal_records")
}

enum League {
  IRON
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}

enum CrewRole {
  OWNER
  ADMIN
  MEMBER
}

enum PRType {
  WEIGHT
  REPS
  VOLUME
  DURATION
}
```

### API Endpoints

```
# Leaderboards
GET  /api/v1/leaderboard/overall          # Overall GymRank
GET  /api/v1/leaderboard/dedication       # Dedication pillar
GET  /api/v1/leaderboard/effort           # Effort pillar
GET  /api/v1/leaderboard/progress         # Progress pillar
GET  /api/v1/leaderboard/balance          # Balance pillar
GET  /api/v1/leaderboard/cohort           # User's cohort ranking
GET  /api/v1/leaderboard/exercise/:slug   # Exercise-specific

# User Scores
GET  /api/v1/scores/me                    # Current user's scores
GET  /api/v1/scores/me/history            # Weekly score history
GET  /api/v1/scores/breakdown             # Detailed score breakdown

# Leagues
GET  /api/v1/leagues/current              # Current league standings
GET  /api/v1/leagues/history              # League history

# Crews
POST /api/v1/crews                        # Create crew
GET  /api/v1/crews/:id                    # Get crew details
POST /api/v1/crews/:id/join               # Join crew
POST /api/v1/crews/:id/challenge          # Issue challenge
GET  /api/v1/crews/leaderboard            # Crew rankings

# Challenges
GET  /api/v1/challenges/daily             # Today's challenge
GET  /api/v1/challenges/weekly            # This week's challenges
POST /api/v1/challenges/:id/complete      # Mark challenge done

# PRs
GET  /api/v1/prs                          # User's personal records
GET  /api/v1/prs/recent                   # Recent PRs
```

### Score Calculation Service

```typescript
// services/score-calculator.service.ts

export class ScoreCalculatorService {

  async calculateWeeklyScore(userId: string, weekStart: Date): Promise<GymScore> {
    const [dedication, effort, progress, balance] = await Promise.all([
      this.calculateDedicationScore(userId, weekStart),
      this.calculateEffortScore(userId, weekStart),
      this.calculateProgressScore(userId, weekStart),
      this.calculateBalanceScore(userId, weekStart),
    ]);

    return {
      dedication,
      effort,
      progress,
      balance,
      total: dedication + effort + progress + balance,
    };
  }

  private async calculateDedicationScore(userId: string, weekStart: Date): Promise<number> {
    const prefs = await this.getUserPreferences(userId);
    const workouts = await this.getWeeklyWorkouts(userId, weekStart);

    const completionRate = workouts.completed / prefs.workoutDaysPerWeek;
    const completionPoints = Math.min(completionRate * 150, 150);

    const streak = await this.getCurrentStreak(userId);
    const streakPoints = Math.min(streak * 5, 50);

    const adherenceRate = this.calculateScheduleAdherence(workouts, prefs);
    const adherencePoints = adherenceRate * 30;

    const timingPoints = this.calculateTimingConsistency(workouts, prefs) * 20;

    return Math.round(completionPoints + streakPoints + adherencePoints + timingPoints);
  }

  private async calculateEffortScore(userId: string, weekStart: Date): Promise<number> {
    const workouts = await this.getWeeklyWorkoutsWithSets(userId, weekStart);
    const baseline = await this.getUserVolumeBaseline(userId);

    let rpeWeightedVolume = 0;
    let totalTargetSets = 0;
    let completedSets = 0;
    let overloadAttempts = 0;

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        totalTargetSets += exercise.targetSets;

        for (const set of exercise.logs) {
          completedSets++;
          const rpeMultiplier = 0.5 + (set.rpe / 20);
          rpeWeightedVolume += set.weight * set.reps * rpeMultiplier;

          if (this.isOverloadAttempt(set, exercise.previousBest)) {
            overloadAttempts++;
          }
        }
      }
    }

    const volumePoints = Math.min((rpeWeightedVolume / baseline) * 120, 120);
    const durationPoints = this.calculateDurationPoints(workouts);
    const completionPoints = (completedSets / totalTargetSets) * 50;
    const overloadPoints = Math.min(overloadAttempts * 10, 30);

    return Math.round(volumePoints + durationPoints + completionPoints + overloadPoints);
  }

  // ... additional methods
}
```

---

## UI/UX Design Guidelines

### Design Principles (Apple-Inspired)

1. **Clarity** - Clean, readable leaderboards with clear hierarchy
2. **Deference** - Content first, chrome second
3. **Depth** - Subtle shadows and layers to show rank
4. **Motion** - Smooth animations for rank changes

### Key Screens

1. **Leaderboard Hub** - Overview of all rankings
2. **Detailed Leaderboard** - Full ranking with filters
3. **Score Breakdown** - How your score is calculated
4. **League View** - Current league and standings
5. **Crew Dashboard** - Team stats and challenges
6. **Profile Stats** - Personal records and history

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│  📊 GYMRANK                    ⚙️   │
├─────────────────────────────────────┤
│                                     │
│     YOUR GYMSCORE                   │
│        ┌─────────┐                  │
│        │   823   │  ↑ +67           │
│        └─────────┘                  │
│     #89 in your cohort              │
│                                     │
│  ┌─────┬─────┬─────┬─────┐          │
│  │ 172 │ 234 │ 198 │ 219 │          │
│  │  D  │  E  │  P  │  B  │          │
│  └─────┴─────┴─────┴─────┘          │
│                                     │
├─────────────────────────────────────┤
│  🏆 LEADERBOARDS                    │
│                                     │
│  ┌─────────────────────────┐        │
│  │ Overall    #89  →       │        │
│  └─────────────────────────┘        │
│  ┌─────────────────────────┐        │
│  │ Dedication #45  →       │        │
│  └─────────────────────────┘        │
│  ┌─────────────────────────┐        │
│  │ My Cohort  #12  →       │        │
│  └─────────────────────────┘        │
│                                     │
├─────────────────────────────────────┤
│  🛡️ CREW: Iron Warriors            │
│  Rank #23 • 12 members • 45 streak  │
└─────────────────────────────────────┘
```

---

## Success Metrics

### Primary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Weekly Active Engagement** | +40% | Users checking leaderboards weekly |
| **Workout Completion Rate** | +25% | Scheduled vs. completed workouts |
| **Average Session Length** | +15% | Time spent in app |
| **7-Day Retention** | +30% | Users returning after first week |
| **30-Day Retention** | +20% | Users active after first month |

### Secondary KPIs

| Metric | Target |
|--------|--------|
| Crew membership rate | 30% of users |
| Challenge completion rate | 60% |
| PR attempts per week | 2+ per user |
| Social interactions (high fives) | 5+ per user/week |

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Database schema updates
- [ ] Score calculation service
- [ ] Basic leaderboard API
- [ ] Personal score dashboard

### Phase 2: Leaderboards (Weeks 4-6)
- [ ] Overall GymRank leaderboard
- [ ] Pillar-specific leaderboards
- [ ] Cohort system
- [ ] Exercise-specific rankings

### Phase 3: Leagues (Weeks 7-8)
- [ ] Weekly league system
- [ ] Promotion/demotion logic
- [ ] League UI and notifications

### Phase 4: Social (Weeks 9-11)
- [ ] Crew creation and management
- [ ] Crew leaderboards
- [ ] Crew challenges
- [ ] High fives and follows

### Phase 5: Challenges (Weeks 12-13)
- [ ] Daily challenge system
- [ ] Weekly challenges
- [ ] Seasonal championships

### Phase 6: Polish (Weeks 14-16)
- [ ] Animation and transitions
- [ ] Push notifications
- [ ] Achievement integration
- [ ] Performance optimization

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gaming/Cheating | PR validation, anti-gaming measures, community reporting |
| Discouraging beginners | Cohort system, personal progress focus |
| Overtraining for points | Recovery score, rest day bonuses |
| Privacy concerns | Granular privacy controls, opt-in defaults |
| Server load | Caching, batch score calculations |

---

## Conclusion

GymRank transforms fitness competition from "who's the strongest" to "who's improving the most." By measuring effort, consistency, and personal growth rather than absolute performance, we create an inclusive system where every user - from complete beginners to elite athletes - can compete meaningfully and stay motivated.

The key insight from Apple's design philosophy: **people don't want to compete with others as much as they want to become better versions of themselves.** GymRank provides both paths while never making users feel inadequate compared to genetic outliers.

---

*"The iron never lies. Neither does the leaderboard."*
