import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  ContinueButton,
} from '../../../components/onboarding';
import { MascotExpression } from '../../../components/onboarding/MascotAvatar';

type WorkoutTimeScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'WorkoutTime'>;
};

function getTimeDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function getMascotExpression(hours: number): MascotExpression {
  if (hours >= 5 && hours < 7) return 'sleepy';
  if (hours >= 7 && hours < 10) return 'happy';
  if (hours >= 12 && hours < 17) return 'excited';
  if (hours >= 18 && hours < 21) return 'default';
  if (hours >= 21 || hours < 5) return 'surprised';
  return 'default';
}

export default function WorkoutTimeScreen({ navigation }: WorkoutTimeScreenProps) {
  const { colors } = useTheme();
  const { workoutTime, setWorkoutTime, goToStep } = useOnboardingStore();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(getTimeDate(workoutTime || '08:00'));

  useEffect(() => {
    goToStep(10);
  }, []);

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      Haptics.selectionAsync();
      setSelectedTime(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setWorkoutTime(`${hours}:${minutes}`);
    }
  };

  const handleContinue = () => {
    navigation.navigate('WorkoutDays');
  };

  const mascotExpression = getMascotExpression(selectedTime.getHours());

  return (
    <OnboardingLayout
      mascotExpression={mascotExpression}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        On your workout days, what time do you want to workout?
      </QuestionBubble>

      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(200).duration(300)}>
          <Pressable
            style={[
              styles.timeButton,
              {
                backgroundColor: colors.background.surface,
                borderColor: colors.primary.base,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPicker(true);
            }}
          >
            <Text style={[styles.timeText, { color: colors.primary.base }]}>
              {formatTime(selectedTime)}
            </Text>
          </Pressable>
        </Animated.View>

        {(showPicker || Platform.OS === 'ios') && (
          <Animated.View
            entering={FadeInUp.delay(100).duration(300)}
            style={styles.pickerContainer}
          >
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              minuteInterval={15}
              themeVariant="dark"
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(400).duration(300)}>
          <Text style={[styles.helperText, { color: colors.text.secondary }]}>
            You will receive a notification 15 minutes before your workout.
          </Text>
        </Animated.View>
      </View>

      <ContinueButton onPress={handleContinue} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  timeButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
