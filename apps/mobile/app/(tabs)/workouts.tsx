import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textWhite]}>Workouts</Text>
        <Pressable style={styles.generateButton}>
          <Ionicons name="sparkles" size={18} color="white" />
          <Text style={styles.generateButtonText}>Generate</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <FilterChip label="All" active isDark={isDark} />
        <FilterChip label="Upcoming" isDark={isDark} />
        <FilterChip label="Completed" isDark={isDark} />
        <FilterChip label="In Progress" isDark={isDark} />
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.emptyState, isDark && styles.cardDark]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="barbell-outline" size={40} color="#64748b" />
          </View>
          <Text style={[styles.emptyTitle, isDark && styles.textWhite]}>No workouts yet</Text>
          <Text style={[styles.emptySubtitle, isDark && styles.textLight]}>
            Generate your first AI-powered workout
          </Text>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Generate Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, isDark }: { label: string; active?: boolean; isDark: boolean }) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive, isDark && !active && styles.filterChipDark]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive, isDark && !active && styles.textLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  generateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 8 },
  generateButtonText: { color: 'white', fontWeight: '600' },
  filters: { paddingHorizontal: 24, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8 },
  filterChipDark: { backgroundColor: '#1e293b' },
  filterChipActive: { backgroundColor: '#3b82f6' },
  filterChipText: { fontSize: 14, color: '#64748b' },
  filterChipTextActive: { color: 'white' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  emptyState: { backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center' },
  cardDark: { backgroundColor: '#1e293b' },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  primaryButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
