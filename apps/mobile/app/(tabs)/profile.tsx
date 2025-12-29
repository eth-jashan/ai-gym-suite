import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Card } from '@/components/ui/Card';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} className="items-center px-6 py-8">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary-500">
            <Text className="text-4xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{user?.name || 'User'}</Text>
          <Text className="text-slate-400">{user?.email || 'user@example.com'}</Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-6 flex-row gap-3 px-6">
          <Card className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold text-white">{user?.totalWorkouts || 0}</Text>
            <Text className="text-xs text-slate-400">Workouts</Text>
          </Card>
          <Card className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold text-white">{user?.currentStreak || 0}</Text>
            <Text className="text-xs text-slate-400">Day Streak</Text>
          </Card>
          <Card className="flex-1 items-center py-4">
            <Text className="text-2xl font-bold text-white">{user?.achievements || 0}</Text>
            <Text className="text-xs text-slate-400">Achievements</Text>
          </Card>
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Account
          </Text>
          <Card className="mb-6">
            <SettingsItem icon="person-outline" title="Edit Profile" onPress={() => {}} />
            <SettingsItem icon="fitness-outline" title="Fitness Goals" onPress={() => {}} />
            <SettingsItem icon="notifications-outline" title="Notifications" onPress={() => {}} />
            <SettingsItem icon="lock-closed-outline" title="Privacy" onPress={() => {}} isLast />
          </Card>

          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Preferences
          </Text>
          <Card className="mb-6">
            <SettingsItem
              icon={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
              title="Dark Mode"
              onPress={toggleTheme}
              rightElement={
                <View className={`h-6 w-11 rounded-full p-0.5 ${theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'}`}>
                  <View
                    className={`h-5 w-5 rounded-full bg-white ${theme === 'dark' ? 'ml-auto' : ''}`}
                  />
                </View>
              }
            />
            <SettingsItem icon="language-outline" title="Language" value="English" onPress={() => {}} />
            <SettingsItem icon="barbell-outline" title="Units" value="Metric" onPress={() => {}} isLast />
          </Card>

          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Support
          </Text>
          <Card className="mb-6">
            <SettingsItem icon="help-circle-outline" title="Help Center" onPress={() => {}} />
            <SettingsItem icon="chatbubble-outline" title="Send Feedback" onPress={() => {}} />
            <SettingsItem icon="document-text-outline" title="Terms of Service" onPress={() => {}} />
            <SettingsItem icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => {}} isLast />
          </Card>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="mb-4 flex-row items-center justify-center rounded-xl bg-red-500/10 py-4"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="ml-2 font-semibold text-red-500">Sign Out</Text>
          </Pressable>

          {/* App Version */}
          <Text className="text-center text-xs text-slate-500">
            AI Gym Suite v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  title,
  value,
  onPress,
  rightElement,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 active:bg-slate-700/50 ${
        !isLast ? 'border-b border-slate-700' : ''
      }`}
    >
      <Ionicons name={icon} size={22} color="#94a3b8" />
      <Text className="ml-3 flex-1 text-base text-white">{title}</Text>
      {rightElement || (
        <>
          {value && <Text className="mr-2 text-sm text-slate-400">{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </>
      )}
    </Pressable>
  );
}
