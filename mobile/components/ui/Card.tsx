/**
 * Card Component
 *
 * A versatile card component with elevation and surface styling.
 * Supports press interaction with scale animation.
 */

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/theme-provider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'raised' | 'outlined';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

export function Card({
  children,
  variant = 'surface',
  onPress,
  disabled = false,
  style,
  contentStyle,
  haptic = true,
}: CardProps) {
  const { colors, radius, spacing } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.background.elevated;
      case 'raised':
        return colors.background.raised;
      case 'outlined':
        return 'transparent';
      default:
        return colors.background.surface;
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: colors.border.default,
      };
    }
    return {};
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: radius.lg,
    ...getBorderStyle(),
  };

  const content = (
    <View
      style={[
        styles.content,
        { padding: spacing[4] },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          containerStyle,
          animatedStyle,
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
