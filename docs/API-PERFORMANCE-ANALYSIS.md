# API Performance Analysis: Weekly Plan Endpoint

## Overview

This document analyzes the performance of the `GET /api/v1/suggestions/weekly-plan` endpoint, which currently has response times of **~4000ms**. The analysis identifies bottlenecks and provides optimization recommendations.

---

## Request Flow

```
GET /api/v1/suggestions/weekly-plan
│
├── Auth Middleware ──────────────────────────── JWT validation (~5ms)
│
├── Route Handler (suggestion.routes.ts:105)
│   │
│   └── suggestionService.generateWeeklyPlan(userId)
│       │
│       ├── getUserContext(userId) ───────────── DB: user + profile + prefs + health (~20ms)
│       │
│       ├── Determine workout split (PPL, Upper/Lower, etc.)
│       │
│       └── FOR EACH workout day (2-7 days):
│           │
│           ├── getExercisesForMuscles(userId, muscles, limit)
│           │   │
│           │   ├── getUserContext(userId) ───── DB Query (~20ms) ❌ REDUNDANT
│           │   │
│           │   ├── embeddingService.searchSimilarExercises(query)
│           │   │   │
│           │   │   ├── generateEmbedding(query) ── Gemini/OpenAI API (~600ms) 🐌
│           │   │   │
│           │   │   ├── Vector similarity search ── DB: pgvector query (~30ms)
│           │   │   │
│           │   │   └── Fetch exercise details ──── DB: exercise findMany (~25ms)
│           │   │
│           │   └── scoreExercise() loop ───────── CPU processing (~15ms)
│           │
│           └── Build day plan with selected exercises
│
└── Return weekly plan JSON
```

---

## Latency Breakdown

For a **6-day PPL (Push/Pull/Legs) split**:

| Component | Calls | Time/Call | Total Time | % of Total |
|-----------|-------|-----------|------------|------------|
| **Embedding API (Gemini)** | 6 | ~600ms | **3,600ms** | **90%** |
| User context queries | 7 | ~20ms | 140ms | 3.5% |
| Vector similarity queries | 6 | ~30ms | 180ms | 4.5% |
| Exercise detail queries | 6 | ~25ms | 150ms | 3.8% |
| Scoring/filtering | 6 | ~15ms | 90ms | 2.2% |
| **TOTAL** | | | **~4,160ms** | 100% |

---

## Root Cause Analysis

### Primary Bottleneck: Embedding API Latency (90% of total time)

**Location:** `apps/api/src/services/embedding.service.ts:109-126`

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  if (this.provider === 'gemini' && this.gemini) {
    const model = this.gemini.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);  // 500-600ms per call
    return result.embedding.values;
  }
  // ... OpenAI path similar
}
```

**Why it's slow:**
- Gemini free tier has high latency (500-2000ms per request)
- No caching - same queries generate fresh embeddings every time
- Called sequentially for each workout day (6 calls for PPL)

**Example queries being embedded:**
- `"chest and triceps exercises for weight loss"`
- `"back and biceps exercises for weight loss"`
- `"legs and core exercises for weight loss"`

---

## Secondary Issues

### 1. N+1 Query Pattern - Redundant getUserContext() Calls

**Location:** `apps/api/src/services/suggestion.service.ts`

```typescript
// Line 556 - Called once at start
const context = await this.getUserContext(userId);

// Line 474 - Called AGAIN inside getExercisesForMuscles (per day)
async getExercisesForMuscles(userId: string, ...): Promise<ScoredExercise[]> {
  const context = await this.getUserContext(userId);  // REDUNDANT!
}
```

**Impact:** 7 database queries instead of 1 (~120ms wasted)

---

### 2. Sequential Day Processing

**Location:** `apps/api/src/services/suggestion.service.ts:572-607`

```typescript
for (let i = 0; i < splitConfig.days.length; i++) {
  // Each iteration WAITS for previous to complete
  const scoredExercises = await this.getExercisesForMuscles(...);
}
```

**Impact:** Days could be processed in parallel with `Promise.all()`

---

### 3. No Vector Search Index

**Location:** Database schema - `exercises.embedding` column

The pgvector similarity search is doing a **sequential scan** of all exercises instead of using an indexed search.

```sql
-- Current: O(n) sequential scan
SELECT ... FROM exercises e
WHERE 1 - (e.embedding::vector <=> query::vector) > threshold
ORDER BY e.embedding::vector <=> query::vector
```

**Impact:** ~30ms per query, could be <5ms with IVFFLAT/HNSW index

---

### 4. Two-Step Exercise Fetch

**Location:** `apps/api/src/services/embedding.service.ts:191-227`

```typescript
// Step 1: Vector search returns only IDs + similarity
const results = await prisma.$queryRawUnsafe(...);

