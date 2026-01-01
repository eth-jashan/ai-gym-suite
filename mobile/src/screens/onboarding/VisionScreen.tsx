import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  ContinueButton,
  TypingText,
} from '../../../components/onboarding';

type VisionScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Vision'>;
};

export default function VisionScreen({ navigation }: VisionScreenProps) {
  const { colors } = useTheme();
  const { name, goToStep } = useOnboardingStore();
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [completedParagraphs, setCompletedParagraphs] = useState<string[]>([]);

  useEffect(() => {
    goToStep(3);
  }, []);

  const paragraphs = [
    `Perfect ${name || 'there'}! Now close your eyes for a moment and imagine...`,
    `It's 90 days from today. You've achieved your goal. You wake up, look in the mirror, and smile at the transformation.`,
    `You feel strong, confident, and energized. Your clothes fit perfectly. People notice the positive change in you.`,
    `How does that feel? That person can be you. And I'm here to make it happen.`,
  ];

  const handleParagraphComplete = useCallback(() => {
    const currentText = paragraphs[currentParagraph];

    if (currentParagraph < paragraphs.length - 1) {
      setCompletedParagraphs(prev => [...prev, currentText]);
      setTimeout(() => {
        setCurrentParagraph(prev => prev + 1);
      }, 400);
    } else {
      setCompletedParagraphs(prev => [...prev, currentText]);
      setTimeout(() => {
        setShowButton(true);
      }, 500);
    }
  }, [currentParagraph, paragraphs]);

  const handleContinue = () => {
    navigation.navigate('Obstacles');
  };

  return (
    <OnboardingLayout
      mascotExpression="excited"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <View style={styles.container}>
        {/* Completed paragraphs - shown as static text */}
        {completedParagraphs.map((text, index) => (
          <View key={`completed-${index}`} style={styles.paragraphContainer}>
            <Text
              style={[
                styles.paragraph,
                { color: colors.text.primary },
                index === 0 && styles.firstParagraph,
              ]}
            >
              {text}
            </Text>
          </View>
        ))}

        {/* Current paragraph - typing animation */}
        {currentParagraph < paragraphs.length && !completedParagraphs.includes(paragraphs[currentParagraph]) && (
          <Animated.View
            key={`typing-${currentParagraph}`}
            entering={FadeIn.duration(300)}
            style={styles.paragraphContainer}
          >
            <TypingText
              text={paragraphs[currentParagraph]}
              speed={25}
              onComplete={handleParagraphComplete}
              style={[
                styles.paragraph,
                { color: colors.text.primary },
                currentParagraph === 0 && styles.firstParagraph,
              ]}
            />
          </Animated.View>
        )}
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
  paragraphContainer: {
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  firstParagraph: {
    fontSize: 20,
    fontWeight: '500',
  },
});
