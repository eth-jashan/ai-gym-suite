import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, Day } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  PillSelector,
  ContinueButton,
} from '../../../components/onboarding';

type WorkoutDaysScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'WorkoutDays'>;
};

const DAY_OPTIONS = [
  { id: 'monday', label: 'M' },
  { id: 'tuesday', label: 'T' },
  { id: 'wednesday', label: 'W' },
  { id: 'thursday', label: 'T' },
  { id: 'friday', label: 'F' },
  { id: 'saturday', label: 'S' },
  { id: 'sunday', label: 'S' },
];

export default function WorkoutDaysScreen({ navigation }: WorkoutDaysScreenProps) {
  const { colors } = useTheme();
  const { workoutDays, setWorkoutDays, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(11);
  }, []);

  const handleChange = (value: string | string[]) => {
    setWorkoutDays(value as Day[]);
  };

  const handleContinue = () => {
    navigation.navigate('NutritionIntro');
  };

  const isValid = workoutDays.length > 0;

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        Which days do you want to workout?
      </QuestionBubble>

      <View style={styles.container}>
        <PillSelector
          options={DAY_OPTIONS}
          value={workoutDays}
          onChange={handleChange}
          multiSelect={true}
          columns={4}
        />

        <Animated.View entering={FadeInUp.delay(400).duration(300)}>
          <Text style={[styles.helperText, { color: colors.text.secondary }]}>
            We recommend at least 3 days per week for optimal results.
          </Text>
        </Animated.View>
      </View>

      <ContinueButton
        onPress={handleContinue}
        disabled={!isValid}
        label={`Continue${workoutDays.length > 0 ? ` (${workoutDays.length} days)` : ''}`}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
