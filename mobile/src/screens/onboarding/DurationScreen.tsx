import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  PillSelector,
} from '../../../components/onboarding';

type DurationScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Duration'>;
};

const DURATION_OPTIONS = [
  { id: '15', label: '15min' },
  { id: '30', label: '30min' },
  { id: '45', label: '45min' },
  { id: '60', label: '1h' },
  { id: '90', label: '1h 30m' },
];

export default function DurationScreen({ navigation }: DurationScreenProps) {
  const { colors } = useTheme();
  const { workoutDuration, setWorkoutDuration, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(8);
  }, []);

  const handleChange = (value: string | string[]) => {
    const duration = parseInt(value as string, 10);
    setWorkoutDuration(duration);
    // Auto-advance after selection
    setTimeout(() => {
      navigation.navigate('Equipment');
    }, 300);
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        How long do you want your workouts to be?
      </QuestionBubble>

      <View style={styles.container}>
        <PillSelector
          options={DURATION_OPTIONS}
          value={workoutDuration?.toString() || null}
          onChange={handleChange}
          multiSelect={false}
          columns={3}
        />

        <Animated.View entering={FadeInUp.delay(400).duration(300)}>
          <Text style={[styles.helperText, { color: colors.text.secondary }]}>
            You can always adjust this on-demand for future workouts.
          </Text>
        </Animated.View>
      </View>
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
