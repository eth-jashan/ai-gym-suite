# pgvector Semantic Search Implementation Guide

This document details how semantic search was implemented for exercise recommendations in AI Gym Suite using embeddings (Gemini or OpenAI) and PostgreSQL's pgvector extension.

## Overview

The system enables natural language search for exercises. Instead of keyword matching, users can search with queries like "exercises for building chest muscles at home" and get semantically relevant results.

## Embedding Providers

| Provider | Model | Dimensions | Cost | Best For |
|----------|-------|------------|------|----------|
| **Gemini** (default) | text-embedding-004 | 768 | **FREE** | Development, production |
| OpenAI | text-embedding-3-small | 1536 | ~$0.02/1M tokens | Higher precision needs |

**Recommendation:** Use Gemini - it's free and provides excellent quality for semantic search.

## Architecture

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
│   Gemini: text-embedding-004 (768 dims) - FREE                  │
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
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    exercises table                        │  │
│   │  ┌─────────┬──────────┬─────────────────────────────┐    │  │
│   │  │   id    │   name   │         embedding           │    │  │
│   │  ├─────────┼──────────┼─────────────────────────────┤    │  │
│   │  │  uuid1  │ Bench... │ [0.021, -0.039, 0.091, ...] │    │  │
│   │  │  uuid2  │ Push-up  │ [0.019, -0.043, 0.085, ...] │    │  │
│   │  │  uuid3  │ Dumbbell │ [0.025, -0.037, 0.089, ...] │    │  │
│   │  └─────────┴──────────┴─────────────────────────────┘    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   Cosine Similarity: 1 - (query <=> exercise_embedding)         │
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

## Implementation Steps

### Step 1: Schema Setup (Prisma)

The Prisma schema was configured to support pgvector:

**File: `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector", schema: "public")]
}

model Exercise {
  // ... other fields ...

  // Vector Embedding for Semantic Search
  embedding    Float[]  @default([])
  searchText   String?  @map("search_text") @db.Text

  // ... rest of model ...
}
```

**Key Points:**
- `previewFeatures = ["postgresqlExtensions"]` enables Prisma extension support
- `extensions = [pgvector(...)]` declares the pgvector extension
- `embedding Float[]` stores the vector as a float array
- `searchText` stores the text that was embedded (for debugging/regeneration)

### Step 2: Search Text Generation

Each exercise gets a `searchText` field that combines all searchable attributes:

**File: `apps/api/scripts/import-exercises.ts`**

```typescript
function generateSearchText(exercise: RawExercise): string {
  const parts = [
    exercise.name,
    exercise.description,
    exercise.category,
    exercise.movementPattern,
    exercise.exerciseType,
    ...(exercise.primaryMuscles || []),
    ...(exercise.secondaryMuscles || []),
    ...(exercise.tags || []),
    ...(exercise.suitableGoals || []),
    ...(exercise.equipmentRequired || []),
    ...(exercise.suitableLocations || []),
    `difficulty level ${exercise.difficultyLevel}`,
    exercise.isBeginnerFriendly ? 'beginner friendly' : 'advanced',
    ...(exercise.formCues || []),
  ];

  return parts.filter(Boolean).join(' | ');
}
```

**Example Output:**
```
Bench Press | Lie on a flat bench and press the barbell upward... |
STRENGTH | HORIZONTAL_PUSH | COMPOUND | chest | pectoralis major |
triceps | anterior deltoids | barbell | bench | gym | strength |
muscle gain | difficulty level 3 | intermediate
```

### Step 3: Embedding Generation Script

**File: `apps/api/scripts/generate-embeddings.ts`**

The script supports both Gemini (free, default) and OpenAI providers:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Provider configurations
const PROVIDERS = {
  gemini: {
    model: 'text-embedding-004',
    dimensions: 768,
    batchSize: 100,
  },
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    batchSize: 100,
  },
};

