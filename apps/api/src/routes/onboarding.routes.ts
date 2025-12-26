import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { onboardingService, ONBOARDING_QUESTIONS } from '../services/onboarding.service.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const onboardingRouter = Router();

// All onboarding routes require authentication
onboardingRouter.use(authenticate);

/**
 * GET /onboarding/status
 * Get user's onboarding status
 */
onboardingRouter.get('/status', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const currentStep = await onboardingService.getCurrentStep(userId);
  const totalPhases = onboardingService.getTotalPhases();
  const phases = onboardingService.getPhasesInfo();

  res.json({
    currentStep,
    totalPhases,
    completed: currentStep >= totalPhases,
    phases,
  });
});

/**
 * GET /onboarding/questions
 * Get all onboarding questions (organized by phase)
 */
onboardingRouter.get('/questions', async (_req: Request, res: Response) => {
  const phases = onboardingService.getPhasesInfo();
  const questionsGrouped = phases.map((phase) => ({
    ...phase,
    questions: onboardingService.getQuestionsForPhase(phase.phase),
  }));

  res.json({
    totalPhases: phases.length,
    phases: questionsGrouped,
  });
});

/**
 * GET /onboarding/questions/:phase
 * Get questions for a specific phase
 */
onboardingRouter.get('/questions/:phase', async (req: Request, res: Response) => {
  const phase = parseInt(req.params.phase, 10);

  if (isNaN(phase) || phase < 1 || phase > 6) {
    throw new ValidationError('Invalid phase number');
  }

  const questions = onboardingService.getQuestionsForPhase(phase);
  const phaseInfo = onboardingService.getPhasesInfo().find((p) => p.phase === phase);

  res.json({
    phase,
    ...phaseInfo,
    questions,
  });
});

/**
 * POST /onboarding/responses
 * Submit responses for a phase
 */
onboardingRouter.post('/responses', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { responses } = req.body;

  if (!responses || typeof responses !== 'object') {
    throw new ValidationError('Responses object is required');
  }

  const result = await onboardingService.saveResponses(userId, responses);

  res.json(result);
});

/**
 * POST /onboarding/complete
 * Complete onboarding and generate user profile
 */
onboardingRouter.post('/complete', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await onboardingService.completeOnboarding(userId);

  res.json(result);
});

/**
 * POST /onboarding/skip
 * Skip remaining onboarding (for testing/development)
 */
onboardingRouter.post('/skip', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Create minimal profile with defaults
  const { prisma } = await import('../lib/prisma.js');

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true, onboardingStep: 6 },
  });

  await prisma.userProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      firstName: 'User',
      age: 30,
      primaryGoal: 'GENERAL_FITNESS',
      fitnessLevel: 'MODERATELY_ACTIVE',
      experienceLevel: 'INTERMEDIATE',
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      workoutDaysPerWeek: 3,
      sessionDurationMin: 45,
      workoutLocation: 'GYM',
      availableEquipment: ['dumbbells', 'barbell', 'full_gym'],
    },
  });

  await prisma.userHealth.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
    },
  });

  res.json({ message: 'Onboarding skipped with defaults' });
});
