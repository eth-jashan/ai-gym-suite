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

interface MultiSelectListProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
  exclusiveOptions?: string[];
}

export default function MultiSelectList({
  options,
  value,
  onChange,
  minSelections = 0,
  maxSelections,
  exclusiveOptions = [],
}: MultiSelectListProps) {
  const { colors } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newValue: string[];

    if (exclusiveOptions.includes(id)) {
      // If selecting an exclusive option, clear all others
      newValue = value.includes(id) ? [] : [id];
    } else {
      // If selecting a non-exclusive option, remove any exclusive options
      const filteredValue = value.filter((v) => !exclusiveOptions.includes(v));

      if (filteredValue.includes(id)) {
        newValue = filteredValue.filter((v) => v !== id);
      } else {
        if (maxSelections && filteredValue.length >= maxSelections) {
          return; // Max reached
        }
        newValue = [...filteredValue, id];
      }
    }

    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <OptionItem
          key={option.id}
          option={option}
          isSelected={value.includes(option.id)}
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
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected ? colors.primary.base : 'transparent',
              borderColor: isSelected ? colors.primary.base : colors.border.default,
            },
          ]}
        >
          {isSelected && <Text style={styles.checkboxText}>✓</Text>}
        </View>
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
