import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';

const STATS = [
  { label: 'Workouts', value: '0', icon: 'barbell-outline', color: '#3b82f6' },
  { label: 'Total Time', value: '0h', icon: 'time-outline', color: '#8b5cf6' },
  { label: 'Exercises', value: '0', icon: 'fitness-outline', color: '#10b981' },
  { label: 'Streak', value: '0 days', icon: 'flame-outline', color: '#f59e0b' },
];

const PERIODS = ['Week', 'Month', 'Year', 'All Time'] as const;

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textWhite]}>Progress</Text>
        <Pressable style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periods}>
        {PERIODS.map((period, index) => (
          <Pressable
            key={period}
            style={[styles.periodChip, index === 0 && styles.periodChipActive, isDark && index !== 0 && styles.periodChipDark]}
          >
            <Text style={[styles.periodChipText, index === 0 && styles.periodChipTextActive, isDark && index !== 0 && styles.textLight]}>
              {period}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, isDark && styles.cardDark]}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, isDark && styles.textWhite]}>{stat.value}</Text>
              <Text style={[styles.statLabel, isDark && styles.textLight]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartCard, isDark && styles.cardDark]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, isDark && styles.textWhite]}>Workout Frequency</Text>
            <Pressable>
              <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="bar-chart-outline" size={48} color="#64748b" />
            <Text style={[styles.chartPlaceholderText, isDark && styles.textLight]}>
              Complete workouts to see your progress
            </Text>
          </View>
        </View>

        <View style={[styles.chartCard, isDark && styles.cardDark]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, isDark && styles.textWhite]}>Personal Records</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          <View style={styles.emptyRecords}>
            <Ionicons name="trophy-outline" size={40} color="#64748b" />
            <Text style={[styles.emptyRecordsText, isDark && styles.textLight]}>
              No personal records yet
            </Text>
            <Text style={[styles.emptyRecordsSubtext, isDark && styles.textLight]}>
              Start logging your workouts to track PRs
            </Text>
          </View>
        </View>

        <View style={[styles.chartCard, isDark && styles.cardDark]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, isDark && styles.textWhite]}>Recent Activity</Text>
          </View>
          <View style={styles.emptyActivity}>
            <Ionicons name="calendar-outline" size={40} color="#64748b" />
            <Text style={[styles.emptyRecordsText, isDark && styles.textLight]}>No activity this week</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  calendarButton: { padding: 8 },
  periods: { paddingHorizontal: 24, marginBottom: 16, maxHeight: 50 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8 },
  periodChipDark: { backgroundColor: '#1e293b' },
  periodChipActive: { backgroundColor: '#3b82f6' },
  periodChipText: { fontSize: 14, color: '#64748b' },
  periodChipTextActive: { color: 'white' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 16, flexGrow: 1 },
  cardDark: { backgroundColor: '#1e293b' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#64748b' },
  chartCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  chartPlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center' },
  chartPlaceholderText: { fontSize: 14, color: '#64748b', marginTop: 12, textAlign: 'center' },
  seeAllText: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
  emptyRecords: { alignItems: 'center', paddingVertical: 24 },
  emptyRecordsText: { fontSize: 16, color: '#64748b', marginTop: 12 },
  emptyRecordsSubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  emptyActivity: { alignItems: 'center', paddingVertical: 24 },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
