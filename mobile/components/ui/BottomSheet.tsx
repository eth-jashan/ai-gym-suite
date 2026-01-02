/**
 * BottomSheet Component
 *
 * A modal bottom sheet with drag-to-dismiss functionality.
 * Uses react-native Modal for simplicity.
 */

import React, { useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme } from '@/providers/theme-provider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Heights in pixels or percentages
  initialSnapIndex?: number;
  showHandle?: boolean;
  closeOnBackdropPress?: boolean;
  title?: string;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [SCREEN_HEIGHT * 0.5],
  showHandle = true,
  closeOnBackdropPress = true,
}: BottomSheetProps) {
  const { colors, radius, spacing } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const maxHeight = Math.max(...snapPoints);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible, translateY]);

  const handleClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd((event) => {
      if (event.velocityY > 500 || translateY.value > maxHeight * 0.5) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: colors.background.scrim },
              backdropAnimatedStyle,
            ]}
          >
            <Pressable
              style={styles.backdropPressable}
              onPress={closeOnBackdropPress ? handleClose : undefined}
            />
          </Animated.View>

          {/* Sheet */}
          <GestureDetector gesture={gesture}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.background.elevated,
                  borderTopLeftRadius: radius['2xl'],
                  borderTopRightRadius: radius['2xl'],
                  maxHeight,
                },
                animatedStyle,
              ]}
            >
              {/* Handle */}
              {showHandle && (
                <View style={[styles.handleContainer, { paddingTop: spacing[2] }]}>
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: colors.border.default },
                    ]}
                  />
                </View>
              )}

              {/* Content */}
              <ScrollView
                style={styles.content}
                contentContainerStyle={{ padding: spacing[4] }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
