/**
 * Muscle Map Component
 *
 * Displays a human body silhouette with highlighted muscles.
 * Shows primary muscles in bright color, secondary in dimmer shade.
 *
 * Currently uses a simplified representation until SVG assets are ready.
 * Can be upgraded with actual anatomical SVG paths.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, G, Ellipse, Rect } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

// Muscle position mappings (simplified for now)
type MuscleRegion = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' |
  'core' | 'abs' | 'obliques' | 'quadriceps' | 'quads' | 'hamstrings' | 'glutes' |
  'calves' | 'lats' | 'traps' | 'lower back' | 'legs';

interface MuscleInfo {
  front: boolean;
  back: boolean;
  regions: { x: number; y: number; w: number; h: number; rx?: number }[];
}

// Simplified muscle positions (percentage of body dimensions)
const MUSCLE_REGIONS: Record<string, MuscleInfo> = {
  // Front muscles
  chest: {
    front: true, back: false,
    regions: [
      { x: 28, y: 22, w: 20, h: 10, rx: 4 },
      { x: 52, y: 22, w: 20, h: 10, rx: 4 },
    ]
  },
  shoulders: {
    front: true, back: true,
    regions: [
      { x: 18, y: 18, w: 12, h: 10, rx: 5 },
      { x: 70, y: 18, w: 12, h: 10, rx: 5 },
    ]
  },
  biceps: {
    front: true, back: false,
    regions: [
      { x: 12, y: 30, w: 10, h: 15, rx: 4 },
      { x: 78, y: 30, w: 10, h: 15, rx: 4 },
    ]
  },
  triceps: {
    front: false, back: true,
    regions: [
      { x: 12, y: 30, w: 10, h: 15, rx: 4 },
      { x: 78, y: 30, w: 10, h: 15, rx: 4 },
    ]
  },
  forearms: {
    front: true, back: true,
    regions: [
      { x: 8, y: 46, w: 8, h: 14, rx: 3 },
      { x: 84, y: 46, w: 8, h: 14, rx: 3 },
    ]
  },
  core: {
    front: true, back: false,
    regions: [
      { x: 35, y: 34, w: 30, h: 18, rx: 6 },
    ]
  },
  abs: {
    front: true, back: false,
    regions: [
      { x: 38, y: 34, w: 24, h: 16, rx: 4 },
    ]
  },
  obliques: {
    front: true, back: false,
    regions: [
      { x: 28, y: 36, w: 8, h: 14, rx: 3 },
      { x: 64, y: 36, w: 8, h: 14, rx: 3 },
    ]
  },
  quadriceps: {
    front: true, back: false,
    regions: [
      { x: 28, y: 54, w: 16, h: 22, rx: 6 },
      { x: 56, y: 54, w: 16, h: 22, rx: 6 },
    ]
  },
  quads: {
    front: true, back: false,
    regions: [
      { x: 28, y: 54, w: 16, h: 22, rx: 6 },
      { x: 56, y: 54, w: 16, h: 22, rx: 6 },
    ]
  },
  // Back muscles
  back: {
    front: false, back: true,
    regions: [
      { x: 28, y: 22, w: 44, h: 20, rx: 8 },
    ]
  },
  lats: {
    front: false, back: true,
    regions: [
      { x: 24, y: 26, w: 16, h: 18, rx: 6 },
      { x: 60, y: 26, w: 16, h: 18, rx: 6 },
    ]
  },
  traps: {
    front: false, back: true,
    regions: [
      { x: 32, y: 12, w: 36, h: 14, rx: 6 },
    ]
  },
  'lower back': {
    front: false, back: true,
    regions: [
      { x: 34, y: 42, w: 32, h: 12, rx: 5 },
    ]
  },
  hamstrings: {
    front: false, back: true,
    regions: [
      { x: 30, y: 56, w: 14, h: 20, rx: 5 },
      { x: 56, y: 56, w: 14, h: 20, rx: 5 },
    ]
  },
  glutes: {
    front: false, back: true,
    regions: [
      { x: 28, y: 48, w: 18, h: 12, rx: 6 },
      { x: 54, y: 48, w: 18, h: 12, rx: 6 },
    ]
  },
  calves: {
    front: false, back: true,
    regions: [
      { x: 32, y: 78, w: 10, h: 14, rx: 4 },
      { x: 58, y: 78, w: 10, h: 14, rx: 4 },
    ]
  },
  // Compound
  legs: {
    front: true, back: true,
    regions: [
      { x: 28, y: 54, w: 16, h: 22, rx: 6 },
      { x: 56, y: 54, w: 16, h: 22, rx: 6 },
      { x: 30, y: 78, w: 12, h: 14, rx: 4 },
      { x: 58, y: 78, w: 12, h: 14, rx: 4 },
    ]
  },
};

// Normalize muscle name to our keys
const normalizeMuscle = (muscle: string): string => {
  const normalized = muscle.toLowerCase().trim();
  const aliases: Record<string, string> = {
    'pectorals': 'chest',
    'pecs': 'chest',
    'abdominals': 'abs',
    'gluteus': 'glutes',
    'latissimus dorsi': 'lats',
    'trapezius': 'traps',
    'erector spinae': 'lower back',
  };
  return aliases[normalized] || normalized;
};

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  view?: 'front' | 'back' | 'both';
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  baseColor?: string;
  silhouetteColor?: string;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

export function MuscleMap({
  primaryMuscles,
  secondaryMuscles = [],
  view = 'front',
  size = 150,
  primaryColor = '#84CC16',
  secondaryColor,
  baseColor = '#1F2937',
  silhouetteColor = '#374151',
  style,
  animated = true,
}: MuscleMapProps) {
  const resolvedSecondaryColor = secondaryColor || primaryColor + '60';
  const showFront = view === 'front' || view === 'both';
  const showBack = view === 'back' || view === 'both';

  const renderBody = (isFront: boolean) => {
    const viewBox = '0 0 100 100';
    const bodyWidth = view === 'both' ? size * 0.45 : size * 0.8;
    const bodyHeight = size;

    // Get muscles to render for this view
    const getMusclesForView = (muscles: string[], isPrimary: boolean) => {
      return muscles
        .map(m => normalizeMuscle(m))
        .filter(m => {
          const info = MUSCLE_REGIONS[m];
          if (!info) return false;
          return isFront ? info.front : info.back;
        })
        .flatMap(m => {
          const info = MUSCLE_REGIONS[m];
          return info.regions.map(r => ({
            ...r,
            color: isPrimary ? primaryColor : resolvedSecondaryColor,
          }));
        });
    };

    const primaryRegions = getMusclesForView(primaryMuscles, true);
    const secondaryRegions = getMusclesForView(secondaryMuscles, false);
    const allRegions = [...secondaryRegions, ...primaryRegions]; // Primary on top

    return (
      <View style={{ width: bodyWidth, height: bodyHeight }}>
        <Svg width={bodyWidth} height={bodyHeight} viewBox={viewBox}>
          {/* Body silhouette */}
          <G>
            {/* Head */}
            <Ellipse cx="50" cy="8" rx="10" ry="8" fill={silhouetteColor} />
            {/* Neck */}
            <Rect x="44" y="14" width="12" height="6" fill={silhouetteColor} />
            {/* Torso */}
            <Path
              d="M28 20 L72 20 L75 30 L78 50 L72 55 L28 55 L22 50 L25 30 Z"
              fill={silhouetteColor}
            />
            {/* Left arm */}
            <Path
              d="M22 22 L10 26 L6 45 L8 60 L16 62 L20 50 L22 30 Z"
              fill={silhouetteColor}
            />
            {/* Right arm */}
            <Path
              d="M78 22 L90 26 L94 45 L92 60 L84 62 L80 50 L78 30 Z"
              fill={silhouetteColor}
            />
            {/* Left leg */}
            <Path
              d="M28 55 L26 75 L28 95 L42 95 L44 75 L45 55 Z"
              fill={silhouetteColor}
            />
            {/* Right leg */}
            <Path
              d="M55 55 L56 75 L58 95 L72 95 L74 75 L72 55 Z"
              fill={silhouetteColor}
            />
          </G>

          {/* Muscle highlights */}
          {allRegions.map((region, index) => (
            <Rect
              key={index}
              x={region.x}
              y={region.y}
              width={region.w}
              height={region.h}
              rx={region.rx || 4}
              fill={region.color}
              opacity={0.9}
            />
          ))}
        </Svg>
      </View>
    );
  };

  const Container = animated ? Animated.View : View;
  const animatedProps = animated ? { entering: FadeIn.duration(400) } : {};

  return (
    <Container
      style={[
        styles.container,
        { width: size, height: size, backgroundColor: baseColor },
        style,
      ]}
      {...animatedProps}
    >
      <View style={styles.bodyContainer}>
        {showFront && renderBody(true)}
        {showBack && renderBody(false)}
      </View>

      {/* View indicator */}
      {view === 'both' && (
        <View style={styles.viewLabels}>
          <View style={[styles.viewLabel, { backgroundColor: silhouetteColor }]}>
            {/* Small dot indicator */}
          </View>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewLabels: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 4,
  },
  viewLabel: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
