/**
 * Program Day Screen
 *
 * Shows detailed view of a single day's workout including:
 * - Day information and phase
 * - Exercise list with detailed info
 * - Tap on exercise to see how to do it
 * - Mark workout as complete
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useProgramStore } from '@/stores/program-store';
import { Button } from '@/components/ui';
import { PHASE_COLORS, getPhaseForDay } from '@/lib/types/program';
import { SPLIT_TYPE_COLORS, SPLIT_TYPE_LABELS, SplitType } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RoutePropType = RouteProp<{ ProgramDay: { dayNumber: number } }, 'ProgramDay'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Exercise icons mapping
const EXERCISE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cardio: 'walk',
  stretch: 'body',
  mobility: 'body',
  warmup: 'body',
  bench: 'fitness',
  press: 'fitness',
  push: 'fitness',
  row: 'fitness',
  pull: 'fitness',
  squat: 'fitness',
  lunge: 'walk',
  deadlift: 'fitness',
  curl: 'fitness',
  raise: 'fitness',
  plank: 'body',
  crunch: 'body',
  default: 'barbell',
};

const getExerciseIcon = (name: string): keyof typeof Ionicons.glyphMap => {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(EXERCISE_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return 'barbell';
};

export default function ProgramDayScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { colors, spacing, radius } = useTheme();
  const { getDayByNumber, completeDay, completeExercise, getTodayDayNumber } = useProgramStore();

  const dayNumber = route.params?.dayNumber || 1;
  const day = getDayByNumber(dayNumber);
  const todayDayNumber = getTodayDayNumber();

  const phaseInfo = getPhaseForDay(dayNumber);
  const isToday = dayNumber === todayDayNumber;
  const isPast = dayNumber < todayDayNumber;
  const isFuture = dayNumber > todayDayNumber;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleExercisePress = (exerciseId: string) => {
    Haptics.selectionAsync();
    navigation.navigate('ExerciseDetail' as keyof MainStackParamList, {
      exerciseId,
      dayNumber,
    } as any);
  };

  const handleCompleteWorkout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeDay(dayNumber);
  };

  // Group exercises into warmup and main
  const groupedExercises = useMemo(() => {
    if (!day || day.isRestDay) return { warmup: [], main: [] };

    const warmup = day.exercises.slice(0, 2); // First 2 are warmup
    const main = day.exercises.slice(2);

    return { warmup, main };
  }, [day]);

  const completedCount = day?.exercises.filter((e) => e.isCompleted).length || 0;
  const totalCount = day?.exercises.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ============================================================================
  // HEADER
  // ============================================================================

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
      <Pressable onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </Pressable>

      <View style={styles.headerCenter}>
        <View style={[styles.dayBadge, { backgroundColor: PHASE_COLORS[phaseInfo.phase] + '20' }]}>
          <Text style={[styles.dayBadgeText, { color: PHASE_COLORS[phaseInfo.phase] }]}>
            DAY {dayNumber}
          </Text>
        </View>
        {isToday && (
          <View style={[styles.todayBadge, { backgroundColor: colors.primary.base }]}>
            <Text style={[styles.todayBadgeText, { color: colors.background.base }]}>TODAY</Text>
          </View>
        )}
      </View>

      <View style={{ width: 32 }} />
    </Animated.View>
  );

  // ============================================================================
  // REST DAY VIEW
  // ============================================================================

  if (day?.isRestDay) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
        {renderHeader()}

        <View style={styles.restDayContainer}>
          <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            style={[styles.restDayCard, { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] }]}
          >
            <View style={[styles.restIcon, { backgroundColor: colors.primary.subtle }]}>
              <Ionicons name="moon" size={48} color={colors.primary.base} />
            </View>

            <Text style={[styles.restTitle, { color: colors.text.primary }]}>Rest Day</Text>
            <Text style={[styles.restSubtitle, { color: colors.text.secondary }]}>
              Your body rebuilds and grows stronger during rest. Take this day to:
            </Text>

            <View style={styles.restTips}>
              {[
                { icon: 'water', text: 'Stay hydrated - drink plenty of water' },
                { icon: 'bed', text: 'Get 7-9 hours of quality sleep' },
                { icon: 'nutrition', text: 'Eat nutritious, protein-rich meals' },
                { icon: 'body', text: 'Light stretching or walking is encouraged' },
              ].map((tip, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInUp.delay(200 + index * 50).duration(400)}
                  style={[styles.restTip, { backgroundColor: colors.background.surface }]}
                >
                  <Ionicons name={tip.icon as any} size={20} color={colors.primary.base} />
                  <Text style={[styles.restTipText, { color: colors.text.secondary }]}>{tip.text}</Text>
                </Animated.View>
              ))}
            </View>

            {day.isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: colors.primary.base + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary.base} />
                <Text style={[styles.completedText, { color: colors.primary.base }]}>Day Complete</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // WORKOUT DAY VIEW
  // ============================================================================

  if (!day) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Day not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const splitColor = day.splitType ? SPLIT_TYPE_COLORS[day.splitType as SplitType] : colors.primary.base;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing[4], paddingBottom: spacing[10] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View
            style={[styles.workoutCard, { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] }]}
          >
            <LinearGradient
              colors={[splitColor + '15', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.workoutGradient, { borderRadius: radius['2xl'] }]}
            />

            <View style={styles.workoutContent}>
              {/* Split Badge & Phase */}
              <View style={styles.workoutTopRow}>
                <View style={[styles.splitBadge, { backgroundColor: colors.background.surface }]}>
                  <Text style={[styles.splitBadgeText, { color: colors.text.primary }]}>
                    {SPLIT_TYPE_LABELS[day.splitType as SplitType] || day.splitType}
                  </Text>
                </View>
                <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[phaseInfo.phase] + '20' }]}>
                  <Text style={[styles.phaseBadgeText, { color: PHASE_COLORS[phaseInfo.phase] }]}>
                    {phaseInfo.name}
                  </Text>
                </View>
              </View>

              {/* Title & Muscles */}
              <Text style={[styles.workoutTitle, { color: colors.text.primary }]}>{day.title}</Text>
              <Text style={[styles.workoutMuscles, { color: colors.text.secondary }]}>
                {day.focusMuscles.join(' • ')}
              </Text>

              {/* Metrics */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                  <Ionicons name="time-outline" size={14} color={colors.primary.base} />
                  <Text style={[styles.metricText, { color: colors.text.primary }]}>
                    {day.estimatedDuration}m
                  </Text>
                </View>
                <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                  <Ionicons name="barbell-outline" size={14} color={colors.primary.base} />
                  <Text style={[styles.metricText, { color: colors.text.primary }]}>
                    {day.exercises.length} Exercises
                  </Text>
                </View>
                <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                  <Ionicons name="flame-outline" size={14} color="#F97316" />
                  <Text style={[styles.metricText, { color: colors.text.primary }]}>
                    {day.estimatedCalories} kcal
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {!day.isCompleted && (
                <View style={{ marginTop: spacing[4] }}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>Progress</Text>
                    <Text style={[styles.progressValue, { color: colors.text.primary }]}>
                      {completedCount}/{totalCount}
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.background.surface }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%`, backgroundColor: colors.primary.base },
                      ]}
                    />
                  </View>
                </View>
              )}

              {day.isCompleted && (
                <View
                  style={[styles.completedBadge, { backgroundColor: colors.primary.base + '20', marginTop: spacing[4] }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary.base} />
                  <Text style={[styles.completedText, { color: colors.primary.base }]}>Workout Complete!</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Warmup Section */}
        {groupedExercises.warmup.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ marginTop: spacing[6] }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>WARM UP</Text>
              <View style={[styles.sectionCount, { backgroundColor: colors.background.elevated }]}>
                <Text style={[styles.sectionCountText, { color: colors.text.tertiary }]}>
                  {groupedExercises.warmup.length} Movements
                </Text>
              </View>
            </View>

            {groupedExercises.warmup.map((exercise, index) => (
              <Animated.View key={exercise.exerciseId} entering={FadeInUp.delay(250 + index * 50).duration(300)}>
                <Pressable
                  onPress={() => handleExercisePress(exercise.exerciseId)}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: colors.background.elevated,
                      borderRadius: radius.xl,
                      opacity: exercise.isCompleted ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: colors.background.surface }]}>
                    <Ionicons name={getExerciseIcon(exercise.name || '')} size={22} color={colors.primary.base} />
                  </View>

                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        {
                          color: colors.text.primary,
                          textDecorationLine: exercise.isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: colors.text.tertiary }]}>
                      Tap to see instructions
                    </Text>
                  </View>

                  <View style={styles.exerciseStats}>
                    <Text style={[styles.exerciseDuration, { color: colors.text.primary }]}>
                      {exercise.reps || '5 min'}
                    </Text>
                    {exercise.isCompleted && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary.base} />
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Main Circuit Section */}
        {groupedExercises.main.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={{ marginTop: spacing[5] }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>MAIN WORKOUT</Text>
              <View style={[styles.sectionCount, { backgroundColor: colors.background.elevated }]}>
                <Text style={[styles.sectionCountText, { color: colors.text.tertiary }]}>
                  {groupedExercises.main.length} Exercises
                </Text>
              </View>
            </View>

            {groupedExercises.main.map((exercise, index) => (
              <Animated.View key={exercise.exerciseId} entering={FadeInUp.delay(350 + index * 50).duration(300)}>
                <Pressable
                  onPress={() => handleExercisePress(exercise.exerciseId)}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: colors.background.elevated,
                      borderRadius: radius.xl,
                      opacity: exercise.isCompleted ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: colors.background.surface }]}>
                    <Ionicons name={getExerciseIcon(exercise.name || '')} size={22} color={colors.primary.base} />
                  </View>

                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        {
                          color: colors.text.primary,
                          textDecorationLine: exercise.isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: colors.text.tertiary }]}>
                      {exercise.exerciseDetails?.primaryMuscles?.[0] || 'Tap to see details'}
                    </Text>
                  </View>

                  <View style={styles.exerciseStats}>
                    <Text style={[styles.exerciseSets, { color: colors.text.primary }]}>
                      {exercise.sets} Sets
                    </Text>
                    <Text style={[styles.exerciseReps, { color: colors.primary.base }]}>{exercise.reps}</Text>
                    {exercise.isCompleted && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary.base} />
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Complete Button */}
        {!day.isCompleted && (isToday || isPast) && (
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={{ marginTop: spacing[6] }}>
            <Button onPress={handleCompleteWorkout} variant="primary" size="lg" icon="checkmark-circle">
              Mark Workout Complete
            </Button>
          </Animated.View>
        )}

        {isFuture && !day.isCompleted && (
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.futureNote}>
            <Ionicons name="time-outline" size={20} color={colors.text.tertiary} />
            <Text style={[styles.futureNoteText, { color: colors.text.tertiary }]}>
              This workout is scheduled for a future day. Come back when it's time!
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Workout Card
  workoutCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  workoutGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  workoutContent: {
    padding: 20,
  },
  workoutTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  splitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutMuscles: {
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Exercise Card
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  exerciseMeta: {
    fontSize: 12,
  },
  exerciseStats: {
    alignItems: 'flex-end',
    marginRight: 8,
    gap: 2,
  },
  exerciseSets: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseReps: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseDuration: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Rest Day
  restDayContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  restDayCard: {
    padding: 24,
    alignItems: 'center',
  },
  restIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  restTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  restSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  restTips: {
    width: '100%',
    gap: 10,
  },
  restTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  restTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Future Note
  futureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginTop: 16,
  },
  futureNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
