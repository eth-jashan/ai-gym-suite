/**
 * Exercise Detail Screen
 *
 * Shows comprehensive exercise information including:
 * - Exercise name and basic info
 * - Step-by-step instructions
 * - Form cues and tips
 * - Common mistakes to avoid
 * - Mark exercise as complete
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
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/theme-provider';
import { useProgramStore } from '@/stores/program-store';
import { Button } from '@/components/ui';
import { getExerciseById, DetailedExercise } from '@/lib/data/exercises-database';
import type { MainStackParamList } from '@/src/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RoutePropType = RouteProp<{ ExerciseDetail: { exerciseId: string; dayNumber: number } }, 'ExerciseDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Difficulty labels
const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#10B981',
  2: '#22C55E',
  3: '#EAB308',
  4: '#F97316',
  5: '#EF4444',
};

export default function ExerciseDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { colors, spacing, radius } = useTheme();
  const { completeExercise, getDayByNumber } = useProgramStore();

  const { exerciseId, dayNumber } = route.params || {};

  // Get exercise from database
  const exercise = useMemo(() => {
    if (!exerciseId) return null;
    return getExerciseById(exerciseId);
  }, [exerciseId]);

  // Get day data to check completion status
  const day = getDayByNumber(dayNumber);
  const dayExercise = day?.exercises.find((e) => e.exerciseId === exerciseId);
  const isCompleted = dayExercise?.isCompleted || false;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleMarkComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeExercise(dayNumber, exerciseId);
  };

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Exercise not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyColor = DIFFICULTY_COLORS[exercise.difficultyLevel] || colors.primary.base;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Exercise Guide</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing[4], paddingBottom: spacing[10] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View
            style={[styles.heroCard, { backgroundColor: colors.background.elevated, borderRadius: radius['2xl'] }]}
          >
            <LinearGradient
              colors={[colors.primary.base + '15', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroGradient, { borderRadius: radius['2xl'] }]}
            />

            <View style={styles.heroContent}>
              {/* Exercise Icon Placeholder */}
              <View style={[styles.exerciseIconLarge, { backgroundColor: colors.primary.subtle }]}>
                <Ionicons name="barbell" size={48} color={colors.primary.base} />
              </View>

              {/* Exercise Name */}
              <Text style={[styles.exerciseName, { color: colors.text.primary }]}>{exercise.name}</Text>

              {/* Meta Row */}
              <View style={styles.metaRow}>
                <View style={[styles.metaPill, { backgroundColor: colors.background.surface }]}>
                  <Text style={[styles.metaText, { color: colors.text.secondary }]}>{exercise.category}</Text>
                </View>
                <View style={[styles.metaPill, { backgroundColor: difficultyColor + '20' }]}>
                  <Text style={[styles.metaText, { color: difficultyColor }]}>
                    {DIFFICULTY_LABELS[exercise.difficultyLevel]}
                  </Text>
                </View>
              </View>

              {/* Muscles */}
              <View style={styles.musclesRow}>
                <Text style={[styles.musclesLabel, { color: colors.text.tertiary }]}>Primary:</Text>
                <Text style={[styles.musclesValue, { color: colors.text.primary }]}>
                  {exercise.primaryMuscles.join(', ')}
                </Text>
              </View>
              {exercise.secondaryMuscles.length > 0 && (
                <View style={styles.musclesRow}>
                  <Text style={[styles.musclesLabel, { color: colors.text.tertiary }]}>Secondary:</Text>
                  <Text style={[styles.musclesValue, { color: colors.text.secondary }]}>
                    {exercise.secondaryMuscles.join(', ')}
                  </Text>
                </View>
              )}

              {/* Equipment */}
              {exercise.equipmentRequired.length > 0 && (
                <View style={[styles.equipmentRow, { marginTop: spacing[3] }]}>
                  <Ionicons name="fitness" size={16} color={colors.text.tertiary} />
                  <Text style={[styles.equipmentText, { color: colors.text.secondary }]}>
                    Equipment: {exercise.equipmentRequired.join(', ')}
                  </Text>
                </View>
              )}

              {/* Recommended Sets/Reps */}
              <View style={[styles.recommendedRow, { marginTop: spacing[4] }]}>
                <View style={[styles.recommendedCard, { backgroundColor: colors.background.surface }]}>
                  <Text style={[styles.recommendedLabel, { color: colors.text.tertiary }]}>Sets</Text>
                  <Text style={[styles.recommendedValue, { color: colors.text.primary }]}>
                    {exercise.recommendedSets.min}-{exercise.recommendedSets.max}
                  </Text>
                </View>
                <View style={[styles.recommendedCard, { backgroundColor: colors.background.surface }]}>
                  <Text style={[styles.recommendedLabel, { color: colors.text.tertiary }]}>Reps</Text>
                  <Text style={[styles.recommendedValue, { color: colors.text.primary }]}>
                    {exercise.recommendedReps.min}-{exercise.recommendedReps.max}
                  </Text>
                </View>
                <View style={[styles.recommendedCard, { backgroundColor: colors.background.surface }]}>
                  <Text style={[styles.recommendedLabel, { color: colors.text.tertiary }]}>Rest</Text>
                  <Text style={[styles.recommendedValue, { color: colors.text.primary }]}>
                    {exercise.restSeconds.min}-{exercise.restSeconds.max}s
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} style={{ marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About This Exercise</Text>
          <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>{exercise.description}</Text>
        </Animated.View>

        {/* Setup Instructions */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Setup</Text>
          <View style={[styles.setupCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary.base} />
            <Text style={[styles.setupText, { color: colors.text.secondary }]}>{exercise.setupInstructions}</Text>
          </View>
        </Animated.View>

        {/* Step-by-Step Instructions */}
        <Animated.View entering={FadeInUp.delay(250).duration(400)} style={{ marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>How To Do It</Text>

          {exercise.executionSteps.map((step, index) => (
            <Animated.View
              key={step.step}
              entering={SlideInRight.delay(300 + index * 50).duration(300)}
              style={[styles.stepCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: colors.primary.base }]}>
                <Text style={[styles.stepNumberText, { color: colors.background.base }]}>{step.step}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text.primary }]}>{step.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Form Cues */}
        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={{ marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Key Form Cues</Text>
          <View style={styles.cuesGrid}>
            {exercise.formCues.map((cue, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(400 + index * 30).duration(300)}
                style={[styles.cueChip, { backgroundColor: colors.primary.base + '15', borderRadius: radius.lg }]}
              >
                <Ionicons name="checkmark" size={14} color={colors.primary.base} />
                <Text style={[styles.cueText, { color: colors.primary.base }]}>{cue}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Pro Tips</Text>
            {exercise.tips.map((tip, index) => {
              const tipIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
                form: 'body',
                breathing: 'cloud',
                common_mistake: 'alert-circle',
                progression: 'trending-up',
              };
              const tipColors: Record<string, string> = {
                form: colors.primary.base,
                breathing: '#3B82F6',
                common_mistake: '#F97316',
                progression: '#10B981',
              };

              return (
                <Animated.View
                  key={index}
                  entering={FadeInUp.delay(450 + index * 50).duration(300)}
                  style={[styles.tipCard, { backgroundColor: colors.background.elevated, borderRadius: radius.xl }]}
                >
                  <View style={[styles.tipIcon, { backgroundColor: tipColors[tip.type] + '20' }]}>
                    <Ionicons name={tipIcons[tip.type] || 'bulb'} size={18} color={tipColors[tip.type]} />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={[styles.tipType, { color: tipColors[tip.type] }]}>
                      {tip.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.tipText, { color: colors.text.secondary }]}>{tip.text}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={{ marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Avoid These Mistakes</Text>
            <View style={[styles.mistakesCard, { backgroundColor: '#FEF2F2', borderRadius: radius.xl }]}>
              {exercise.commonMistakes.map((mistake, index) => (
                <View key={index} style={styles.mistakeRow}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                  <Text style={[styles.mistakeText, { color: '#7F1D1D' }]}>{mistake}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Complete Button */}
        {dayNumber && !isCompleted && (
          <Animated.View entering={FadeInUp.delay(550).duration(400)} style={{ marginTop: spacing[6] }}>
            <Button onPress={handleMarkComplete} variant="primary" size="lg" icon="checkmark-circle">
              Mark Exercise Complete
            </Button>
          </Animated.View>
        )}

        {isCompleted && (
          <Animated.View entering={FadeIn.delay(550).duration(400)} style={{ marginTop: spacing[6] }}>
            <View style={[styles.completedBanner, { backgroundColor: colors.primary.base + '15', borderRadius: radius.xl }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.base} />
              <Text style={[styles.completedBannerText, { color: colors.primary.base }]}>
                Exercise Complete! Great job!
              </Text>
            </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  // Hero Card
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    padding: 20,
    alignItems: 'center',
  },
  exerciseIconLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  musclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  musclesLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  musclesValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentText: {
    fontSize: 13,
  },
  recommendedRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  recommendedCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  recommendedLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  recommendedValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Setup
  setupCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  setupText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },

  // Steps
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  // Form Cues
  cuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cueText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Tips
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    marginBottom: 10,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipType: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Mistakes
  mistakesCard: {
    padding: 16,
    gap: 12,
  },
  mistakeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mistakeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Completed
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '600',
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
