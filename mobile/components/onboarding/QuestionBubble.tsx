import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../providers/theme-provider';

interface QuestionBubbleProps {
  children: React.ReactNode;
  subtitle?: string;
  animate?: boolean;
}

export default function QuestionBubble({
  children,
  subtitle,
  animate = true,
}: QuestionBubbleProps) {
  const { colors } = useTheme();

  const Container = animate ? Animated.View : View;
  const animationProps = animate
    ? { entering: FadeInDown.delay(50).duration(400) }
    : {};

  return (
    <Container
      {...animationProps}
      style={[styles.container, { backgroundColor: colors.primary.base }]}
    >
      <Text style={[styles.text, { color: colors.text.onPrimary }]}>
        {children}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.text.onPrimary, opacity: 0.8 }]}>
          {subtitle}
        </Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});
