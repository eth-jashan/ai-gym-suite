/**
 * Workout Day Detail Screen
 *
 * Shows full workout details for a specific day with exercise cards.
 * Allows viewing exercise details and starting the workout.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/providers/theme-provider';
import { useWorkoutStore } from '@/stores/workout-store';
import { Card, Button, Badge, BottomSheet } from '@/components/ui';
import {
  SPLIT_TYPE_COLORS,
  SPLIT_TYPE_LABELS,
  SplitType,
  getDayName,
  WorkoutExercise,
} from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RouteProps = RouteProp<MainStackParamList, 'WorkoutDayDetail'>;

export default function WorkoutDayDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { colors, spacing, typography, radius } = useTheme();
  const { weeklyPlan, startWorkout } = useWorkoutStore();

  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);

  const { workoutId, dayIndex } = route.params;

  // Find the workout for this day
  const workout = weeklyPlan?.days.find(d => d.dayIndex === dayIndex);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleStartWorkout = async () => {
    if (workout) {
      const fullWorkout = {
        id: workoutId,
        scheduledDate: new Date().toISOString().split('T')[0],
        dayOfWeek: workout.dayIndex,
        workoutType: workout.splitType,
        title: workout.dayName,
        focusMuscles: workout.focusMuscles,
        estimatedDuration: workout.estimatedDuration,
        status: 'SCHEDULED' as const,
        exercises: workout.exercises,
      };

      await startWorkout(fullWorkout);
      navigation.navigate('ActiveWorkout', { workoutId });
    }
  };

  const handleExercisePress = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseExerciseDetail = () => {
    setSelectedExercise(null);
  };

  if (!workout) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.base }]}
        edges={['top']}
      >
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.text.primary }}>Workout not found</Text>
          <Button onPress={handleGoBack} variant="secondary">
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const splitColor = SPLIT_TYPE_COLORS[workout.splitType as SplitType] || colors.primary.base;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[splitColor + '30', 'transparent']}
            style={[styles.heroGradient, { borderRadius: radius['2xl'] }]}
          >
            {/* Back Button */}
            <Pressable
              onPress={handleGoBack}
              style={[styles.backButton, { backgroundColor: colors.background.base + '80' }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </Pressable>

            <View style={[styles.heroContent, { padding: spacing[4] }]}>
              <Badge color={splitColor} size="md">
                {SPLIT_TYPE_LABELS[workout.splitType as SplitType] || workout.splitType}
              </Badge>

              <Text
                style={[
                  styles.heroTitle,
                  { color: colors.text.primary, fontSize: typography.sizes['3xl'] },
                ]}
              >
                {workout.dayName}
              </Text>

              <Text
                style={[
                  styles.heroDay,
                  { color: colors.text.secondary, fontSize: typography.sizes.base },
                ]}
              >
                {getDayName(workout.dayIndex)}
              </Text>

              <View style={styles.muscleChips}>
                {workout.focusMuscles.map((muscle, index) => (
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

              <View style={styles.heroMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                  <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                    {workout.estimatedDuration} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={20} color={colors.text.secondary} />
                  <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Exercise List */}
        <View style={[styles.exerciseSection, { paddingHorizontal: spacing[4] }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, fontSize: typography.sizes.lg, marginBottom: spacing[3] },
            ]}
          >
            Exercises
          </Text>

          {workout.exercises.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              entering={FadeInUp.delay(index * 50).duration(300)}
            >
              <Card
                variant="surface"
                onPress={() => handleExercisePress(exercise)}
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
                        { color: splitColor, fontSize: typography.sizes.base },
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
                      {exercise.sets || exercise.targetSets} sets × {exercise.reps || exercise.targetReps} reps
                    </Text>
                    <View style={styles.exerciseTags}>
                      {(exercise.exercise?.primaryMuscles || []).slice(0, 2).map((muscle, i, arr) => (
                        <Text
                          key={i}
                          style={[
                            styles.exerciseTag,
                            { color: colors.text.tertiary, fontSize: typography.sizes.xs },
                          ]}
                        >
                          {muscle}{i < Math.min(arr.length - 1, 1) ? ' • ' : ''}
                        </Text>
                      ))}
                    </View>
                  </View>

                  <View style={styles.exerciseActions}>
                    <Pressable
                      style={[styles.iconButton, { backgroundColor: colors.background.raised }]}
                    >
                      <Ionicons name="swap-horizontal" size={18} color={colors.text.secondary} />
                    </Pressable>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.text.tertiary}
                    />
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Start Button */}
      <View
        style={[
          styles.stickyButton,
          {
            backgroundColor: colors.background.base,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderTopWidth: 1,
            borderTopColor: colors.border.muted,
          },
        ]}
      >
        <Button
          onPress={handleStartWorkout}
          variant="primary"
          size="lg"
          fullWidth
          icon="play"
        >
          Start Workout
        </Button>
      </View>

      {/* Exercise Detail Bottom Sheet */}
      <BottomSheet
        visible={!!selectedExercise}
        onClose={handleCloseExerciseDetail}
        snapPoints={[500]}
      >
        {selectedExercise && (
          <View>
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.text.primary, fontSize: typography.sizes.xl },
              ]}
            >
              {selectedExercise.name || selectedExercise.exercise?.name}
            </Text>

            <View style={styles.sheetMeta}>
              <Badge variant="primary" size="sm">
                {selectedExercise.sets || selectedExercise.targetSets} sets
              </Badge>
              <Badge variant="default" size="sm">
                {selectedExercise.reps || selectedExercise.targetReps} reps
              </Badge>
              <Badge variant="default" size="sm">
                {selectedExercise.restSeconds}s rest
              </Badge>
            </View>

            <Text
              style={[
                styles.sheetLabel,
                { color: colors.text.secondary, fontSize: typography.sizes.sm },
              ]}
            >
              Target Muscles
            </Text>
            <View style={styles.sheetChips}>
              {(selectedExercise.exercise?.primaryMuscles || []).map((muscle, i) => (
                <Badge key={i} variant="primary" size="sm">
                  {muscle}
                </Badge>
              ))}
              {(selectedExercise.exercise?.secondaryMuscles || []).map((muscle, i) => (
                <Badge key={i} variant="default" size="sm">
                  {muscle}
                </Badge>
              ))}
            </View>

            {selectedExercise.exercise?.instructions && (
              <>
                <Text
                  style={[
                    styles.sheetLabel,
                    { color: colors.text.secondary, fontSize: typography.sizes.sm, marginTop: spacing[4] },
                  ]}
                >
                  Instructions
                </Text>
                <Text
                  style={[
                    styles.sheetText,
                    { color: colors.text.primary, fontSize: typography.sizes.base },
                  ]}
                >
                  {selectedExercise.exercise.instructions}
                </Text>
              </>
            )}

            <View style={{ marginTop: spacing[6], flexDirection: 'row', gap: spacing[3] }}>
              <Button
                onPress={handleCloseExerciseDetail}
                variant="outline"
                style={{ flex: 1 }}
              >
                Swap Exercise
              </Button>
              <Button
                onPress={handleCloseExerciseDetail}
                variant="primary"
                style={{ flex: 1 }}
              >
                Got It
              </Button>
            </View>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  // Hero
  heroContainer: {
    marginBottom: 24,
  },
  heroGradient: {
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 220,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroContent: {
    marginTop: 56,
  },
  heroTitle: {
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  heroDay: {
    marginBottom: 16,
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
  heroMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 15,
  },

  // Exercise Section
  exerciseSection: {},
  sectionTitle: {
    fontWeight: '600',
  },
  exerciseCard: {},
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseOrder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  exerciseMeta: {
    marginBottom: 4,
  },
  exerciseTags: {
    flexDirection: 'row',
  },
  exerciseTag: {},
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sticky Button
  stickyButton: {},

  // Bottom Sheet
  sheetTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sheetLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetText: {
    lineHeight: 24,
  },
});
