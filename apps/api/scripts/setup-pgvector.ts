/**
 * pgvector Setup Script
 *
 * Sets up the pgvector extension and creates necessary indexes for semantic search.
 * Automatically detects the embedding dimensions from existing data.
 *
 * Usage:
 *   npm run db:setup-vector
 *
 * What it does:
 *   1. Ensures pgvector extension is enabled
 *   2. Detects embedding dimensions (768 for Gemini, 1536 for OpenAI)
 *   3. Creates IVFFlat index on exercise embeddings for fast similarity search
 *   4. Creates helper SQL functions for similarity search
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Number of lists for IVFFlat index (rule of thumb: sqrt(n) where n is number of rows)
// For ~400 exercises, 20 lists is reasonable. Adjust as data grows.
const IVFFLAT_LISTS = 20;

async function detectEmbeddingDimensions(): Promise<number | null> {
  // Find an exercise with embeddings to detect dimensions
  const exercise = await prisma.exercise.findFirst({
    where: {
      NOT: {
        embedding: { equals: [] },
      },
    },
    select: { embedding: true },
  });

  if (exercise && exercise.embedding && exercise.embedding.length > 0) {
    return exercise.embedding.length;
  }

  return null;
}

async function setupPgVector() {
  console.log('='.repeat(60));
  console.log('pgvector Setup');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Enable pgvector extension
    console.log('1. Enabling pgvector extension...');
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS vector;
    `);
    console.log('   ✅ pgvector extension enabled\n');

    // Step 2: Check if embeddings exist and detect dimensions
    console.log('2. Checking exercise embeddings...');
    const exercisesWithEmbeddings = await prisma.exercise.count({
      where: {
        NOT: {
          embedding: { equals: [] },
        },
      },
    });

    const dimensions = await detectEmbeddingDimensions();

    console.log(`   Found ${exercisesWithEmbeddings} exercises with embeddings`);
    if (dimensions) {
      const provider = dimensions === 768 ? 'Gemini' : dimensions === 1536 ? 'OpenAI' : 'Unknown';
      console.log(`   Detected dimensions: ${dimensions} (${provider})\n`);
    } else {
      console.log('   No embeddings found yet\n');
    }

    if (exercisesWithEmbeddings === 0 || !dimensions) {
      console.log('   ⚠️  No embeddings found. Run "npm run generate:embeddings" first.');
      console.log('   Skipping index creation (needs data to build index).\n');
      console.log('   After generating embeddings, re-run this script.\n');
    } else {
      // Step 3: Create IVFFlat index for similarity search
      console.log('3. Creating vector similarity index...');
      console.log(`   Using IVFFlat with ${IVFFLAT_LISTS} lists for ${exercisesWithEmbeddings} exercises`);
      console.log(`   Vector dimensions: ${dimensions}`);

      // Drop existing index if any
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS exercises_embedding_idx;
      `);

      // Create IVFFlat index for cosine similarity
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS exercises_embedding_idx
        ON exercises
        USING ivfflat ((embedding::vector(${dimensions})) vector_cosine_ops)
        WITH (lists = ${IVFFLAT_LISTS});
      `);
      console.log('   ✅ Vector index created\n');

      // Step 4: Create similarity search function
      console.log('4. Creating similarity search function...');
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION search_exercises_by_embedding(
          query_embedding vector(${dimensions}),
          match_threshold float DEFAULT 0.6,
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
            1 - (e.embedding::vector(${dimensions}) <=> query_embedding) as similarity
          FROM exercises e
          WHERE e.is_active = true
            AND e.embedding IS NOT NULL
            AND array_length(e.embedding, 1) = ${dimensions}
            AND 1 - (e.embedding::vector(${dimensions}) <=> query_embedding) > match_threshold
          ORDER BY e.embedding::vector(${dimensions}) <=> query_embedding
          LIMIT match_count;
        END;
        $$;
      `);
      console.log('   ✅ Similarity search function created\n');

      // Step 5: Create match count function
      console.log('5. Creating helper functions...');
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION match_exercises_count()
        RETURNS int
        LANGUAGE sql
        AS $$
          SELECT COUNT(*)::int
          FROM exercises
          WHERE is_active = true
            AND embedding IS NOT NULL
            AND array_length(embedding, 1) = ${dimensions};
        $$;
      `);
      console.log('   ✅ Helper functions created\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('Setup Complete!');
    console.log('='.repeat(60));
    console.log();

    if (dimensions) {
      console.log('Configuration:');
      console.log(`  - Embedding dimensions: ${dimensions}`);
      console.log(`  - Provider: ${dimensions === 768 ? 'Gemini (free)' : dimensions === 1536 ? 'OpenAI' : 'Custom'}`);
      console.log(`  - Index type: IVFFlat with ${IVFFLAT_LISTS} lists`);
      console.log();
      console.log('Available SQL functions:');
      console.log('  - search_exercises_by_embedding(embedding, threshold, limit)');
      console.log('  - match_exercises_count()');
      console.log();
      console.log('✅ Ready for semantic search!');
      console.log('   Use the EmbeddingService in your code for similarity search.');
    } else {
      console.log('Next steps:');
      console.log('  1. Get a free Gemini API key: https://aistudio.google.com/app/apikey');
      console.log('  2. Add to .env: GEMINI_API_KEY=your-key-here');
      console.log('  3. Generate embeddings: npm run generate:embeddings');
      console.log('  4. Re-run this script: npm run db:setup-vector');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupPgVector();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
