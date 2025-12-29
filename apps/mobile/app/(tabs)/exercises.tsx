import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useExerciseStore } from '@/stores/exercise.store';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { useRefresh } from '@/hooks/useRefresh';
import type { Exercise } from '@/types/workout.types';

const MUSCLE_GROUPS = [
  { key: 'all', label: 'All', icon: 'body-outline' },
  { key: 'chest', label: 'Chest', icon: 'fitness-outline' },
  { key: 'back', label: 'Back', icon: 'body-outline' },
  { key: 'shoulders', label: 'Shoulders', icon: 'body-outline' },
  { key: 'arms', label: 'Arms', icon: 'barbell-outline' },
  { key: 'legs', label: 'Legs', icon: 'walk-outline' },
  { key: 'core', label: 'Core', icon: 'body-outline' },
] as const;

export default function ExercisesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const { exercises, fetchExercises } = useExerciseStore();
  const { refreshing, onRefresh } = useRefresh(fetchExercises);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle =
        selectedMuscle === 'all' ||
        exercise.muscleGroups?.some((m) => m.toLowerCase() === selectedMuscle);
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  const renderExercise = useCallback(
    ({ item, index }: { item: Exercise; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 50)} className="px-6">
        <ExerciseCard exercise={item} />
      </Animated.View>
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} className="px-6 py-4">
        <Text className="mb-4 text-2xl font-bold text-white">Exercise Library</Text>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl bg-slate-800 px-4">
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            className="ml-3 flex-1 py-3 text-base text-white"
            placeholder="Search exercises..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Muscle Group Filter */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-4">
        <FlatList
          horizontal
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-6 gap-2"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedMuscle(item.key)}
              className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${
                selectedMuscle === item.key ? 'bg-primary-500' : 'bg-slate-800'
              }`}
            >
              <Ionicons
                name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={16}
                color={selectedMuscle === item.key ? 'white' : '#94a3b8'}
              />
              <Text
                className={`text-sm font-medium ${
                  selectedMuscle === item.key ? 'text-white' : 'text-slate-400'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </Animated.View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-6 gap-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-800">
              <Ionicons name="search-outline" size={40} color="#64748b" />
            </View>
            <Text className="mb-2 text-lg font-semibold text-white">No exercises found</Text>
            <Text className="text-center text-slate-400">
              Try adjusting your search or filter
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Text className="px-6 pb-2 text-sm text-slate-400">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </Text>
        }
      />
    </SafeAreaView>
  );
}
