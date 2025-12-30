import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#0f172a', '#0f172a']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💪</Text>
            </View>
            <Text style={styles.title}>AI Gym Suite</Text>
            <Text style={styles.subtitle}>Your intelligent fitness companion powered by AI</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.featuresSection}>
            <FeatureItem icon="🎯" title="Personalized Workouts" description="AI-generated plans tailored to your goals" />
            <FeatureItem icon="📊" title="Track Progress" description="Monitor your fitness journey in real-time" />
            <FeatureItem icon="🤖" title="AI Coaching" description="Get smart recommendations and feedback" />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.ctaSection}>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  gradient: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconText: { fontSize: 64 },
  title: { fontSize: 36, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
  featuresSection: { marginBottom: 32, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(51, 65, 85, 0.5)', padding: 16, borderRadius: 12, gap: 16 },
  featureIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center' },
  featureIcon: { fontSize: 24 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
  featureDescription: { fontSize: 14, color: '#94a3b8' },
  ctaSection: { marginBottom: 32, gap: 12 },
  primaryButton: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: '#475569', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
