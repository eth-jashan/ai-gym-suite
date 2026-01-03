/**
 * Active Workout Screen
 *
 * The main workout execution screen with:
 * - Workout timer
 * - Current exercise display
 * - Set logging (reps, weight, RPE)
 * - Rest timer
 * - Navigation between exercises
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import {
  useWorkoutStore,
  selectCurrentExercise,
  selectExerciseProgress,
  selectSetsLoggedForCurrentExercise,
  selectElapsedTime,
  selectIsLastExercise,
} from '@/stores/workout-store';
import { Card, Button, Badge, NumberInput } from '@/components/ui';
import { formatDuration, SetLog } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RouteProps = RouteProp<MainStackParamList, 'ActiveWorkout'>;

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { colors, spacing, typography, radius } = useTheme();

  const {
    activeSession,
    logSet,
    nextExercise,
    previousExercise,
    skipExercise,
    completeWorkout,
    cancelWorkout,
    startRestTimer,
    skipRestTimer,
  } = useWorkoutStore();

  // Get derived state
  const currentExercise = useWorkoutStore(selectCurrentExercise);
  const progress = useWorkoutStore(selectExerciseProgress);
  const loggedSets = useWorkoutStore(selectSetsLoggedForCurrentExercise);
  const elapsedSeconds = useWorkoutStore(selectElapsedTime);
  const isLastExercise = useWorkoutStore(selectIsLastExercise);

  // Local state for set input
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(0);
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  console.log('restSeconds',selectCurrentExercise, activeSession);
  // Timer updates
  const [displayTime, setDisplayTime] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useWorkoutStore.getState();
      const elapsed = selectElapsedTime(state);
      setDisplayTime(formatDuration(elapsed));

      // Check rest timer
      const restRemaining = state.activeSession?.restTimerEnd
        ? Math.max(0, Math.round((new Date(state.activeSession.restTimerEnd).getTime() - Date.now()) / 1000))
        : 0;

      if (restRemaining > 0) {
        setShowRestTimer(true);
        setRestSeconds(restRemaining);
      } else if (showRestTimer) {
        setShowRestTimer(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showRestTimer]);

  // Reset inputs when exercise changes
  useEffect(() => {
    if (currentExercise) {
      // Set default values based on target
      const repsStr = currentExercise.reps || currentExercise.targetReps || '10';
      const repsMatch = repsStr.match(/\d+/);
      if (repsMatch) {
        setReps(parseInt(repsMatch[0], 10));
      }
      setWeight(0);
      setRpe(7);
      setNotes('');
    }
  }, [currentExercise?.exerciseId]);

  const handleLogSet = () => {
    if (!currentExercise) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const setData: Omit<SetLog, 'loggedAt'> = {
      setNumber: loggedSets.length + 1,
      repsCompleted: reps,
      weightUsed: weight > 0 ? weight : null,
      rpe: rpe,
      isWarmup: false,
      notes: notes || undefined,
    };

    logSet(currentExercise.exerciseId, setData);

    // Start rest timer
    startRestTimer(currentExercise.restSeconds);
    setShowRestTimer(true);
    setRestSeconds(currentExercise.restSeconds);

    // Reset notes
    setNotes('');
  };

  const handleSkipRest = () => {
    skipRestTimer();
    setShowRestTimer(false);
  };

  const handleNextExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRestTimer(false);
    nextExercise();
  };

  const handlePreviousExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRestTimer(false);
    previousExercise();
  };

  const handleSkipExercise = () => {
    Alert.alert(
      'Skip Exercise',
      'Are you sure you want to skip this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            skipExercise('User skipped');
            setShowRestTimer(false);
          },
        },
      ]
    );
  };

  const handleCompleteWorkout = async () => {
    try {
      const stats = await completeWorkout();
      navigation.replace('WorkoutComplete', {
        workoutId: route.params.workoutId,
        stats,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete workout');
    }
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!activeSession || !currentExercise) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.base }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text.primary }}>Loading workout...</Text>
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
        <Pressable onPress={handleCancelWorkout} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>

        <View style={styles.timerContainer}>
          <Text
            style={[
              styles.timer,
              { color: colors.text.primary, fontSize: typography.sizes['2xl'] },
            ]}
          >
            {displayTime}
          </Text>
          <Text
            style={[
              styles.progressText,
              { color: colors.text.secondary, fontSize: typography.sizes.sm },
            ]}
          >
            Exercise {progress.current} of {progress.total}
          </Text>
        </View>

        <Pressable onPress={handleSkipExercise} style={styles.skipButton}>
          <Ionicons name="play-skip-forward" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Exercise */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Card
            variant="elevated"
            style={[styles.exerciseCard, { marginBottom: spacing[4] }]}
          >
            <Text
              style={[
                styles.exerciseName,
                { color: colors.text.primary, fontSize: typography.sizes.xl },
              ]}
            >
              {currentExercise.name || currentExercise.exercise?.name}
            </Text>

            <View style={styles.exerciseMeta}>
              <Badge variant="primary" size="sm">
                Set {loggedSets.length + 1} of {currentExercise.sets || currentExercise.targetSets}
              </Badge>
              <Text style={[styles.targetText, { color: colors.text.secondary }]}>
                Target: {currentExercise.reps || currentExercise.targetReps} reps
              </Text>
            </View>

            {/* Logged Sets */}
            {loggedSets.length > 0 && (
              <View style={styles.loggedSets}>
                <Text
                  style={[
                    styles.loggedSetsLabel,
                    { color: colors.text.secondary, fontSize: typography.sizes.sm },
                  ]}
                >
                  Completed Sets
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.loggedSetsList}>
                    {loggedSets.map((set, index) => (
                      <View
                        key={index}
                        style={[
                          styles.loggedSetBadge,
                          { backgroundColor: colors.primary.muted },
                        ]}
                      >
                        <Text style={[styles.loggedSetText, { color: colors.primary.base }]}>
                          {set.repsCompleted} × {set.weightUsed || 'BW'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Rest Timer Overlay */}
        {showRestTimer && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card
              variant="surface"
              style={[
                styles.restTimerCard,
                { backgroundColor: colors.primary.muted, marginBottom: spacing[4] },
              ]}
            >
              <Ionicons name="timer-outline" size={32} color={colors.primary.base} />
              <Text
                style={[
                  styles.restTimerValue,
                  { color: colors.primary.base, fontSize: typography.sizes['3xl'] },
                ]}
              >
                {formatDuration(restSeconds)}
              </Text>
              <Text
                style={[
                  styles.restTimerLabel,
                  { color: colors.primary.base, fontSize: typography.sizes.base },
                ]}
              >
                Rest Time
              </Text>
              <Button
                onPress={handleSkipRest}
                variant="ghost"
                size="sm"
                style={{ marginTop: spacing[2] }}
              >
                Skip Rest
              </Button>
            </Card>
          </Animated.View>
        )}

        {/* Set Logger */}
        {!showRestTimer && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <Card variant="surface" style={[styles.loggerCard, { marginBottom: spacing[4] }]}>
              <Text
                style={[
                  styles.loggerTitle,
                  { color: colors.text.primary, fontSize: typography.sizes.lg },
                ]}
              >
                Log Set
              </Text>

              {/* Reps Input */}
              <View style={[styles.inputRow, { marginBottom: spacing[4] }]}>
                <NumberInput
                  label="Reps"
                  value={reps}
                  onChange={setReps}
                  min={1}
                  max={100}
                  size="lg"
                />
              </View>

              {/* Weight Input */}
              <View style={[styles.inputRow, { marginBottom: spacing[4] }]}>
                <NumberInput
                  label="Weight (kg)"
                  value={weight}
                  onChange={setWeight}
                  min={0}
                  max={500}
                  step={2.5}
                  size="lg"
                  unit="kg"
                />
              </View>

              {/* RPE Slider */}
              <View style={[styles.rpeSection, { marginBottom: spacing[4] }]}>
                <Text
                  style={[
                    styles.rpeLabel,
                    { color: colors.text.secondary, fontSize: typography.sizes.sm },
                  ]}
                >
                  RPE (Rate of Perceived Exertion)
                </Text>
                <View style={styles.rpeButtons}>
                  {[6, 7, 8, 9, 10].map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setRpe(value);
                      }}
                      style={[
                        styles.rpeButton,
                        {
                          backgroundColor:
                            rpe === value ? colors.primary.base : colors.background.raised,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rpeButtonText,
                          {
                            color: rpe === value ? colors.text.onPrimary : colors.text.secondary,
                          },
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button
                onPress={handleLogSet}
                variant="primary"
                size="lg"
                fullWidth
                icon="checkmark"
              >
                Log Set
              </Button>
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.background.elevated,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderTopWidth: 1,
            borderTopColor: colors.border.muted,
          },
        ]}
      >
        <Pressable
          onPress={handlePreviousExercise}
          disabled={progress.current === 1}
          style={[
            styles.navButton,
            { opacity: progress.current === 1 ? 0.3 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          <Text style={[styles.navButtonText, { color: colors.text.primary }]}>
            Previous
          </Text>
        </Pressable>

        {isLastExercise && loggedSets.length >= (currentExercise.sets || currentExercise.targetSets || 3) ? (
          <Button
            onPress={handleCompleteWorkout}
            variant="primary"
            size="md"
            icon="checkmark-circle"
          >
            Complete Workout
          </Button>
        ) : (
          <Pressable
            onPress={handleNextExercise}
            disabled={isLastExercise}
            style={[
              styles.navButton,
              { opacity: isLastExercise ? 0.3 : 1 },
            ]}
          >
            <Text style={[styles.navButtonText, { color: colors.text.primary }]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  cancelButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressText: {},
  skipButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Exercise Card
  exerciseCard: {},
  exerciseName: {
    fontWeight: '700',
    marginBottom: 12,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetText: {
    fontSize: 14,
  },
  loggedSets: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  loggedSetsLabel: {
    marginBottom: 8,
  },
  loggedSetsList: {
    flexDirection: 'row',
    gap: 8,
  },
  loggedSetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loggedSetText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Rest Timer
  restTimerCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  restTimerValue: {
    fontWeight: '700',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  restTimerLabel: {
    fontWeight: '500',
  },

  // Logger Card
  loggerCard: {},
  loggerTitle: {
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    alignItems: 'center',
  },

  // RPE
  rpeSection: {},
  rpeLabel: {
    textAlign: 'center',
    marginBottom: 12,
  },
  rpeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  rpeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