// Gemini embedder (FREE)
class GeminiEmbedder {
  async embedBatch(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.batchEmbedContents({
      requests: texts.map((text) => ({
        content: { parts: [{ text }], role: 'user' },
      })),
    });
    return result.embeddings.map((e) => e.values);
  }
}
```

**Why Gemini (default)?**
- **FREE** - No cost for embeddings
- 768 dimensions (efficient storage)
- Fast inference
- High quality for semantic similarity
- Generous rate limits

**Batch Processing:**
- Process 100 exercises per API call
- Add delay between batches to avoid rate limits
- Store embeddings in PostgreSQL Float[] column

### Step 4: pgvector Setup Script

**File: `apps/api/scripts/setup-pgvector.ts`**

```typescript
// Enable pgvector extension
await prisma.$executeRawUnsafe(`
  CREATE EXTENSION IF NOT EXISTS vector;
`);

// Create IVFFlat index for fast similarity search
await prisma.$executeRawUnsafe(`
  CREATE INDEX IF NOT EXISTS exercises_embedding_idx
  ON exercises
  USING ivfflat ((embedding::vector(1536)) vector_cosine_ops)
  WITH (lists = 20);
`);

// Create helper function for similarity search
await prisma.$executeRawUnsafe(`
  CREATE OR REPLACE FUNCTION search_exercises_by_embedding(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
  )
  RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    similarity float
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      e.id,
      e.name,
      e.slug,
      1 - (e.embedding::vector(1536) <=> query_embedding) as similarity
    FROM exercises e
    WHERE e.is_active = true
      AND 1 - (e.embedding::vector(1536) <=> query_embedding) > match_threshold
    ORDER BY e.embedding::vector(1536) <=> query_embedding
    LIMIT match_count;
  END;
  $$;
`);
```

**Index Choice - IVFFlat:**
- IVFFlat (Inverted File Flat) is fast for approximate nearest neighbor search
- `lists = 20` creates 20 clusters (rule of thumb: sqrt(n) where n = row count)
- `vector_cosine_ops` uses cosine distance (ideal for text embeddings)

**Distance Operators:**
- `<=>` - Cosine distance (we use this)
- `<->` - Euclidean distance (L2)
- `<#>` - Inner product

### Step 5: Embedding Service

**File: `apps/api/src/services/embedding.service.ts`**

```typescript
export class EmbeddingService {
  private openai: OpenAI | null = null;

  /**
   * Search for similar exercises using semantic search
   */
  async searchSimilarExercises(
    query: string,
    options: {
      threshold?: number;
      limit?: number;
      filters?: {
        category?: string;
        maxDifficulty?: number;
        location?: 'home' | 'gym' | 'outdoor';
      };
    } = {}
  ): Promise<ExerciseSearchResult[]> {
    // 1. Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // 2. Use raw SQL for vector similarity search
    const results = await prisma.$queryRaw<SimilarExercise[]>`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector(1536) <=> ${queryEmbedding}::vector(1536)) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.embedding IS NOT NULL
        AND array_length(e.embedding, 1) = 1536
        AND 1 - (e.embedding::vector(1536) <=> ${queryEmbedding}::vector(1536)) > ${threshold}
      ORDER BY e.embedding::vector(1536) <=> ${queryEmbedding}::vector(1536)
      LIMIT ${limit}
    `;

    // 3. Fetch full exercise details and apply additional filters
    // ...
  }
}
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `searchSimilarExercises()` | Natural language search |
| `findSimilarToExercise()` | Find alternatives to a specific exercise |
| `searchForUserGoal()` | Goal-based recommendations with user profile |
| `getRecommendations()` | Multi-criteria recommendations |

### Step 6: Fallback for No OpenAI

When OpenAI API key is not configured, the service falls back to text-based search:

```typescript
private async fallbackTextSearch(
  query: string,
  limit: number
): Promise<ExerciseSearchResult[]> {
  const words = query.toLowerCase().split(/\s+/);

  return prisma.exercise.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { searchText: { contains: query, mode: 'insensitive' } },
        { primaryMuscles: { hasSome: words } },
        { tags: { hasSome: words } },
      ],
    },
    take: limit,
  });
}
```

## Usage

### Setup Commands

```bash
# 1. Push schema changes to database
npm run db:push

