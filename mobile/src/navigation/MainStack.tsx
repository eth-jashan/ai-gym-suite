/**
 * Main Stack Navigator
 *
 * Navigation stack for the main workout flow after onboarding.
 * Dashboard → WeeklyPlan → WorkoutDayDetail → ActiveWorkout → WorkoutComplete
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/providers/theme-provider';
import type { MainStackParamList } from './types';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import WeeklyPlanScreen from '../screens/workout/WeeklyPlanScreen';
import WorkoutDayDetailScreen from '../screens/workout/WorkoutDayDetailScreen';
import ActiveWorkoutScreen from '../screens/workout/ActiveWorkoutScreen';
import WorkoutCompleteScreen from '../screens/workout/WorkoutCompleteScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.base },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="WeeklyPlan" component={WeeklyPlanScreen} />
      <Stack.Screen
        name="WorkoutDayDetail"
        component={WorkoutDayDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          gestureEnabled: false, // Prevent accidental swipe back during workout
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="WorkoutComplete"
        component={WorkoutCompleteScreen}
        options={{
          gestureEnabled: false, // Keep user on completion screen
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}
