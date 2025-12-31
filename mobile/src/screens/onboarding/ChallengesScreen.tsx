import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, Challenge } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  MultiSelectList,
  ContinueButton,
} from '../../../components/onboarding';

type ChallengesScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Challenges'>;
};

const CHALLENGE_OPTIONS = [
  {
    id: 'finding_time',
    label: 'Finding time for workouts',
  },
  {
    id: 'not_knowing_exercises',
    label: 'Not knowing what exercises to do',
  },
  {
    id: 'staying_motivated',
    label: 'Staying motivated long-term',
  },
  {
    id: 'no_accountability',
    label: 'Having no one to keep me accountable',
  },
  {
    id: 'tracking_food',
    label: 'Tracking my food and calories',
  },
  {
    id: 'planning_workouts',
    label: 'Planning effective workouts',
  },
];

export default function ChallengesScreen({ navigation }: ChallengesScreenProps) {
  const { challenges, setChallenges, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(5);
  }, []);

  const handleChange = (values: string[]) => {
    setChallenges(values as Challenge[]);
  };

  const handleContinue = () => {
    navigation.navigate('Experience');
  };

  const isValid = challenges.length > 0;

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble subtitle="Select all that apply">
        What challenges have held you back from your goals before?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MultiSelectList
          options={CHALLENGE_OPTIONS}
          value={challenges}
          onChange={handleChange}
          minSelections={1}
        />
      </ScrollView>

      <ContinueButton
        onPress={handleContinue}
        disabled={!isValid}
        label={`Continue${challenges.length > 0 ? ` (${challenges.length})` : ''}`}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
