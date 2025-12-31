import React, { useEffect, useRef } from 'react';
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
} from '../../../components/onboarding';

type TargetWeightScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'TargetWeight'>;
};

export default function TargetWeightScreen({ navigation }: TargetWeightScreenProps) {
  const { colors } = useTheme();
  const { targetWeight, setTargetWeight, currentWeight, unitSystem, setUnitSystem, goToStep } = useOnboardingStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    goToStep(17);
    // Set default target weight if not set (slightly less than current)
    if (!targetWeight && currentWeight) {
      const defaultTarget = unitSystem === 'metric'
        ? Math.max(45, currentWeight - 10)
        : Math.max(100, currentWeight - 22);
      setTargetWeight(defaultTarget);
    }
  }, []);

  const toggleUnit = (unit: 'metric' | 'imperial') => {
    if (unit !== unitSystem) {
      Haptics.selectionAsync();
      setUnitSystem(unit);
      if (targetWeight) {
        if (unit === 'imperial') {
          setTargetWeight(Math.round(targetWeight * 2.205));
        } else {
          setTargetWeight(Math.round(targetWeight / 2.205));
        }
      }
    }
  };

  const handleChange = (value: number) => {
    setTargetWeight(value);

    // Debounce auto-advance
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      navigation.navigate('ActivityLevel');
    }, 800);
  };

  const getUnit = () => unitSystem === 'metric' ? 'kg' : 'lb';
  const getMin = () => unitSystem === 'metric' ? 40 : 88;
  const getMax = () => unitSystem === 'metric' ? 200 : 440;

  const getDefaultTarget = () => {
    if (targetWeight) return targetWeight;
    if (currentWeight) {
      return unitSystem === 'metric'
        ? Math.max(45, currentWeight - 10)
        : Math.max(100, currentWeight - 22);
    }
    return unitSystem === 'metric' ? 65 : 143;
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What is your target weight?
      </QuestionBubble>

      <View style={styles.container}>
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.toggleContainer}
        >
          <Pressable
            style={[
              styles.toggleButton,
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
          value={getDefaultTarget()}
          onChange={handleChange}
          min={getMin()}
          max={getMax()}
          step={1}
          unit={getUnit()}
        />

        <Animated.View entering={FadeInUp.delay(300).duration(300)}>
          <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
            Scroll to select your target weight
          </Text>
        </Animated.View>
      </View>
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
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
