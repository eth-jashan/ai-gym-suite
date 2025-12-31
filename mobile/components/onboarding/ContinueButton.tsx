import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../providers/theme-provider';

interface ContinueButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function ContinueButton({
  onPress,
  label = 'Continue',
  disabled = false,
  loading = false,
  animate = true,
  delay = 200,
}: ContinueButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const Container = animate ? Animated.View : ({ children, style }: any) => (
    <Animated.View style={style}>{children}</Animated.View>
  );

  return (
    <Container
      entering={animate ? FadeInUp.delay(delay).duration(300) : undefined}
      style={styles.wrapper}
    >
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: disabled ? colors.interactive.disabled : colors.primary.base,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.onPrimary} />
        ) : (
          <Text style={[styles.label, { color: colors.text.onPrimary }]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Container>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
});
