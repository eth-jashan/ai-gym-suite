import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import type { Workout } from '@/types/workout.types';

interface WorkoutCardProps {
  workout: Workout;
  variant?: 'default' | 'featured' | 'compact';
  onPress?: () => void;
}

export function WorkoutCard({ workout, variant = 'default', onPress }: WorkoutCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/workout/${workout.id}`);
    }
  };

  const statusColors = {
    upcoming: 'bg-primary-500',
    in_progress: 'bg-energy-500',
    completed: 'bg-success-500',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  if (variant === 'featured') {
    return (
      <Pressable onPress={handlePress}>
        <Card className="overflow-hidden p-0">
          <View className="bg-gradient-to-r from-primary-600 to-primary-800 p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">{workout.name}</Text>
              <View className={`rounded-full px-3 py-1 ${statusColors[workout.status]}`}>
                <Text className="text-xs font-medium text-white">
                  {statusLabels[workout.status]}
                </Text>
              </View>
            </View>
            <Text className="mb-4 text-sm text-white/80">{workout.description}</Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text className="ml-1 text-sm text-white/80">{workout.duration} min</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="barbell-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text className="ml-1 text-sm text-white/80">
                  {workout.exercises?.length || 0} exercises
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="flame-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text className="ml-1 text-sm text-white/80">{workout.calories} cal</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between bg-slate-800 px-5 py-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
              <Text className="ml-2 text-sm text-slate-400">
                {formatDate(workout.scheduledAt)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="mr-1 text-sm font-medium text-primary-400">Start</Text>
              <Ionicons name="arrow-forward" size={16} color="#60a5fa" />
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  if (variant === 'compact') {
    return (
      <Pressable onPress={handlePress}>
        <Card className="flex-row items-center">
          <View
            className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
              workout.status === 'completed' ? 'bg-success-500/20' : 'bg-primary-500/20'
            }`}
          >
            <Ionicons
              name={workout.status === 'completed' ? 'checkmark-circle' : 'barbell'}
              size={24}
              color={workout.status === 'completed' ? '#22c55e' : '#3b82f6'}
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-white">{workout.name}</Text>
            <Text className="text-sm text-slate-400">
              {workout.duration} min • {workout.exercises?.length || 0} exercises
            </Text>
          </View>
          <Text className="text-xs text-slate-500">{formatRelativeDate(workout.completedAt || workout.scheduledAt)}</Text>
        </Card>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable onPress={handlePress}>
      <Card>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-white">{workout.name}</Text>
          <View className={`rounded-full px-2 py-0.5 ${statusColors[workout.status]}`}>
            <Text className="text-xs font-medium text-white">
              {statusLabels[workout.status]}
            </Text>
          </View>
        </View>
        {workout.description && (
          <Text className="mb-3 text-sm text-slate-400" numberOfLines={2}>
            {workout.description}
          </Text>
        )}
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-sm text-slate-400">{workout.duration} min</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="barbell-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-sm text-slate-400">
              {workout.exercises?.length || 0} exercises
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="flame-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-sm text-slate-400">{workout.calories} cal</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function formatDate(date?: string | Date): string {
  if (!date) return 'Not scheduled';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatRelativeDate(date?: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
