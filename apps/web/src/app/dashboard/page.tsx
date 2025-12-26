'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  LogOut,
  Play,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface DashboardData {
  profile: { name: string; currentWeight: number; goal: string } | null;
  stats: {
    totalWorkouts: number;
    thisWeekWorkouts: number;
    currentStreak: number;
    weeklyVolume: number;
    weeklyTime: number;
    achievementsUnlocked: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, loadUser } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [motivation, setMotivation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }

    if (user && !user.onboardingCompleted) {
      router.push('/onboarding');
      return;
    }

    fetchDashboard();
  }, [isAuthenticated, user, router]);

  const fetchDashboard = async () => {
    try {
      const [dashboardData, workoutData] = await Promise.all([
        api.getDashboard(),
        api.getTodaysWorkout().catch(() => null),
      ]);
      setData(dashboardData);
      if (workoutData?.motivation) {
        setMotivation(workoutData.motivation);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">AI Gym Suite</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-dark-400">
              Hey, {data?.profile?.name || 'there'}!
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Motivation Banner */}
        {motivation && (
          <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/10 border border-primary-600/30 rounded-xl p-6 mb-8">
            <p className="text-lg text-primary-100">{motivation}</p>
          </div>
        )}

        {/* Quick Action */}
        <Card
          variant="elevated"
          className="mb-8 cursor-pointer hover:bg-dark-700 transition-colors"
          onClick={() => router.push('/workout')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Today's Workout</h2>
                <p className="text-dark-400">Tap to view and start your workout</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-dark-400" />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Current Streak"
            value={`${data?.stats.currentStreak || 0} days`}
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
            label="This Week"
            value={`${data?.stats.thisWeekWorkouts || 0} workouts`}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            label="Total Volume"
            value={`${Math.round(data?.stats.weeklyVolume || 0)} kg`}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            label="Achievements"
            value={`${data?.stats.achievementsUnlocked || 0} unlocked`}
          />
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <QuickLink
            title="Exercise Library"
            description="Browse 30+ exercises with instructions"
            onClick={() => router.push('/exercises')}
          />
          <QuickLink
            title="Workout History"
            description="View past workouts and progress"
            onClick={() => router.push('/history')}
          />
          <QuickLink
            title="Track Progress"
            description="Log measurements and see trends"
            onClick={() => router.push('/progress')}
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card variant="bordered" className="p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-dark-400">{label}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </Card>
  );
}

function QuickLink({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      variant="bordered"
      className="cursor-pointer hover:border-dark-600 transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-dark-400 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
