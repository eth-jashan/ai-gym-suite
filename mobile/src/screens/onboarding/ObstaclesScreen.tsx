import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, PastObstacle } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  SingleSelectList,
  SelectOption,
} from '../../../components/onboarding';

type ObstaclesScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Obstacles'>;
};

const OBSTACLE_OPTIONS: SelectOption[] = [
  {
    id: 'no_plan',
    label: "I didn't have a clear plan",
  },
  {
    id: 'no_guidance',
    label: 'I had no guidance or support',
  },
  {
    id: 'gave_up',
    label: 'I gave up when it got difficult',
  },
  {
    id: 'inconsistent',
    label: "I couldn't stay consistent",
  },
  {
    id: 'first_attempt',
    label: 'This is my first serious attempt',
  },
];

export default function ObstaclesScreen({ navigation }: ObstaclesScreenProps) {
  const { pastObstacle, setPastObstacle, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(4);
  }, []);

  const handleSelect = (value: string) => {
    setPastObstacle(value as PastObstacle);
  };

  const handleAutoAdvance = () => {
    navigation.navigate('Challenges');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What has stopped you from reaching your goals before?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SingleSelectList
          options={OBSTACLE_OPTIONS}
          value={pastObstacle}
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
