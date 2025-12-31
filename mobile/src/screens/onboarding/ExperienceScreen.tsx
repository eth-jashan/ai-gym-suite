import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, FitnessLevel } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  SingleSelectList,
  SelectOption,
} from '../../../components/onboarding';

type ExperienceScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Experience'>;
};

const EXPERIENCE_OPTIONS: SelectOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    subtitle: 'You have never worked out before',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    subtitle: 'You have worked out before but not consistently',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    subtitle: 'You have worked out consistently for a long time',
  },
];

export default function ExperienceScreen({ navigation }: ExperienceScreenProps) {
  const { fitnessLevel, setFitnessLevel, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(6);
  }, []);

  const handleSelect = (value: string) => {
    setFitnessLevel(value as FitnessLevel);
  };

  const handleAutoAdvance = () => {
    navigation.navigate('ExperienceResponse');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        How would you describe your current fitness experience?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SingleSelectList
          options={EXPERIENCE_OPTIONS}
          value={fitnessLevel}
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
