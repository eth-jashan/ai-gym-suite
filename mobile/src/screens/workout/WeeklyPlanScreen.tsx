/**
 * Weekly Plan Screen
 *
 * Premium workout plan view inspired by Stitch design:
 * - Horizontal date picker with week days
 * - Workout card for selected day
 * - Exercise list grouped by sections (Warm Up, Main Circuit)
 * - Exercise cards with icons and metadata
 */

import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useWorkoutStore } from '@/stores/workout-store';
import { Button } from '@/components/ui';
import {
  SPLIT_TYPE_COLORS,
  SPLIT_TYPE_LABELS,
  SplitType,
} from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DATE_PILL_WIDTH = (SCREEN_WIDTH - 48) / 5.5; // Show ~5.5 days

// Exercise icons mapping
const EXERCISE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Cardio
  'cardio': 'walk',
  'treadmill': 'walk',
  'running': 'walk',
  'bike': 'bicycle',
  'cycling': 'bicycle',
  // Stretching
  'stretch': 'body',
  'dynamic': 'body',
  'mobility': 'body',
  'warmup': 'body',
  // Chest
  'bench': 'fitness',
  'press': 'fitness',
  'push': 'fitness',
  'fly': 'fitness',
  'flys': 'fitness',
  // Back
  'row': 'fitness',
  'pull': 'fitness',
  'lat': 'fitness',
  // Shoulders
  'shoulder': 'fitness',
  'lateral': 'fitness',
  'raise': 'fitness',
  'overhead': 'fitness',
  // Arms
  'curl': 'fitness',
  'tricep': 'fitness',
  'pushdown': 'fitness',
  'extension': 'fitness',
  // Legs
  'squat': 'fitness',
  'leg': 'walk',
  'lunge': 'walk',
  'deadlift': 'fitness',
  'calf': 'walk',
  // Default
  'default': 'barbell',
};

const getExerciseIcon = (name: string): keyof typeof Ionicons.glyphMap => {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(EXERCISE_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return 'barbell';
};

// Get exercise category based on name
const getExerciseCategory = (name: string, index: number, total: number): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('cardio') || lowerName.includes('warm') || lowerName.includes('stretch')) {
    return 'warmup';
  }
  return 'main';
};

