import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import type { Exercise } from '@/types/workout.types';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
}

const difficultyColors = {
  beginner: 'bg-success-500',
  intermediate: 'bg-energy-500',
  advanced: 'bg-red-500',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row items-center">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-xl bg-primary-500/20">
          <Ionicons name="barbell" size={24} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 font-semibold text-white">{exercise.name}</Text>
          <View className="flex-row flex-wrap gap-1">
            {exercise.muscleGroups?.slice(0, 3).map((muscle, index) => (
              <View key={index} className="rounded bg-slate-700 px-2 py-0.5">
                <Text className="text-xs text-slate-300">{muscle}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="items-end">
          {exercise.difficulty && (
            <View
              className={`mb-1 rounded-full px-2 py-0.5 ${difficultyColors[exercise.difficulty]}/20`}
            >
              <Text
                className={`text-xs font-medium ${
                  exercise.difficulty === 'beginner'
                    ? 'text-success-400'
                    : exercise.difficulty === 'intermediate'
                      ? 'text-energy-400'
                      : 'text-red-400'
                }`}
              >
                {difficultyLabels[exercise.difficulty]}
              </Text>
            </View>
          )}
          <View className="flex-row items-center">
            <Ionicons name="fitness-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-xs text-slate-500">{exercise.equipment || 'Bodyweight'}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
