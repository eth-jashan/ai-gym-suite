import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../../providers/theme-provider';
import { palette } from '../../../constants/colors';
import type { AuthStackScreenProps } from '../../navigation/types';

type Props = AuthStackScreenProps<'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.base }]}>
      <LinearGradient
        colors={isDark
          ? [palette.neon[950], colors.background.base, colors.background.base]
          : [palette.neon[100], colors.background.base, colors.background.base]
        }
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary.muted }]}>
              <Text style={styles.iconText}>💪</Text>
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]}>AI Gym Suite</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Your intelligent fitness companion powered by AI
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.featuresSection}>
            <FeatureItem
              icon="🎯"
              title="Personalized Workouts"
              description="AI-generated plans tailored to your goals"
              colors={colors}
            />
            <FeatureItem
              icon="📊"
              title="Track Progress"
              description="Monitor your fitness journey in real-time"
              colors={colors}
            />
            <FeatureItem
              icon="🤖"
              title="AI Coaching"
              description="Get smart recommendations and feedback"
              colors={colors}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.ctaSection}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary.base }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.primaryButtonText, { color: colors.text.onPrimary }]}>
                Get Started
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border.default }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                I already have an account
              </Text>
            </Pressable>
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
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.featureItem, { backgroundColor: colors.background.surface }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.primary.muted }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconText: { fontSize: 64 },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 18, textAlign: 'center', paddingHorizontal: 32 },
  featuresSection: { marginBottom: 32, gap: 16 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 24 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600' },
  featureDescription: { fontSize: 14 },
  ctaSection: { marginBottom: 32, gap: 12 },
  primaryButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { fontSize: 18, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { fontSize: 18, fontWeight: '600' },
});
