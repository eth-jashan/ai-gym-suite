import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  ContinueButton,
  TypingText,
} from '../../../components/onboarding';

type ExperienceResponseScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ExperienceResponse'>;
};

const EXPERIENCE_MESSAGES = {
  beginner: `Starting out as a beginner is a big step, and one that I know can be intimidating.

But I'm here to guide you every step of the way. Your workouts will be simple, effective, and gradually increase as you build strength and confidence.

Let's make this journey fun and sustainable!`,

  intermediate: `Having some experience under your belt is a great foundation to build on!

The key now is consistency and structure. I'll help you establish a routine that fits your lifestyle and progressively challenges you.

Together, we'll turn your sporadic efforts into lasting habits!`,

  advanced: `Impressive! Having consistent workout experience means you're ready for the next level.

I'll help you optimize your training with advanced techniques, periodization, and fine-tuned nutrition to break through plateaus.

Let's push your limits and achieve peak performance!`,
};

export default function ExperienceResponseScreen({ navigation }: ExperienceResponseScreenProps) {
  const { colors } = useTheme();
  const { fitnessLevel, goToStep } = useOnboardingStore();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    goToStep(7);
  }, []);

  const message = EXPERIENCE_MESSAGES[fitnessLevel || 'beginner'];

  const handleTypingComplete = () => {
    setTimeout(() => {
      setShowButton(true);
    }, 300);
  };

  const handleContinue = () => {
    navigation.navigate('Duration');
  };

  return (
    <OnboardingLayout
      mascotExpression="happy"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <View style={styles.container}>
        <TypingText
          text={message}
          speed={20}
          onComplete={handleTypingComplete}
          style={[styles.text, { color: colors.text.primary }]}
        />
      </View>

      {showButton && (
        <ContinueButton onPress={handleContinue} delay={0} />
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
});
