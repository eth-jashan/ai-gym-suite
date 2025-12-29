import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useWorkoutStore } from '@/stores/workout.store';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { Button } from '@/components/ui/Button';
import { useRefresh } from '@/hooks/useRefresh';
import type { Workout } from '@/types/workout.types';

type FilterType = 'all' | 'completed' | 'upcoming' | 'in_progress';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function WorkoutsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { workouts, isLoading, fetchWorkouts, generateWorkout } = useWorkoutStore();
  const { refreshing, onRefresh } = useRefresh(fetchWorkouts);

  const filteredWorkouts = workouts.filter((workout) => {
    if (activeFilter === 'all') return true;
    return workout.status === activeFilter;
  });

  const handleGenerateWorkout = async () => {
    await generateWorkout();
  };

  const renderWorkout = useCallback(
    ({ item, index }: { item: Workout; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 100)} className="px-6">
        <WorkoutCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
      </Animated.View>
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top']}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="flex-row items-center justify-between px-6 py-4"
      >
        <Text className="text-2xl font-bold text-white">Workouts</Text>
        <Pressable
          onPress={handleGenerateWorkout}
          className="flex-row items-center gap-2 rounded-lg bg-primary-500 px-4 py-2"
        >
          <Ionicons name="sparkles" size={18} color="white" />
          <Text className="font-semibold text-white">Generate</Text>
        </Pressable>
      </Animated.View>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-6 gap-2"
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`rounded-full px-4 py-2 ${
                activeFilter === filter.key ? 'bg-primary-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter.key ? 'text-white' : 'text-slate-400'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Workout List */}
      <FlatList
        data={filteredWorkouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-6 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-800">
              <Ionicons name="barbell-outline" size={40} color="#64748b" />
            </View>
            <Text className="mb-2 text-lg font-semibold text-white">No workouts found</Text>
            <Text className="mb-6 text-center text-slate-400">
              {activeFilter === 'all'
                ? "You haven't created any workouts yet"
                : `No ${activeFilter.replace('_', ' ')} workouts`}
            </Text>
            {activeFilter === 'all' && (
              <Button
                title="Generate Your First Workout"
                onPress={handleGenerateWorkout}
                loading={isLoading}
              />
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
