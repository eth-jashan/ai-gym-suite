import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Sample workout data - would come from API/store
const SAMPLE_WORKOUT = {
  id: '1',
  name: 'Full Body Strength',
  duration: '45 min',
  exercises: [
    { id: '1', name: 'Barbell Squat', sets: 4, reps: '8-10', rest: '90s', muscle: 'Legs' },
    { id: '2', name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s', muscle: 'Chest' },
    { id: '3', name: 'Bent Over Row', sets: 4, reps: '8-10', rest: '90s', muscle: 'Back' },
    { id: '4', name: 'Overhead Press', sets: 3, reps: '10-12', rest: '60s', muscle: 'Shoulders' },
    { id: '5', name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '60s', muscle: 'Legs' },
    { id: '6', name: 'Plank', sets: 3, reps: '30-45s', rest: '30s', muscle: 'Core' },
  ],
};

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // In a real app, fetch workout by id from API/store
  const workout = SAMPLE_WORKOUT;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={isDark ? 'white' : '#0f172a'} />
        </Pressable>
        <Text style={[styles.headerTitle, isDark && styles.textWhite]}>{workout.name}</Text>
        <Pressable style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? 'white' : '#0f172a'} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, isDark && styles.cardDark]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={[styles.infoLabel, isDark && styles.textLight]}>Duration</Text>
              <Text style={[styles.infoValue, isDark && styles.textWhite]}>{workout.duration}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="barbell-outline" size={20} color="#8b5cf6" />
              <Text style={[styles.infoLabel, isDark && styles.textLight]}>Exercises</Text>
              <Text style={[styles.infoValue, isDark && styles.textWhite]}>{workout.exercises.length}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="layers-outline" size={20} color="#10b981" />
              <Text style={[styles.infoLabel, isDark && styles.textLight]}>Total Sets</Text>
              <Text style={[styles.infoValue, isDark && styles.textWhite]}>
                {workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, isDark && styles.textWhite]}>Exercises</Text>

        {workout.exercises.map((exercise, index) => (
          <View key={exercise.id} style={[styles.exerciseCard, isDark && styles.cardDark]}>
            <View style={styles.exerciseNumber}>
              <Text style={styles.exerciseNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseDetails}>
              <Text style={[styles.exerciseName, isDark && styles.textWhite]}>{exercise.name}</Text>
              <Text style={[styles.exerciseMuscle, isDark && styles.textLight]}>{exercise.muscle}</Text>
              <View style={styles.exerciseStats}>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatLabel, isDark && styles.textLight]}>Sets</Text>
                  <Text style={[styles.exerciseStatValue, isDark && styles.textWhite]}>{exercise.sets}</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatLabel, isDark && styles.textLight]}>Reps</Text>
                  <Text style={[styles.exerciseStatValue, isDark && styles.textWhite]}>{exercise.reps}</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatLabel, isDark && styles.textLight]}>Rest</Text>
                  <Text style={[styles.exerciseStatValue, isDark && styles.textWhite]}>{exercise.rest}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.exerciseMenu}>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Pressable style={styles.startButton}>
          <Ionicons name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  menuButton: { padding: 8 },
  content: { padding: 24 },
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 24 },
  cardDark: { backgroundColor: '#1e293b' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#64748b', marginTop: 8 },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 16 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: { fontSize: 14, fontWeight: '600', color: 'white' },
  exerciseDetails: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  exerciseMuscle: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  exerciseStats: { flexDirection: 'row', gap: 16 },
  exerciseStat: {},
  exerciseStatLabel: { fontSize: 12, color: '#94a3b8' },
  exerciseStatValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  exerciseMenu: { padding: 8 },
  footer: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerDark: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: { fontSize: 18, fontWeight: '600', color: 'white' },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
