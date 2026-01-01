import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import GoalScreen from '../screens/onboarding/GoalScreen';
import VisionScreen from '../screens/onboarding/VisionScreen';
import ObstaclesScreen from '../screens/onboarding/ObstaclesScreen';
import ChallengesScreen from '../screens/onboarding/ChallengesScreen';
import ExperienceScreen from '../screens/onboarding/ExperienceScreen';
import ExperienceResponseScreen from '../screens/onboarding/ExperienceResponseScreen';
import DurationScreen from '../screens/onboarding/DurationScreen';
import EquipmentScreen from '../screens/onboarding/EquipmentScreen';
import WorkoutTimeScreen from '../screens/onboarding/WorkoutTimeScreen';
import WorkoutDaysScreen from '../screens/onboarding/WorkoutDaysScreen';
import NutritionIntroScreen from '../screens/onboarding/NutritionIntroScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import AgeScreen from '../screens/onboarding/AgeScreen';
import HeightScreen from '../screens/onboarding/HeightScreen';
import CurrentWeightScreen from '../screens/onboarding/CurrentWeightScreen';
import TargetWeightScreen from '../screens/onboarding/TargetWeightScreen';
import ActivityLevelScreen from '../screens/onboarding/ActivityLevelScreen';
import WeightRateScreen from '../screens/onboarding/WeightRateScreen';
import ProcessingScreen from '../screens/onboarding/ProcessingScreen';
import SummaryScreen from '../screens/onboarding/SummaryScreen';
import CompleteScreen from '../screens/onboarding/CompleteScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goal: undefined;
  Vision: undefined;
  Obstacles: undefined;
  Challenges: undefined;
  Experience: undefined;
  ExperienceResponse: undefined;
  Duration: undefined;
  Equipment: undefined;
  WorkoutTime: undefined;
  WorkoutDays: undefined;
  NutritionIntro: undefined;
  Gender: undefined;
  Age: undefined;
  Height: undefined;
  CurrentWeight: undefined;
  TargetWeight: undefined;
  ActivityLevel: undefined;
  WeightRate: undefined;
  Processing: undefined;
  Summary: undefined;
  Complete: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Phase 1: Introduction */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Vision" component={VisionScreen} />

      {/* Phase 2: Past Experience */}
      <Stack.Screen name="Obstacles" component={ObstaclesScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Experience" component={ExperienceScreen} />
      <Stack.Screen name="ExperienceResponse" component={ExperienceResponseScreen} />

      {/* Phase 3: Workout Preferences */}
      <Stack.Screen name="Duration" component={DurationScreen} />
      <Stack.Screen name="Equipment" component={EquipmentScreen} />
      <Stack.Screen name="WorkoutTime" component={WorkoutTimeScreen} />
      <Stack.Screen name="WorkoutDays" component={WorkoutDaysScreen} />

      {/* Phase 4: Body Metrics */}
      <Stack.Screen name="NutritionIntro" component={NutritionIntroScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="Age" component={AgeScreen} />
      <Stack.Screen name="Height" component={HeightScreen} />
      <Stack.Screen name="CurrentWeight" component={CurrentWeightScreen} />
      <Stack.Screen name="TargetWeight" component={TargetWeightScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="WeightRate" component={WeightRateScreen} />

      {/* Phase 5: Finalization */}
      <Stack.Screen name="Processing" component={ProcessingScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Summary" component={SummaryScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Complete" component={CompleteScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
