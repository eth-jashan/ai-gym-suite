import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  NumberScroller,
  ContinueButton,
} from '../../../components/onboarding';

type HeightScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Height'>;
};

export default function HeightScreen({ navigation }: HeightScreenProps) {
  const { colors } = useTheme();
  const { height, setHeight, unitSystem, setUnitSystem, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(15);
    // Set default height if not set
    if (!height) {
      setHeight(170);
    }
  }, []);

  const toggleUnit = (unit: 'metric' | 'imperial') => {
    if (unit !== unitSystem) {
      Haptics.selectionAsync();
      setUnitSystem(unit);
      // Convert height
      if (height) {
        if (unit === 'imperial') {
          // cm to inches (for display, we'll show feet/inches)
          setHeight(Math.round(height / 2.54));
        } else {
          // inches to cm
          setHeight(Math.round(height * 2.54));
        }
      }
    }
  };

  const getDisplayValue = () => {
    if (!height) return 170;
    return height;
  };

  const getUnit = () => {
    return unitSystem === 'metric' ? 'cm' : 'in';
  };

  const getMin = () => unitSystem === 'metric' ? 140 : 55;
  const getMax = () => unitSystem === 'metric' ? 220 : 87;

  const handleContinue = () => {
    navigation.navigate('CurrentWeight');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What is your height?
      </QuestionBubble>

      <View style={styles.container}>
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.toggleContainer}
        >
          <Pressable
            style={[
              styles.toggleButton,
              unitSystem === 'metric' && styles.toggleButtonActive,
              {
                backgroundColor: unitSystem === 'metric' ? colors.primary.base : colors.background.surface,
                borderColor: unitSystem === 'metric' ? colors.primary.base : colors.border.default,
              },
            ]}
            onPress={() => toggleUnit('metric')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: unitSystem === 'metric' ? colors.text.onPrimary : colors.text.primary },
              ]}
            >
              Metric
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              unitSystem === 'imperial' && styles.toggleButtonActive,
              {
                backgroundColor: unitSystem === 'imperial' ? colors.primary.base : colors.background.surface,
                borderColor: unitSystem === 'imperial' ? colors.primary.base : colors.border.default,
              },
            ]}
            onPress={() => toggleUnit('imperial')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: unitSystem === 'imperial' ? colors.text.onPrimary : colors.text.primary },
              ]}
            >
              Imperial
            </Text>
          </Pressable>
        </Animated.View>

        <NumberScroller
          value={getDisplayValue()}
          onChange={setHeight}
          min={getMin()}
          max={getMax()}
          step={1}
          unit={getUnit()}
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
  },
  toggleButtonActive: {},
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
