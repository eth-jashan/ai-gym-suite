/**
 * Embedding Generation Script
 *
 * Generates vector embeddings for all exercises using Gemini (default, free) or OpenAI.
 * These embeddings enable semantic search for exercise recommendations.
 *
 * Usage:
 *   npm run generate:embeddings                    # Use default provider (Gemini)
 *   npm run generate:embeddings -- --provider=gemini
 *   npm run generate:embeddings -- --provider=openai
 *   npm run generate:embeddings -- --force        # Regenerate all embeddings
 *
 * Environment Variables:
 *   GEMINI_API_KEY   - Google AI API key (free tier available)
 *   OPENAI_API_KEY   - OpenAI API key (paid)
 *   EMBEDDING_PROVIDER - Default provider: 'gemini' or 'openai'
 *
 * Get free Gemini API key: https://aistudio.google.com/app/apikey
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Provider configurations
const PROVIDERS = {
  gemini: {
    model: 'text-embedding-004',
    dimensions: 768,
    batchSize: 100, // Gemini supports batching
    delayMs: 100,   // Minimal delay needed
  },
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    batchSize: 100,
    delayMs: 500,
  },
} as const;

type ProviderType = keyof typeof PROVIDERS;

interface EmbeddingResult {
  exerciseId: string;
  slug: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// EMBEDDING CLIENTS
// ============================================================================

class GeminiEmbedder {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = PROVIDERS.gemini.model;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({ model: this.model });

    // Gemini's batchEmbedContents for multiple texts
    const result = await model.batchEmbedContents({
      requests: texts.map((text) => ({
        content: { parts: [{ text }], role: 'user' },
      })),
    });

    return result.embeddings.map((e) => e.values);
  }

  async embedSingle(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: this.model });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}

class OpenAIEmbedder {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.model = PROVIDERS.openai.model;
    this.dimensions = PROVIDERS.openai.dimensions;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }

  async embedSingle(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });
    return response.data[0].embedding;
  }
}

type Embedder = GeminiEmbedder | OpenAIEmbedder;

// ============================================================================
// HELPERS
// ============================================================================

function getProvider(): ProviderType {
  // Check command line args first
  const providerArg = process.argv.find((arg) => arg.startsWith('--provider='));
  if (providerArg) {
    const provider = providerArg.split('=')[1] as ProviderType;
    if (provider in PROVIDERS) {
      return provider;
    }
  }

  // Fall back to environment variable
  const envProvider = process.env.EMBEDDING_PROVIDER as ProviderType;
  if (envProvider && envProvider in PROVIDERS) {
    return envProvider;
  }

  // Default to Gemini (free)
  return 'gemini';
}

function createEmbedder(provider: ProviderType): Embedder {
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY environment variable is not set');
      console.log('\nTo get a FREE Gemini API key:');
      console.log('  1. Go to https://aistudio.google.com/app/apikey');
      console.log('  2. Sign in with Google account');
      console.log('  3. Create an API key');
      console.log('  4. Add to your .env file: GEMINI_API_KEY=your-key-here');
      process.exit(1);
    }
    return new GeminiEmbedder(apiKey);
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is not set');
      console.log('\nTo set up:');
      console.log('  1. Get an API key from https://platform.openai.com/api-keys');
      console.log('  2. Add to your .env file: OPENAI_API_KEY=sk-...');
      console.log('\nOr use Gemini (free): npm run generate:embeddings -- --provider=gemini');
      process.exit(1);
    }
    return new OpenAIEmbedder(apiKey);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function getExercisesNeedingEmbeddings(
  forceAll: boolean,
  dimensions: number
): Promise<{ id: string; slug: string; searchText: string }[]> {
  if (forceAll) {
    return prisma.exercise.findMany({
      where: { searchText: { not: null } },
      select: { id: true, slug: true, searchText: true },
    }) as Promise<{ id: string; slug: string; searchText: string }[]>;
  }

  // Only get exercises without embeddings or with wrong dimensions
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
    select: { id: true, slug: true, searchText: true },
  }) as Promise<{ id: string; slug: string; searchText: string }[]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN
// ============================================================================

async function generateEmbeddings() {
  const forceAll = process.argv.includes('--force');
  const provider = getProvider();
  const config = PROVIDERS[provider];

  console.log('='.repeat(60));
  console.log('Exercise Embedding Generation');
  console.log('='.repeat(60));
  console.log();
  console.log(`Provider: ${provider.toUpperCase()}`);
  console.log(`Model: ${config.model}`);
  console.log(`Dimensions: ${config.dimensions}`);
  console.log(`Mode: ${forceAll ? 'Force regenerate all' : 'Only missing embeddings'}`);
  console.log();

  // Create embedder
  const embedder = createEmbedder(provider);
  console.log(`✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} client initialized\n`);

  // Get exercises
  console.log('Fetching exercises...');
  const exercises = await getExercisesNeedingEmbeddings(forceAll, config.dimensions);

  if (exercises.length === 0) {
    console.log('✅ All exercises already have embeddings!');
    console.log('   Use --force flag to regenerate all embeddings.');
    return;
  }

  console.log(`Found ${exercises.length} exercises needing embeddings\n`);

  // Process in batches
  const results: EmbeddingResult[] = [];
  const totalBatches = Math.ceil(exercises.length / config.batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * config.batchSize;
    const end = Math.min(start + config.batchSize, exercises.length);
    const batch = exercises.slice(start, end);

    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} exercises)...`);

    try {
      const texts = batch.map((e) => e.searchText);
      const embeddings = await embedder.embedBatch(texts);

      // Update each exercise
      for (let i = 0; i < batch.length; i++) {
        const exercise = batch[i];
        try {
          await prisma.exercise.update({
            where: { id: exercise.id },
            data: { embedding: embeddings[i] },
          });
          results.push({ exerciseId: exercise.id, slug: exercise.slug, success: true });
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

      if (batchIndex < totalBatches - 1) {
        await sleep(config.delayMs);
      }
    } catch (err) {
      console.error(`  ❌ Batch ${batchIndex + 1} failed: ${(err as Error).message}`);
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

  // Database stats
  const exercisesWithEmbeddings = await prisma.exercise.count({
    where: { NOT: { embedding: { equals: [] } } },
  });
  const totalExercises = await prisma.exercise.count();

  console.log();
  console.log(`Exercises with embeddings: ${exercisesWithEmbeddings}/${totalExercises}`);
  console.log(`Embedding dimensions: ${config.dimensions}`);
  console.log();
  console.log('Next step: Run "npm run db:setup-vector" to create the similarity index');
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
