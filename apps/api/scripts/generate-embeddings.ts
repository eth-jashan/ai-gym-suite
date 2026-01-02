/**
 * Embedding Generation Script
 *
 * Generates vector embeddings for all exercises using OpenAI's text-embedding-3-small model.
 * These embeddings enable semantic search for exercise recommendations.
 *
 * Usage:
 *   npm run generate:embeddings
 *   npm run generate:embeddings -- --force  # Regenerate all, even if already exists
 *
 * Prerequisites:
 *   - OPENAI_API_KEY environment variable must be set
 *   - Exercises must be imported first (npm run import:exercises)
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// OpenAI embedding model - 1536 dimensions, good balance of quality and cost
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Batch size for API calls (OpenAI supports up to 2048 inputs per request)
const BATCH_SIZE = 100;

// Rate limiting - avoid hitting OpenAI rate limits
const DELAY_BETWEEN_BATCHES_MS = 500;

interface EmbeddingResult {
  exerciseId: string;
  slug: string;
  success: boolean;
  error?: string;
}

async function createOpenAIClient(): Promise<OpenAI> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.log('\nTo set up:');
    console.log('  1. Get an API key from https://platform.openai.com/api-keys');
    console.log('  2. Add to your .env file: OPENAI_API_KEY=sk-...');
    process.exit(1);
  }

  return new OpenAI({ apiKey });
}

async function generateEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

async function generateEmbeddingsBatch(
  openai: OpenAI,
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  // Sort by index to ensure correct ordering
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function getExercisesNeedingEmbeddings(forceAll: boolean): Promise<
  { id: string; slug: string; searchText: string }[]
> {
  if (forceAll) {
    // Get all exercises with searchText
    return prisma.exercise.findMany({
      where: {
        searchText: { not: null },
      },
      select: {
        id: true,
        slug: true,
        searchText: true,
      },
    }) as Promise<{ id: string; slug: string; searchText: string }[]>;
  }

  // Only get exercises without embeddings
  return prisma.exercise.findMany({
    where: {
      AND: [
        { searchText: { not: null } },
        {
          OR: [
            { embedding: { equals: [] } },
            { embedding: { isEmpty: true } },
          ],
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      searchText: true,
    },
  }) as Promise<{ id: string; slug: string; searchText: string }[]>;
}

async function updateExerciseEmbedding(
  exerciseId: string,
  embedding: number[]
): Promise<void> {
  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { embedding },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateEmbeddings() {
  const forceAll = process.argv.includes('--force');

  console.log('='.repeat(60));
  console.log('Exercise Embedding Generation');
  console.log('='.repeat(60));
  console.log();
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log(`Dimensions: ${EMBEDDING_DIMENSIONS}`);
  console.log(`Mode: ${forceAll ? 'Force regenerate all' : 'Only missing embeddings'}`);
  console.log();

  // Initialize OpenAI client
  const openai = await createOpenAIClient();
  console.log('✅ OpenAI client initialized\n');

  // Get exercises needing embeddings
  console.log('Fetching exercises...');
  const exercises = await getExercisesNeedingEmbeddings(forceAll);

  if (exercises.length === 0) {
    console.log('✅ All exercises already have embeddings!');
    console.log('   Use --force flag to regenerate all embeddings.');
    return;
  }

  console.log(`Found ${exercises.length} exercises needing embeddings\n`);

  // Process in batches
  const results: EmbeddingResult[] = [];
  const totalBatches = Math.ceil(exercises.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, exercises.length);
    const batch = exercises.slice(start, end);

    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} exercises)...`);

    try {
      // Generate embeddings for the batch
      const texts = batch.map((e) => e.searchText);
      const embeddings = await generateEmbeddingsBatch(openai, texts);

      // Update each exercise with its embedding
      for (let i = 0; i < batch.length; i++) {
        const exercise = batch[i];
        try {
          await updateExerciseEmbedding(exercise.id, embeddings[i]);
          results.push({
            exerciseId: exercise.id,
            slug: exercise.slug,
            success: true,
          });
        } catch (err) {
          results.push({
            exerciseId: exercise.id,
            slug: exercise.slug,
            success: false,
            error: (err as Error).message,
          });
        }
      }

      console.log(`  ✅ Batch ${batchIndex + 1} complete`);

      // Rate limiting delay between batches
      if (batchIndex < totalBatches - 1) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (err) {
      console.error(`  ❌ Batch ${batchIndex + 1} failed: ${(err as Error).message}`);

      // Mark all exercises in batch as failed
      for (const exercise of batch) {
        results.push({
          exerciseId: exercise.id,
          slug: exercise.slug,
          success: false,
          error: (err as Error).message,
        });
      }
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('Embedding Generation Complete!');
  console.log('='.repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`  ✅ Successful: ${successful.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed exercises:');
    for (const result of failed.slice(0, 10)) {
      console.log(`  - ${result.slug}: ${result.error}`);
    }
    if (failed.length > 10) {
      console.log(`  ... and ${failed.length - 10} more`);
    }
  }

  // Verify embeddings in database
  const exercisesWithEmbeddings = await prisma.exercise.count({
    where: {
      NOT: {
        embedding: { equals: [] },
      },
    },
  });

  const totalExercises = await prisma.exercise.count();

  console.log();
  console.log(`Exercises with embeddings: ${exercisesWithEmbeddings}/${totalExercises}`);
}

async function main() {
  try {
    await generateEmbeddings();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
