import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, Gender } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
} from '../../../components/onboarding';

type GenderScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Gender'>;
};

export default function GenderScreen({ navigation }: GenderScreenProps) {
  const { colors } = useTheme();
  const { gender, setGender, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(13);
  }, []);

  const handleSelect = (value: Gender) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGender(value);
    setTimeout(() => {
      navigation.navigate('Age');
    }, 300);
  };

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble subtitle="This helps us calculate your metabolism and recommend appropriate exercises.">
        What is your biological sex?
      </QuestionBubble>

      <View style={styles.container}>
        <GenderCard
          icon="\u2642\uFE0F"
          label="Male"
          isSelected={gender === 'male'}
          onPress={() => handleSelect('male')}
          colors={colors}
          delay={100}
        />
        <GenderCard
          icon="\u2640\uFE0F"
          label="Female"
          isSelected={gender === 'female'}
          onPress={() => handleSelect('female')}
          colors={colors}
          delay={150}
        />
      </View>
    </OnboardingLayout>
  );
}

interface GenderCardProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  delay: number;
}

function GenderCard({ icon, label, isSelected, onPress, colors, delay }: GenderCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(300)}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.primary.muted : colors.background.surface,
            borderColor: isSelected ? colors.primary.base : colors.border.default,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
