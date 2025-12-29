import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth.store';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { isLoading, forgotPassword } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    const success = await forgotPassword(email);
    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark">
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center"
          >
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-success-500/20">
              <Ionicons name="mail-outline" size={40} color="#22c55e" />
            </View>
            <Text className="mb-3 text-center text-2xl font-bold text-white">
              Check your email
            </Text>
            <Text className="mb-8 text-center text-base text-slate-400">
              We've sent a password reset link to {email}
            </Text>
            <Button
              title="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="outline"
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-8 mt-4">
            <Link href="/(auth)/login" asChild>
              <Pressable className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
            </Link>
            <Text className="mb-2 text-3xl font-bold text-white">Forgot password?</Text>
            <Text className="text-base text-slate-400">
              Enter your email and we'll send you a reset link
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#94a3b8" />}
            />
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mt-8">
            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
