import { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  options?: { value: string; label: string; icon: string }[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'goals',
    title: "What's your main goal?",
    description: 'This helps us create the perfect workout plan for you',
    icon: '🎯',
    options: [
      { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
      { value: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
      { value: 'stay_fit', label: 'Stay Fit', icon: '🏃' },
      { value: 'improve_strength', label: 'Improve Strength', icon: '🏋️' },
    ],
  },
  {
    id: 'experience',
    title: "What's your fitness level?",
    description: "Be honest - we'll adapt your workouts accordingly",
    icon: '📊',
    options: [
      { value: 'beginner', label: 'Beginner', icon: '🌱' },
      { value: 'intermediate', label: 'Intermediate', icon: '🌿' },
      { value: 'advanced', label: 'Advanced', icon: '🌳' },
      { value: 'expert', label: 'Expert', icon: '🏆' },
    ],
  },
  {
    id: 'frequency',
    title: 'How often can you work out?',
    description: 'Consistency is key to achieving your goals',
    icon: '📅',
    options: [
      { value: '2-3', label: '2-3 days/week', icon: '🗓️' },
      { value: '3-4', label: '3-4 days/week', icon: '📆' },
      { value: '4-5', label: '4-5 days/week', icon: '💪' },
      { value: '6+', label: '6+ days/week', icon: '🔥' },
    ],
  },
  {
    id: 'equipment',
    title: 'What equipment do you have?',
    description: "We'll tailor exercises to your available equipment",
    icon: '🏋️',
    options: [
      { value: 'none', label: 'No Equipment', icon: '🏠' },
      { value: 'basic', label: 'Basic (Dumbbells)', icon: '🏋️' },
      { value: 'home_gym', label: 'Home Gym', icon: '🏠' },
      { value: 'full_gym', label: 'Full Gym Access', icon: '🏢' },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);

  const { completeOnboarding, isLoading } = useAuthStore();

  const handleOptionSelect = (stepId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  };

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      flatListRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
    } else {
      // Complete onboarding
      const success = await completeOnboarding(answers);
      if (success) {
        router.replace('/(tabs)');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      flatListRef.current?.scrollToIndex({ index: currentStep - 1, animated: true });
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isCurrentStepAnswered = !!answers[currentStepData.id];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={{ width }} className="px-6">
      <Animated.View entering={FadeIn.delay(200)} className="mb-8 items-center">
        <Text className="mb-4 text-6xl">{item.icon}</Text>
        <Text className="mb-2 text-center text-2xl font-bold text-white">{item.title}</Text>
        <Text className="text-center text-base text-slate-400">{item.description}</Text>
      </Animated.View>

      <View className="gap-3">
        {item.options?.map((option, optionIndex) => {
          const isSelected = answers[item.id] === option.value;
          return (
            <Animated.View key={option.value} entering={FadeInDown.delay(100 * optionIndex)}>
              <Pressable
                onPress={() => handleOptionSelect(item.id, option.value)}
                className={`flex-row items-center rounded-xl border-2 p-4 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <Text className="mr-4 text-3xl">{option.icon}</Text>
                <Text
                  className={`text-lg font-medium ${isSelected ? 'text-primary-400' : 'text-white'}`}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-primary-500">
                    <Text className="text-white">✓</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Progress Indicator */}
      <View className="flex-row gap-2 px-6 py-4">
        {ONBOARDING_STEPS.map((_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index <= currentStep ? 'bg-primary-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </View>

      {/* Steps */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_STEPS}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      />

      {/* Navigation */}
      <View className="flex-row gap-3 px-6 pb-4">
        {currentStep > 0 && (
          <Button title="Back" onPress={handleBack} variant="outline" className="flex-1" />
        )}
        <Button
          title={isLastStep ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          disabled={!isCurrentStepAnswered}
          loading={isLoading && isLastStep}
          className="flex-1"
        />
      </View>
    </SafeAreaView>
  );
}
