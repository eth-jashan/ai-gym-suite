import { Router, Request, Response } from 'express';
import { suggestionService } from '../services/suggestion.service.js';
import { embeddingService } from '../services/embedding.service.js';
import { authenticate } from '../middleware/auth.js';

export const suggestionRouter = Router();

// All routes require authentication
suggestionRouter.use(authenticate);

/**
 * GET /suggestions/status
 * Get embedding service status and user readiness
 */
suggestionRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const context = await suggestionService.getUserContext(userId);
    const embeddingInfo = embeddingService.getProviderInfo();

    res.json({
      embedding: embeddingInfo,
      user: {
        hasProfile: !!context.profile,
        hasPreferences: !!context.preferences,
        hasHealth: !!context.health,
        ready: !!(context.profile && context.preferences),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /suggestions/exercises
 * Get exercise suggestions for specific muscles
 * Query params: muscles (comma-separated), limit
 */
suggestionRouter.get('/exercises', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const muscles = (req.query.muscles as string)?.split(',').map((m) => m.trim()) || ['chest'];
    const limit = parseInt(req.query.limit as string) || 10;

    const exercises = await suggestionService.getExercisesForMuscles(userId, muscles, limit);

    res.json({
      muscles,
      count: exercises.length,
      exercises,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get exercise suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /suggestions/search
 * Semantic search for exercises based on natural language query
 */
suggestionRouter.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10, threshold = 0.5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!embeddingService.isAvailable()) {
      return res.status(503).json({
        error: 'Semantic search unavailable',
        message: 'Embedding provider not configured. Set GEMINI_API_KEY or OPENAI_API_KEY.',
      });
    }

    const results = await embeddingService.searchSimilarExercises(query, {
      limit,
      threshold,
    });

    res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /suggestions/weekly-plan
 * Generate a personalized weekly workout plan
 */
suggestionRouter.get('/weekly-plan', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const plan = await suggestionService.generateWeeklyPlan(userId);

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate weekly plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /suggestions/weekly-plan
 * Generate and save a weekly workout plan
 */
suggestionRouter.post('/weekly-plan', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Generate plan
    const plan = await suggestionService.generateWeeklyPlan(userId);

    // Save to database
    const planId = await suggestionService.saveWeeklyPlan(userId, plan);

    res.json({
      success: true,
      planId,
      plan,
      message: 'Weekly plan created and workouts scheduled',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create weekly plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /suggestions/similar/:exerciseId
 * Find exercises similar to a given exercise
 */
suggestionRouter.get('/similar/:exerciseId', async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const similar = await embeddingService.findSimilarToExercise(exerciseId, limit);

    res.json({
      exerciseId,
      count: similar.length,
      similar,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to find similar exercises',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /suggestions/recommend
 * Get recommendations based on multiple criteria
 */
suggestionRouter.post('/recommend', async (req: Request, res: Response) => {
  try {
    const {
      targetMuscles,
      goals,
      difficulty,
      location,
      equipment,
      excludeExerciseIds,
      limit = 10,
    } = req.body;

    const recommendations = await embeddingService.getRecommendations({
      targetMuscles,
      goals,
      difficulty,
      location,
      equipment,
      excludeExerciseIds,
      limit,
    });

    res.json({
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
