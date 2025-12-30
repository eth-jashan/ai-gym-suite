import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';

const MENU_ITEMS = [
  { id: 'personal', label: 'Personal Information', icon: 'person-outline', route: '/settings/personal' },
  { id: 'goals', label: 'Fitness Goals', icon: 'flag-outline', route: '/settings/goals' },
  { id: 'preferences', label: 'Workout Preferences', icon: 'settings-outline', route: '/settings/preferences' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: '/settings/notifications' },
  { id: 'privacy', label: 'Privacy & Security', icon: 'shield-outline', route: '/settings/privacy' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: '/settings/help' },
  { id: 'about', label: 'About', icon: 'information-circle-outline', route: '/settings/about' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleMenuPress = (route: string) => {
    // Navigate to route when implemented
    Alert.alert('Coming Soon', 'This feature is coming soon!');
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textWhite]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, isDark && styles.cardDark]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#64748b" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isDark && styles.textWhite]}>
              {user?.name || 'Guest User'}
            </Text>
            <Text style={[styles.profileEmail, isDark && styles.textLight]}>
              {user?.email || 'Not signed in'}
            </Text>
          </View>
          <Pressable style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#3b82f6" />
          </Pressable>
        </View>

        <View style={[styles.statsRow, isDark && styles.cardDark]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDark && styles.textWhite]}>0</Text>
            <Text style={[styles.statLabel, isDark && styles.textLight]}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDark && styles.textWhite]}>0</Text>
            <Text style={[styles.statLabel, isDark && styles.textLight]}>Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDark && styles.textWhite]}>0</Text>
            <Text style={[styles.statLabel, isDark && styles.textLight]}>Streak</Text>
          </View>
        </View>

        <View style={[styles.menuCard, isDark && styles.cardDark]}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.menuItemText, isDark && styles.textWhite]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </Pressable>
          ))}
        </View>

        {isAuthenticated ? (
          <Pressable style={[styles.logoutButton, isDark && styles.logoutButtonDark]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="log-in-outline" size={22} color="white" />
            <Text style={styles.loginText}>Sign In</Text>
          </Pressable>
        )}

        <Text style={[styles.version, isDark && styles.textLight]}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardDark: { backgroundColor: '#1e293b' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 20, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#64748b' },
  editButton: { padding: 8 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#64748b' },
  menuCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { fontSize: 16, color: '#0f172a' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  logoutButtonDark: { backgroundColor: '#450a0a' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  loginText: { fontSize: 16, fontWeight: '600', color: 'white' },
  version: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  textWhite: { color: 'white' },
  textLight: { color: '#94a3b8' },
});
