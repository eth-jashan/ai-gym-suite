import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  ContinueButton,
} from '../../../components/onboarding';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { name, setName, goToStep } = useOnboardingStore();
  const [localName, setLocalName] = useState(name);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    goToStep(1);
    // Auto-focus the input after a brief delay for animation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (localName.trim()) {
      Keyboard.dismiss();
      setName(localName.trim());
      navigation.navigate('Goal');
    }
  };

  const isValid = localName.trim().length > 0;

  return (
    <OnboardingLayout
      showBack={false}
      mascotExpression="happy"
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        Hi! I'm your AI fitness coach. What should I call you?
      </QuestionBubble>

      <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.background.surface,
              color: colors.text.primary,
              borderColor: localName ? colors.primary.base : colors.border.default,
            },
          ]}
          placeholder="Enter your name..."
          placeholderTextColor={colors.text.tertiary}
          value={localName}
          onChangeText={setLocalName}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
      </Animated.View>

      <ContinueButton
        onPress={handleContinue}
        disabled={!isValid}
        delay={400}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 8,
  },
  input: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
});
