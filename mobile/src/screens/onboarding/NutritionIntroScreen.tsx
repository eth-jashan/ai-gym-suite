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

type NutritionIntroScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'NutritionIntro'>;
};

export default function NutritionIntroScreen({ navigation }: NutritionIntroScreenProps) {
  const { colors } = useTheme();
  const { name, goToStep } = useOnboardingStore();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    goToStep(12);
  }, []);

  const message = `Awesome job ${name}! You're over halfway there! Now, let's tackle nutrition.

Nutrition can be 90% of your fitness success. Without the right nutrition, it's going to be very hard to make progress.

So I'll help you craft a personalized nutrition plan to hit your goals!`;

  const handleTypingComplete = () => {
    setTimeout(() => {
      setShowButton(true);
    }, 300);
  };

  const handleContinue = () => {
    navigation.navigate('Gender');
  };

  return (
    <OnboardingLayout
      mascotExpression="excited"
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
