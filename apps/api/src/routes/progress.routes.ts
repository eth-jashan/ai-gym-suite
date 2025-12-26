import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai.service.js';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const progressRouter = Router();

// All progress routes require authentication
progressRouter.use(authenticate);
progressRouter.use(requireOnboarding);

/**
 * GET /progress/dashboard
 * Get overview stats for dashboard
 */
progressRouter.get('/dashboard', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  // Workout stats
  const totalWorkouts = await prisma.workout.count({
    where: { userId, status: 'COMPLETED' },
  });

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekWorkouts = await prisma.workout.count({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: thisWeekStart },
    },
  });

  // Current streak
  const streak = await calculateStreak(userId);

  // Total volume this week
  const weeklyVolume = await prisma.workout.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: thisWeekStart },
    },
    _sum: { totalVolume: true },
  });

  // Total time this week
  const weeklyTime = await prisma.workout.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: thisWeekStart },
    },
    _sum: { actualDuration: true },
  });

  // Latest measurements
  const latestSnapshot = await prisma.progressSnapshot.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });

  // Achievements
  const achievements = await prisma.userAchievement.count({
    where: { userId },
  });

  res.json({
    profile: profile ? {
      name: profile.firstName,
      currentWeight: profile.currentWeightKg,
      targetWeight: profile.targetWeightKg,
      goal: profile.primaryGoal,
    } : null,
    stats: {
      totalWorkouts,
      thisWeekWorkouts,
      currentStreak: streak,
      weeklyVolume: weeklyVolume._sum.totalVolume || 0,
      weeklyTime: weeklyTime._sum.actualDuration || 0,
      achievementsUnlocked: achievements,
    },
    latestMeasurement: latestSnapshot ? {
      weight: latestSnapshot.weightKg,
      recordedAt: latestSnapshot.recordedAt,
    } : null,
  });
});

/**
 * GET /progress/weekly-summary
 * Get AI-generated weekly summary
 */
progressRouter.get('/weekly-summary', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const summary = await aiService.generateWeeklySummary(userId);

  res.json({ summary });
});

/**
 * GET /progress/strength
 * Get strength progression for exercises
 */
progressRouter.get('/strength', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { exerciseId, days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const logs = await prisma.exerciseLog.findMany({
    where: {
      userId,
      performedAt: { gte: startDate },
      ...(exerciseId && { exerciseId: exerciseId as string }),
    },
    include: {
      exercise: { select: { id: true, name: true } },
      sets: {
        where: { isWarmup: false },
        orderBy: { setNumber: 'asc' },
      },
    },
    orderBy: { performedAt: 'asc' },
  });

  // Group by exercise
  const progressByExercise: Record<string, any> = {};

  for (const log of logs) {
    const exerciseName = log.exercise.name;
    if (!progressByExercise[exerciseName]) {
      progressByExercise[exerciseName] = {
        exerciseId: log.exerciseId,
        name: exerciseName,
        data: [],
      };
    }

    // Find max weight for this session
    const maxWeight = Math.max(...log.sets.map((s) => s.weightUsed || 0));
    const totalVolume = log.sets.reduce(
      (sum, s) => sum + (s.weightUsed || 0) * s.repsCompleted,
      0
    );

    progressByExercise[exerciseName].data.push({
      date: log.performedAt,
      maxWeight,
      totalVolume,
      sets: log.sets.length,
    });
  }

  res.json(Object.values(progressByExercise));
});

/**
 * GET /progress/body
 * Get body measurement history
 */
progressRouter.get('/body', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { limit = 30 } = req.query;

  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: Number(limit),
  });

  res.json(snapshots.reverse());
});

/**
 * POST /progress/body
 * Log a new body measurement
 */
const bodySnapshotSchema = z.object({
  weightKg: z.number().min(20).max(500).optional(),
  bodyFatPercent: z.number().min(1).max(60).optional(),
  chestCm: z.number().min(50).max(200).optional(),
  waistCm: z.number().min(40).max(200).optional(),
  hipsCm: z.number().min(50).max(200).optional(),
  bicepsCm: z.number().min(15).max(70).optional(),
  thighsCm: z.number().min(30).max(100).optional(),
  notes: z.string().max(500).optional(),
});

progressRouter.post('/body', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validation = bodySnapshotSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid input', validation.error.errors);
  }

  const snapshot = await prisma.progressSnapshot.create({
    data: {
      userId,
      ...validation.data,
    },
  });

  // Update user profile with latest weight
  if (validation.data.weightKg) {
    await prisma.userProfile.update({
      where: { userId },
      data: { currentWeightKg: validation.data.weightKg },
    });
  }

  res.status(201).json(snapshot);
});

/**
 * GET /progress/achievements
 * Get user achievements
 */
progressRouter.get('/achievements', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });

  const allAchievements = await prisma.achievement.findMany();

  const unlocked = userAchievements.map((ua) => ({
    ...ua.achievement,
    unlockedAt: ua.unlockedAt,
    unlocked: true,
  }));

  const locked = allAchievements
    .filter((a) => !userAchievements.some((ua) => ua.achievementId === a.id))
    .map((a) => ({ ...a, unlocked: false }));

  res.json({
    unlocked,
    locked,
    totalPoints: unlocked.reduce((sum, a) => sum + a.points, 0),
  });
});

/**
 * GET /progress/streaks
 * Get streak information
 */
progressRouter.get('/streaks', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const currentStreak = await calculateStreak(userId);
  const longestStreak = await calculateLongestStreak(userId);

  // Get this week's workout days
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: thisWeekStart },
    },
    select: { completedAt: true },
  });

  const workoutDays = thisWeekWorkouts.map((w) =>
    w.completedAt!.getDay()
  );

  res.json({
    currentStreak,
    longestStreak,
    thisWeek: {
      workoutDays: [...new Set(workoutDays)],
      totalWorkouts: thisWeekWorkouts.length,
    },
  });
});

// ==================== HELPER FUNCTIONS ====================

async function calculateStreak(userId: string): Promise<number> {
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  if (workouts.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if there was a workout today or yesterday
  const lastWorkout = workouts[0].completedAt!;
  const lastWorkoutDate = new Date(lastWorkout);
  lastWorkoutDate.setHours(0, 0, 0, 0);

  const daysSinceLastWorkout = Math.floor(
    (currentDate.getTime() - lastWorkoutDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysSinceLastWorkout > 1) {
    return 0; // Streak broken
  }

  // Count consecutive days
  const workoutDates = new Set(
    workouts.map((w) => {
      const date = new Date(w.completedAt!);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  let checkDate = lastWorkoutDate;
  while (workoutDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

async function calculateLongestStreak(userId: string): Promise<number> {
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'asc' },
    select: { completedAt: true },
  });

  if (workouts.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;
  let prevDate = new Date(workouts[0].completedAt!);
  prevDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < workouts.length; i++) {
    const currentDate = new Date(workouts[i].completedAt!);
    currentDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (dayDiff > 1) {
      currentStreak = 1;
    }

    prevDate = currentDate;
  }

  return longestStreak;
}