# 2. Import exercises (generates searchText)
npm run import:exercises

# 3. Generate embeddings (Gemini is FREE and default)
# Get free API key: https://aistudio.google.com/app/apikey
npm run generate:embeddings

# Or specify provider explicitly:
npm run generate:embeddings -- --provider=gemini   # FREE (default)
npm run generate:embeddings -- --provider=openai   # Paid

# 4. Set up pgvector extension and indexes
npm run db:setup-vector
```

### Environment Variables

```bash
# .env file
GEMINI_API_KEY=your-gemini-key    # FREE - Get from https://aistudio.google.com/app/apikey
OPENAI_API_KEY=sk-...              # Optional, paid alternative
EMBEDDING_PROVIDER=gemini          # 'gemini' (default) or 'openai'
```

### Using the Service

```typescript
import { embeddingService } from './services/embedding.service';

// Natural language search
const results = await embeddingService.searchSimilarExercises(
  'chest exercises I can do at home without equipment',
  {
    threshold: 0.6,
    limit: 10,
    filters: { location: 'home' }
  }
);

// Find similar exercises
const alternatives = await embeddingService.findSimilarToExercise(
  exerciseId,
  5
);

// Goal-based recommendations
const recommendations = await embeddingService.searchForUserGoal(
  'build muscle',
  {
    fitnessLevel: 'intermediate',
    location: 'gym',
    equipment: ['barbell', 'dumbbells']
  }
);
```

## How Similarity Works

### Cosine Similarity

Embeddings are high-dimensional vectors. Cosine similarity measures the angle between two vectors:

```
similarity = 1 - cosine_distance
           = 1 - (A · B) / (||A|| × ||B||)
```

- **1.0** = Identical meaning
- **0.7+** = Very similar
- **0.5-0.7** = Somewhat related
- **<0.5** = Different topics

### Example

Query: "exercises for building chest"

| Exercise | Similarity | Why? |
|----------|------------|------|
| Bench Press | 0.89 | Direct chest builder |
| Push-up | 0.85 | Bodyweight chest exercise |
| Cable Fly | 0.82 | Chest isolation |
| Bicep Curl | 0.31 | Different muscle group |

## Performance Considerations

### Index Tuning

For ~400 exercises:
```sql
CREATE INDEX ... WITH (lists = 20);
```

For larger datasets:
```sql
-- 10,000 exercises
CREATE INDEX ... WITH (lists = 100);

-- 100,000 exercises
CREATE INDEX ... WITH (lists = 316);
```

### Query Performance

| Operation | Without Index | With IVFFlat Index |
|-----------|--------------|-------------------|
| Similarity search (400 rows) | ~50ms | ~5ms |
| Similarity search (10k rows) | ~500ms | ~15ms |

### Cost Estimation

**Gemini (Recommended):**
- **FREE** - No cost for embeddings
- Generous rate limits (1500 requests/minute)
- 400 exercises: $0.00

**OpenAI (Alternative):**
- ~$0.02 per 1M tokens
- Average exercise searchText: ~100 tokens
- 400 exercises: ~40,000 tokens = ~$0.0008

## Files Created/Modified

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Added pgvector extension and embedding fields |
| `scripts/import-exercises.ts` | Generates searchText during import |
| `scripts/generate-embeddings.ts` | Generates OpenAI embeddings |
| `scripts/setup-pgvector.ts` | Sets up vector extension and indexes |
| `src/services/embedding.service.ts` | Semantic search service |
| `src/config/index.ts` | Added VECTOR_DIMENSIONS config |
| `package.json` | Added npm scripts |

## Next Steps

1. **Build Suggestion Service** - Use embeddings to suggest exercises based on user profile
2. **Create API Endpoints** - Expose search functionality via REST API
3. **Implement Weekly Plan Generator** - Combine embeddings with workout split logic
4. **Add User Feedback Loop** - Track which suggestions users accept/reject
