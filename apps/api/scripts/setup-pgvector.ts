/**
 * pgvector Setup Script
 *
 * Sets up the pgvector extension and creates necessary indexes for semantic search.
 * This script should be run once after initial database setup.
 *
 * Usage:
 *   npm run db:setup-vector
 *
 * What it does:
 *   1. Ensures pgvector extension is enabled
 *   2. Creates IVFFlat index on exercise embeddings for fast similarity search
 *   3. Creates a similarity search function for easy querying
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const EMBEDDING_DIMENSIONS = 1536;

// Number of lists for IVFFlat index (rule of thumb: sqrt(n) where n is number of rows)
// For ~400 exercises, 20 lists is reasonable. Adjust as data grows.
const IVFFLAT_LISTS = 20;

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

    // Step 2: Check if embeddings exist
    console.log('2. Checking exercise embeddings...');
    const exercisesWithEmbeddings = await prisma.exercise.count({
      where: {
        NOT: {
          embedding: { equals: [] },
        },
      },
    });
    console.log(`   Found ${exercisesWithEmbeddings} exercises with embeddings\n`);

    if (exercisesWithEmbeddings === 0) {
      console.log('   ⚠️  No embeddings found. Run "npm run generate:embeddings" first.');
      console.log('   Skipping index creation (needs data to build index).\n');
    } else {
      // Step 3: Create IVFFlat index for similarity search
      console.log('3. Creating vector similarity index...');
      console.log(`   Using IVFFlat with ${IVFFLAT_LISTS} lists for ${exercisesWithEmbeddings} exercises`);

      // Drop existing index if any
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS exercises_embedding_idx;
      `);

      // Create IVFFlat index for cosine similarity
      // Note: Prisma stores Float[] as a regular array, so we need to cast to vector
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS exercises_embedding_idx
        ON exercises
        USING ivfflat ((embedding::vector(${EMBEDDING_DIMENSIONS})) vector_cosine_ops)
        WITH (lists = ${IVFFLAT_LISTS});
      `);
      console.log('   ✅ Vector index created\n');
    }

    // Step 4: Create similarity search function
    console.log('4. Creating similarity search function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION search_exercises_by_embedding(
        query_embedding vector(${EMBEDDING_DIMENSIONS}),
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
          1 - (e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> query_embedding) as similarity
        FROM exercises e
        WHERE e.is_active = true
          AND e.embedding IS NOT NULL
          AND array_length(e.embedding, 1) = ${EMBEDDING_DIMENSIONS}
          AND 1 - (e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> query_embedding) > match_threshold
        ORDER BY e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `);
    console.log('   ✅ Similarity search function created\n');

    // Step 5: Create search by text function (combines embedding generation and search)
    console.log('5. Creating text search function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION match_exercises_count()
      RETURNS int
      LANGUAGE sql
      AS $$
        SELECT COUNT(*)::int
        FROM exercises
        WHERE is_active = true
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) = ${EMBEDDING_DIMENSIONS};
      $$;
    `);
    console.log('   ✅ Match count function created\n');

    // Summary
    console.log('='.repeat(60));
    console.log('Setup Complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Available functions:');
    console.log('  - search_exercises_by_embedding(embedding, threshold, limit)');
    console.log('  - match_exercises_count()');
    console.log();
    console.log('Next steps:');
    if (exercisesWithEmbeddings === 0) {
      console.log('  1. Generate embeddings: npm run generate:embeddings');
      console.log('  2. Re-run this script to create the index: npm run db:setup-vector');
    } else {
      console.log('  ✅ Ready for semantic search!');
      console.log('  Use the EmbeddingService in your code for similarity search.');
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
