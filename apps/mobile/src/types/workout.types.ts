export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  totalWorkouts?: number;
  currentStreak?: number;
  achievements?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroups?: string[];
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
  notes?: string;
  completed?: boolean;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  duration: number;
  calories: number;
  exercises: WorkoutExercise[];
  status: 'upcoming' | 'in_progress' | 'completed';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  weeklyWorkouts: number;
  currentStreak: number;
  progressPercent: number;
  totalMinutes: number;
  caloriesBurned: number;
  workoutsTrend?: number;
  timeTrend?: number;
  caloriesTrend?: number;
  weeklyActivity?: boolean[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalMinutes: number;
  caloriesBurned: number;
  currentStreak: number;
  workoutsTrend?: number;
  timeTrend?: number;
  caloriesTrend?: number;
  weeklyActivity?: boolean[];
}
