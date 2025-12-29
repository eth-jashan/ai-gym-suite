import { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderOpacity = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? '#ef4444'
      : `rgba(59, 130, 246, ${borderOpacity.value})`,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderOpacity.value = withTiming(0, { duration: 200 });
    props.onBlur?.({} as any);
  };

  return (
    <View className="mb-1">
      {label && (
        <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      )}
      <AnimatedView
        style={animatedBorderStyle}
        className={`flex-row items-center rounded-xl border-2 bg-slate-800 px-4 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 py-3.5 text-base text-white"
          placeholderTextColor="#64748b"
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </AnimatedView>
      {error && (
        <Text className="mt-1.5 text-sm text-red-400">{error}</Text>
      )}
    </View>
  );
}
