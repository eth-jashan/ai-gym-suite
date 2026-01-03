/**
 * Progress Ring Component
 *
 * A beautiful animated circular progress indicator with:
 * - Smooth spring animations on mount and updates
 * - Configurable size, stroke width, and colors
 * - Optional center content
 * - Gradient support for premium feel
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '@/providers/theme-provider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  useGradient?: boolean;
  delay?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  trackColor,
  progressColor,
  useGradient = true,
  delay = 0,
  children,
  style,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  useEffect(() => {
    animatedProgress.value = withDelay(
      delay,
      withSpring(Math.min(Math.max(progress, 0), 1), {
        damping: 20,
        stiffness: 90,
        mass: 1,
      })
    );
  }, [progress, delay, animatedProgress]);

  const animatedStrokeDashoffset = useDerivedValue(() => {
    return circumference * (1 - animatedProgress.value);
  });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedStrokeDashoffset.value,
  }));

  const finalTrackColor = trackColor || colors.background.raised;
  const finalProgressColor = progressColor || colors.primary.base;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary.base} />
            <Stop offset="100%" stopColor={colors.gradient.primary[1]} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={finalTrackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={useGradient ? "url(#progressGradient)" : finalProgressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>

      {/* Center Content */}
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
