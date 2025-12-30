# AI Gym Suite

AI-powered fitness application with smart workout recommendations, personalized training plans, and progress tracking.

## Monorepo Structure

```
ai-gym-suite/
├── apps/
│   ├── api/          # Express.js backend API
│   ├── web/          # Next.js frontend app
│   └── mobile/       # Expo React Native app
├── docs/             # Architecture documentation
└── package.json      # Root workspace config
```

## Features

- **Smart Onboarding**: 6-phase questionnaire that builds a complete fitness profile
- **AI Workout Generation**: Personalized daily workouts based on goals, experience, and equipment
- **Exercise Database**: 30+ exercises with detailed instructions, form cues, and alternatives
- **Progress Tracking**: Track workouts, strength gains, body measurements, and streaks
- **AI Coaching**: Get personalized tips, weekly summaries, and performance analysis (via Claude API)
- **Achievement System**: Gamification with badges and milestones

## Tech Stack

| App | Stack |
|-----|-------|
| **API** | Node.js, Express.js, TypeScript, Prisma, PostgreSQL (Supabase) |
| **Web** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand |
| **Mobile** | Expo SDK 52, React Native, TypeScript, NativeWind, Expo Router, Zustand |

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Anthropic API key (optional, for AI coaching features)

---

## Supabase Database Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Enter a project name (e.g., `ai-gym-suite`)
4. Set a strong **database password** (save this!)
5. Choose a region close to you
6. Click **"Create new project"** and wait for setup

### Step 2: Get Your Connection String

1. In your Supabase dashboard, go to **Project Settings** → **Database**
2. Click **"Connect"** button
3. Select **"Connection String"** tab → **"URI"**
4. **Important**: Change Method from "Direct connection" to **"Transaction"** or **"Session"** pooler
   - Direct connection (port 5432) is NOT IPv4 compatible
   - Session Pooler (port **6543**) works on all networks
5. Copy the connection string

Your connection string should look like:
```
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

### Step 3: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy these keys:
   - **Project URL** → `SUPABASE_URL`
   - **Publishable key** (anon) → `SUPABASE_ANON_KEY`
   - **Secret key** (service_role) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Installation

### Step 1: Clone and Install

```bash
git clone <repo-url>
cd ai-gym-suite

# Install all dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your Supabase credentials:

```env
# Supabase
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-key"

# Database - USE PORT 6543 (Session Pooler)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# JWT Secret (generate a random 32+ character string)
JWT_SECRET="your-super-secret-key-min-32-chars"

# Optional: AI Features
ANTHROPIC_API_KEY=""
```

### Step 3: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Seed with exercises and onboarding questions
npm run db:seed
```

### Step 4: Run the Apps

```bash
# Start both API and Web in development mode
npm run dev
```

- **API**: http://localhost:3001
- **Web**: http://localhost:3000

---

## Troubleshooting

### Error: Can't reach database server at port 5432

**Cause**: Direct connection is not IPv4 compatible.

**Fix**: Use Session Pooler with port **6543**:
```env
DATABASE_URL="postgresql://postgres.XXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
```

### Error: Password contains brackets

**Cause**: Don't include `[` `]` around your password.

**Fix**:
```env
# Wrong
DATABASE_URL="postgresql://postgres:[MyPassword]@..."

# Correct
DATABASE_URL="postgresql://postgres:MyPassword@..."
```

### Error: Module not found (seed.ts)

**Fix**: Make sure you have the latest code:
```bash
git pull
npm install
npm run db:seed
```

---

### Running Individually

```bash
# API only (runs on http://localhost:3001)
npm run dev:api

# Web only (runs on http://localhost:3000)
npm run dev:web

# Mobile only (starts Expo development server)
npm run dev:mobile
```

---

## Mobile App

The mobile app is built with Expo SDK 52 and React Native, featuring file-based routing with Expo Router and NativeWind for Tailwind CSS styling.

### Mobile Features

- **Authentication**: Welcome screen, login, registration, password reset
- **Home Dashboard**: Today's workout, quick stats, recent activity
- **Workouts**: AI-generated workout library with filtering by status
- **Exercise Library**: Searchable database with muscle group filters
- **Progress Tracking**: Stats, achievements, weekly activity calendar
- **Profile**: Settings, preferences, theme toggle
- **Onboarding**: Goal selection, fitness level, schedule preferences
- **Active Workout**: Timer, exercise progression, haptic feedback

### Mobile Tech Stack

- **Expo SDK 52** - Latest React Native platform
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **React Native Reanimated** - Smooth animations
- **Zustand** - State management (shared patterns with web)
- **Expo SecureStore** - Secure token storage
- **Expo Haptics** - Touch feedback

### Mobile Development

```bash
# Start Expo development server
npm run dev:mobile

