/**
 * Weekly Plan Screen
 *
 * Shows the weekly workout plan with day-by-day view.
 * Users can navigate between days and see workout details.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/providers/theme-provider';
import { useWorkoutStore } from '@/stores/workout-store';
import { Card, Button, Badge } from '@/components/ui';
import {
  SPLIT_TYPE_COLORS,
  SPLIT_TYPE_LABELS,
  SplitType,
  getShortDayName,
  getDayName,
} from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_PILL_WIDTH = 48;

export default function WeeklyPlanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, typography, radius } = useTheme();
  const { weeklyPlan, selectedDayIndex, setSelectedDay, isGeneratingPlan, generateWeeklyPlan } = useWorkoutStore();

  const scrollViewRef = useRef<ScrollView>(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDay(dayIndex);
  };

  const handleViewWorkout = (workoutId: string, dayIndex: number) => {
    navigation.navigate('WorkoutDayDetail', { workoutId, dayIndex });
  };

  const handleStartWorkout = (workoutId: string) => {
    navigation.navigate('ActiveWorkout', { workoutId });
  };

  const getCurrentDayWorkout = () => {
    if (!weeklyPlan) return null;
    return weeklyPlan.days.find(d => d.dayIndex === selectedDayIndex);
  };

  const currentWorkout = getCurrentDayWorkout();

  const renderDayPill = (dayIndex: number) => {
    const isSelected = selectedDayIndex === dayIndex;
    const isToday = new Date().getDay() === dayIndex;
    const hasWorkout = weeklyPlan?.days.some(d => d.dayIndex === dayIndex);
    const workout = weeklyPlan?.days.find(d => d.dayIndex === dayIndex);
    const splitColor = workout
      ? SPLIT_TYPE_COLORS[workout.splitType as SplitType]
      : colors.text.tertiary;

    return (
      <Pressable
        key={dayIndex}
        onPress={() => handleDaySelect(dayIndex)}
        style={[
          styles.dayPill,
          {
            width: DAY_PILL_WIDTH,
            backgroundColor: isSelected
              ? colors.primary.base
              : colors.background.surface,
            borderRadius: radius.xl,
          },
        ]}
      >
        <Text
          style={[
            styles.dayPillText,
            {
              color: isSelected ? colors.text.onPrimary : colors.text.secondary,
              fontSize: typography.sizes.sm,
            },
          ]}
        >
          {getShortDayName(dayIndex)}
        </Text>
        {hasWorkout && (
          <View
            style={[
              styles.workoutIndicator,
              {
                backgroundColor: isSelected ? colors.text.onPrimary : splitColor,
              },
            ]}
          />
        )}
        {isToday && !isSelected && (
          <View
            style={[
              styles.todayDot,
              { backgroundColor: colors.primary.base },
            ]}
          />
        )}
      </Pressable>
    );
  };

  const renderWorkoutContent = () => {
    if (!currentWorkout) {
      // Rest day
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.restDayContainer}
        >
          <View
            style={[
              styles.restDayIcon,
              { backgroundColor: colors.primary.muted },
            ]}
          >
            <Ionicons name="bed-outline" size={48} color={colors.primary.base} />
          </View>
          <Text
            style={[
              styles.restDayTitle,
              { color: colors.text.primary, fontSize: typography.sizes.xl },
            ]}
          >
            Rest Day
          </Text>
          <Text
            style={[
              styles.restDaySubtitle,
              { color: colors.text.secondary, fontSize: typography.sizes.base },
            ]}
          >
            {getDayName(selectedDayIndex)} is your recovery day.
            {'\n'}Focus on rest, stretching, or light activity.
          </Text>
        </Animated.View>
      );
    }

    const splitColor = SPLIT_TYPE_COLORS[currentWorkout.splitType as SplitType] || colors.primary.base;
    const workoutId = weeklyPlan ? `${weeklyPlan.id}-day-${currentWorkout.dayIndex}` : '';

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        {/* Workout Header */}
        <View
          style={[
            styles.workoutHeader,
            {
              backgroundColor: splitColor + '15',
              borderRadius: radius.xl,
              padding: spacing[4],
              marginBottom: spacing[4],
            },
          ]}
        >
          <View style={styles.workoutHeaderTop}>
            <Badge color={splitColor} size="md">
              {SPLIT_TYPE_LABELS[currentWorkout.splitType as SplitType] || currentWorkout.splitType}
            </Badge>
            <Text
              style={[
                styles.dayLabel,
                { color: colors.text.secondary, fontSize: typography.sizes.sm },
              ]}
            >
              {getDayName(selectedDayIndex)}
            </Text>
          </View>

          <Text
            style={[
              styles.workoutTitle,
              { color: colors.text.primary, fontSize: typography.sizes['2xl'] },
            ]}
          >
            {currentWorkout.dayName}
          </Text>

          <View style={styles.muscleChips}>
            {currentWorkout.focusMuscles.map((muscle, index) => (
              <View
                key={index}
                style={[
                  styles.muscleChip,
                  { backgroundColor: colors.background.surface, borderRadius: radius.full },
                ]}
              >
                <Text
                  style={[
                    styles.muscleChipText,
                    { color: colors.text.secondary, fontSize: typography.sizes.sm },
                  ]}
                >
                  {muscle}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                {currentWorkout.estimatedDuration} min
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={18} color={colors.text.secondary} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                {currentWorkout.exercises.length} exercises
              </Text>
            </View>
          </View>
        </View>

        {/* Exercise List */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text.primary, fontSize: typography.sizes.lg, marginBottom: spacing[3] },
          ]}
        >
          Exercises
        </Text>

        {currentWorkout.exercises.map((exercise, index) => (
          <Animated.View
            key={exercise.id}
            entering={FadeInUp.delay(index * 50).duration(300)}
          >
            <Card
              variant="surface"
              style={[styles.exerciseCard, { marginBottom: spacing[3] }]}
            >
              <View style={styles.exerciseRow}>
                <View
                  style={[
                    styles.exerciseOrder,
                    { backgroundColor: splitColor + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseOrderText,
                      { color: splitColor, fontSize: typography.sizes.sm },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text
                    style={[
                      styles.exerciseName,
                      { color: colors.text.primary, fontSize: typography.sizes.base },
                    ]}
                  >
                    {exercise.name || exercise.exercise?.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseMeta,
                      { color: colors.text.secondary, fontSize: typography.sizes.sm },
                    ]}
                  >
                    {exercise.sets || exercise.targetSets} sets × {exercise.reps || exercise.targetReps} reps • {exercise.restSeconds}s rest
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </View>
            </Card>
          </Animated.View>
        ))}

        {/* Start Workout Button */}
        <Button
          onPress={() => handleStartWorkout(workoutId)}
          variant="primary"
          size="lg"
          fullWidth
          icon="play"
          style={{ marginTop: spacing[4] }}
        >
          Start Workout
        </Button>
      </Animated.View>
    );
  };

  if (!weeklyPlan) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.base }]}
        edges={['top']}
      >
        <View style={[styles.header, { paddingHorizontal: spacing[4] }]}>
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text.primary, fontSize: typography.sizes.lg },
            ]}
          >
            Weekly Plan
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text.primary, fontSize: typography.sizes.xl },
            ]}
          >
            No Plan Yet
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: colors.text.secondary, fontSize: typography.sizes.base },
            ]}
          >
            Generate a workout plan to get started.
          </Text>
          <Button
            onPress={generateWeeklyPlan}
            variant="primary"
            loading={isGeneratingPlan}
            icon="sparkles"
            style={{ marginTop: spacing[4] }}
          >
            Generate Plan
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing[4] }]}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontSize: typography.sizes.lg },
          ]}
        >
          Week {weeklyPlan.weekNumber}
        </Text>
        <Pressable onPress={generateWeeklyPlan} disabled={isGeneratingPlan}>
          <Ionicons
            name="refresh"
            size={24}
            color={isGeneratingPlan ? colors.text.disabled : colors.text.primary}
          />
        </Pressable>
      </View>

      {/* Day Pills */}
      <View style={[styles.dayPillsContainer, { paddingHorizontal: spacing[4] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPillsContent}
        >
          {[0, 1, 2, 3, 4, 5, 6].map(renderDayPill)}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderWorkoutContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: '600',
  },
  dayPillsContainer: {
    marginBottom: 16,
  },
  dayPillsContent: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontWeight: '600',
  },
  workoutIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // Rest Day
  restDayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  restDayIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  restDayTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  restDaySubtitle: {
    textAlign: 'center',
  },

  // Workout Header
  workoutHeader: {},
  workoutHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {},
  workoutTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  muscleChipText: {
    fontWeight: '500',
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },

  // Exercise Cards
  sectionTitle: {
    fontWeight: '600',
  },
  exerciseCard: {},
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseOrder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseOrderText: {
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {},

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
