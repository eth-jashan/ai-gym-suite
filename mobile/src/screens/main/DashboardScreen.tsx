/**
 * Dashboard Screen
 *
 * Premium home screen with Apple/Stripe/Linear quality design:
 * - Refined visual hierarchy with careful spacing
 * - Smooth spring animations throughout
 * - Subtle gradients and shadows for depth
 * - Animated progress ring for weekly tracking
 * - Quick stats grid for key metrics
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { Card, Button, Badge, ProgressRing } from '@/components/ui';
import { SPLIT_TYPE_COLORS, SPLIT_TYPE_LABELS, SplitType } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const {
    weeklyPlan,
    todayWorkout,
    upcomingWorkouts,
    isLoading,
    error,
    fetchWeeklyPlan,
    generateWeeklyPlan,
    isGeneratingPlan,
    startWorkout,
  } = useWorkoutStore();

  useEffect(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  const onRefresh = useCallback(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStartWorkout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (todayWorkout) {
      await startWorkout(todayWorkout);
      navigation.navigate('ActiveWorkout', { workoutId: todayWorkout.id });
    }
  };

  const handleViewPlan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('WeeklyPlan');
  };

  const handleWorkoutPress = (workoutId: string, dayIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('WorkoutDayDetail', { workoutId, dayIndex });
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  const renderHeader = () => (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.header}
    >
      <View style={styles.headerLeft}>
        <Text
          style={[
            styles.greeting,
            { color: colors.text.secondary, fontSize: typography.sizes.sm },
          ]}
        >
          {getGreeting()}
        </Text>
        <Text
          style={[
            styles.userName,
            { color: colors.text.primary, fontSize: typography.sizes['2xl'] },
          ]}
        >
          {user?.name || 'Athlete'}
        </Text>
        <View style={styles.dateRow}>
          <View
            style={[
              styles.dateDot,
              { backgroundColor: colors.primary.base },
            ]}
          />
          <Text
            style={[
              styles.date,
              { color: colors.text.tertiary, fontSize: typography.sizes.sm },
            ]}
          >
            {formatDate()}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={logout}
        style={({ pressed }) => [
          styles.profileButton,
          {
            backgroundColor: colors.background.surface,
            borderColor: colors.border.muted,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Ionicons name="person" size={20} color={colors.text.secondary} />
      </Pressable>
    </Animated.View>
  );

  // ============================================================================
  // TODAY'S WORKOUT CARD
  // ============================================================================

  const renderTodayWorkoutCard = () => {
    if (!todayWorkout) {
      return (
        <Animated.View entering={FadeInUp.delay(100).duration(500).springify()}>
          <View
            style={[
              styles.restDayCard,
              {
                backgroundColor: colors.background.surface,
                borderRadius: radius['2xl'],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary.muted, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.restDayGradient, { borderRadius: radius['2xl'] }]}
            />
            <View style={styles.restDayContent}>
              <View
                style={[
                  styles.restDayIconWrapper,
                  { backgroundColor: colors.primary.subtle },
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={32}
                  color={colors.primary.base}
                />
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
                  { color: colors.text.secondary, fontSize: typography.sizes.sm },
                ]}
              >
                Recovery is essential. Your muscles grow while you rest.
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    }

    const splitColor = SPLIT_TYPE_COLORS[todayWorkout.workoutType as SplitType] || colors.primary.base;

    return (
      <Animated.View entering={FadeInUp.delay(100).duration(500).springify()}>
        <Pressable
          onPress={() => handleWorkoutPress(todayWorkout.id, todayWorkout.dayOfWeek)}
          style={({ pressed }) => [
            styles.heroCard,
            {
              backgroundColor: colors.background.elevated,
              borderRadius: radius['2xl'],
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {/* Gradient Accent */}
          <LinearGradient
            colors={[splitColor + '25', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroGradient, { borderRadius: radius['2xl'] }]}
          />

          {/* Left Color Bar */}
          <View
            style={[
              styles.heroColorBar,
              { backgroundColor: splitColor, borderRadius: radius.sm },
            ]}
          />

          <View style={[styles.heroContent, { padding: spacing[5] }]}>
            {/* Header Row */}
            <View style={styles.heroHeader}>
              <Badge color={splitColor} size="sm">
                {SPLIT_TYPE_LABELS[todayWorkout.workoutType as SplitType] || todayWorkout.workoutType}
              </Badge>
              <View style={styles.todayBadge}>
                <View style={[styles.todayDot, { backgroundColor: colors.status.success }]} />
                <Text style={[styles.todayLabel, { color: colors.status.success }]}>
                  Today
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              style={[
                styles.heroTitle,
                { color: colors.text.primary, fontSize: typography.sizes['2xl'] },
              ]}
            >
              {todayWorkout.title}
            </Text>

            {/* Muscles */}
            <Text
              style={[
                styles.heroMuscles,
                { color: colors.text.secondary, fontSize: typography.sizes.sm },
              ]}
            >
              {todayWorkout.focusMuscles.slice(0, 4).join(' • ')}
            </Text>

            {/* Meta Row */}
            <View style={[styles.heroMeta, { marginTop: spacing[4] }]}>
              <View style={[styles.metaItem, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={[styles.metaText, { color: colors.text.primary }]}>
                  {todayWorkout.estimatedDuration} min
                </Text>
              </View>
              <View style={[styles.metaItem, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="barbell-outline" size={16} color={colors.text.secondary} />
                <Text style={[styles.metaText, { color: colors.text.primary }]}>
                  {todayWorkout.exercises.length} exercises
                </Text>
              </View>
            </View>

            {/* Start Button */}
            <Button
              onPress={handleStartWorkout}
              variant="primary"
              size="lg"
              fullWidth
              icon="play"
              style={{ marginTop: spacing[5] }}
            >
              Start Workout
            </Button>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // ============================================================================
  // WEEKLY PROGRESS
  // ============================================================================

  const renderWeeklyProgress = () => {
    if (!weeklyPlan) return null;

    const completedDays = 0; // TODO: Calculate from actual data
    const totalDays = weeklyPlan.daysPerWeek;
    const progress = totalDays > 0 ? completedDays / totalDays : 0;

    return (
      <Animated.View entering={FadeInUp.delay(200).duration(500).springify()}>
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.background.surface,
              borderRadius: radius['2xl'],
              padding: spacing[5],
              marginTop: spacing[4],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.progressHeader}>
            <View>
              <Text
                style={[
                  styles.progressTitle,
                  { color: colors.text.primary, fontSize: typography.sizes.lg },
                ]}
              >
                Weekly Progress
              </Text>
              <Text
                style={[
                  styles.progressSubtitle,
                  { color: colors.text.tertiary, fontSize: typography.sizes.sm },
                ]}
              >
                Week {weeklyPlan.weekNumber}
              </Text>
            </View>
            <Pressable
              onPress={handleViewPlan}
              style={({ pressed }) => [
                styles.viewPlanButton,
                {
                  backgroundColor: colors.primary.subtle,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.viewPlanText, { color: colors.primary.base }]}>
                View Plan
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary.base} />
            </Pressable>
          </View>

          {/* Progress Ring + Days */}
          <View style={[styles.progressContent, { marginTop: spacing[5] }]}>
            <ProgressRing
              progress={progress}
              size={90}
              strokeWidth={10}
              delay={300}
            >
              <Text
                style={[
                  styles.progressValue,
                  { color: colors.text.primary, fontSize: typography.sizes.xl },
                ]}
              >
                {completedDays}
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  { color: colors.text.tertiary, fontSize: typography.sizes.xs },
                ]}
              >
                of {totalDays}
              </Text>
            </ProgressRing>

            {/* Week Days */}
            <View style={styles.weekDaysContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const dayIndex = index === 6 ? 0 : index + 1;
                const hasWorkout = weeklyPlan.days.some(d => d.dayIndex === dayIndex);
                const isCompleted = false;
                const isToday = new Date().getDay() === dayIndex;

                return (
                  <Animated.View
                    key={index}
                    entering={FadeIn.delay(400 + index * 50)}
                  >
                    <View
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: isCompleted
                            ? colors.primary.base
                            : hasWorkout
                            ? colors.background.raised
                            : 'transparent',
                          borderWidth: isToday ? 2 : hasWorkout ? 0 : 1,
                          borderColor: isToday
                            ? colors.primary.base
                            : colors.border.muted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayLetter,
                          {
                            color: isCompleted
                              ? colors.text.onPrimary
                              : isToday
                              ? colors.primary.base
                              : colors.text.secondary,
                            fontSize: typography.sizes.xs,
                          },
                        ]}
                      >
                        {day.charAt(0)}
                      </Text>
                      {hasWorkout && !isCompleted && (
                        <View
                          style={[
                            styles.workoutIndicator,
                            { backgroundColor: colors.primary.base },
                          ]}
                        />
                      )}
                      {isCompleted && (
                        <Ionicons
                          name="checkmark"
                          size={10}
                          color={colors.text.onPrimary}
                          style={styles.checkIcon}
                        />
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // QUICK STATS
  // ============================================================================

  const renderQuickStats = () => {
    const stats = [
      { label: 'Streak', value: '0', icon: 'flame-outline' as const, color: '#F97316' },
      { label: 'This Week', value: '0h', icon: 'time-outline' as const, color: colors.primary.base },
      { label: 'Volume', value: '0kg', icon: 'trending-up-outline' as const, color: '#8B5CF6' },
    ];

    return (
      <Animated.View entering={FadeInUp.delay(300).duration(500).springify()}>
        <View style={[styles.statsRow, { marginTop: spacing[5] }]}>
          {stats.map((stat, index) => (
            <Animated.View
              key={stat.label}
              entering={SlideInRight.delay(350 + index * 100).duration(400)}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.background.surface,
                  borderRadius: radius.xl,
                  flex: 1,
                  marginRight: index < stats.length - 1 ? spacing[3] : 0,
                },
              ]}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text.primary, fontSize: typography.sizes.lg },
                ]}
              >
                {stat.value}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.text.tertiary, fontSize: typography.sizes.xs },
                ]}
              >
                {stat.label}
              </Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // UPCOMING WORKOUTS
  // ============================================================================

  const renderUpcomingWorkouts = () => {
    if (!upcomingWorkouts.length) return null;

    return (
      <Animated.View entering={FadeInUp.delay(400).duration(500).springify()}>
        <View style={[styles.sectionHeader, { marginTop: spacing[6] }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, fontSize: typography.sizes.lg },
            ]}
          >
            Coming Up
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: colors.text.tertiary, fontSize: typography.sizes.sm },
            ]}
          >
            Next {Math.min(upcomingWorkouts.length, 3)} workouts
          </Text>
        </View>

        <View style={[styles.upcomingList, { marginTop: spacing[3] }]}>
          {upcomingWorkouts.slice(0, 3).map((workout, index) => {
            const splitColor = SPLIT_TYPE_COLORS[workout.workoutType as SplitType] || colors.primary.base;
            const date = new Date(workout.scheduledDate);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <Animated.View
                key={workout.id}
                entering={FadeInUp.delay(450 + index * 80).duration(400)}
              >
                <Pressable
                  onPress={() => handleWorkoutPress(workout.id, workout.dayOfWeek)}
                  style={({ pressed }) => [
                    styles.upcomingCard,
                    {
                      backgroundColor: colors.background.surface,
                      borderRadius: radius.xl,
                      marginBottom: spacing[3],
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.upcomingRow}>
                    {/* Day Badge */}
                    <View
                      style={[
                        styles.dayBadge,
                        { backgroundColor: splitColor + '15' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          { color: splitColor, fontSize: typography.sizes.sm },
                        ]}
                      >
                        {dayName}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.upcomingInfo}>
                      <Text
                        style={[
                          styles.upcomingTitle,
                          { color: colors.text.primary, fontSize: typography.sizes.base },
                        ]}
                      >
                        {workout.title}
                      </Text>
                      <View style={styles.upcomingMetaRow}>
                        <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                        <Text
                          style={[
                            styles.upcomingMeta,
                            { color: colors.text.tertiary, fontSize: typography.sizes.xs },
                          ]}
                        >
                          {workout.estimatedDuration} min
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: colors.text.tertiary }]} />
                        <Text
                          style={[
                            styles.upcomingMeta,
                            { color: colors.text.tertiary, fontSize: typography.sizes.xs },
                          ]}
                        >
                          {workout.exercises.length} exercises
                        </Text>
                      </View>
                    </View>

                    {/* Arrow */}
                    <View
                      style={[
                        styles.arrowWrapper,
                        { backgroundColor: colors.background.raised },
                      ]}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.text.tertiary}
                      />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500).springify()}
      style={styles.emptyState}
    >
      <LinearGradient
        colors={[colors.primary.muted, 'transparent']}
        style={styles.emptyGradient}
      />
      <View
        style={[
          styles.emptyIconWrapper,
          { backgroundColor: colors.primary.subtle },
        ]}
      >
        <Ionicons
          name="barbell-outline"
          size={48}
          color={colors.primary.base}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.text.primary, fontSize: typography.sizes.xl },
        ]}
      >
        Ready to Get Started?
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: colors.text.secondary, fontSize: typography.sizes.base },
        ]}
      >
        Generate your personalized workout plan based on your goals and preferences.
      </Text>
      <Button
        onPress={generateWeeklyPlan}
        variant="primary"
        size="lg"
        loading={isGeneratingPlan}
        icon="sparkles"
        style={{ marginTop: spacing[6] }}
      >
        Generate My Plan
      </Button>
    </Animated.View>
  );

  // ============================================================================
  // ERROR BANNER
  // ============================================================================

  const renderError = () => {
    if (!error) return null;

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.errorBanner,
          {
            backgroundColor: colors.status.errorMuted,
            borderRadius: radius.lg,
            marginBottom: spacing[4],
          },
        ]}
      >
        <Ionicons name="cloud-offline" size={16} color={colors.status.error} />
        <Text style={[styles.errorText, { color: colors.status.error }]}>
          {error}
        </Text>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary.base}
          />
        }
      >
        {renderHeader()}
        {renderError()}

        {!weeklyPlan && !isLoading ? (
          renderEmptyState()
        ) : (
          <>
            {renderTodayWorkoutCard()}
            {renderWeeklyProgress()}
            {renderQuickStats()}
            {renderUpcomingWorkouts()}
          </>
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
    marginBottom: 24,
    marginTop: 8,
  },
  headerLeft: {},
  greeting: {
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  userName: {
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  date: {
    fontWeight: '500',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Hero Card
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroColorBar: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 4,
  },
  heroContent: {},
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  heroTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroMuscles: {
    fontWeight: '500',
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Rest Day
  restDayCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 200,
  },
  restDayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  restDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  restDayIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  restDayTitle: {
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  restDaySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  // Progress Card
  progressCard: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  progressSubtitle: {
    marginTop: 2,
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  viewPlanText: {
    fontWeight: '600',
    fontSize: 13,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressValue: {
    fontWeight: '700',
  },
  progressLabel: {
    fontWeight: '500',
    marginTop: -2,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  dayPill: {
    width: 28,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLetter: {
    fontWeight: '600',
  },
  workoutIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  checkIcon: {
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    padding: 16,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontWeight: '500',
    marginTop: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {},

  // Upcoming
  upcomingList: {},
  upcomingCard: {
    padding: 14,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dayBadgeText: {
    fontWeight: '700',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingMeta: {},
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});
