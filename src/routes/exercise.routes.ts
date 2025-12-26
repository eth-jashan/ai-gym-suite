import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export const exerciseRouter = Router();

/**
 * GET /exercises
 * Get all exercises (with optional filtering)
 */
exerciseRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  const {
    category,
    muscle,
    equipment,
    difficulty,
    location,
    search,
    limit = 20,
    offset = 0,
  } = req.query;

  const where: any = {
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  if (muscle) {
    where.OR = [
      { primaryMuscles: { has: muscle as string } },
      { secondaryMuscles: { has: muscle as string } },
    ];
  }

  if (equipment) {
    where.equipmentRequired = { has: equipment as string };
  }

  if (difficulty) {
    where.difficultyLevel = Number(difficulty);
  }

  if (location) {
    where.suitableLocations = { has: (location as string).toLowerCase() };
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { tags: { has: (search as string).toLowerCase() } },
    ];
  }

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { popularityScore: 'desc' },
    take: Number(limit),
    skip: Number(offset),
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      movementPattern: true,
      exerciseType: true,
      primaryMuscles: true,
      difficultyLevel: true,
      equipmentRequired: true,
      thumbnailUrl: true,
      isBeginnerFriendly: true,
      tags: true,
    },
  });

  const total = await prisma.exercise.count({ where });

  res.json({
    exercises,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /exercises/categories
 * Get all exercise categories
 */
exerciseRouter.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.exercise.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { isActive: true },
  });

  res.json(
    categories.map((c) => ({
      category: c.category,
      count: c._count.id,
    }))
  );
});

/**
 * GET /exercises/muscles
 * Get all muscle groups
 */
exerciseRouter.get('/muscles', async (_req: Request, res: Response) => {
  const muscles = [
    { id: 'chest', name: 'Chest', bodyPart: 'upper' },
    { id: 'back', name: 'Back', bodyPart: 'upper' },
    { id: 'lats', name: 'Lats', bodyPart: 'upper' },
    { id: 'shoulders', name: 'Shoulders', bodyPart: 'upper' },
    { id: 'biceps', name: 'Biceps', bodyPart: 'upper' },
    { id: 'triceps', name: 'Triceps', bodyPart: 'upper' },
    { id: 'forearms', name: 'Forearms', bodyPart: 'upper' },
    { id: 'core', name: 'Core', bodyPart: 'core' },
    { id: 'obliques', name: 'Obliques', bodyPart: 'core' },
    { id: 'quads', name: 'Quadriceps', bodyPart: 'lower' },
    { id: 'hamstrings', name: 'Hamstrings', bodyPart: 'lower' },
    { id: 'glutes', name: 'Glutes', bodyPart: 'lower' },
    { id: 'calves', name: 'Calves', bodyPart: 'lower' },
    { id: 'hip_flexors', name: 'Hip Flexors', bodyPart: 'lower' },
  ];

  res.json(muscles);
});

/**
 * GET /exercises/:id
 * Get exercise details
 */
exerciseRouter.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const exercise = await prisma.exercise.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
  });

  if (!exercise) {
    throw new NotFoundError('Exercise');
  }

  // Increment popularity
  await prisma.exercise.update({
    where: { id: exercise.id },
    data: { timesRecommended: { increment: 1 } },
  });

  res.json(exercise);
});

/**
 * GET /exercises/:id/coaching
 * Get AI coaching tips for an exercise
 */
exerciseRouter.get('/:id/coaching', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  const tips = await aiService.getExerciseCoaching(id);

  res.json({ tips });
});

/**
 * GET /exercises/:id/alternatives
 * Get alternative exercises
 */
exerciseRouter.get('/:id/alternatives', optionalAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (!exercise) {
    throw new NotFoundError('Exercise');
  }

  const alternatives = await prisma.exercise.findMany({
    where: {
      id: { not: id },
      isActive: true,
      OR: [
        { primaryMuscles: { hasSome: exercise.primaryMuscles } },
        { movementPattern: exercise.movementPattern },
      ],
    },
    orderBy: { popularityScore: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      primaryMuscles: true,
      difficultyLevel: true,
      equipmentRequired: true,
      thumbnailUrl: true,
    },
  });

  res.json(alternatives);
});

/**
 * GET /exercises/by-muscle/:muscle
 * Get exercises for a specific muscle group
 */
exerciseRouter.get('/by-muscle/:muscle', optionalAuth, async (req: Request, res: Response) => {
  const { muscle } = req.params;
  const { limit = 10 } = req.query;

  const exercises = await prisma.exercise.findMany({
    where: {
      isActive: true,
      OR: [
        { primaryMuscles: { has: muscle } },
        { secondaryMuscles: { has: muscle } },
      ],
    },
    orderBy: [
      { exerciseType: 'asc' }, // Compound first
      { popularityScore: 'desc' },
    ],
    take: Number(limit),
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      exerciseType: true,
      primaryMuscles: true,
      difficultyLevel: true,
      equipmentRequired: true,
      thumbnailUrl: true,
    },
  });

  res.json(exercises);
});
