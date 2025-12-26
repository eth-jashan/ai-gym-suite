'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Dumbbell, Zap, Target, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loadUser, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      if (!user?.onboardingCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 to-dark-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-600/10 text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Fitness
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">
            Your Personal AI
            <br />
            Fitness Coach
          </h1>

          <p className="text-xl text-dark-400 mb-8 max-w-2xl mx-auto">
            Get personalized workout plans, smart exercise recommendations, and
            AI-powered coaching to help you reach your fitness goals faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth?mode=register')}
              className="px-8"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/auth?mode=login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Target className="w-8 h-8 text-primary-500" />}
            title="Personalized Plans"
            description="AI analyzes your goals, experience, and equipment to create the perfect workout plan for you."
          />
          <FeatureCard
            icon={<Dumbbell className="w-8 h-8 text-primary-500" />}
            title="Smart Workouts"
            description="Daily workouts that adapt to your progress, available time, and preferences."
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-primary-500" />}
            title="Track Progress"
            description="Monitor your strength gains, body changes, and workout streaks over time."
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Step number={1} title="Sign Up" description="Create your free account" />
          <Step number={2} title="Tell Us About You" description="Complete smart onboarding" />
          <Step number={3} title="Get Your Plan" description="AI generates your workout" />
          <Step number={4} title="Train & Track" description="Log workouts, see progress" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-dark-500">
          <p>AI Gym Suite - Smart Fitness for Everyone</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-dark-900 rounded-xl p-6 border border-dark-800 hover:border-dark-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-dark-400">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-dark-400">{description}</p>
    </div>
  );
}
