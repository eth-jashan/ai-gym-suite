import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../providers/theme-provider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 60;
const VISIBLE_ITEMS = 5;

interface NumberScrollerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export default function NumberScroller({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
}: NumberScrollerProps) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const lastHapticValue = useRef(value);

  // Generate array of numbers
  const numbers: number[] = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(i);
  }

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const centerOffset = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
      const index = Math.round((offsetX + centerOffset) / ITEM_WIDTH);
      const newValue = numbers[Math.max(0, Math.min(index, numbers.length - 1))];

      if (newValue !== undefined && newValue !== value) {
        onChange(newValue);

        // Haptic feedback on value change
        if (newValue !== lastHapticValue.current) {
          Haptics.selectionAsync();
          lastHapticValue.current = newValue;
        }
      }
    },
    [numbers, value, onChange]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const centerOffset = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
      const index = Math.round((offsetX + centerOffset) / ITEM_WIDTH);

      // Snap to nearest value
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH - centerOffset,
        animated: true,
      });
    },
    []
  );

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const isSelected = item === value;

    return (
      <View style={[styles.item, { width: ITEM_WIDTH }]}>
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected ? colors.primary.base : colors.text.tertiary,
              fontSize: isSelected ? 32 : 20,
              fontWeight: isSelected ? '700' : '400',
            },
          ]}
        >
          {item}
        </Text>
      </View>
    );
  };

  const initialIndex = numbers.indexOf(value);

  return (
    <View style={styles.container}>
      {/* Large display */}
      <View style={styles.displayContainer}>
        <Text style={[styles.displayValue, { color: colors.primary.base }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.displayUnit, { color: colors.primary.base }]}>
            {unit}
          </Text>
        )}
      </View>

      {/* Scroller */}
      <View style={styles.scrollerContainer}>
        <FlatList
          ref={flatListRef}
          data={numbers}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.max(0, initialIndex)}
          contentContainerStyle={{
            paddingHorizontal: (SCREEN_WIDTH - ITEM_WIDTH) / 2,
          }}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        />

        {/* Center indicator */}
        <View style={styles.indicatorContainer} pointerEvents="none">
          <View style={[styles.indicator, { backgroundColor: colors.primary.base }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  displayValue: {
    fontSize: 64,
    fontWeight: '700',
  },
  displayUnit: {
    fontSize: 24,
    fontWeight: '500',
    marginLeft: 8,
  },
  scrollerContainer: {
    height: 60,
    width: SCREEN_WIDTH,
  },
  item: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {},
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  indicator: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
});
