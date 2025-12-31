import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { useTheme } from '../../providers/theme-provider';

export type MascotExpression =
  | 'default'
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'sleepy'
  | 'surprised'
  | 'wink'
  | 'wave';

interface MascotAvatarProps {
  expression?: MascotExpression;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

const SIZES = {
  small: 48,
  medium: 64,
  large: 96,
};

const EXPRESSIONS: Record<MascotExpression, { leftEye: string; rightEye: string; mouth: string }> = {
  default: { leftEye: '●', rightEye: '●', mouth: '‿' },
  happy: { leftEye: '◠', rightEye: '◠', mouth: '◡' },
  thinking: { leftEye: '●', rightEye: '◔', mouth: '～' },
  excited: { leftEye: '★', rightEye: '★', mouth: 'D' },
  sleepy: { leftEye: '─', rightEye: '─', mouth: '○' },
  surprised: { leftEye: '○', rightEye: '○', mouth: 'O' },
  wink: { leftEye: '◠', rightEye: '●', mouth: '‿' },
  wave: { leftEye: '◠', rightEye: '◠', mouth: '◡' },
};

export default function MascotAvatar({
  expression = 'default',
  size = 'medium',
  animate = true,
}: MascotAvatarProps) {
  const { colors } = useTheme();
  const dimensions = SIZES[size];
  const expr = EXPRESSIONS[expression];

  // Animation values
  const bounce = useSharedValue(0);
  const waveRotation = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      // Gentle bounce animation
      bounce.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );

      // Wave animation for wave expression
      if (expression === 'wave') {
        waveRotation.value = withRepeat(
          withSequence(
            withTiming(20, { duration: 200 }),
            withTiming(-20, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          3,
          false
        );
      }
    }
  }, [animate, expression]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          width: dimensions,
          height: dimensions,
          borderRadius: dimensions / 2,
          backgroundColor: colors.background.surface,
          borderWidth: 2,
          borderColor: colors.border.default,
          // Shadow for floating effect
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
          }),
        },
      ]}
    >
      {/* Headband */}
      <View
        style={[
          styles.headband,
          {
            width: dimensions * 0.9,
            height: dimensions * 0.15,
            top: dimensions * 0.15,
            backgroundColor: colors.primary.base,
          },
        ]}
      />

      {/* Eyes */}
      <View style={[styles.eyesContainer, { top: dimensions * 0.35 }]}>
        <Text
          style={[
            styles.eye,
            { fontSize: dimensions * 0.18, color: colors.text.primary },
          ]}
        >
          {expr.leftEye}
        </Text>
        <Text
          style={[
            styles.eye,
            { fontSize: dimensions * 0.18, color: colors.text.primary, marginLeft: dimensions * 0.15 },
          ]}
        >
          {expr.rightEye}
        </Text>
      </View>

      {/* Mouth */}
      <Text
        style={[
          styles.mouth,
          {
            fontSize: dimensions * 0.25,
            top: dimensions * 0.55,
            color: colors.text.primary,
          },
        ]}
      >
        {expr.mouth}
      </Text>

      {/* Wave hand for wave expression */}
      {expression === 'wave' && (
        <Animated.View
          style={[
            styles.hand,
            waveStyle,
            {
              right: -dimensions * 0.2,
              bottom: dimensions * 0.1,
            },
          ]}
        >
          <Text style={{ fontSize: dimensions * 0.3 }}>👋</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  headband: {
    position: 'absolute',
    borderRadius: 4,
  },
  eyesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {
    fontWeight: 'bold',
  },
  mouth: {
    position: 'absolute',
    fontWeight: 'bold',
  },
  hand: {
    position: 'absolute',
  },
});
