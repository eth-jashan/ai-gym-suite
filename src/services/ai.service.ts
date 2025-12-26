import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

const anthropic = config.ai.anthropicApiKey
  ? new Anthropic({ apiKey: config.ai.anthropicApiKey })
  : null;

interface UserContext {
  name: string;
  age: number;
  goal: string;
  fitnessLevel: string;
  experienceLevel: string;
}

export class AIService {
  /**
   * Generate personalized workout motivation/tips
   */
  async generateMotivation(userId: string): Promise<string> {
    if (!anthropic) {
      return this.getDefaultMotivation();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user?.profile) {
      return this.getDefaultMotivation();
    }

    const context: UserContext = {
      name: user.profile.firstName || 'there',
      age: user.profile.age || 30,
      goal: user.profile.primaryGoal || 'general fitness',
      fitnessLevel: user.profile.fitnessLevel || 'moderate',
      experienceLevel: user.profile.experienceLevel || 'intermediate',
    };

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Generate a short, personalized workout motivation message (2-3 sentences) for:
Name: ${context.name}
Goal: ${context.goal}
Fitness Level: ${context.fitnessLevel}
Experience: ${context.experienceLevel}

Be encouraging, specific to their goal, and energetic. Don't use emojis.`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent?.text || this.getDefaultMotivation();
    } catch (error) {
      console.error('AI motivation generation failed:', error);
      return this.getDefaultMotivation();
    }
  }

  /**
   * Generate weekly progress summary
   */
  async generateWeeklySummary(userId: string): Promise<string> {
    // Get last 7 days of workouts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        completedAt: { gte: sevenDaysAgo },
        status: 'COMPLETED',
      },
      include: {
        exercises: {
          include: {
            logs: {
              include: {
                sets: true,
              },
            },
          },
        },
      },
    });

    const stats = {
      workoutsCompleted: workouts.length,
      totalVolume: 0,
      musclesWorked: new Set<string>(),
      totalTime: 0,
    };

    for (const workout of workouts) {
      stats.totalTime += workout.actualDuration || 0;
      workout.focusMuscles.forEach((m) => stats.musclesWorked.add(m));

      for (const exercise of workout.exercises) {
        for (const log of exercise.logs) {
          stats.totalVolume += log.totalVolume || 0;
        }
      }
    }

    if (!anthropic) {
      return this.formatDefaultSummary(stats);
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Generate a brief weekly fitness summary (3-4 sentences) based on:
- Workouts completed: ${stats.workoutsCompleted}
- Total training time: ${stats.totalTime} minutes
- Total volume lifted: ${Math.round(stats.totalVolume)} kg
- Muscle groups trained: ${Array.from(stats.musclesWorked).join(', ')}

Be encouraging and give one specific tip for next week.`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent?.text || this.formatDefaultSummary(stats);
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return this.formatDefaultSummary(stats);
    }
  }

  /**
   * Generate exercise form tips
   */
  async getExerciseCoaching(exerciseId: string): Promise<string> {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new Error('Exercise not found');
    }

    if (!anthropic) {
      return exercise.formCues.join('\n- ');
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Give 3 key coaching tips for performing "${exercise.name}" with perfect form.
Exercise description: ${exercise.description}
Common mistakes: ${exercise.commonMistakes.join(', ')}

Keep tips concise and actionable.`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent?.text || exercise.formCues.join('\n- ');
    } catch (error) {
      console.error('AI coaching generation failed:', error);
      return exercise.formCues.join('\n- ');
    }
  }

  /**
   * Analyze workout and suggest adjustments
   */
  async analyzePerformance(userId: string, workoutId: string): Promise<{
    feedback: string;
    adjustments: string[];
  }> {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId, userId },
      include: {
        exercises: {
          include: {
            exercise: true,
            logs: {
              include: { sets: true },
            },
          },
        },
      },
    });

    if (!workout) {
      throw new Error('Workout not found');
    }

    const performance = {
      completed: workout.status === 'COMPLETED',
      exercises: workout.exercises.map((we) => ({
        name: we.exercise.name,
        targetSets: we.targetSets,
        completedSets: we.logs.reduce((sum, l) => sum + l.sets.length, 0),
        averageRpe: we.logs.length > 0
          ? we.logs.reduce((sum, l) => sum + (l.averageRpe || 0), 0) / we.logs.length
          : 0,
        skipped: we.skipped,
      })),
    };

    // Default analysis if no AI
    if (!anthropic) {
      return this.getDefaultAnalysis(performance);
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 250,
        messages: [
          {
            role: 'user',
            content: `Analyze this workout performance and provide brief feedback:
${JSON.stringify(performance, null, 2)}

Provide:
1. A short overall assessment (1-2 sentences)
2. 2-3 specific adjustments for next session

Format as JSON: { "feedback": "...", "adjustments": ["...", "..."] }`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (textContent?.text) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return this.getDefaultAnalysis(performance);
        }
      }
      return this.getDefaultAnalysis(performance);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getDefaultAnalysis(performance);
    }
  }

  // ==================== DEFAULT FALLBACKS ====================

  private getDefaultMotivation(): string {
    const motivations = [
      "Every rep counts. Let's make today's workout your best one yet!",
      "Consistency beats perfection. Show up, put in the work, and results will follow.",
      "Your future self will thank you for the effort you put in today.",
      "Small progress is still progress. Keep pushing forward!",
      "The only bad workout is the one that didn't happen. Let's go!",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  private formatDefaultSummary(stats: {
    workoutsCompleted: number;
    totalVolume: number;
    musclesWorked: Set<string>;
    totalTime: number;
  }): string {
    if (stats.workoutsCompleted === 0) {
      return "No workouts completed this week. Let's get back on track!";
    }

    return `Great week! You completed ${stats.workoutsCompleted} workout${stats.workoutsCompleted > 1 ? 's' : ''}, ` +
      `trained for ${stats.totalTime} minutes, and lifted ${Math.round(stats.totalVolume)} kg total. ` +
      `Keep up the consistency!`;
  }

  private getDefaultAnalysis(performance: any): { feedback: string; adjustments: string[] } {
    const completionRate = performance.exercises.filter((e: any) => !e.skipped).length / performance.exercises.length;
    const avgRpe = performance.exercises.reduce((sum: number, e: any) => sum + e.averageRpe, 0) / performance.exercises.length;

    let feedback = '';
    const adjustments: string[] = [];

    if (completionRate >= 0.9) {
      feedback = 'Excellent workout! You completed almost all exercises.';
    } else if (completionRate >= 0.7) {
      feedback = 'Good effort! Most exercises were completed.';
      adjustments.push('Try to complete all exercises next session');
    } else {
      feedback = 'Workout partially completed. Consider reducing volume.';
      adjustments.push('Reduce number of exercises or sets');
    }

    if (avgRpe > 8.5) {
      adjustments.push('Consider slightly reducing weight for better form');
    } else if (avgRpe < 6) {
      adjustments.push('You can increase the weight next session');
    }

    return { feedback, adjustments };
  }
}

export const aiService = new AIService();
