# AI Gym Suite

AI-powered fitness application with smart workout recommendations, personalized training plans, and progress tracking.

## Monorepo Structure

```
ai-gym-suite/
├── apps/
│   ├── api/          # Express.js backend API
│   └── web/          # Next.js frontend app
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

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase account)
- Anthropic API key (optional, for AI features)

### Installation

```bash
# Install all dependencies
npm install

# Set up API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your credentials

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed the database
npm run db:seed

# Start both apps in development
npm run dev
```

### Running Individually

```bash
# API only (runs on http://localhost:3001)
npm run dev:api

# Web only (runs on http://localhost:3000)
npm run dev:web
```

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
