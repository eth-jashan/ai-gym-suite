/**
 * Dashboard Screen
 *
 * Premium fitness dashboard inspired by Nike Training Club & Stitch design:
 * - Tab navigation (Today/Progress/Insights)
 * - Hero workout card with clean metrics
 * - Horizontal scrolling progress cards
 * - Upcoming workouts with date badges
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
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
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { Button } from '@/components/ui';
import { SPLIT_TYPE_COLORS, SPLIT_TYPE_LABELS, SplitType } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS_CARD_WIDTH = SCREEN_WIDTH * 0.75;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabType = 'today' | 'progress' | 'insights';

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, typography, radius } = useTheme();
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

  const [activeTab, setActiveTab] = useState<TabType>('today');

  useEffect(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  const onRefresh = useCallback(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const formatDateHeader = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    }).toUpperCase();
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
        <Text style={[styles.dateText, { color: colors.text.tertiary }]}>
          {formatDateHeader()}
        </Text>
        <Text style={[styles.greeting, { color: colors.text.primary }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.userName, { color: colors.text.primary }]}>
          {user?.name || 'Athlete'}
        </Text>
      </View>

      <View style={styles.headerRight}>
        <Pressable
          style={({ pressed }) => [
            styles.headerIconButton,
            { backgroundColor: colors.background.surface, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.headerIconButton,
            { backgroundColor: colors.background.surface, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
          <View style={[styles.notificationBadge, { backgroundColor: colors.primary.base }]} />
        </Pressable>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.avatarButton,
            { borderColor: colors.primary.base, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.avatarInner, { backgroundColor: colors.background.elevated }]}>
            <Ionicons name="person" size={18} color={colors.text.secondary} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  const renderTabs = () => {
    const tabs: { key: TabType; label: string }[] = [
      { key: 'today', label: 'Today' },
      { key: 'progress', label: 'Progress' },
      { key: 'insights', label: 'Insights' },
    ];

    return (
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={[styles.tabContainer, { marginBottom: spacing[5] }]}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab.key);
            }}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? colors.text.primary : colors.text.tertiary,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.primary.base }]} />
            )}
          </Pressable>
        ))}
      </Animated.View>
    );
  };

  // ============================================================================
  // HERO WORKOUT CARD
  // ============================================================================

  const renderHeroCard = () => {
    if (!todayWorkout) {
      return renderRestDayCard();
    }

    const splitColor = SPLIT_TYPE_COLORS[todayWorkout.workoutType as SplitType] || colors.primary.base;
    const estimatedCalories = Math.round(todayWorkout.estimatedDuration * 7); // Rough estimate

    return (
      <Animated.View entering={FadeInUp.delay(150).duration(500).springify()}>
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
          {/* Subtle gradient overlay */}
          <LinearGradient
            colors={[splitColor + '15', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroGradient, { borderRadius: radius['2xl'] }]}
          />

          <View style={[styles.heroContent, { padding: spacing[5] }]}>
            {/* Top Row: Badge + Icon */}
            <View style={styles.heroTopRow}>
              <View style={[styles.splitBadge, { backgroundColor: colors.background.surface }]}>
                <Text style={[styles.splitBadgeText, { color: colors.text.primary }]}>
                  {SPLIT_TYPE_LABELS[todayWorkout.workoutType as SplitType] || todayWorkout.workoutType}
                </Text>
              </View>
              <View style={[styles.heroIconWrapper, { backgroundColor: splitColor + '20' }]}>
                <Ionicons name="barbell" size={20} color={splitColor} />
              </View>
            </View>

            {/* Title & Muscles */}
            <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
              {todayWorkout.title}
            </Text>
            <Text style={[styles.heroMuscles, { color: colors.text.secondary }]}>
              {todayWorkout.focusMuscles.slice(0, 3).join(' • ')}
            </Text>

            {/* Metrics Row */}
            <View style={[styles.metricsRow, { marginTop: spacing[4] }]}>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="time-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {todayWorkout.estimatedDuration}m
                </Text>
              </View>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="barbell-outline" size={14} color={colors.primary.base} />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {todayWorkout.exercises.length} Ex
                </Text>
              </View>
              <View style={[styles.metricPill, { backgroundColor: colors.background.surface }]}>
                <Ionicons name="flame-outline" size={14} color="#F97316" />
                <Text style={[styles.metricText, { color: colors.text.primary }]}>
                  {estimatedCalories} kcal
                </Text>
              </View>
            </View>

            {/* Dive In Button */}
            <Pressable
              onPress={handleViewPlan}
              style={({ pressed }) => [
                styles.startButton,
                {
                  backgroundColor: colors.text.primary,
                  opacity: pressed ? 0.9 : 1,
                  marginTop: spacing[5],
                },
              ]}
            >
              <Text style={[styles.startButtonText, { color: colors.background.base }]}>
                LET'S DIVE IN
              </Text>
              <View style={[styles.playCircle, { backgroundColor: colors.primary.base }]}>
                <Ionicons name="arrow-forward" size={16} color={colors.background.base} />
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // ============================================================================
  // REST DAY CARD
  // ============================================================================

  const renderRestDayCard = () => (
    <Animated.View entering={FadeInUp.delay(150).duration(500).springify()}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.background.elevated,
            borderRadius: radius['2xl'],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.primary.muted, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { borderRadius: radius['2xl'] }]}
        />
        <View style={styles.restDayContent}>
          <View style={[styles.restDayIcon, { backgroundColor: colors.primary.subtle }]}>
            <Ionicons name="moon-outline" size={32} color={colors.primary.base} />
          </View>
          <Text style={[styles.restDayTitle, { color: colors.text.primary }]}>
            Rest Day
          </Text>
          <Text style={[styles.restDaySubtitle, { color: colors.text.secondary }]}>
            Recovery is essential. Your muscles grow while you rest.
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  // ============================================================================
  // WEEKLY PROGRESS SECTION
  // ============================================================================

  const renderWeeklyProgress = () => {
    if (!weeklyPlan) return null;

    const completedDays = 0; // TODO: Calculate from actual data
    const totalDays = weeklyPlan.daysPerWeek;
    const currentStreak = 4; // TODO: Calculate actual streak

    return (
      <Animated.View entering={FadeInUp.delay(250).duration(500).springify()}>
        {/* Section Header */}
        <View style={[styles.sectionHeader, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Weekly Progress
          </Text>
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary.base }]} />
            <View style={[styles.dot, { backgroundColor: colors.text.tertiary }]} />
            <View style={[styles.dot, { backgroundColor: colors.text.tertiary }]} />
            <View style={[styles.dot, { backgroundColor: colors.text.tertiary }]} />
          </View>
        </View>

        {/* Horizontal Scroll Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.progressScrollContent, { paddingLeft: spacing[4] }]}
          style={{ marginTop: spacing[4] }}
          decelerationRate="fast"
          snapToInterval={PROGRESS_CARD_WIDTH + spacing[3]}
        >
          {/* Consistency Card */}
          <Animated.View
            entering={SlideInRight.delay(300).duration(400)}
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.background.elevated,
                borderRadius: radius['2xl'],
                width: PROGRESS_CARD_WIDTH,
                marginRight: spacing[3],
              },
            ]}
          >
            <View style={styles.progressCardContent}>
              <View style={styles.progressCardHeader}>
                <View style={styles.consistencyLabel}>
                  <View style={[styles.consistencyDot, { backgroundColor: colors.primary.base }]} />
                  <Text style={[styles.consistencyText, { color: colors.primary.base }]}>
                    CONSISTENCY
                  </Text>
                </View>
                <View style={[styles.streakBadge, { backgroundColor: colors.primary.base + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary.base} />
                </View>
              </View>

              <Text style={[styles.streakValue, { color: colors.text.primary }]}>
                {currentStreak} Day Streak
              </Text>

              {/* Week Day Pills */}
              <View style={styles.weekDayRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                  const isCompleted = index < 2; // First 2 days completed
                  const isToday = index === 3; // Thursday
                  const hasWorkout = weeklyPlan.days.some(d => {
                    const dayIndex = index === 6 ? 0 : index + 1;
                    return d.dayIndex === dayIndex;
                  });

                  return (
                    <View
                      key={index}
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: isCompleted
                            ? colors.primary.base
                            : colors.background.surface,
                          borderWidth: isToday ? 2 : 0,
                          borderColor: colors.primary.base,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          {
                            color: isCompleted
                              ? colors.background.base
                              : isToday
                              ? colors.primary.base
                              : colors.text.tertiary,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Decorative Grid */}
            <View style={styles.streakGrid}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.gridCell,
                    {
                      backgroundColor: i < 8 ? colors.primary.base + '30' : colors.background.surface,
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Weekly Goal Card */}
          <Animated.View
            entering={SlideInRight.delay(400).duration(400)}
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.background.elevated,
                borderRadius: radius['2xl'],
                width: PROGRESS_CARD_WIDTH,
                marginRight: spacing[4],
              },
            ]}
          >
            <View style={styles.progressCardContent}>
              <View style={styles.progressCardHeader}>
                <View style={styles.consistencyLabel}>
                  <View style={[styles.consistencyDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={[styles.consistencyText, { color: '#3B82F6' }]}>
                    WEEKLY GOAL
                  </Text>
                </View>
              </View>

              <Text style={[styles.streakValue, { color: colors.text.primary }]}>
                {completedDays} of {totalDays}
              </Text>
              <Text style={[styles.progressSubtext, { color: colors.text.tertiary }]}>
                Workouts completed
              </Text>

              {/* Progress Bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.background.surface }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#3B82F6',
                      width: totalDays > 0 ? `${(completedDays / totalDays) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    );
  };

  // ============================================================================
  // UPCOMING WORKOUTS
  // ============================================================================

  const renderUpcoming = () => {
    if (!upcomingWorkouts.length) return null;

    return (
      <Animated.View entering={FadeInUp.delay(350).duration(500).springify()}>
        <View style={[styles.sectionHeader, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Upcoming
          </Text>
          <Pressable onPress={handleViewPlan}>
            <Text style={[styles.seeAllText, { color: colors.primary.base }]}>
              SEE ALL
            </Text>
          </Pressable>
        </View>

        <View style={[styles.upcomingList, { marginTop: spacing[4] }]}>
          {upcomingWorkouts.slice(0, 2).map((workout, index) => {
            const splitColor = SPLIT_TYPE_COLORS[workout.workoutType as SplitType] || colors.primary.base;
            const date = new Date(workout.scheduledDate);
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const estimatedCalories = Math.round(workout.estimatedDuration * 7);

            return (
              <Animated.View
                key={workout.id}
                entering={FadeInUp.delay(400 + index * 80).duration(400)}
              >
                <Pressable
                  onPress={() => handleWorkoutPress(workout.id, workout.dayOfWeek)}
                  style={({ pressed }) => [
                    styles.upcomingCard,
                    {
                      backgroundColor: colors.background.elevated,
                      borderRadius: radius.xl,
                      marginBottom: spacing[3],
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {/* Date Badge */}
                  <View style={[styles.dateBadge, { backgroundColor: colors.background.surface }]}>
                    <Text style={[styles.dateBadgeDay, { color: colors.text.primary }]}>
                      {dayNum}
                    </Text>
                    <Text style={[styles.dateBadgeMonth, { color: colors.text.tertiary }]}>
                      {monthName}
                    </Text>
                    {/* Workout illustration placeholder */}
                    <View style={[styles.workoutIllustration, { backgroundColor: splitColor + '20' }]}>
                      <Ionicons
                        name={workout.workoutType.includes('LEG') ? 'walk' : 'body'}
                        size={20}
                        color={splitColor}
                      />
                    </View>
                  </View>

                  {/* Workout Info */}
                  <View style={styles.upcomingInfo}>
                    <Text style={[styles.upcomingTitle, { color: colors.text.primary }]}>
                      {workout.title}
                    </Text>
                    <Text style={[styles.upcomingMeta, { color: colors.text.tertiary }]}>
                      {workout.estimatedDuration} min • ~{estimatedCalories} kcal
                    </Text>
                  </View>

                  {/* Chevron */}
                  <View style={[styles.chevronWrapper, { backgroundColor: colors.background.surface }]}>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
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
      <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primary.subtle }]}>
        <Ionicons name="barbell-outline" size={48} color={colors.primary.base} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        Ready to Get Started?
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        Generate your personalized workout plan based on your goals.
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
        <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
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
        {renderTabs()}
        {renderError()}

        {activeTab === 'today' && (
          <>
            {!weeklyPlan && !isLoading ? (
              renderEmptyState()
            ) : (
              <>
                {renderHeroCard()}
                {renderWeeklyProgress()}
                {renderUpcoming()}
              </>
            )}
          </>
        )}

        {activeTab === 'progress' && (
          <View style={styles.placeholderContent}>
            <Ionicons name="stats-chart" size={48} color={colors.text.tertiary} />
            <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>
              Progress tracking coming soon
            </Text>
          </View>
        )}

        {activeTab === 'insights' && (
          <View style={styles.placeholderContent}>
            <Ionicons name="bulb-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>
              AI insights coming soon
            </Text>
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
    marginBottom: 20,
    marginTop: 8,
  },
  headerLeft: {},
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tabButton: {
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 16,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
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
  heroContent: {},
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  splitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  splitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroMuscles: {
    fontSize: 15,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rest Day
  restDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  restDayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  restDayTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  restDaySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Progress Cards
  progressScrollContent: {
    paddingRight: 16,
  },
  progressCard: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCardContent: {
    flex: 1,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consistencyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consistencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  consistencyText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  streakBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  progressSubtext: {
    fontSize: 13,
    marginBottom: 16,
  },
  weekDayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  streakGrid: {
    width: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignSelf: 'center',
  },
  gridCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Upcoming
  upcomingList: {},
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dateBadge: {
    width: 72,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateBadgeDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  workoutIllustration: {
    position: 'absolute',
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingMeta: {
    fontSize: 13,
  },
  chevronWrapper: {
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
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // Placeholder
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