// Step 2: Separate query to get full exercise details
const exercises = await prisma.exercise.findMany({
  where: { id: { in: exerciseIds } }
});
```

**Impact:** Extra database round-trip (~25ms per call)

---

## Optimization Recommendations

### Priority 1: Embedding Cache (High Impact)

**Estimated Savings:** 50-80% of embedding time

```typescript
// Add in-memory or Redis cache
const embeddingCache = new Map<string, number[]>();

async generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = text.toLowerCase().trim();

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const embedding = await this.callEmbeddingAPI(text);
  embeddingCache.set(cacheKey, embedding);
  return embedding;
}
```

**Why it works:** Most queries are repetitive:
- "chest exercises for weight loss" (used for all push days)
- "back exercises for muscle gain" (used for all pull days)

---

### Priority 2: Parallelize Day Processing (Medium Impact)

**Estimated Savings:** 30-40% if not API rate-limited

```typescript
// Before (sequential)
for (const dayConfig of splitConfig.days) {
  const exercises = await this.getExercisesForMuscles(...);
  days.push({ ...dayConfig, exercises });
}

// After (parallel)
const dayPromises = splitConfig.days.map(dayConfig =>
  this.getExercisesForMuscles(userId, dayConfig.focusMuscles, limit)
    .then(exercises => ({ ...dayConfig, exercises }))
);
const days = await Promise.all(dayPromises);
```

---

### Priority 3: Pass Context Through Functions (Low Impact, Easy Win)

**Estimated Savings:** ~120ms

```typescript
// Before
async getExercisesForMuscles(userId: string, ...): Promise<ScoredExercise[]> {
  const context = await this.getUserContext(userId);  // Fetches again
}

// After
async getExercisesForMuscles(
  context: UserContext,  // Pass it in
  muscles: string[],
  limit: number
): Promise<ScoredExercise[]> {
  // Use context directly - no extra query
}
```

---

### Priority 4: Add Vector Search Index (Low Impact, One-Time Setup)

**Estimated Savings:** ~150ms (30ms × 5 queries)

```sql
-- Add IVFFLAT index for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS exercises_embedding_idx
ON exercises
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Or HNSW for better accuracy (PostgreSQL 15+)
CREATE INDEX IF NOT EXISTS exercises_embedding_hnsw_idx
ON exercises
USING hnsw (embedding vector_cosine_ops);
```

---

### Priority 5: Single-Query Exercise Fetch (Low Impact)

**Estimated Savings:** ~150ms (25ms × 6 queries)

```sql
-- Combine vector search with full data fetch
SELECT
  e.id, e.name, e.slug, e.description, e.category,
  e.primary_muscles, e.difficulty_level, e.equipment_required,
  1 - (e.embedding::vector <=> $1::vector) as similarity
FROM exercises e
WHERE e.is_active = true
  AND e.embedding IS NOT NULL
  AND 1 - (e.embedding::vector <=> $1::vector) > $2
ORDER BY e.embedding::vector <=> $1::vector
LIMIT $3
```

---

## Implementation Roadmap

| Phase | Optimization | Effort | Impact | New Response Time |
|-------|--------------|--------|--------|-------------------|
| 1 | Embedding cache | 2 hours | High | ~1500ms |
| 2 | Parallel processing | 1 hour | Medium | ~1000ms |
| 3 | Pass context | 30 min | Low | ~880ms |
| 4 | Vector index | 15 min | Low | ~730ms |
| 5 | Single-query fetch | 1 hour | Low | ~580ms |

**Target:** Reduce from **4000ms → ~500-600ms** (85% improvement)

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/services/embedding.service.ts` | Add embedding cache |
| `apps/api/src/services/suggestion.service.ts` | Parallelize, pass context |
| `apps/api/prisma/migrations/` | Add vector index migration |

---

## Monitoring

After optimization, monitor:
- P50/P95/P99 latency for `/suggestions/weekly-plan`
- Embedding cache hit rate
- Database query times via Prisma logging
- External API call durations

---

## Appendix: Code Locations

```
apps/api/src/
├── routes/
│   └── suggestion.routes.ts      # Line 105-120: Route handler
├── services/
│   ├── suggestion.service.ts     # Line 555-616: generateWeeklyPlan
│   │                             # Line 469-550: getExercisesForMuscles
│   │                             # Line 73-108: getUserContext
│   └── embedding.service.ts      # Line 109-126: generateEmbedding
│                                 # Line 159-241: searchSimilarExercises
└── prisma/
    └── schema.prisma             # Exercise model with embedding field
```
