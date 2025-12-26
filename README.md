# AI Gym Suite

AI-powered fitness application with smart workout recommendations, personalized training plans, and progress tracking. Built with Node.js, Express, TypeScript, and Supabase.

## Features

- **Smart Onboarding**: 6-phase questionnaire that builds a complete fitness profile
- **AI Workout Generation**: Personalized daily workouts based on goals, experience, and equipment
- **Exercise Database**: 30+ exercises with detailed instructions, form cues, and alternatives
- **Progress Tracking**: Track workouts, strength gains, body measurements, and streaks
- **AI Coaching**: Get personalized tips, weekly summaries, and performance analysis (via Claude API)
- **Achievement System**: Gamification with badges and milestones

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **AI**: Anthropic Claude API for intelligent coaching
- **Authentication**: JWT-based auth

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Generate Prisma client
npm run db:generate

# Push database schema to Supabase
npm run db:push

# Seed the database with exercises
npm run db:seed

# Start development server
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/onboarding/status` | Get onboarding status |
| GET | `/api/v1/onboarding/questions` | Get all questions |
| POST | `/api/v1/onboarding/responses` | Submit responses |
| POST | `/api/v1/onboarding/complete` | Complete onboarding |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/workouts/today` | Get today's AI-generated workout |
| POST | `/api/v1/workouts/generate` | Generate new workout |
| GET | `/api/v1/workouts` | List workout history |
| POST | `/api/v1/workouts/:id/start` | Start workout session |
| POST | `/api/v1/workouts/:id/complete` | Complete workout |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/exercises` | List all exercises |
| GET | `/api/v1/exercises/:id` | Get exercise details |
| GET | `/api/v1/exercises/:id/coaching` | Get AI coaching tips |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/progress/dashboard` | Dashboard stats |
| GET | `/api/v1/progress/weekly-summary` | AI weekly summary |
| GET | `/api/v1/progress/strength` | Strength progression |
| POST | `/api/v1/progress/body` | Log body measurement |

## Project Structure

```
ai-gym-suite/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeding
│   └── data/                  # Seed data
├── src/
│   ├── config/                # Configuration
│   ├── lib/                   # Prisma & Supabase clients
│   ├── middleware/            # Auth, error handling
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── ai.service.ts
│   │   ├── auth.service.ts
│   │   ├── onboarding.service.ts
│   │   └── workout-generator.service.ts
│   └── index.ts               # App entry point
└── docs/
    └── ARCHITECTURE.md        # Detailed architecture
```

## Onboarding Phases

1. **Basic Profile**: Name, age, gender, height, weight, target weight
2. **Goals & Motivation**: Primary goal, secondary goal, motivations
3. **Fitness Assessment**: Activity level, experience, baseline tests (push-ups, plank)
4. **Logistics**: Workout location, equipment, days per week, session duration
5. **Health & Limitations**: Injuries, chronic conditions, special considerations
6. **Personalization**: Exercise preferences, rest periods, reminders

## Workout Generation

The AI generates personalized workouts based on:

- **Training Split**: PPL, Upper/Lower, or Full Body based on days/week
- **Exercise Selection**: Matches target muscles, available equipment, skill level
- **Rep Ranges**: Adjusted for goals (strength: 3-6, hypertrophy: 8-12, endurance: 15-20)
- **Progressive Overload**: Tracks performance and suggests weight increases
- **Injury Prevention**: Filters exercises based on user's health profile

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-32-character-secret-key

# AI (optional - enables smart coaching)
ANTHROPIC_API_KEY=your-anthropic-key
```

## License

MIT
