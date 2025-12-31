import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  ContinueButton,
} from '../../../components/onboarding';

type WeightRateScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'WeightRate'>;
};

const RATE_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.5];

const RATE_LABELS: Record<number, { label: string; health: string }> = {
  0.25: { label: 'Slow & Steady', health: 'Very Safe' },
  0.5: { label: 'Recommended', health: 'Safe' },
  0.75: { label: 'Moderate', health: 'Moderate' },
  1.0: { label: 'Aggressive', health: 'Challenging' },
  1.5: { label: 'Very Aggressive', health: 'Not Recommended' },
};

export default function WeightRateScreen({ navigation }: WeightRateScreenProps) {
  const { colors } = useTheme();
  const {
    weightLossRate,
    setWeightLossRate,
    currentWeight,
    targetWeight,
    unitSystem,
    primaryGoal,
    goToStep,
  } = useOnboardingStore();

  useEffect(() => {
    goToStep(19);
    if (!weightLossRate) {
      setWeightLossRate(0.5);
    }
  }, []);

  const rate = weightLossRate || 0.5;

  // Calculate estimated end date
  const estimatedDate = useMemo(() => {
    if (!currentWeight || !targetWeight) return null;

    const weightDiff = Math.abs(currentWeight - targetWeight);
    // Convert to kg if imperial
    const weightDiffKg = unitSystem === 'imperial' ? weightDiff / 2.205 : weightDiff;
    const weeksToGoal = weightDiffKg / rate;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeksToGoal * 7);

    return endDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [currentWeight, targetWeight, rate, unitSystem]);

  const getRateLabel = () => {
    const closest = RATE_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
    );
    return RATE_LABELS[closest];
  };

  const handleSliderChange = (value: number) => {
    // Snap to nearest option
    const closest = RATE_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    setWeightLossRate(closest);
  };

  const handleContinue = () => {
    navigation.navigate('Processing');
  };

  const rateInfo = getRateLabel();
  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';
  const displayRate = unitSystem === 'imperial' ? Math.round(rate * 2.205 * 10) / 10 : rate;

  const isGaining = primaryGoal === 'build_muscle' || (currentWeight && targetWeight && targetWeight > currentWeight);

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        How fast do you want to reach your weight goal?
      </QuestionBubble>

      <View style={styles.container}>
        {/* Weight Range Display */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.weightDisplay}
        >
          <View style={styles.weightRow}>
            <Text style={[styles.weightValue, { color: colors.text.primary }]}>
              {currentWeight} {weightUnit}
            </Text>
            <Text style={[styles.arrow, { color: colors.text.tertiary }]}>→</Text>
            <Text style={[styles.weightValue, { color: colors.primary.base }]}>
              {targetWeight} {weightUnit}
            </Text>
          </View>
          {estimatedDate && (
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              Est. {estimatedDate}
            </Text>
          )}
        </Animated.View>

        {/* Rate Display */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(300)}
          style={styles.rateDisplay}
        >
          <Text style={[styles.rateValue, { color: colors.primary.base }]}>
            {displayRate} {weightUnit} per week
          </Text>
          <Text style={[styles.rateLabel, { color: colors.text.secondary }]}>
            {rateInfo.label}
          </Text>
        </Animated.View>

        {/* Slider */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(300)}
          style={styles.sliderContainer}
        >
          <Slider
            style={styles.slider}
            minimumValue={0.25}
            maximumValue={1.5}
            value={rate}
            onValueChange={handleSliderChange}
            step={0.25}
            minimumTrackTintColor={colors.primary.base}
            maximumTrackTintColor={colors.background.surface}
            thumbTintColor={colors.primary.base}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>0.25</Text>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>0.5</Text>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>0.75</Text>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>1.0</Text>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>1.5</Text>
          </View>
        </Animated.View>

        {/* Health Info */}
        <Animated.View entering={FadeInUp.delay(400).duration(300)}>
          <Text style={[styles.healthText, { color: colors.text.secondary }]}>
            {rate <= 0.5
              ? 'This is considered a healthy rate of weight change that is more balanced and sustainable while getting you to your target weight in a reasonable amount of time.'
              : rate <= 0.75
              ? 'This is a moderate rate that requires more discipline but can still be achieved safely with proper nutrition.'
              : 'This aggressive rate is challenging to maintain and may require significant lifestyle changes. Consider a more gradual approach for long-term success.'}
          </Text>
        </Animated.View>
      </View>

      <ContinueButton onPress={handleContinue} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  weightDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
  },
  dateText: {
    fontSize: 14,
    marginTop: 8,
  },
  rateDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  rateLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  sliderContainer: {
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 12,
  },
  healthText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
