import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../providers/theme-provider';

interface GridOption {
  id: string;
  label: string;
  icon?: string;
}

interface MultiSelectGridProps {
  options: GridOption[];
  value: string[];
  onChange: (value: string[]) => void;
  exclusiveOptions?: string[];
  columns?: number;
}

export default function MultiSelectGrid({
  options,
  value,
  onChange,
  exclusiveOptions = [],
  columns = 2,
}: MultiSelectGridProps) {
  const { colors } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newValue: string[];

    if (exclusiveOptions.includes(id)) {
      newValue = value.includes(id) ? [] : [id];
    } else {
      const filteredValue = value.filter((v) => !exclusiveOptions.includes(v));
      if (filteredValue.includes(id)) {
        newValue = filteredValue.filter((v) => v !== id);
      } else {
        newValue = [...filteredValue, id];
      }
    }

    onChange(newValue);
  };

  // Group options into rows
  const rows: GridOption[][] = [];
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
            <GridItem
              key={option.id}
              option={option}
              isSelected={value.includes(option.id)}
              onSelect={() => handleSelect(option.id)}
              colors={colors}
            />
          ))}
        </Animated.View>
      ))}
    </View>
  );
}

interface GridItemProps {
  option: GridOption;
  isSelected: boolean;
  onSelect: () => void;
  colors: any;
}

function GridItem({ option, isSelected, onSelect, colors }: GridItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.gridItemWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.gridItem,
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
        <Text
          style={[
            styles.label,
            { color: colors.text.primary },
          ]}
        >
          {option.label}
        </Text>
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
    gap: 12,
  },
  gridItemWrapper: {
    flex: 1,
  },
  gridItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
