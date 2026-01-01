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

type CurrentWeightScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'CurrentWeight'>;
};

export default function CurrentWeightScreen({ navigation }: CurrentWeightScreenProps) {
  const { colors } = useTheme();
  const { currentWeight, setCurrentWeight, unitSystem, setUnitSystem, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(16);
    // Set default weight if not set
    if (!currentWeight) {
      setCurrentWeight(unitSystem === 'metric' ? 70 : 154);
    }
  }, []);

  const toggleUnit = (unit: 'metric' | 'imperial') => {
    if (unit !== unitSystem) {
      Haptics.selectionAsync();
      setUnitSystem(unit);
      // Convert weight
      if (currentWeight) {
        if (unit === 'imperial') {
          // kg to lb
          setCurrentWeight(Math.round(currentWeight * 2.205));
        } else {
          // lb to kg
          setCurrentWeight(Math.round(currentWeight / 2.205));
        }
      }
    }
  };

  const getUnit = () => unitSystem === 'metric' ? 'kg' : 'lb';
  const getMin = () => unitSystem === 'metric' ? 40 : 88;
  const getMax = () => unitSystem === 'metric' ? 200 : 440;

  const handleContinue = () => {
    navigation.navigate('TargetWeight');
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What is your current weight?
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
          value={currentWeight || (unitSystem === 'metric' ? 70 : 154)}
          onChange={setCurrentWeight}
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
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
