/**
 * Embedding Service
 *
 * Provides semantic search capabilities for exercises using OpenAI embeddings and pgvector.
 * This service generates embeddings from text and performs similarity searches.
 */

import OpenAI from 'openai';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

// OpenAI embedding configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Default similarity threshold (0.0 - 1.0, higher = more similar)
const DEFAULT_SIMILARITY_THRESHOLD = 0.6;
const DEFAULT_MATCH_COUNT = 10;

interface SimilarExercise {
  id: string;
  name: string;
  slug: string;
  similarity: number;
}

interface ExerciseSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  primaryMuscles: string[];
  difficultyLevel: number;
  equipmentRequired: string[];
  similarity: number;
}

export class EmbeddingService {
  private openai: OpenAI | null = null;

  constructor() {
    if (config.ai.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
  }

  /**
   * Check if the embedding service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate embedding for a text string
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch operation)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }

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
        equipment?: string[];
      };
    } = {}
  ): Promise<ExerciseSearchResult[]> {
    const {
      threshold = DEFAULT_SIMILARITY_THRESHOLD,
      limit = DEFAULT_MATCH_COUNT,
      filters,
    } = options;

    if (!this.openai) {
      // Fallback to text-based search if no OpenAI
      return this.fallbackTextSearch(query, limit, filters);
    }

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Use raw SQL for vector similarity search
    const results = await prisma.$queryRaw<SimilarExercise[]>`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> ${queryEmbedding}::vector(${EMBEDDING_DIMENSIONS})) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.embedding IS NOT NULL
        AND array_length(e.embedding, 1) = ${EMBEDDING_DIMENSIONS}
        AND 1 - (e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> ${queryEmbedding}::vector(${EMBEDDING_DIMENSIONS})) > ${threshold}
      ORDER BY e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> ${queryEmbedding}::vector(${EMBEDDING_DIMENSIONS})
      LIMIT ${limit}
    `;

    if (results.length === 0) {
      return [];
    }

    // Fetch full exercise details
    const exerciseIds = results.map((r) => r.id);
    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        ...(filters?.category && { category: filters.category as any }),
        ...(filters?.maxDifficulty && { difficultyLevel: { lte: filters.maxDifficulty } }),
        ...(filters?.location === 'home' && { homeCompatibility: { gte: 0.6 } }),
        ...(filters?.location === 'gym' && { gymCompatibility: { gte: 0.6 } }),
        ...(filters?.location === 'outdoor' && { outdoorCompatibility: { gte: 0.6 } }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        primaryMuscles: true,
        difficultyLevel: true,
        equipmentRequired: true,
      },
    });

    // Create a map for quick lookup
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    // Combine with similarity scores
    return results
      .filter((r) => exerciseMap.has(r.id))
      .map((r) => ({
        ...exerciseMap.get(r.id)!,
        similarity: Number(r.similarity),
      }));
  }

  /**
   * Find exercises similar to a given exercise
   */
  async findSimilarToExercise(
    exerciseId: string,
    limit: number = 5
  ): Promise<ExerciseSearchResult[]> {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { embedding: true, name: true },
    });

    if (!exercise || !exercise.embedding || exercise.embedding.length === 0) {
      // Fallback: find exercises with same movement pattern or muscles
      return this.fallbackSimilarExercise(exerciseId, limit);
    }

    const results = await prisma.$queryRaw<SimilarExercise[]>`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> ${exercise.embedding}::vector(${EMBEDDING_DIMENSIONS})) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.id != ${exerciseId}
        AND e.embedding IS NOT NULL
        AND array_length(e.embedding, 1) = ${EMBEDDING_DIMENSIONS}
      ORDER BY e.embedding::vector(${EMBEDDING_DIMENSIONS}) <=> ${exercise.embedding}::vector(${EMBEDDING_DIMENSIONS})
      LIMIT ${limit}
    `;

    if (results.length === 0) {
      return [];
    }

