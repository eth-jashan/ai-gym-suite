import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import { MascotAvatar } from '../../../components/onboarding';

type ProcessingScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Processing'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataTag {
  label: string;
  value: string;
  color: string;
  delay: number;
  position: 'left' | 'right';
}

export default function ProcessingScreen({ navigation }: ProcessingScreenProps) {
  const { colors } = useTheme();
  const {
    height,
    currentWeight,
    gender,
    activityLevel,
    equipment,
    unitSystem,
    calculatePlan,
    submitOnboarding,
    goToStep,
  } = useOnboardingStore();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Creating your personalized plan...');

  const rotation = useSharedValue(0);

  useEffect(() => {
    goToStep(20);

    // Start rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Submit to API and calculate local plan
    const submitAndNavigate = async () => {
      try {
        setStatusText('Saving your profile...');

        // Calculate local plan first
        calculatePlan();

        // Submit to backend (useMock = false to use real API)
        const result = await submitOnboarding(false);

        if (result) {
          console.log('Onboarding submitted successfully');
          setStatusText('Plan created!');
          navigation.navigate('Summary');
        } else {
          // If API fails, still navigate but with local plan
          console.warn('API submission failed, using local plan');
          setStatusText('Plan created (offline mode)');
          navigation.navigate('Summary');
        }
      } catch (error) {
        console.error('Onboarding submission error:', error);
        // Still navigate with local plan on error
        setStatusText('Plan created (offline mode)');
        navigation.navigate('Summary');
      }
    };

    // Wait for animations then submit
    const timer = setTimeout(submitAndNavigate, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const orbitStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value * 0.7}deg` }],
  }));

  const dataTags: DataTag[] = [
    {
      label: 'Height',
      value: `${height}${unitSystem === 'metric' ? 'cm' : 'in'}`,
      color: '#9575CD',
      delay: 500,
      position: 'left',
    },
    {
      label: 'Weight',
      value: `${currentWeight}${unitSystem === 'metric' ? 'kg' : 'lb'}`,
      color: '#78909C',
      delay: 800,
      position: 'left',
    },
    {
      label: 'Gender',
      value: gender === 'male' ? 'Male' : 'Female',
      color: '#EF9A9A',
      delay: 1100,
      position: 'right',
    },
    {
      label: 'Activity',
      value: activityLevel?.replace('_', ' ') || 'Moderate',
      color: '#4DD0E1',
      delay: 1400,
      position: 'right',
    },
    {
      label: 'Equipment',
      value: equipment.length > 0 ? `${equipment.length} types` : 'Bodyweight',
      color: '#FFD54F',
      delay: 1700,
      position: 'left',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.base }]}>
      {/* Animated Mascot with Orbits */}
      <View style={styles.mascotContainer}>
        <Animated.View style={[styles.orbit, styles.orbit1, orbitStyle]}>
          <View style={[styles.orbitDot, { backgroundColor: colors.primary.base }]} />
        </Animated.View>
        <Animated.View style={[styles.orbit, styles.orbit2, orbitStyle2]}>
          <View style={[styles.orbitDot, { backgroundColor: colors.primary.muted }]} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <MascotAvatar expression="excited" size="large" />
        </Animated.View>
      </View>

      {/* Data Tags */}
      <View style={styles.tagsContainer}>
        {dataTags.map((tag, index) => (
          <Animated.View
            key={tag.label}
            entering={
              tag.position === 'left'
                ? FadeInLeft.delay(tag.delay).duration(400)
                : FadeInRight.delay(tag.delay).duration(400)
            }
            style={[
              styles.tag,
              tag.position === 'left' ? styles.tagLeft : styles.tagRight,
              { backgroundColor: tag.color },
            ]}
          >
            <Text style={styles.tagLabel}>{tag.label}</Text>
            <Text style={styles.tagValue}>{tag.value}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Progress Text */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        style={styles.progressContainer}
      >
        <Text style={[styles.progressText, { color: colors.text.primary }]}>
          {statusText}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.background.surface }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary.base, width: `${progress}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressPercent, { color: colors.text.secondary }]}>
          {progress}%
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    alignItems: 'center',
  },
  orbit1: {
    width: 160,
    height: 160,
  },
  orbit2: {
    width: 200,
    height: 200,
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: -5,
  },
  tagsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tag: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
  },
  tagLeft: {
    left: 20,
  },
  tagRight: {
    right: 20,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
  },
  tagValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.8)',
    marginTop: 2,
  },
  progressContainer: {
    alignItems: 'center',
    width: '80%',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    marginTop: 8,
  },
});
