/**
 * Button Component
 *
 * A versatile button component with multiple variants.
 * Supports primary, secondary, ghost, and danger styles.
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/theme-provider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary.base,
          },
          text: {
            color: colors.text.onPrimary,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.background.surface,
          },
          text: {
            color: colors.text.primary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.primary.base,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.status.error,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border.default,
          },
          text: {
            color: colors.text.primary,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[3],
            minHeight: 36,
          },
          text: {
            fontSize: typography.sizes.sm,
          },
          iconSize: 16,
        };
      case 'lg':
        return {
          container: {
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[6],
            minHeight: 56,
          },
          text: {
            fontSize: typography.sizes.lg,
          },
          iconSize: 24,
        };
      default: // md
        return {
          container: {
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            minHeight: 48,
          },
          text: {
            fontSize: typography.sizes.base,
          },
          iconSize: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const iconColor = variantStyles.text.color as string;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={iconColor}
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={iconColor}
            style={{ marginRight: spacing[2] }}
          />
        )}
        <Text
          style={[
            styles.text,
            { fontWeight: typography.weights.semibold as TextStyle['fontWeight'] },
            variantStyles.text,
            sizeStyles.text,
            textStyle,
          ]}
        >
          {children}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={iconColor}
            style={{ marginLeft: spacing[2] }}
          />
        )}
      </>
    );
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.container,
        { borderRadius: radius.lg },
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
