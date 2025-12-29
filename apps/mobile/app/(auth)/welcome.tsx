import { View, Text, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-background-dark">
      <LinearGradient
        colors={['#1e40af', '#0f172a', '#0f172a']}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      >
        <SafeAreaView className="flex-1 px-6">
          {/* Hero Section */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(800)}
            className="flex-1 items-center justify-center"
          >
            <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-primary-500/20">
              <Text className="text-6xl">💪</Text>
            </View>
            <Text className="mb-3 text-center text-4xl font-bold text-white">
              AI Gym Suite
            </Text>
            <Text className="px-8 text-center text-lg text-slate-400">
              Your intelligent fitness companion powered by AI
            </Text>
          </Animated.View>

          {/* Features List */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            className="mb-8 space-y-4"
          >
            <FeatureItem
              icon="🎯"
              title="Personalized Workouts"
              description="AI-generated plans tailored to your goals"
            />
            <FeatureItem
              icon="📊"
              title="Track Progress"
              description="Monitor your fitness journey in real-time"
            />
            <FeatureItem
              icon="🤖"
              title="AI Coaching"
              description="Get smart recommendations and feedback"
            />
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(800)}
            className="mb-8 space-y-3"
          >
            <Link href="/(auth)/register" asChild>
              <Pressable className="w-full rounded-xl bg-primary-500 py-4 active:bg-primary-600">
                <Text className="text-center text-lg font-semibold text-white">
                  Get Started
                </Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/login" asChild>
              <Pressable className="w-full rounded-xl border border-slate-600 py-4 active:bg-slate-800">
                <Text className="text-center text-lg font-semibold text-white">
                  I already have an account
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center space-x-4 rounded-xl bg-slate-800/50 p-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-white">{title}</Text>
        <Text className="text-sm text-slate-400">{description}</Text>
      </View>
    </View>
  );
}