    const exerciseIds = results.map((r) => r.id);
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        primaryMuscles: true,
        difficultyLevel: true,
        equipmentRequired: true,
      },
    });

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    return results
      .filter((r) => exerciseMap.has(r.id))
      .map((r) => ({
        ...exerciseMap.get(r.id)!,
        similarity: Number(r.similarity),
      }));
  }

  /**
   * Search exercises for a specific goal and user profile
   */
  async searchForUserGoal(
    goal: string,
    userProfile: {
      fitnessLevel?: string;
      experienceLevel?: string;
      location?: string;
      equipment?: string[];
    },
    limit: number = 20
  ): Promise<ExerciseSearchResult[]> {
    // Build a semantic search query from the goal and profile
    const queryParts = [goal];

    if (userProfile.fitnessLevel) {
      queryParts.push(`suitable for ${userProfile.fitnessLevel} fitness level`);
    }
    if (userProfile.experienceLevel) {
      queryParts.push(`${userProfile.experienceLevel} experience`);
    }
    if (userProfile.location) {
      queryParts.push(`can do at ${userProfile.location}`);
    }
    if (userProfile.equipment && userProfile.equipment.length > 0) {
      queryParts.push(`using ${userProfile.equipment.join(' or ')}`);
    }

    const query = queryParts.join(', ');

    return this.searchSimilarExercises(query, {
      limit,
      threshold: 0.5, // Lower threshold for broader results
      filters: {
        location: userProfile.location as 'home' | 'gym' | 'outdoor' | undefined,
      },
    });
  }

  /**
   * Get exercise recommendations based on multiple criteria
   */
  async getRecommendations(criteria: {
    targetMuscles?: string[];
    goals?: string[];
    difficulty?: number;
    location?: string;
    equipment?: string[];
    excludeExerciseIds?: string[];
    limit?: number;
  }): Promise<ExerciseSearchResult[]> {
    const {
      targetMuscles = [],
      goals = [],
      difficulty,
      location,
      equipment = [],
      excludeExerciseIds = [],
      limit = 10,
    } = criteria;

    // Build semantic query
    const queryParts: string[] = [];

    if (targetMuscles.length > 0) {
      queryParts.push(`exercises for ${targetMuscles.join(' and ')}`);
    }
    if (goals.length > 0) {
      queryParts.push(`good for ${goals.join(' and ')}`);
    }
    if (difficulty) {
      const difficultyLabel = difficulty <= 2 ? 'beginner' : difficulty <= 3 ? 'intermediate' : 'advanced';
      queryParts.push(`${difficultyLabel} level`);
    }
    if (location) {
      queryParts.push(`suitable for ${location}`);
    }
    if (equipment.length > 0) {
      queryParts.push(`using ${equipment.join(' or ')}`);
    }

    const query = queryParts.length > 0 ? queryParts.join(', ') : 'effective exercise';

    const results = await this.searchSimilarExercises(query, {
      limit: limit + excludeExerciseIds.length, // Get extra to account for exclusions
      threshold: 0.4,
      filters: {
        maxDifficulty: difficulty,
        location: location as 'home' | 'gym' | 'outdoor' | undefined,
      },
    });

    // Filter out excluded exercises
    return results
      .filter((r) => !excludeExerciseIds.includes(r.id))
      .slice(0, limit);
  }

  // ==================== FALLBACK METHODS ====================

  /**
   * Fallback text-based search when OpenAI is not available
   */
  private async fallbackTextSearch(
    query: string,
    limit: number,
    filters?: {
      category?: string;
      maxDifficulty?: number;
      location?: 'home' | 'gym' | 'outdoor';
    }
  ): Promise<ExerciseSearchResult[]> {
    const words = query.toLowerCase().split(/\s+/);

    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        AND: [
          ...(filters?.category ? [{ category: filters.category as any }] : []),
          ...(filters?.maxDifficulty ? [{ difficultyLevel: { lte: filters.maxDifficulty } }] : []),
          ...(filters?.location === 'home' ? [{ homeCompatibility: { gte: 0.6 } }] : []),
          ...(filters?.location === 'gym' ? [{ gymCompatibility: { gte: 0.6 } }] : []),
          ...(filters?.location === 'outdoor' ? [{ outdoorCompatibility: { gte: 0.6 } }] : []),
        ],
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { searchText: { contains: query, mode: 'insensitive' } },
          { primaryMuscles: { hasSome: words } },
          { tags: { hasSome: words } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        primaryMuscles: true,
        difficultyLevel: true,
        equipmentRequired: true,
      },
    });

    return exercises.map((e) => ({
      ...e,
      similarity: 0.5, // Default similarity for text search
    }));
  }

  /**
   * Fallback to find similar exercises without embeddings
   */
  private async fallbackSimilarExercise(
    exerciseId: string,
    limit: number
  ): Promise<ExerciseSearchResult[]> {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        movementPattern: true,
        primaryMuscles: true,
        category: true,
        difficultyLevel: true,
      },
    });

    if (!exercise) {
      return [];
    }

    const similar = await prisma.exercise.findMany({
      where: {
        id: { not: exerciseId },
        isActive: true,
        OR: [
          { movementPattern: exercise.movementPattern },
          { primaryMuscles: { hasSome: exercise.primaryMuscles } },
        ],
      },
      take: limit,
      orderBy: [
        { movementPattern: 'asc' },
        { difficultyLevel: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        primaryMuscles: true,
        difficultyLevel: true,
        equipmentRequired: true,
      },
    });

    return similar.map((e) => ({
      ...e,
      similarity: 0.6,
    }));
  }
}

export const embeddingService = new EmbeddingService();
