import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import {
  OnboardingLayout,
  QuestionBubble,
  NumberScroller,
  ContinueButton,
} from '../../../components/onboarding';

type AgeScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Age'>;
};

export default function AgeScreen({ navigation }: AgeScreenProps) {
  const { age, setAge, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(14);
    // Set default age if not set
    if (!age) {
      setAge(28);
    }
  }, []);

  const handleContinue = () => {
    navigation.navigate('Height');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        How old are you?
      </QuestionBubble>

      <View style={styles.container}>
        <NumberScroller
          value={age || 28}
          onChange={setAge}
          min={16}
          max={80}
          step={1}
          unit="years"
        />
      </View>

      <ContinueButton onPress={handleContinue} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
});
