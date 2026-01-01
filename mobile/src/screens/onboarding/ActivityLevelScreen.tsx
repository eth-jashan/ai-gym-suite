import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, ActivityLevel } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  SingleSelectList,
  SelectOption,
} from '../../../components/onboarding';

type ActivityLevelScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ActivityLevel'>;
};

const ACTIVITY_OPTIONS: SelectOption[] = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    subtitle: 'Little or no exercise',
  },
  {
    id: 'lightly_active',
    label: 'Lightly Active',
    subtitle: 'Light exercise or sports 1-3 days a week',
  },
  {
    id: 'moderately_active',
    label: 'Moderately Active',
    subtitle: 'Moderate exercise or sports 3-5 days a week',
  },
  {
    id: 'very_active',
    label: 'Very Active',
    subtitle: 'Hard exercise or sports 6-7 days a week',
  },
  {
    id: 'super_active',
    label: 'Super Active',
    subtitle: 'Very hard exercise, physical job or training twice a day',
  },
];

export default function ActivityLevelScreen({ navigation }: ActivityLevelScreenProps) {
  const { activityLevel, setActivityLevel, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(18);
  }, []);

  const handleSelect = (value: string) => {
    setActivityLevel(value as ActivityLevel);
  };

  const handleAutoAdvance = () => {
    navigation.navigate('WeightRate');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        Including your job, hobbies and other general activity, how active are you on a typical day?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SingleSelectList
          options={ACTIVITY_OPTIONS}
          value={activityLevel}
          onChange={handleSelect}
          autoAdvance={true}
          autoAdvanceDelay={300}
          onAutoAdvance={handleAutoAdvance}
        />
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
