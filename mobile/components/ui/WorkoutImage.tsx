/**
 * Workout Image Component
 *
 * Displays workout-related imagery with:
 * - Gradient fallbacks until real images are available
 * - Dark overlay for text legibility
 * - Support for different image types (hero, split, muscle)
 * - Animated loading states
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SplitType } from '@/lib/types/workout';

// Gradient fallbacks for each split type
const SPLIT_GRADIENTS: Record<SplitType, [string, string, string]> = {
  UPPER_BODY: ['#3B82F6', '#1E40AF', '#1E3A8A'],
  LOWER_BODY: ['#8B5CF6', '#7C3AED', '#5B21B6'],
  FULL_BODY: ['#10B981', '#059669', '#047857'],
  PUSH: ['#F97316', '#EA580C', '#C2410C'],
  PULL: ['#06B6D4', '#0891B2', '#0E7490'],
  LEGS: ['#A855F7', '#9333EA', '#7E22CE'],
  CHEST_TRICEPS: ['#EF4444', '#DC2626', '#B91C1C'],
  BACK_BICEPS: ['#3B82F6', '#2563EB', '#1D4ED8'],
  SHOULDERS_ARMS: ['#EC4899', '#DB2777', '#BE185D'],
  CORE: ['#14B8A6', '#0D9488', '#0F766E'],
  CARDIO: ['#F43F5E', '#E11D48', '#BE123C'],
  HIIT: ['#EAB308', '#CA8A04', '#A16207'],
  ACTIVE_RECOVERY: ['#22C55E', '#16A34A', '#15803D'],
};

// Hero image gradients
const HERO_GRADIENTS = {
  morning: ['#F97316', '#EA580C', '#0A0A0A'],
  intensity: ['#3B82F6', '#1E40AF', '#0A0A0A'],
  strength: ['#6B7280', '#374151', '#0A0A0A'],
  cardio: ['#06B6D4', '#0891B2', '#0A0A0A'],
  rest: ['#8B5CF6', '#6D28D9', '#0A0A0A'],
  achievement: ['#EAB308', '#CA8A04', '#0A0A0A'],
};

type ImageType = 'hero' | 'split' | 'muscle' | 'category';

interface WorkoutImageProps {
  type: ImageType;
  splitType?: SplitType;
  heroVariant?: keyof typeof HERO_GRADIENTS;
  source?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function WorkoutImage({
  type,
  splitType,
  heroVariant = 'intensity',
  source,
  style,
  overlay = true,
  overlayOpacity = 0.4,
  children,
}: WorkoutImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get gradient colors based on type
  const getGradientColors = (): [string, string, string] => {
    if (type === 'hero') {
      return HERO_GRADIENTS[heroVariant] as [string, string, string];
    }
    if (type === 'split' && splitType) {
      return SPLIT_GRADIENTS[splitType] || SPLIT_GRADIENTS.FULL_BODY;
    }
    return ['#3B82F6', '#1E40AF', '#0A0A0A'];
  };

  const gradientColors = getGradientColors();
  const showImage = source && !imageError;

  return (
    <View style={[styles.container, style]}>
      {/* Gradient Background (always rendered as fallback) */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Actual Image (if provided and loaded) */}
      {showImage && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={StyleSheet.absoluteFillObject}
        >
          <Image
            source={source}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </Animated.View>
      )}

      {/* Dark Overlay for text legibility */}
      {overlay && (
        <LinearGradient
          colors={[
            `rgba(0,0,0,${overlayOpacity})`,
            `rgba(0,0,0,${overlayOpacity * 1.5})`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Decorative Elements */}
      <View style={styles.decorativeOverlay}>
        {/* Subtle noise texture effect via gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'transparent', 'rgba(0,0,0,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Children content */}
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

// Preset components for common use cases

interface SplitImageProps {
  splitType: SplitType;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function SplitImage({ splitType, style, children }: SplitImageProps) {
  // TODO: Map to actual image sources when available
  // const imageSource = SPLIT_IMAGES[splitType];

  return (
    <WorkoutImage
      type="split"
      splitType={splitType}
      style={style}
      overlay={true}
      overlayOpacity={0.3}
    >
      {children}
    </WorkoutImage>
  );
}

interface HeroImageProps {
  variant?: keyof typeof HERO_GRADIENTS;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function HeroImage({ variant = 'intensity', style, children }: HeroImageProps) {
  return (
    <WorkoutImage
      type="hero"
      heroVariant={variant}
      style={style}
      overlay={true}
      overlayOpacity={0.5}
    >
      {children}
    </WorkoutImage>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  decorativeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
