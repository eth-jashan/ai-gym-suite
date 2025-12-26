import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { onboardingRouter } from './onboarding.routes.js';
import { workoutRouter } from './workout.routes.js';
import { exerciseRouter } from './exercise.routes.js';
import { progressRouter } from './progress.routes.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'AI Gym Suite API',
    version: '0.1.0',
    endpoints: {
      auth: '/auth',
      onboarding: '/onboarding',
      workouts: '/workouts',
      exercises: '/exercises',
      progress: '/progress',
    },
  });
});

// Mount routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/onboarding', onboardingRouter);
apiRouter.use('/workouts', workoutRouter);
apiRouter.use('/exercises', exerciseRouter);
apiRouter.use('/progress', progressRouter);
