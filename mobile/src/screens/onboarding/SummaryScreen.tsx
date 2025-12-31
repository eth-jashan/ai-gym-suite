import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  ContinueButton,
} from '../../../components/onboarding';

type SummaryScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Summary'>;
};

export default function SummaryScreen({ navigation }: SummaryScreenProps) {
  const { colors } = useTheme();
  const {
    calculatedPlan,
    currentWeight,
    targetWeight,
    workoutDays,
    workoutDuration,
    unitSystem,
    goToStep,
  } = useOnboardingStore();

  useEffect(() => {
    goToStep(21);
  }, []);

  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    return labels[day] || day;
  };

  const handleContinue = () => {
    navigation.navigate('Complete');
  };

  return (
    <OnboardingLayout
      showBack={false}
      mascotExpression="happy"
      onClose={() => navigation.getParent()?.goBack()}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Your Personalized Plan
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Calories Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={[styles.card, { backgroundColor: colors.background.surface }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>
            Daily Calories
          </Text>
          <Text style={[styles.calorieValue, { color: colors.primary.base }]}>
            {calculatedPlan?.dailyCalories?.toLocaleString() || '2,000'} kcal
          </Text>
          <View style={styles.macrosContainer}>
            <MacroItem
              label="Protein"
              value={`${calculatedPlan?.protein || 0}g`}
              colors={colors}
            />
            <MacroItem
              label="Carbs"
              value={`${calculatedPlan?.carbs || 0}g`}
              colors={colors}
            />
            <MacroItem
              label="Fat"
              value={`${calculatedPlan?.fat || 0}g`}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Weekly Workouts Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(300)}
          style={[styles.card, { backgroundColor: colors.background.surface }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>
            Weekly Workouts
          </Text>
          <Text style={[styles.workoutValue, { color: colors.text.primary }]}>
            {workoutDays.length} sessions x {workoutDuration || 45} min
          </Text>
          <View style={styles.scheduleContainer}>
            {calculatedPlan?.workoutSchedule?.map((workout, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Text style={[styles.scheduleDay, { color: colors.primary.base }]}>
                  {getDayLabel(workout.day)}
                </Text>
                <Text style={[styles.scheduleType, { color: colors.text.secondary }]}>
                  {workout.workoutType}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Goal Timeline Card */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(300)}
          style={[styles.card, { backgroundColor: colors.background.surface }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>
            Goal Timeline
          </Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <Text style={[styles.timelineValue, { color: colors.text.primary }]}>
                {currentWeight} {weightUnit}
              </Text>
              <Text style={[styles.timelineLabel, { color: colors.text.tertiary }]}>
                Current
              </Text>
            </View>
            <View style={[styles.timelineArrow, { backgroundColor: colors.primary.base }]} />
            <View style={styles.timelineItem}>
              <Text style={[styles.timelineValue, { color: colors.primary.base }]}>
                {targetWeight} {weightUnit}
              </Text>
              <Text style={[styles.timelineLabel, { color: colors.text.tertiary }]}>
                Target
              </Text>
            </View>
          </View>
          {calculatedPlan?.estimatedEndDate && (
            <Text style={[styles.estimatedDate, { color: colors.text.secondary }]}>
              Est. {formatDate(calculatedPlan.estimatedEndDate)}
            </Text>
          )}
        </Animated.View>

        {/* TDEE Info */}
        {calculatedPlan?.bmr && calculatedPlan?.tdee && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(300)}
            style={[styles.infoCard, { backgroundColor: colors.background.elevated }]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                BMR (Base Metabolic Rate)
              </Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {calculatedPlan.bmr} kcal
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                TDEE (Daily Expenditure)
              </Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {calculatedPlan.tdee} kcal
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <ContinueButton
        onPress={handleContinue}
        label="Start My Journey"
        delay={500}
      />
    </OnboardingLayout>
  );
}

interface MacroItemProps {
  label: string;
  value: string;
  colors: any;
}

function MacroItem({ label, value, colors }: MacroItemProps) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[styles.macroLabel, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  workoutValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  scheduleContainer: {
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
  },
  scheduleType: {
    fontSize: 14,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineItem: {
    alignItems: 'center',
  },
  timelineValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  timelineLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  timelineArrow: {
    flex: 1,
    height: 2,
    marginHorizontal: 16,
  },
  estimatedDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
