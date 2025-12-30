import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDark && styles.textLight]}>{greeting}</Text>
            <Text style={[styles.name, isDark && styles.textWhite]}>{firstName} 💪</Text>
          </View>
          <Pressable style={[styles.notificationButton, isDark && styles.notificationButtonDark]}>
            <Ionicons name="notifications-outline" size={22} color={isDark ? 'white' : '#1e293b'} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="flame-outline" value="3" label="This Week" color="#f97316" isDark={isDark} />
          <StatCard icon="trophy-outline" value="7" label="Day Streak" color="#eab308" isDark={isDark} />
          <StatCard icon="trending-up-outline" value="85%" label="Progress" color="#22c55e" isDark={isDark} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textWhite]}>Today's Workout</Text>
            <Link href="/(tabs)/workouts" asChild>
              <Pressable>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </Link>
          </View>
          <Pressable style={[styles.workoutCard, isDark && styles.cardDark]}>
            <View style={styles.workoutIcon}>
              <Ionicons name="add-outline" size={32} color="#3b82f6" />
            </View>
            <Text style={[styles.workoutTitle, isDark && styles.textWhite]}>No workout scheduled</Text>
            <Text style={[styles.workoutSubtitle, isDark && styles.textLight]}>Generate an AI-powered workout</Text>
            <Pressable style={styles.generateButton}>
              <Text style={styles.generateButtonText}>Generate Workout</Text>
            </Pressable>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textWhite]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard icon="barbell" title="Start Workout" color="#3b82f6" isDark={isDark} />
            <ActionCard icon="search" title="Find Exercise" color="#8b5cf6" isDark={isDark} />
            <ActionCard icon="analytics" title="View Progress" color="#22c55e" isDark={isDark} />
            <ActionCard icon="trophy" title="Achievements" color="#eab308" isDark={isDark} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color, isDark }: { icon: string; value: string; label: string; color: string; isDark: boolean }) {
  return (
    <View style={[styles.statCard, isDark && styles.cardDark]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, isDark && styles.textWhite]}>{value}</Text>
      <Text style={[styles.statLabel, isDark && styles.textLight]}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, title, color, isDark }: { icon: string; title: string; color: string; isDark: boolean }) {
  return (
    <Pressable style={[styles.actionCard, isDark && styles.cardDark]}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.actionTitle, isDark && styles.textWhite]}>{title}</Text>
    </Pressable>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  greeting: { fontSize: 16, color: '#64748b' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  notificationButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  notificationButtonDark: { backgroundColor: '#1e293b' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center' },
  cardDark: { backgroundColor: '#1e293b' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  viewAll: { fontSize: 14, color: '#3b82f6' },
  workoutCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center' },
  workoutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  workoutTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  workoutSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  generateButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  generateButtonText: { color: 'white', fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
