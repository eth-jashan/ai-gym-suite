/**
 * Badge Component
 *
 * A small badge/chip component for status indicators and labels.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/providers/theme-provider';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string; // Custom color override
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  color,
  style,
  textStyle,
}: BadgeProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    // If custom color is provided, use it
    if (color) {
      return {
        container: {
          backgroundColor: `${color}20`, // 20% opacity
        },
        text: {
          color: color,
        },
      };
    }

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary.muted,
          },
          text: {
            color: colors.primary.base,
          },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.status.successMuted,
          },
          text: {
            color: colors.status.success,
          },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: colors.status.warningMuted,
          },
          text: {
            color: colors.status.warning,
          },
        };
      case 'error':
        return {
          container: {
            backgroundColor: colors.status.errorMuted,
          },
          text: {
            color: colors.status.error,
          },
        };
      case 'info':
        return {
          container: {
            backgroundColor: colors.status.infoMuted,
          },
          text: {
            color: colors.status.info,
          },
        };
      default:
        return {
          container: {
            backgroundColor: colors.background.surface,
          },
          text: {
            color: colors.text.secondary,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing[0.5],
            paddingHorizontal: spacing[2],
          },
          text: {
            fontSize: typography.sizes.xs,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[4],
          },
          text: {
            fontSize: typography.sizes.base,
          },
        };
      default: // md
        return {
          container: {
            paddingVertical: spacing[1],
            paddingHorizontal: spacing[3],
          },
          text: {
            fontSize: typography.sizes.sm,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        { borderRadius: radius.full },
        variantStyles.container,
        sizeStyles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontWeight: typography.weights.medium as TextStyle['fontWeight'] },
          variantStyles.text,
          sizeStyles.text,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});
