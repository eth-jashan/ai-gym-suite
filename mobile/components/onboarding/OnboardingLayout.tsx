import React from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../providers/theme-provider';
import { useOnboardingStore } from '../../stores/onboarding-store';
import MascotAvatar, { MascotExpression } from './MascotAvatar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  showClose?: boolean;
  showProgress?: boolean;
  showMascot?: boolean;
  mascotExpression?: MascotExpression;
  onBack?: () => void;
  onClose?: () => void;
}

export default function OnboardingLayout({
  children,
  showBack = true,
  showClose = true,
  showProgress = true,
  showMascot = true,
  mascotExpression = 'default',
  onBack,
  onClose,
}: OnboardingLayoutProps) {
  const { colors } = useTheme();
  const { currentStep, totalSteps } = useOnboardingStore();

  const progress = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          {showBack && onBack ? (
            <Pressable style={styles.headerButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}

          {showProgress && (
            <View style={[styles.progressContainer, { backgroundColor: colors.background.surface }]}>
              <Animated.View
                entering={FadeIn}
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.primary.base, width: `${progress}%` },
                ]}
              />
            </View>
          )}

          {showClose && onClose ? (
            <Pressable style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        {/* Content */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.content}>
          {children}
        </Animated.View>

        {/* Mascot */}
        {showMascot && (
          <View style={styles.mascotContainer}>
            <MascotAvatar expression={mascotExpression} size="medium" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 100, // Above the button
    left: 24,
  },
});
