import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStats } from '@/lib/types/workout';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  WeeklyPlan: undefined;
  WorkoutDayDetail: {
    workoutId: string;
    dayIndex?: number;
  };
  ActiveWorkout: {
    workoutId: string;
  };
  WorkoutComplete: {
    workoutId: string;
    stats: WorkoutStats;
  };
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;
