/**
 * Embedding Service
 *
 * Provides semantic search capabilities for exercises using Gemini (free) or OpenAI embeddings.
 * This service generates embeddings from text and performs similarity searches via pgvector.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

// Provider configurations
const PROVIDERS = {
  gemini: {
    model: 'text-embedding-004',
    dimensions: 768,
  },
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
} as const;

type ProviderType = keyof typeof PROVIDERS;

// Default search settings
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
  private gemini: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private provider: ProviderType;
  private dimensions: number;

  constructor() {
    // Determine provider based on config and available keys
    this.provider = this.determineProvider();
    this.dimensions = PROVIDERS[this.provider].dimensions;

    // Initialize the appropriate client
    if (this.provider === 'gemini' && config.ai.geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(config.ai.geminiApiKey);
    } else if (this.provider === 'openai' && config.ai.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
  }

  private determineProvider(): ProviderType {
    // Check configured provider
    const configuredProvider = config.embedding?.provider as ProviderType;

    if (configuredProvider === 'gemini' && config.ai.geminiApiKey) {
      return 'gemini';
    }
    if (configuredProvider === 'openai' && config.ai.openaiApiKey) {
      return 'openai';
    }

    // Fallback: use whichever key is available, prefer Gemini (free)
    if (config.ai.geminiApiKey) return 'gemini';
    if (config.ai.openaiApiKey) return 'openai';

    // Default to gemini even if no key (will use fallback search)
    return 'gemini';
  }

  /**
   * Check if the embedding service is available
   */
  isAvailable(): boolean {
    return this.gemini !== null || this.openai !== null;
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): { provider: string; dimensions: number; available: boolean } {
    return {
      provider: this.provider,
      dimensions: this.dimensions,
      available: this.isAvailable(),
    };
  }

  /**
   * Generate embedding for a text string
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.provider === 'gemini' && this.gemini) {
      const model = this.gemini.getGenerativeModel({ model: PROVIDERS.gemini.model });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.embeddings.create({
        model: PROVIDERS.openai.model,
        input: text,
        dimensions: PROVIDERS.openai.dimensions,
      });
      return response.data[0].embedding;
    }

    throw new Error('No embedding provider configured');
  }

  /**
   * Generate embeddings for multiple texts (batch operation)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (this.provider === 'gemini' && this.gemini) {
      const model = this.gemini.getGenerativeModel({ model: PROVIDERS.gemini.model });
      const result = await model.batchEmbedContents({
        requests: texts.map((text) => ({
          content: { parts: [{ text }], role: 'user' as const },
        })),
      });
      return result.embeddings.map((e) => e.values);
    }

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.embeddings.create({
        model: PROVIDERS.openai.model,
        input: texts,
        dimensions: PROVIDERS.openai.dimensions,
      });
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    }

    throw new Error('No embedding provider configured');
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

    if (!this.isAvailable()) {
      return this.fallbackTextSearch(query, limit, filters);
    }

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);
    const dims = this.dimensions;

    // Format embedding as PostgreSQL array literal
    const embeddingArray = `[${queryEmbedding.join(',')}]`;

    // Use raw SQL for vector similarity search
    // Use Prisma.sql for raw SQL parts that shouldn't be parameterized
    const results = await prisma.$queryRawUnsafe<SimilarExercise[]>(`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector <=> '${embeddingArray}'::vector) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.embedding IS NOT NULL
        AND array_length(e.embedding, 1) = ${dims}
        AND 1 - (e.embedding::vector <=> '${embeddingArray}'::vector) > ${threshold}
      ORDER BY e.embedding::vector <=> '${embeddingArray}'::vector
      LIMIT ${limit}
    `);

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

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

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
      return this.fallbackSimilarExercise(exerciseId, limit);
    }

    const dims = exercise.embedding.length;

    // Format embedding as PostgreSQL array literal
    const embeddingArray = `[${exercise.embedding.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<SimilarExercise[]>(`
      SELECT
        e.id,
        e.name,
        e.slug,
        1 - (e.embedding::vector <=> '${embeddingArray}'::vector) as similarity
      FROM exercises e
      WHERE e.is_active = true
        AND e.id != '${exerciseId}'
        AND e.embedding IS NOT NULL
        AND array_length(e.embedding, 1) = ${dims}
      ORDER BY e.embedding::vector <=> '${embeddingArray}'::vector
      LIMIT ${limit}
    `);

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
      threshold: 0.5,
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
      limit: limit + excludeExerciseIds.length,
      threshold: 0.4,
      filters: {
        maxDifficulty: difficulty,
        location: location as 'home' | 'gym' | 'outdoor' | undefined,
      },
    });

    return results
      .filter((r) => !excludeExerciseIds.includes(r.id))
      .slice(0, limit);
  }

  // ==================== FALLBACK METHODS ====================

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
      similarity: 0.5,
    }));
  }

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
