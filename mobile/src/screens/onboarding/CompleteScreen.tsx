import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useAuthStore } from '../../../stores/auth-store';
import { useTheme } from '../../../providers/theme-provider';
import { MascotAvatar, ContinueButton } from '../../../components/onboarding';

type CompleteScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Complete'>;
};

export default function CompleteScreen({ navigation }: CompleteScreenProps) {
  const { colors } = useTheme();
  const { name, goToStep } = useOnboardingStore();
  const { completeOnboarding } = useAuthStore();

  useEffect(() => {
    goToStep(22);
    // Celebrate with haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleGetStarted = async () => {
    await completeOnboarding();
    // Navigation will happen automatically via RootNavigator
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.base }]}>
      {/* Celebration Animation */}
      <Animated.View
        entering={ZoomIn.delay(200).duration(500)}
        style={styles.mascotContainer}
      >
        <MascotAvatar expression="excited" size="large" />
      </Animated.View>

      {/* Checkmark */}
      <Animated.View
        entering={ZoomIn.delay(400).duration(400)}
        style={[styles.checkmark, { backgroundColor: colors.status.success }]}
      >
        <Text style={styles.checkmarkText}>\u2713</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(600).duration(400)}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          You're all set, {name}!
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View entering={FadeInUp.delay(800).duration(400)}>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Your personalized fitness journey begins now. I'll be here to guide you every step of the way.
        </Text>
      </Animated.View>

      {/* Features List */}
      <Animated.View
        entering={FadeInUp.delay(1000).duration(400)}
        style={styles.featuresList}
      >
        <FeatureItem
          icon="\uD83D\uDCAA"
          text="Custom workout plans"
          colors={colors}
        />
        <FeatureItem
          icon="\uD83C\uDF7D\uFE0F"
          text="Personalized nutrition"
          colors={colors}
        />
        <FeatureItem
          icon="\uD83D\uDCC8"
          text="Progress tracking"
          colors={colors}
        />
        <FeatureItem
          icon="\uD83E\uDD16"
          text="AI coaching support"
          colors={colors}
        />
      </Animated.View>

      {/* CTA Button */}
      <View style={styles.buttonContainer}>
        <ContinueButton
          onPress={handleGetStarted}
          label="Let's Go!"
          delay={1200}
        />
      </View>
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
  colors: any;
}

function FeatureItem({ icon, text, colors }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: colors.text.primary }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mascotContainer: {
    marginBottom: 16,
  },
  checkmark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmarkText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuresList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
  },
});
