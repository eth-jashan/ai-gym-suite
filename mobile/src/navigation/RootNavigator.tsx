import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { RootStackParamList } from './types';

import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../providers/theme-provider';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import HomeScreen from '../screens/main/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.loading, { backgroundColor: colors.background.base }]}>
      <ActivityIndicator size="large" color={colors.primary.base} />
    </View>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="Main" component={HomeScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
