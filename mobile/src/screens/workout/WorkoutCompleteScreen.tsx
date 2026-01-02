/**
 * Workout Complete Screen
 *
 * Shows workout completion summary with:
 * - Celebration animation
 * - Stats grid (duration, volume, sets, etc.)
 * - Personal records if any
 * - Optional notes
 * - Next workout preview
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useWorkoutStore } from '@/stores/workout-store';
import { Card, Button, Badge } from '@/components/ui';
import { formatDuration, WorkoutStats } from '@/lib/types/workout';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RouteProps = RouteProp<MainStackParamList, 'WorkoutComplete'>;

export default function WorkoutCompleteScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { colors, spacing, typography, radius } = useTheme();
  const { upcomingWorkouts, fetchWeeklyPlan } = useWorkoutStore();

  const { stats } = route.params;
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Celebration haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Refresh the plan data
    fetchWeeklyPlan();
  }, []);

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const nextWorkout = upcomingWorkouts[0];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.celebrationHeader}
        >
          <View
            style={[
              styles.checkmarkContainer,
              { backgroundColor: colors.primary.muted },
            ]}
          >
            <Animated.View entering={FadeIn.delay(200).duration(400)}>
              <Ionicons
                name="checkmark-circle"
                size={80}
                color={colors.primary.base}
              />
            </Animated.View>
          </View>

          <Text
            style={[
              styles.celebrationTitle,
              { color: colors.text.primary, fontSize: typography.sizes['2xl'] },
            ]}
          >
            Workout Complete!
          </Text>

          <Text
            style={[
              styles.celebrationSubtitle,
              { color: colors.text.secondary, fontSize: typography.sizes.base },
            ]}
          >
            Great job crushing your workout today!
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
          style={styles.statsGrid}
        >
          <View style={styles.statsRow}>
            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {formatDuration(stats.duration)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Duration
              </Text>
            </Card>

            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="barbell-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {stats.exercisesCompleted}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Exercises
              </Text>
            </Card>

            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="layers-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {stats.totalSets}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Sets
              </Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="fitness-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {Math.round(stats.totalVolume).toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Volume (kg)
              </Text>
            </Card>

            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="speedometer-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {stats.averageRpe.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Avg RPE
              </Text>
            </Card>

            <Card variant="surface" style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color={colors.primary.base} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {stats.caloriesBurned}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Calories
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Personal Records */}
        {stats.personalRecords.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.primary, fontSize: typography.sizes.lg },
              ]}
            >
              Personal Records
            </Text>

            {stats.personalRecords.map((pr, index) => (
              <Card
                key={index}
                variant="surface"
                style={[
                  styles.prCard,
                  { backgroundColor: '#FFD70020', marginBottom: spacing[2] },
                ]}
              >
                <View style={styles.prRow}>
                  <View
                    style={[
                      styles.prIcon,
                      { backgroundColor: '#FFD700' },
                    ]}
                  >
                    <Ionicons name="trophy" size={20} color="#000" />
                  </View>
                  <View style={styles.prInfo}>
                    <Text style={[styles.prExercise, { color: colors.text.primary }]}>
                      {pr.exerciseName}
                    </Text>
                    <Text style={[styles.prDetails, { color: colors.text.secondary }]}>
                      New {pr.type}: {pr.newValue}{pr.type === 'weight' ? 'kg' : ''} (+{pr.improvement.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Notes Input */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, fontSize: typography.sizes.lg, marginTop: spacing[6] },
            ]}
          >
            How did it go?
          </Text>

          <Card variant="surface" style={styles.notesCard}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your workout..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              style={[
                styles.notesInput,
                { color: colors.text.primary, fontSize: typography.sizes.base },
              ]}
            />
          </Card>
        </Animated.View>

        {/* Next Workout Preview */}
        {nextWorkout && (
          <Animated.View entering={FadeInUp.delay(600).duration(400)}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.primary, fontSize: typography.sizes.lg, marginTop: spacing[6] },
              ]}
            >
              Up Next
            </Text>

            <Card variant="surface" style={styles.nextWorkoutCard}>
              <View style={styles.nextWorkoutRow}>
                <View>
                  <Text style={[styles.nextWorkoutTitle, { color: colors.text.primary }]}>
                    {nextWorkout.title}
                  </Text>
                  <Text style={[styles.nextWorkoutMeta, { color: colors.text.secondary }]}>
                    {nextWorkout.estimatedDuration} min • {nextWorkout.exercises.length} exercises
                  </Text>
                </View>
                <Badge variant="default" size="sm">
                  {new Date(nextWorkout.scheduledDate).toLocaleDateString('en-US', { weekday: 'short' })}
                </Badge>
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Done Button */}
      <View
        style={[
          styles.bottomButton,
          {
            backgroundColor: colors.background.base,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
        ]}
      >
        <Button
          onPress={handleDone}
          variant="primary"
          size="lg"
          fullWidth
        >
          Done
        </Button>
      </View>
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
    paddingTop: 32,
  },

  // Celebration Header
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },

  // Section Title
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },

  // Personal Records
  prCard: {},
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  prDetails: {
    fontSize: 13,
  },

  // Notes
  notesCard: {},
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Next Workout
  nextWorkoutCard: {},
  nextWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextWorkoutTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  nextWorkoutMeta: {
    fontSize: 14,
  },

  // Bottom Button
  bottomButton: {},
});