export default function WeeklyPlanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, radius } = useTheme();
  const { weeklyPlan, selectedDayIndex, setSelectedDay, isGeneratingPlan, generateWeeklyPlan, startWorkout } = useWorkoutStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const dateScrollRef = useRef<ScrollView>(null);

  // Get week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        dayIndex: i === 6 ? 0 : i + 1, // Convert to Sun=0 format
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
      };
    });
  }, []);

  const currentMonth = weekDates[0]?.fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekNumber = weeklyPlan?.weekNumber || Math.ceil(weekDates[0]?.fullDate.getDate() / 7);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleDaySelect = (dayIndex: number) => {
    Haptics.selectionAsync();
    setSelectedDay(dayIndex);
  };

  const handleStartWorkout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentWorkout = getCurrentDayWorkout();
    if (currentWorkout && weeklyPlan) {
      const workoutData = {
        id: `${weeklyPlan.id}-day-${currentWorkout.dayIndex}`,
        title: currentWorkout.dayName,
        workoutType: currentWorkout.splitType,
        focusMuscles: currentWorkout.focusMuscles,
        exercises: currentWorkout.exercises,
        estimatedDuration: currentWorkout.estimatedDuration,
        dayOfWeek: currentWorkout.dayIndex,
        scheduledDate: new Date().toISOString(),
        status: 'SCHEDULED' as const,
      };
      await startWorkout(workoutData);
      navigation.navigate('ActiveWorkout', { workoutId: workoutData.id });
    }
  };

  const getCurrentDayWorkout = () => {
    if (!weeklyPlan) return null;
    return weeklyPlan.days.find(d => d.dayIndex === selectedDayIndex);
  };

  const currentWorkout = getCurrentDayWorkout();

  // Group exercises by section
  const groupedExercises = useMemo(() => {
    if (!currentWorkout) return { warmup: [], main: [] };

    const warmup: typeof currentWorkout.exercises = [];
    const main: typeof currentWorkout.exercises = [];

    currentWorkout.exercises.forEach((exercise, index) => {
      const category = getExerciseCategory(
        exercise.name || exercise.exercise?.name || '',
        index,
        currentWorkout.exercises.length
      );
      if (category === 'warmup') {
        warmup.push(exercise);
      } else {
        main.push(exercise);
      }
    });

    // If no warmup detected, treat first 2 as warmup
    if (warmup.length === 0 && main.length > 3) {
      warmup.push(...main.splice(0, 2));
    }

    return { warmup, main };
  }, [currentWorkout]);

  // ============================================================================
  // HEADER
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.monthText, { color: colors.text.primary }]}>
          {currentMonth}
        </Text>
        <Text style={[styles.weekText, { color: colors.text.tertiary }]}>
          WEEK {weekNumber}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <Pressable
          style={[styles.headerIconButton, { backgroundColor: colors.background.surface }]}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          style={[styles.headerIconButton, { backgroundColor: colors.background.surface }]}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={handleGoBack}
          style={[styles.avatarButton, { borderColor: colors.primary.base }]}
        >
          <View style={[styles.avatarInner, { backgroundColor: colors.background.elevated }]}>
            <Ionicons name="person" size={16} color={colors.text.secondary} />
          </View>
        </Pressable>
      </View>
    </View>
  );

  // ============================================================================
  // DATE PICKER
  // ============================================================================

  const renderDatePicker = () => (
    <View style={styles.datePickerContainer}>
      <ScrollView
        ref={dateScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePickerContent}
        decelerationRate="fast"
      >
        {weekDates.map((dateInfo, index) => {
          const isSelected = selectedDayIndex === dateInfo.dayIndex;

          return (
            <Animated.View
              key={index}
              entering={FadeInRight.delay(index * 50).duration(300)}
            >
              <Pressable
                onPress={() => handleDaySelect(dateInfo.dayIndex)}
                style={[
                  styles.datePill,
                  {
                    width: DATE_PILL_WIDTH,
                    backgroundColor: isSelected
                      ? colors.primary.base
                      : colors.background.elevated,
                    borderRadius: radius.xl,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.datePillDay,
                    {
                      color: isSelected
                        ? colors.background.base
                        : colors.text.tertiary,
                    },
                  ]}
                >
                  {dateInfo.dayName}
                </Text>
                <Text
                  style={[
                    styles.datePillNumber,
                    {
                      color: isSelected
                        ? colors.background.base
                        : colors.text.primary,
                    },
                  ]}
                >
                  {dateInfo.date.toString().padStart(2, '0')}
                </Text>
                {dateInfo.isToday && !isSelected && (
                  <View style={[styles.todayIndicator, { backgroundColor: colors.primary.base }]} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  // ============================================================================
  // WORKOUT CARD
  // ============================================================================

  const renderWorkoutCard = () => {
    if (!currentWorkout) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.restDayCard,
            { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] },
          ]}
        >
          {/* Badge */}
          <View style={[styles.restBadge, { backgroundColor: colors.background.surface }]}>
            <Ionicons name="moon" size={16} color={colors.primary.base} />
            <Text style={[styles.restBadgeText, { color: colors.primary.base }]}>
              REST & RECOVERY
            </Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.restDayTitle, { color: colors.text.primary }]}>
            It's a rest day.
          </Text>
          <Text style={[styles.restDaySubtitle, { color: colors.text.secondary }]}>
            Your body rebuilds during rest. Focus on mobility, hydration, and mental clarity today.
          </Text>

          {/* Bottom Row */}
          <View style={styles.restDayBottom}>
            {/* Avatar Stack */}
            <View style={styles.avatarStack}>
              <View style={[styles.stackAvatar, { backgroundColor: colors.background.surface }]}>
                <Text style={[styles.stackAvatarText, { color: colors.text.secondary }]}>JD</Text>
              </View>
              <View style={[styles.stackAvatar, styles.stackAvatarOverlap, { backgroundColor: colors.background.raised }]}>
                <Text style={[styles.stackAvatarText, { color: colors.text.secondary }]}>AM</Text>
              </View>
              <View style={[styles.stackAvatar, styles.stackAvatarOverlap, { backgroundColor: colors.background.surface }]}>
                <Text style={[styles.stackAvatarText, { color: colors.text.tertiary }]}>+3</Text>
              </View>
            </View>

            {/* View Tips Button */}
            <Pressable
              style={({ pressed }) => [
                styles.viewTipsButton,
                {
                  backgroundColor: colors.text.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.viewTipsText, { color: colors.background.base }]}>
                VIEW TIPS
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.background.base} />
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    const splitColor = SPLIT_TYPE_COLORS[currentWorkout.splitType as SplitType] || colors.primary.base;
    const estimatedCalories = Math.round(currentWorkout.estimatedDuration * 7);

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <View
          style={[
            styles.workoutCard,
            { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] },
          ]}
        >
          <LinearGradient
            colors={[splitColor + '15', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.workoutCardGradient, { borderRadius: radius['2xl'] }]}
          />

          <View style={styles.workoutCardContent}>
            {/* Top Row */}
            <View style={styles.workoutCardTop}>
              <View style={[styles.splitBadge, { backgroundColor: colors.background.surface }]}>
                <Text style={[styles.splitBadgeText, { color: colors.text.primary }]}>
                  {SPLIT_TYPE_LABELS[currentWorkout.splitType as SplitType] || currentWorkout.splitType}
                </Text>
              </View>
              <View style={[styles.workoutIcon, { backgroundColor: splitColor + '20' }]}>
                <Ionicons name="barbell" size={18} color={splitColor} />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.workoutTitle, { color: colors.text.primary }]}>
              {currentWorkout.dayName}
            </Text>
            <Text style={[styles.workoutMuscles, { color: colors.text.secondary }]}>
              {currentWorkout.focusMuscles.slice(0, 3).join(' • ')}
            </Text>

            {/* Metrics */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="time-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {currentWorkout.estimatedDuration}m
                </Text>
              </View>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="barbell-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {currentWorkout.exercises.length} Ex
                </Text>
              </View>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="flame-outline" size={14} color="#F97316" />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {estimatedCalories} kcal
                </Text>
              </View>
            </View>

            {/* Start Button */}
            <Pressable
              onPress={handleStartWorkout}
              style={({ pressed }) => [
                styles.startButton,
                {
                  backgroundColor: colors.text.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.startButtonText, { color: colors.background.base }]}>
                START WORKOUT
              </Text>
              <View style={[styles.playCircle, { backgroundColor: colors.primary.base }]}>
                <Ionicons name="play" size={14} color={colors.background.base} />
              </View>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // EXERCISE SECTION
  // ============================================================================

  const renderExerciseSection = (
    title: string,
    exercises: NonNullable<typeof currentWorkout>['exercises'],
    countLabel: string,
    startIndex: number
  ) => {
    if (!exercises.length) return null;

    return (
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            {title}
          </Text>
          <View style={[styles.sectionCount, { backgroundColor: colors.background.elevated }]}>
            <Text style={[styles.sectionCountText, { color: colors.text.tertiary }]}>
              {countLabel}
            </Text>
          </View>
        </View>

        {/* Exercise Cards */}
        {exercises.map((exercise, index) => {
          const exerciseName = exercise.name || exercise.exercise?.name || 'Exercise';
          const icon = getExerciseIcon(exerciseName);
          const isWarmup = title === 'WARM UP';
          const sets = exercise.sets || exercise.targetSets || 3;
          const reps = exercise.reps || exercise.targetReps || '10';
          const primaryMuscle = exercise.exercise?.primaryMuscles?.[0] || '';
          const movementType = isWarmup ? 'Mobility' : 'Compound';

          return (
            <Animated.View
              key={exercise.id || `${startIndex + index}`}
              entering={FadeInUp.delay(250 + index * 60).duration(300)}
            >
              <View
                style={[
                  styles.exerciseCard,
                  { backgroundColor: colors.background.elevated, borderRadius: radius.xl },
                ]}
              >
                {/* Icon */}
                <View style={[styles.exerciseIconWrapper, { backgroundColor: colors.background.surface }]}>
                  <Ionicons name={icon} size={22} color={colors.primary.base} />
                </View>

                {/* Info */}
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                    {exerciseName}
                  </Text>
                  <Text style={[styles.exerciseMeta, { color: colors.text.tertiary }]}>
                    {primaryMuscle} • {movementType}
                  </Text>
                </View>

                {/* Sets/Reps or Duration */}
                <View style={styles.exerciseStats}>
                  {isWarmup ? (
                    <>
                      <Text style={[styles.exerciseSets, { color: colors.text.primary }]}>
                        {exercise.restSeconds ? `${Math.round(exercise.restSeconds / 60)} min` : '5 min'}
                      </Text>
                      <Text style={[styles.exerciseReps, { color: colors.primary.base }]}>
                        {movementType === 'Mobility' ? 'Mobility' : 'Zone 2'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.exerciseSets, { color: colors.text.primary }]}>
                        {sets} Sets
                      </Text>
                      <Text style={[styles.exerciseReps, { color: colors.primary.base }]}>
                        {typeof reps === 'number' ? `${reps} Reps` : reps}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </Animated.View>
    );
  };

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  if (!weeklyPlan) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.base }]}
        edges={['top']}
      >
        {renderHeader()}
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary.subtle }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.primary.base} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No Plan Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Generate a personalized workout plan to get started.
          </Text>
          <Button
            onPress={generateWeeklyPlan}
            variant="primary"
            size="lg"
            loading={isGeneratingPlan}
            icon="sparkles"
            style={{ marginTop: spacing[6] }}
          >
            Generate Plan
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      edges={['top']}
    >
      {renderHeader()}
      {renderDatePicker()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderWorkoutCard()}

        {currentWorkout && (
          <View style={{ marginTop: spacing[6] }}>
            {renderExerciseSection(
              'WARM UP',
              groupedExercises.warmup,
              `${groupedExercises.warmup.length} Movements`,
              0
            )}
            {renderExerciseSection(
              'MAIN CIRCUIT',
              groupedExercises.main,
              `${groupedExercises.main.length} Exercises`,
              groupedExercises.warmup.length
            )}
          </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {},
  monthText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date Picker
  datePickerContainer: {
    marginBottom: 20,
  },
  datePickerContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  datePill: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  datePillNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Workout Card
  workoutCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  workoutCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  workoutCardContent: {
    padding: 20,
  },
  workoutCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  splitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  splitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  workoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  workoutMuscles: {
    fontSize: 14,
    fontWeight: '500',
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rest Day
  restDayCard: {
    padding: 20,
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  restBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  restDayTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  restDaySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  restDayBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarOverlap: {
    marginLeft: -10,
  },
  stackAvatarText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  viewTipsText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  exerciseIconWrapper: {
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
  },
  exerciseSets: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseReps: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
