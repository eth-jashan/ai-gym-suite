import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useWorkoutStore } from '@/stores/workout.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import type { Workout, WorkoutExercise } from '@/types/workout.types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);

  const { fetchWorkoutById, startWorkout, completeExercise, finishWorkout, isLoading } = useWorkoutStore();

  useEffect(() => {
    if (id) {
      fetchWorkoutById(id).then(setWorkout);
    }
  }, [id, fetchWorkoutById]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStartWorkout = async () => {
    if (!workout) return;
    await startWorkout(workout.id);
    setIsActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCompleteExercise = async () => {
    if (!workout) return;
    const currentExercise = workout.exercises[currentExerciseIndex];
    await completeExercise(workout.id, currentExercise.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = async () => {
    if (!workout) return;
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            await finishWorkout(workout.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-white">Loading...</Text>
      </SafeAreaView>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-6 py-4">
          <Card className="overflow-hidden">
            <View className="bg-gradient-to-r from-primary-500 to-primary-700 p-6">
              <Text className="mb-2 text-2xl font-bold text-white">{workout.name}</Text>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text className="ml-1 text-white/80">{workout.duration} min</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="barbell-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text className="ml-1 text-white/80">{workout.exercises.length} exercises</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="flame-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text className="ml-1 text-white/80">{workout.calories} cal</Text>
                </View>
              </View>
            </View>

            {isActive && (
              <View className="border-t border-slate-700 p-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-400">Progress</Text>
                  <Text className="text-sm font-medium text-white">
                    {currentExerciseIndex + 1} / {workout.exercises.length}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <View
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${progress}%` }}
                  />
                </View>
                <View className="mt-4 flex-row items-center justify-center">
                  <Ionicons name="timer-outline" size={20} color="#3b82f6" />
                  <Text className="ml-2 text-2xl font-bold text-white">{formatTime(timer)}</Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Current Exercise */}
        {isActive && currentExercise && (
          <Animated.View entering={FadeInUp.delay(100)} className="mb-6 px-6">
            <Text className="mb-3 text-lg font-semibold text-white">Current Exercise</Text>
            <Card className="border-2 border-primary-500 p-6">
              <View className="mb-4 flex-row items-center">
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-primary-500/20">
                  <Ionicons name="barbell" size={28} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white">{currentExercise.exercise.name}</Text>
                  <Text className="text-slate-400">{currentExercise.exercise.muscleGroups?.join(', ')}</Text>
                </View>
              </View>

              <View className="mb-4 flex-row justify-around rounded-lg bg-slate-800 p-4">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary-400">{currentExercise.sets}</Text>
                  <Text className="text-sm text-slate-400">Sets</Text>
                </View>
                <View className="h-full w-px bg-slate-700" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary-400">{currentExercise.reps}</Text>
                  <Text className="text-sm text-slate-400">Reps</Text>
                </View>
                {currentExercise.weight && (
                  <>
                    <View className="h-full w-px bg-slate-700" />
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-primary-400">{currentExercise.weight}</Text>
                      <Text className="text-sm text-slate-400">kg</Text>
                    </View>
                  </>
                )}
              </View>

              <Button
                title="Complete Exercise"
                onPress={handleCompleteExercise}
                icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
              />
            </Card>
          </Animated.View>
        )}

        {/* Exercise List */}
        <Animated.View entering={FadeInUp.delay(200)} className="px-6">
          <Text className="mb-3 text-lg font-semibold text-white">
            {isActive ? 'All Exercises' : 'Exercises'}
          </Text>
          <View className="gap-3">
            {workout.exercises.map((exercise, index) => {
              const isCompleted = isActive && index < currentExerciseIndex;
              const isCurrent = isActive && index === currentExerciseIndex;
              return (
                <Card
                  key={exercise.id}
                  className={`flex-row items-center p-4 ${isCurrent ? 'border border-primary-500' : ''} ${isCompleted ? 'opacity-60' : ''}`}
                >
                  <View
                    className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
                      isCompleted ? 'bg-success-500' : isCurrent ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={20} color="white" />
                    ) : (
                      <Text className="font-bold text-white">{index + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isCompleted ? 'text-slate-400' : 'text-white'}`}>
                      {exercise.exercise.name}
                    </Text>
                    <Text className="text-sm text-slate-400">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      {!isActive && (
        <View className="border-t border-slate-800 px-6 py-4">
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            loading={isLoading}
            icon={<Ionicons name="play" size={20} color="white" />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
