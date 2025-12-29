import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth.store';
import { useWorkoutStore } from '@/stores/workout.store';
import { Card } from '@/components/ui/Card';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { useRefresh } from '@/hooks/useRefresh';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { todaysWorkout, recentWorkouts, stats, fetchHomeData } = useWorkoutStore();
  const { refreshing, onRefresh } = useRefresh(fetchHomeData);

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="flex-row items-center justify-between px-6 py-4"
        >
          <View>
            <Text className="text-base text-slate-400">{greeting}</Text>
            <Text className="text-2xl font-bold text-white">{firstName} 💪</Text>
          </View>
          <Link href="/profile" asChild>
            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <Ionicons name="notifications-outline" size={22} color="white" />
            </Pressable>
          </Link>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="mb-6 flex-row gap-3 px-6"
        >
          <QuickStatCard
            icon="flame-outline"
            value={stats?.weeklyWorkouts || 0}
            label="This Week"
            color="#f97316"
          />
          <QuickStatCard
            icon="trophy-outline"
            value={stats?.currentStreak || 0}
            label="Day Streak"
            color="#eab308"
          />
          <QuickStatCard
            icon="trending-up-outline"
            value={`${stats?.progressPercent || 0}%`}
            label="Progress"
            color="#22c55e"
          />
        </Animated.View>

        {/* Today's Workout */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mb-6 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">Today's Workout</Text>
            <Link href="/(tabs)/workouts" asChild>
              <Pressable>
                <Text className="text-sm text-primary-400">View All</Text>
              </Pressable>
            </Link>
          </View>

          {todaysWorkout ? (
            <WorkoutCard workout={todaysWorkout} variant="featured" />
          ) : (
            <Card className="items-center py-8">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary-500/20">
                <Ionicons name="add-outline" size={32} color="#3b82f6" />
              </View>
              <Text className="mb-1 text-lg font-semibold text-white">No workout scheduled</Text>
              <Text className="mb-4 text-sm text-slate-400">Generate an AI-powered workout</Text>
              <Link href="/(tabs)/workouts" asChild>
                <Pressable className="rounded-lg bg-primary-500 px-6 py-2">
                  <Text className="font-semibold text-white">Generate Workout</Text>
                </Pressable>
              </Link>
            </Card>
          )}
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} className="px-6">
          <Text className="mb-4 text-lg font-semibold text-white">Recent Activity</Text>
          {recentWorkouts && recentWorkouts.length > 0 ? (
            <View className="space-y-3">
              {recentWorkouts.slice(0, 3).map((workout, index) => (
                <Animated.View key={workout.id} entering={FadeInRight.delay(100 * index)}>
                  <WorkoutCard workout={workout} variant="compact" />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Card className="items-center py-6">
              <Text className="text-slate-400">No recent workouts</Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <Card className="flex-1 items-center py-4">
      <Ionicons name={icon} size={24} color={color} />
      <Text className="mt-2 text-xl font-bold text-white">{value}</Text>
      <Text className="text-xs text-slate-400">{label}</Text>
    </Card>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
