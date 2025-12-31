import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../providers/theme-provider';

interface PillOption {
  id: string;
  label: string;
}

interface PillSelectorProps {
  options: PillOption[];
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  columns?: number;
}

export default function PillSelector({
  options,
  value,
  onChange,
  multiSelect = false,
  columns = 3,
}: PillSelectorProps) {
  const { colors } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (multiSelect) {
      const currentValue = (value as string[]) || [];
      if (currentValue.includes(id)) {
        onChange(currentValue.filter((v) => v !== id));
      } else {
        onChange([...currentValue, id]);
      }
    } else {
      onChange(id);
    }
  };

  const isSelected = (id: string) => {
    if (multiSelect) {
      return ((value as string[]) || []).includes(id);
    }
    return value === id;
  };

  // Group options into rows
  const rows: PillOption[][] = [];
  for (let i = 0; i < options.length; i += columns) {
    rows.push(options.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <Animated.View
          key={rowIndex}
          entering={FadeInUp.delay(100 + rowIndex * 80).duration(300)}
          style={styles.row}
        >
          {row.map((option) => (
            <PillItem
              key={option.id}
              option={option}
              isSelected={isSelected(option.id)}
              onSelect={() => handleSelect(option.id)}
              colors={colors}
            />
          ))}
        </Animated.View>
      ))}
    </View>
  );
}

interface PillItemProps {
  option: PillOption;
  isSelected: boolean;
  onSelect: () => void;
  colors: any;
}

function PillItem({ option, isSelected, onSelect, colors }: PillItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.pillWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.pill,
          {
            backgroundColor: isSelected ? colors.primary.base : colors.background.surface,
            borderColor: isSelected ? colors.primary.base : colors.border.default,
          },
        ]}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text
          style={[
            styles.pillLabel,
            { color: isSelected ? colors.text.onPrimary : colors.text.primary },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pillWrapper: {
    flex: 1,
    maxWidth: 120,
  },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