# Run on iOS Simulator
npm run mobile:ios

# Run on Android Emulator
npm run mobile:android

# Run in web browser
npm run mobile:web
```

### Mobile Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   │   ├── welcome.tsx    # Welcome/landing
│   │   ├── login.tsx      # Sign in
│   │   ├── register.tsx   # Sign up
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Home dashboard
│   │   ├── workouts.tsx   # Workout list
│   │   ├── exercises.tsx  # Exercise library
│   │   ├── progress.tsx   # Progress & achievements
│   │   └── profile.tsx    # Settings & profile
│   ├── onboarding/        # User onboarding
│   └── workout/[id].tsx   # Workout detail/session
├── src/
│   ├── components/        # React Native components
│   │   ├── ui/           # Button, Input, Card
│   │   └── workout/      # WorkoutCard, ExerciseCard
│   ├── stores/           # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── workout.store.ts
│   │   ├── exercise.store.ts
│   │   ├── progress.store.ts
│   │   └── theme.store.ts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # API client
│   ├── types/            # TypeScript types
│   ├── constants/        # App config
│   └── utils/            # Helper functions
├── app.json              # Expo config
├── tailwind.config.js    # NativeWind config
└── eas.json              # EAS Build config
```

### Building Mobile for Production

```bash
cd apps/mobile

# Install EAS CLI globally if not already
npm install -g eas-cli

# Development build (with dev client)
npm run build:dev

# Preview build (internal testing)
npm run build:preview

# Production build (App Store / Play Store)
npm run build:prod
```

### Mobile Environment Configuration

Configure the API URL in `apps/mobile/src/constants/config.ts`:

```typescript
export const API_URL = __DEV__
  ? 'http://localhost:3001/api/v1'  // Development
  : 'https://api.yourdomain.com/api/v1';  // Production
```

**Note for physical devices**: Replace `localhost` with your computer's local IP address.

## App Screenshots Flow

### 1. Landing Page
- Welcome hero with features overview
- Sign up / Sign in buttons

### 2. Authentication
- Email/password registration and login
- JWT-based session management

### 3. Onboarding Flow
- **Phase 1**: Basic profile (name, age, height, weight)
- **Phase 2**: Goals & motivation
- **Phase 3**: Fitness assessment (activity level, experience)
- **Phase 4**: Logistics (location, equipment, schedule)
- **Phase 5**: Health considerations (injuries, conditions)
- **Phase 6**: Personalization (preferences, reminders)

### 4. Dashboard
- Today's workout card
- Weekly stats (streak, workouts, volume)
- Quick links to exercises, history, progress

### 5. Workout Session
- Exercise list with sets/reps targets
- Set logging with weight and rep tracking
- Rest timer between sets
- Workout completion summary

### 6. Exercise Library
- Searchable exercise database
- Filter by muscle group
- Detailed exercise pages with form cues

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get current user |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/onboarding/questions` | Get all questions |
| POST | `/api/v1/onboarding/responses` | Submit responses |
| POST | `/api/v1/onboarding/complete` | Complete onboarding |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/workouts/today` | Get today's workout |
| POST | `/api/v1/workouts/:id/start` | Start workout |
| POST | `/api/v1/workouts/:wid/exercises/:eid/log` | Log a set |
| POST | `/api/v1/workouts/:id/complete` | Complete workout |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/exercises` | List exercises |
| GET | `/api/v1/exercises/:id` | Get exercise details |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/progress/dashboard` | Dashboard stats |
| GET | `/api/v1/progress/streaks` | Streak info |

## Environment Variables (API)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-32-character-secret-key

# AI (optional)
ANTHROPIC_API_KEY=your-anthropic-key
```

## Development

```bash
# Run both apps
npm run dev

# Build all apps
npm run build

# Open Prisma Studio
npm run db:studio
```

## License

MIT
