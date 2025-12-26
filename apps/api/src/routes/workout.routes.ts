import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { workoutGeneratorService } from '../services/workout-generator.service.js';
import { aiService } from '../services/ai.service.js';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

export const workoutRouter = Router();

// All workout routes require authentication and completed onboarding
workoutRouter.use(authenticate);
workoutRouter.use(requireOnboarding);

/**
 * GET /workouts/today
 * Get today's workout (generates if not exists)
 */
workoutRouter.get('/today', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const workout = await workoutGeneratorService.getTodaysWorkout(userId);
  const motivation = await aiService.generateMotivation(userId);

  res.json({
    workout,
    motivation,
  });
});

/**
 * POST /workouts/generate
 * Generate a new workout
 */
workoutRouter.post('/generate', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { dayOfWeek, weekNumber } = req.body;

  const today = new Date();
  const workout = await workoutGeneratorService.generateWorkout({
    userId,
    dayOfWeek: dayOfWeek ?? today.getDay(),
    weekNumber: weekNumber ?? Math.ceil(today.getDate() / 7),
  });

  res.status(201).json(workout);
});

/**
 * GET /workouts
 * Get user's workout history
 */
workoutRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { limit = 10, offset = 0, status } = req.query;

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
    orderBy: { scheduledDate: 'desc' },
    take: Number(limit),
    skip: Number(offset),
    include: {
      exercises: {
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  const total = await prisma.workout.count({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
  });

  res.json({
    workouts,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /workouts/:id
 * Get specific workout details
 */
workoutRouter.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const workout = await prisma.workout.findUnique({
    where: { id, userId },
    include: {
      exercises: {
        include: {
          exercise: true,
          logs: {
            include: { sets: true },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!workout) {
    throw new NotFoundError('Workout');
  }

  res.json(workout);
});

/**
 * POST /workouts/:id/start
 * Start a workout session
 */
workoutRouter.post('/:id/start', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const workout = await prisma.workout.update({
    where: { id, userId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  res.json(workout);
});

/**
 * POST /workouts/:id/complete
 * Complete a workout
 */
workoutRouter.post('/:id/complete', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { notes } = req.body;

  const workout = await prisma.workout.findUnique({
    where: { id, userId },
    include: {
      exercises: {
        include: {
          logs: {
            include: { sets: true },
          },
        },
      },
    },
  });

  if (!workout) {
    throw new NotFoundError('Workout');
  }

  // Calculate total volume and duration
  let totalVolume = 0;
  let caloriesBurned = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  for (const exercise of workout.exercises) {
    for (const log of exercise.logs) {
      totalVolume += log.totalVolume || 0;
      if (log.averageRpe) {
        rpeSum += log.averageRpe;
        rpeCount++;
      }
    }
  }

  const actualDuration = workout.startedAt
    ? Math.round((Date.now() - workout.startedAt.getTime()) / 60000)
    : workout.estimatedDuration;

  // Rough calorie estimation (MET * weight * hours)
  caloriesBurned = Math.round((6 * 70 * actualDuration) / 60);

  const updated = await prisma.workout.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      actualDuration,
      totalVolume,
      caloriesBurned,
      averageRpe: rpeCount > 0 ? rpeSum / rpeCount : null,
      userNotes: notes,
    },
  });

  // Get AI analysis
  const analysis = await aiService.analyzePerformance(userId, id);

  res.json({
    workout: updated,
    analysis,
  });
});

/**
 * POST /workouts/:workoutId/exercises/:exerciseId/log
 * Log a set for an exercise
 */
const logSetSchema = z.object({
  setNumber: z.number().min(1),
  repsCompleted: z.number().min(0),
  weightUsed: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  isWarmup: z.boolean().optional(),
  notes: z.string().optional(),
});

workoutRouter.post(
  '/:workoutId/exercises/:exerciseId/log',
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workoutId, exerciseId } = req.params;

    const validation = logSetSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.errors);
    }

    const { setNumber, repsCompleted, weightUsed, rpe, isWarmup, notes } = validation.data;

    // Verify workout exercise exists and belongs to user
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workout: { id: workoutId, userId },
      },
      include: { exercise: true },
    });

    if (!workoutExercise) {
      throw new NotFoundError('Exercise');
    }

    // Find or create exercise log
    let exerciseLog = await prisma.exerciseLog.findFirst({
      where: {
        workoutExerciseId: exerciseId,
        userId,
      },
    });

    if (!exerciseLog) {
      exerciseLog = await prisma.exerciseLog.create({
        data: {
          userId,
          workoutExerciseId: exerciseId,
          exerciseId: workoutExercise.exerciseId,
        },
      });
    }

    // Create set log
    const setLog = await prisma.setLog.create({
      data: {
        exerciseLogId: exerciseLog.id,
        setNumber,
        repsCompleted,
        weightUsed,
        rpe,
        isWarmup: isWarmup || false,
        notes,
      },
    });

    // Update exercise log totals
    const volume = (weightUsed || 0) * repsCompleted;
    await prisma.exerciseLog.update({
      where: { id: exerciseLog.id },
      data: {
        totalVolume: { increment: volume },
        averageRpe: rpe, // This should be calculated properly
      },
    });

    // Update workout exercise status
    await prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: { status: 'IN_PROGRESS' },
    });

    res.status(201).json(setLog);
  }
);

/**
 * POST /workouts/:workoutId/exercises/:exerciseId/swap
 * Swap an exercise for an alternative
 */
workoutRouter.post(
  '/:workoutId/exercises/:exerciseId/swap',
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { exerciseId } = req.params;

    const result = await workoutGeneratorService.swapExercise(exerciseId, userId);

    res.json(result);
  }
);

/**
 * POST /workouts/:workoutId/exercises/:exerciseId/skip
 * Skip an exercise
 */
workoutRouter.post(
  '/:workoutId/exercises/:exerciseId/skip',
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workoutId, exerciseId } = req.params;
    const { reason } = req.body;

    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workout: { id: workoutId, userId },
      },
    });

    if (!workoutExercise) {
      throw new NotFoundError('Exercise');
    }

    const updated = await prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: {
        status: 'SKIPPED',
        skipped: true,
        skipReason: reason,
      },
    });

    res.json(updated);
  }
);
