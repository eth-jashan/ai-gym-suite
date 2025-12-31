import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '../../../stores/auth-store';
import { useTheme } from '../../../providers/theme-provider';
import type { AuthStackScreenProps } from '../../navigation/types';

type Props = AuthStackScreenProps<'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    await register(name, email, password);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.base }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.background.surface }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.icon.primary} />
            </Pressable>
            <Text style={[styles.title, { color: colors.text.primary }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Start your fitness transformation today
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.status.errorMuted }]}>
                <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, {
                backgroundColor: colors.background.surface,
                borderColor: colors.border.default,
              }]}>
                <Ionicons name="person-outline" size={20} color={colors.icon.secondary} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.text.tertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
              <View style={[styles.inputWrapper, {
                backgroundColor: colors.background.surface,
                borderColor: colors.border.default,
              }]}>
                <Ionicons name="mail-outline" size={20} color={colors.icon.secondary} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Password</Text>
              <View style={[styles.inputWrapper, {
                backgroundColor: colors.background.surface,
                borderColor: colors.border.default,
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon.secondary} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.icon.secondary}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.actions}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary.base }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={[styles.primaryButtonText, { color: colors.text.onPrimary }]}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </Pressable>

            <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: colors.primary.base }]}>Sign In</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { marginTop: 16, marginBottom: 32 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { gap: 16 },
  errorContainer: { padding: 12, borderRadius: 8 },
  errorText: { textAlign: 'center', fontSize: 14 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
  },
  input: { flex: 1, paddingVertical: 14, marginLeft: 12, fontSize: 16 },
  actions: { marginTop: 32, gap: 16 },
  primaryButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { fontSize: 18, fontWeight: '600' },
  termsText: { fontSize: 14, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: {},
  linkText: { fontWeight: '600' },
});
