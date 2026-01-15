/**
 * Program Calendar Screen
 *
 * 28-day program calendar view showing:
 * - 4-week calendar grid
 * - Phase indicators with progress
 * - Day completion status
 * - Quick access to each day's workout
 */

import React, { useEffect, useMemo, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useProgramStore } from '@/stores/program-store';
import { useAuthStore } from '@/stores/auth-store';
import { PHASE_COLORS, PROGRAM_PHASES, getPhaseForDay } from '@/lib/types/program';
import { SPLIT_TYPE_COLORS, SPLIT_TYPE_LABELS, SplitType } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = (SCREEN_WIDTH - 48 - 24) / 7; // 7 days with gaps

export default function ProgramCalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuthStore();
  const {
    program,
    selectedDay,
    setSelectedDay,
    getTodayDayNumber,
    getStats,
    getPhaseProgress,
    loadProgram,
    isLoading,
  } = useProgramStore();

  useEffect(() => {
    if (!program) {
      loadProgram();
    }
  }, []);

  const todayDayNumber = getTodayDayNumber();
  const stats = getStats();
  const phaseProgress = getPhaseProgress();

  const handleDayPress = (dayNumber: number) => {
    Haptics.selectionAsync();
    setSelectedDay(dayNumber);
    navigation.navigate('ProgramDay' as keyof MainStackParamList, { dayNumber } as any);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatDateRange = () => {
    if (!program) return '';
    const start = new Date(program.startDate);
    const end = new Date(program.endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            28-Day Program
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
            {formatDateRange()}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.todayButton, { backgroundColor: colors.primary.base }]}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedDay(todayDayNumber);
        }}
      >
        <Text style={[styles.todayButtonText, { color: colors.background.base }]}>
          TODAY
        </Text>
      </Pressable>
    </Animated.View>
  );

  // ============================================================================
  // PHASE PROGRESS
  // ============================================================================

  const renderPhaseProgress = () => (
    <Animated.View entering={FadeInUp.delay(100).duration(400)}>
      <View style={[styles.phaseCard, { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] }]}>
        <LinearGradient
          colors={[phaseProgress.color + '20', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.phaseGradient, { borderRadius: radius['2xl'] }]}
        />

        <View style={styles.phaseContent}>
          <View style={styles.phaseHeader}>
            <View style={[styles.phaseBadge, { backgroundColor: phaseProgress.color + '20' }]}>
              <Text style={[styles.phaseBadgeText, { color: phaseProgress.color }]}>
                {phaseProgress.phase.toUpperCase()} PHASE
              </Text>
            </View>
            <Text style={[styles.phasePercent, { color: colors.text.primary }]}>
              {phaseProgress.progress}%
            </Text>
          </View>

          {/* Phase progress bar */}
          <View style={[styles.phaseProgressBar, { backgroundColor: colors.background.surface }]}>
            <View
              style={[
                styles.phaseProgressFill,
                { width: `${phaseProgress.progress}%`, backgroundColor: phaseProgress.color },
              ]}
            />
          </View>

          {/* Phase indicators */}
          <View style={styles.phasesRow}>
            {PROGRAM_PHASES.map((phase, index) => {
              const currentPhase = getPhaseForDay(todayDayNumber);
              const isActive = phase.phase === currentPhase.phase;
              const isPast = PROGRAM_PHASES.findIndex((p) => p.phase === currentPhase.phase) > index;

              return (
                <View key={phase.phase} style={styles.phaseIndicator}>
                  <View
                    style={[
                      styles.phaseDot,
                      {
                        backgroundColor: isActive
                          ? PHASE_COLORS[phase.phase]
                          : isPast
                          ? PHASE_COLORS[phase.phase] + '60'
                          : colors.background.surface,
                        borderWidth: isActive ? 2 : 0,
                        borderColor: PHASE_COLORS[phase.phase],
                      },
                    ]}
                  >
                    {isPast && (
                      <Ionicons name="checkmark" size={10} color={colors.background.base} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.phaseLabel,
                      {
                        color: isActive ? colors.text.primary : colors.text.tertiary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {phase.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  // ============================================================================
  // STATS ROW
  // ============================================================================

  const renderStatsRow = () => (
    <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsRow}>
      <View style={[styles.statCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}>
        <Ionicons name="checkmark-circle" size={20} color={colors.primary.base} />
        <Text style={[styles.statValue, { color: colors.text.primary }]}>
          {stats.completedWorkouts}/{program?.totalWorkouts || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Workouts</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}>
        <Ionicons name="flame" size={20} color="#F97316" />
        <Text style={[styles.statValue, { color: colors.text.primary }]}>
          {stats.currentStreak}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Streak</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}>
        <Ionicons name="time" size={20} color="#3B82F6" />
        <Text style={[styles.statValue, { color: colors.text.primary }]}>
          {stats.totalMinutes}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Minutes</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}>
        <Ionicons name="trophy" size={20} color="#EAB308" />
        <Text style={[styles.statValue, { color: colors.text.primary }]}>
          {stats.completionPercentage}%
        </Text>
        <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Complete</Text>
      </View>
    </Animated.View>
  );

  // ============================================================================
  // CALENDAR GRID
  // ============================================================================

  const renderCalendarGrid = () => {
    const weeks = [1, 2, 3, 4];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ marginTop: spacing[4] }}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your 28 Days</Text>

        {/* Day name headers */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((day, index) => (
            <View key={index} style={[styles.dayNameCell, { width: DAY_CELL_SIZE }]}>
              <Text style={[styles.dayNameText, { color: colors.text.tertiary }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Week rows */}
        {weeks.map((weekNum) => {
          const weekDays = program?.days.filter((d) => d.weekNumber === weekNum) || [];
          const phaseInfo = getPhaseForDay((weekNum - 1) * 7 + 1);

          return (
            <View key={weekNum} style={styles.weekRow}>
              {/* Week label */}
              <View style={styles.weekLabelContainer}>
                <View style={[styles.weekPhaseDot, { backgroundColor: PHASE_COLORS[phaseInfo.phase] }]} />
                <Text style={[styles.weekLabel, { color: colors.text.tertiary }]}>W{weekNum}</Text>
              </View>

              {/* Day cells */}
              <View style={styles.weekDaysContainer}>
                {weekDays.map((day) => {
                  const isToday = day.dayNumber === todayDayNumber;
                  const isSelected = day.dayNumber === selectedDay;
                  const isPast = day.dayNumber < todayDayNumber;
                  const isFuture = day.dayNumber > todayDayNumber;

                  let bgColor = colors.background.surface;
                  let textColor = colors.text.primary;
                  let borderColor = 'transparent';

                  if (day.isCompleted && !day.isRestDay) {
                    bgColor = colors.primary.base;
                    textColor = colors.background.base;
                  } else if (day.isRestDay && (isPast || day.isCompleted)) {
                    bgColor = colors.background.elevated;
                    textColor = colors.text.tertiary;
                  } else if (isToday) {
                    borderColor = colors.primary.base;
                  } else if (isFuture) {
                    textColor = colors.text.tertiary;
                  }

                  const splitColor = day.splitType
                    ? SPLIT_TYPE_COLORS[day.splitType as SplitType]
                    : undefined;

                  return (
                    <Pressable
                      key={day.dayNumber}
                      onPress={() => handleDayPress(day.dayNumber)}
                      style={[
                        styles.dayCell,
                        {
                          width: DAY_CELL_SIZE,
                          height: DAY_CELL_SIZE,
                          backgroundColor: bgColor,
                          borderRadius: radius.lg,
                          borderWidth: isToday ? 2 : 0,
                          borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.dayCellNumber, { color: textColor }]}>{day.dayNumber}</Text>
                      {!day.isRestDay && !day.isCompleted && splitColor && (
                        <View style={[styles.splitIndicator, { backgroundColor: splitColor }]} />
                      )}
                      {day.isRestDay && (
                        <Ionicons name="moon" size={10} color={textColor} style={{ opacity: 0.5 }} />
                      )}
                      {day.isCompleted && !day.isRestDay && (
                        <Ionicons name="checkmark" size={12} color={textColor} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  // ============================================================================
  // TODAY'S WORKOUT PREVIEW
  // ============================================================================

  const renderTodayPreview = () => {
    const todayData = program?.days.find((d) => d.dayNumber === todayDayNumber);
    if (!todayData || todayData.isRestDay || todayData.isCompleted) return null;

    const splitColor = todayData.splitType
      ? SPLIT_TYPE_COLORS[todayData.splitType as SplitType]
      : colors.primary.base;

    return (
      <Animated.View entering={FadeInUp.delay(300).duration(400)} style={{ marginTop: spacing[6] }}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Today's Workout</Text>

        <Pressable
          onPress={() => handleDayPress(todayDayNumber)}
          style={[styles.todayCard, { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] }]}
        >
          <LinearGradient
            colors={[splitColor + '15', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.todayGradient, { borderRadius: radius['2xl'] }]}
          />

          <View style={styles.todayContent}>
            <View style={styles.todayHeader}>
              <View style={[styles.todaySplitBadge, { backgroundColor: colors.background.surface }]}>
                <Text style={[styles.todaySplitText, { color: colors.text.primary }]}>
                  {SPLIT_TYPE_LABELS[todayData.splitType as SplitType] || todayData.splitType}
                </Text>
              </View>
              <View style={[styles.todayDayBadge, { backgroundColor: splitColor }]}>
                <Text style={[styles.todayDayText, { color: colors.background.base }]}>
                  DAY {todayDayNumber}
                </Text>
              </View>
            </View>

            <Text style={[styles.todayTitle, { color: colors.text.primary }]}>{todayData.title}</Text>
            <Text style={[styles.todayMuscles, { color: colors.text.secondary }]}>
              {todayData.focusMuscles.slice(0, 3).join(' • ')}
            </Text>

            <View style={styles.todayMetrics}>
              <View style={[styles.todayMetric, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="time-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.todayMetricText, { color: colors.text.primary }]}>
                  {todayData.estimatedDuration}m
                </Text>
              </View>
              <View style={[styles.todayMetric, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="barbell-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.todayMetricText, { color: colors.text.primary }]}>
                  {todayData.exercises.length} Ex
                </Text>
              </View>
              <View style={[styles.todayMetric, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="flame-outline" size={14} color="#F97316" />
                <Text style={[styles.todayMetricText, { color: colors.text.primary }]}>
                  {todayData.estimatedCalories} kcal
                </Text>
              </View>
            </View>

            <View style={[styles.startButton, { backgroundColor: colors.text.primary }]}>
              <Text style={[styles.startButtonText, { color: colors.background.base }]}>VIEW WORKOUT</Text>
              <View style={[styles.startButtonIcon, { backgroundColor: colors.primary.base }]}>
                <Ionicons name="arrow-forward" size={16} color={colors.background.base} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!program) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Program Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Complete onboarding to generate your personalized 28-day program.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing[4], paddingBottom: spacing[10] }]}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderPhaseProgress()}
        {renderStatsRow()}
        {renderCalendarGrid()}
        {renderTodayPreview()}
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
    marginBottom: 20,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Phase Card
  phaseCard: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  phaseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  phaseContent: {
    padding: 20,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phasePercent: {
    fontSize: 24,
    fontWeight: '700',
  },
  phaseProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  phaseProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  phasesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseIndicator: {
    alignItems: 'center',
  },
  phaseDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  phaseLabel: {
    fontSize: 11,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  // Calendar
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingRight: 0,
  },
  dayNameCell: {
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekLabelContainer: {
    width: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekPhaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  splitIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Today Preview
  todayCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  todayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  todayContent: {
    padding: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todaySplitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todaySplitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  todayDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayDayText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  todayTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayMuscles: {
    fontSize: 14,
    marginBottom: 16,
  },
  todayMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  todayMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayMetricText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  startButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
