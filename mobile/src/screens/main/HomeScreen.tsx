import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../../stores/auth-store';
import { useTheme } from '../../../providers/theme-provider';

export default function HomeScreen() {
  const { colors, toggleMode, isDark } = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary.muted }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.primary.base} />
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>
          Welcome, {user?.name || 'User'}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          You're all set up and ready to go.
        </Text>

        <View style={[styles.placeholder, { backgroundColor: colors.background.surface }]}>
          <Ionicons name="construct-outline" size={32} color={colors.icon.secondary} />
          <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>
            Main app content coming soon
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.themeButton, { backgroundColor: colors.background.surface }]}
            onPress={toggleMode}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={colors.icon.accent}
            />
            <Text style={[styles.themeButtonText, { color: colors.text.primary }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.logoutButton, { borderColor: colors.status.error }]}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
            <Text style={[styles.logoutText, { color: colors.status.error }]}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  placeholder: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 48,
    width: '100%',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
