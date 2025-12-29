import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useProgressStore } from '@/stores/progress.store';
import { Card } from '@/components/ui/Card';
import { useRefresh } from '@/hooks/useRefresh';

type TimeRange = 'week' | 'month' | 'year';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const { stats, achievements, fetchProgress } = useProgressStore();
  const { refreshing, onRefresh } = useRefresh(fetchProgress);

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
        <Animated.View entering={FadeInDown.duration(500)} className="px-6 py-4">
          <Text className="text-2xl font-bold text-white">Your Progress</Text>
        </Animated.View>

        {/* Time Range Selector */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="mb-6 flex-row gap-2 px-6"
        >
          {TIME_RANGES.map((range) => (
            <Pressable
              key={range.key}
              onPress={() => setTimeRange(range.key)}
              className={`flex-1 rounded-lg py-3 ${
                timeRange === range.key ? 'bg-primary-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  timeRange === range.key ? 'text-white' : 'text-slate-400'
                }`}
              >
                {range.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="mb-6 flex-row flex-wrap gap-3 px-6"
        >
          <StatCard
            icon="barbell"
            title="Total Workouts"
            value={stats?.totalWorkouts || 0}
            trend={stats?.workoutsTrend}
            color="#3b82f6"
          />
          <StatCard
            icon="time"
            title="Total Time"
            value={`${stats?.totalMinutes || 0}m`}
            trend={stats?.timeTrend}
            color="#f97316"
          />
          <StatCard
            icon="flame"
            title="Calories Burned"
            value={stats?.caloriesBurned || 0}
            trend={stats?.caloriesTrend}
            color="#ef4444"
          />
          <StatCard
            icon="trophy"
            title="Current Streak"
            value={`${stats?.currentStreak || 0} days`}
            color="#eab308"
          />
        </Animated.View>

        {/* Weekly Activity */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mb-6 px-6">
          <Text className="mb-4 text-lg font-semibold text-white">Weekly Activity</Text>
          <Card className="p-4">
            <View className="flex-row justify-between">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const isCompleted = stats?.weeklyActivity?.[index] || false;
                const isToday = new Date().getDay() === (index + 1) % 7;
                return (
                  <View key={day} className="items-center">
                    <View
                      className={`mb-2 h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-success-500'
                          : isToday
                            ? 'border-2 border-primary-500 bg-transparent'
                            : 'bg-slate-700'
                      }`}
                    >
                      {isCompleted && <Ionicons name="checkmark" size={20} color="white" />}
                    </View>
                    <Text className={`text-xs ${isToday ? 'text-primary-400' : 'text-slate-400'}`}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} className="px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">Achievements</Text>
            <Pressable>
              <Text className="text-sm text-primary-400">View All</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {(achievements || DEFAULT_ACHIEVEMENTS).slice(0, 4).map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                entering={FadeInUp.delay(index * 100)}
                className="w-[48%]"
              >
                <AchievementCard achievement={achievement} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  title,
  value,
  trend,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value: string | number;
  trend?: number;
  color: string;
}) {
  return (
    <Card className="w-[48%] p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && (
          <View className="flex-row items-center">
            <Ionicons
              name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={trend >= 0 ? '#22c55e' : '#ef4444'}
            />
            <Text
              className={`text-xs font-medium ${trend >= 0 ? 'text-success-500' : 'text-red-500'}`}
            >
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="text-xs text-slate-400">{title}</Text>
    </Card>
  );
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={`p-4 ${achievement.unlocked ? '' : 'opacity-50'}`}>
      <Text className="mb-2 text-2xl">{achievement.icon}</Text>
      <Text className="mb-1 font-semibold text-white">{achievement.title}</Text>
      <Text className="text-xs text-slate-400">{achievement.description}</Text>
      {!achievement.unlocked && achievement.progress !== undefined && (
        <View className="mt-2">
          <View className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${achievement.progress}%` }}
            />
          </View>
          <Text className="mt-1 text-xs text-slate-500">{achievement.progress}%</Text>
        </View>
      )}
    </Card>
  );
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first workout', icon: '🏃', unlocked: true },
  { id: '2', title: 'Week Warrior', description: 'Complete 7 workouts', icon: '💪', unlocked: false, progress: 43 },
  { id: '3', title: 'Early Bird', description: 'Complete a workout before 7 AM', icon: '🌅', unlocked: false, progress: 0 },
  { id: '4', title: 'Consistency King', description: 'Maintain a 30-day streak', icon: '👑', unlocked: false, progress: 10 },
];
