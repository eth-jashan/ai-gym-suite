import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';

const MUSCLE_GROUPS = [
  { id: 'all', label: 'All', icon: 'body-outline' },
  { id: 'chest', label: 'Chest', icon: 'fitness-outline' },
  { id: 'back', label: 'Back', icon: 'fitness-outline' },
  { id: 'shoulders', label: 'Shoulders', icon: 'fitness-outline' },
  { id: 'arms', label: 'Arms', icon: 'fitness-outline' },
  { id: 'legs', label: 'Legs', icon: 'fitness-outline' },
  { id: 'core', label: 'Core', icon: 'fitness-outline' },
] as const;

const SAMPLE_EXERCISES = [
  { id: '1', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '2', name: 'Squat', muscle: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '3', name: 'Deadlift', muscle: 'Back', equipment: 'Barbell', difficulty: 'Advanced' },
  { id: '4', name: 'Pull-ups', muscle: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: '5', name: 'Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner' },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const filteredExercises = SAMPLE_EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || exercise.muscle.toLowerCase() === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textWhite]}>Exercises</Text>
      </View>

      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={[styles.searchInput, isDark && styles.textWhite]}
          placeholder="Search exercises..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleGroups}>
        {MUSCLE_GROUPS.map((muscle) => (
          <Pressable
            key={muscle.id}
            style={[
              styles.muscleChip,
              selectedMuscle === muscle.id && styles.muscleChipActive,
              isDark && selectedMuscle !== muscle.id && styles.muscleChipDark,
            ]}
            onPress={() => setSelectedMuscle(muscle.id)}
          >
            <Text
              style={[
                styles.muscleChipText,
                selectedMuscle === muscle.id && styles.muscleChipTextActive,
                isDark && selectedMuscle !== muscle.id && styles.textLight,
              ]}
            >
              {muscle.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <Pressable key={exercise.id} style={[styles.exerciseCard, isDark && styles.cardDark]}>
              <View style={styles.exerciseIcon}>
                <Ionicons name="barbell-outline" size={24} color="#3b82f6" />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, isDark && styles.textWhite]}>{exercise.name}</Text>
                <Text style={[styles.exerciseMeta, isDark && styles.textLight]}>
                  {exercise.muscle} • {exercise.equipment}
                </Text>
              </View>
              <View style={[styles.difficultyBadge, getDifficultyStyle(exercise.difficulty)]}>
                <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyState, isDark && styles.cardDark]}>
            <Ionicons name="search-outline" size={40} color="#64748b" />
            <Text style={[styles.emptyTitle, isDark && styles.textWhite]}>No exercises found</Text>
            <Text style={[styles.emptySubtitle, isDark && styles.textLight]}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getDifficultyStyle(difficulty: string) {
  switch (difficulty) {
    case 'Beginner':
      return { backgroundColor: '#dcfce7' };
    case 'Intermediate':
      return { backgroundColor: '#fef3c7' };
    case 'Advanced':
      return { backgroundColor: '#fecaca' };
    default:
      return { backgroundColor: '#e2e8f0' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchContainerDark: { backgroundColor: '#1e293b' },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a' },
  muscleGroups: { paddingHorizontal: 24, marginVertical: 16, maxHeight: 50 },
  muscleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8 },
  muscleChipDark: { backgroundColor: '#1e293b' },
  muscleChipActive: { backgroundColor: '#3b82f6' },
  muscleChipText: { fontSize: 14, color: '#64748b' },
  muscleChipTextActive: { color: 'white' },
  content: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardDark: { backgroundColor: '#1e293b' },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  exerciseMeta: { fontSize: 14, color: '#64748b' },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  difficultyText: { fontSize: 12, fontWeight: '500', color: '#0f172a' },
  emptyState: { backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center', marginTop: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
