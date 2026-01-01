import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, PrimaryGoal } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  SingleSelectList,
  SelectOption,
} from '../../../components/onboarding';

type GoalScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Goal'>;
};

const GOAL_OPTIONS: SelectOption[] = [
  {
    id: 'lose_weight',
    label: 'Lose Weight',
    subtitle: 'Burn fat & get lean',
    icon: '\uD83D\uDD25', // fire emoji
  },
  {
    id: 'build_muscle',
    label: 'Build Muscle',
    subtitle: 'Gain strength & size',
    icon: '\uD83D\uDCAA', // flexed biceps emoji
  },
  {
    id: 'get_fitter',
    label: 'Get Fitter',
    subtitle: 'Improve overall health',
    icon: '\u26A1', // lightning emoji
  },
  {
    id: 'maintain',
    label: 'Maintain',
    subtitle: 'Stay in current shape',
    icon: '\uD83C\uDFC3', // runner emoji
  },
];

export default function GoalScreen({ navigation }: GoalScreenProps) {
  const { name, primaryGoal, setPrimaryGoal, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(2);
  }, []);

  const handleSelect = (value: string) => {
    setPrimaryGoal(value as PrimaryGoal);
  };

  const handleAutoAdvance = () => {
    navigation.navigate('Vision');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What's your main fitness goal, {name}?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SingleSelectList
          options={GOAL_OPTIONS}
          value={primaryGoal}
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
