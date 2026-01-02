/**
 * NumberInput Component
 *
 * A numeric input with increment/decrement buttons.
 * Great for reps, weight, and other numeric values.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/theme-provider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showInput?: boolean; // Show direct text input
  style?: ViewStyle;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  unit,
  size = 'md',
  disabled = false,
  showInput = false,
  style,
}: NumberInputProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const decrementScale = useSharedValue(1);
  const incrementScale = useSharedValue(1);

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  const handleInputChange = (text: string) => {
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    } else if (text === '') {
      onChange(min);
    }
  };

  const decrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: decrementScale.value }],
  }));

  const incrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: incrementScale.value }],
  }));

  const handlePressIn = (scale: SharedValue<number>) => () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = (scale: SharedValue<number>) => () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          buttonSize: 32,
          fontSize: typography.sizes.lg,
          iconSize: 16,
          padding: spacing[2],
        };
      case 'lg':
        return {
          buttonSize: 56,
          fontSize: typography.sizes['3xl'],
          iconSize: 28,
          padding: spacing[4],
        };
      default: // md
        return {
          buttonSize: 44,
          fontSize: typography.sizes['2xl'],
          iconSize: 22,
          padding: spacing[3],
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.text.secondary,
              fontSize: typography.sizes.sm,
              marginBottom: spacing[2],
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={styles.inputRow}>
        {/* Decrement Button */}
        <AnimatedPressable
          onPress={handleDecrement}
          onPressIn={handlePressIn(decrementScale)}
          onPressOut={handlePressOut(decrementScale)}
          disabled={!canDecrement}
          style={[
            styles.button,
            {
              width: sizeStyles.buttonSize,
              height: sizeStyles.buttonSize,
              borderRadius: radius.lg,
              backgroundColor: colors.background.surface,
            },
            !canDecrement && styles.buttonDisabled,
            decrementAnimatedStyle,
          ]}
        >
          <Ionicons
            name="remove"
            size={sizeStyles.iconSize}
            color={canDecrement ? colors.text.primary : colors.text.disabled}
          />
        </AnimatedPressable>

        {/* Value Display */}
        <View
          style={[
            styles.valueContainer,
            { paddingHorizontal: sizeStyles.padding },
          ]}
        >
          {showInput ? (
            <TextInput
              value={value.toString()}
              onChangeText={handleInputChange}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  color: colors.text.primary,
                  fontSize: sizeStyles.fontSize,
                  fontWeight: typography.weights.bold as 'bold',
                },
              ]}
              editable={!disabled}
              selectTextOnFocus
            />
          ) : (
            <Text
              style={[
                styles.value,
                {
                  color: disabled ? colors.text.disabled : colors.text.primary,
                  fontSize: sizeStyles.fontSize,
                  fontWeight: typography.weights.bold as 'bold',
                },
              ]}
            >
              {value}
            </Text>
          )}
          {unit && (
            <Text
              style={[
                styles.unit,
                {
                  color: colors.text.secondary,
                  fontSize: typography.sizes.base,
                  marginLeft: spacing[1],
                },
              ]}
            >
              {unit}
            </Text>
          )}
        </View>

        {/* Increment Button */}
        <AnimatedPressable
          onPress={handleIncrement}
          onPressIn={handlePressIn(incrementScale)}
          onPressOut={handlePressOut(incrementScale)}
          disabled={!canIncrement}
          style={[
            styles.button,
            {
              width: sizeStyles.buttonSize,
              height: sizeStyles.buttonSize,
              borderRadius: radius.lg,
              backgroundColor: colors.background.surface,
            },
            !canIncrement && styles.buttonDisabled,
            incrementAnimatedStyle,
          ]}
        >
          <Ionicons
            name="add"
            size={sizeStyles.iconSize}
            color={canIncrement ? colors.text.primary : colors.text.disabled}
          />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 80,
    justifyContent: 'center',
  },
  value: {
    textAlign: 'center',
  },
  input: {
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  },
  unit: {
    textAlign: 'center',
  },
});
