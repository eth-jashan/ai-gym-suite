import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../providers/theme-provider';

export interface SelectOption {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
}

interface SingleSelectListProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  onAutoAdvance?: () => void;
}

export default function SingleSelectList({
  options,
  value,
  onChange,
  autoAdvance = true,
  autoAdvanceDelay = 300,
  onAutoAdvance,
}: SingleSelectListProps) {
  const { colors } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(id);

    if (autoAdvance && onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
      }, autoAdvanceDelay);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <OptionItem
          key={option.id}
          option={option}
          isSelected={value === option.id}
          onSelect={() => handleSelect(option.id)}
          index={index}
          colors={colors}
        />
      ))}
    </View>
  );
}

interface OptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  colors: any;
}

function OptionItem({ option, isSelected, onSelect, index, colors }: OptionItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(100 + index * 50).duration(300)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.option,
          {
            backgroundColor: isSelected ? colors.primary.muted : colors.background.surface,
            borderColor: isSelected ? colors.primary.base : colors.border.default,
          },
        ]}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {option.icon && <Text style={styles.icon}>{option.icon}</Text>}
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {option.label}
          </Text>
          {option.subtitle && (
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {option.subtitle}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: colors.primary.base }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
