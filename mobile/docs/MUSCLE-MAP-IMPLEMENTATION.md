# Muscle Map Implementation Plan

## Overview

Add interactive muscle anatomy diagrams like BetterMe/Nike Training Club that show:
- Human body silhouette (front + back views)
- Highlighted target muscles for each exercise
- Primary muscles (bright color) vs Secondary muscles (dimmer)
- Animated highlight transitions

## Visual Reference

The target style (from screenshot):
- Dark gray body silhouette as base
- Lime green (#84CC16) highlights for active muscles
- Clean, stylized anatomical illustration
- Supports both front and back body views

---

## Implementation Approaches

### Option 1: SVG-Based (Recommended)
**Pros:** Scalable, customizable colors, small file size, animatable
**Cons:** Complex to create paths, requires careful design

### Option 2: Image Layer Compositing
**Pros:** Easier to create, more realistic look possible
**Cons:** Larger file size, need separate image for each muscle

### Option 3: Pre-rendered Combinations
**Pros:** Simplest implementation, predictable results
**Cons:** Many images needed, not flexible

**Recommendation:** Use SVG for scalability and animation support.

---

## Required SVG Assets

### Base Body Silhouettes
1. `body-front-base.svg` - Front view silhouette (dark gray)
2. `body-back-base.svg` - Back view silhouette (dark gray)

### Muscle Overlays (SVG paths for each)

#### Front View Muscles
| Muscle | SVG ID | Notes |
|--------|--------|-------|
| Chest (Pectorals) | `muscle-chest` | Left + Right pec |
| Front Deltoids | `muscle-front-delt` | Shoulder front |
| Biceps | `muscle-biceps` | Both arms |
| Forearms (Front) | `muscle-forearm-front` | Both arms |
| Abs (Rectus Abdominis) | `muscle-abs` | 6-pack region |
| Obliques | `muscle-obliques` | Side abs |
| Quadriceps | `muscle-quads` | Front thigh |
| Hip Flexors | `muscle-hip-flexors` | Upper thigh/hip |
| Tibialis Anterior | `muscle-tibialis` | Front shin |
| Adductors | `muscle-adductors` | Inner thigh |

#### Back View Muscles
| Muscle | SVG ID | Notes |
|--------|--------|-------|
| Trapezius | `muscle-traps` | Upper back/neck |
| Rear Deltoids | `muscle-rear-delt` | Shoulder back |
| Latissimus Dorsi | `muscle-lats` | V-taper back |
| Rhomboids | `muscle-rhomboids` | Mid back |
| Lower Back (Erector Spinae) | `muscle-lower-back` | Spine muscles |
| Triceps | `muscle-triceps` | Back of arms |
| Forearms (Back) | `muscle-forearm-back` | Both arms |
| Glutes | `muscle-glutes` | Buttocks |
| Hamstrings | `muscle-hamstrings` | Back thigh |
| Calves | `muscle-calves` | Back lower leg |

---

## Component Architecture

```
components/
  ui/
    MuscleMap/
      index.tsx           # Main export
      MuscleMap.tsx       # Core component
      MusclePaths.ts      # SVG path data
      types.ts            # TypeScript types
      constants.ts        # Muscle colors, mappings
```

---

## MuscleMap Component API

```tsx
interface MuscleMapProps {
  // Which muscles to highlight
  primaryMuscles: string[];    // e.g., ['chest', 'triceps']
  secondaryMuscles?: string[]; // e.g., ['shoulders']

  // Display options
  view?: 'front' | 'back' | 'both'; // Default: 'front'
  size?: number;                     // Default: 200

  // Colors
  primaryColor?: string;    // Default: '#84CC16' (lime)
  secondaryColor?: string;  // Default: primary at 50% opacity
  baseColor?: string;       // Default: '#374151' (gray)

  // Animation
  animated?: boolean;       // Default: true

  // Style
  style?: ViewStyle;
}

// Usage
<MuscleMap
  primaryMuscles={['chest', 'triceps']}
  secondaryMuscles={['shoulders', 'core']}
  view="front"
  size={200}
/>
```

---

## Muscle Name Mapping

Map exercise muscle names to SVG muscle IDs:

```typescript
const MUSCLE_MAP: Record<string, MuscleInfo> = {
  // Chest
  'chest': { svgIds: ['muscle-chest'], view: 'front' },
  'pectorals': { svgIds: ['muscle-chest'], view: 'front' },
  'pecs': { svgIds: ['muscle-chest'], view: 'front' },

  // Back
  'back': { svgIds: ['muscle-lats', 'muscle-rhomboids'], view: 'back' },
  'lats': { svgIds: ['muscle-lats'], view: 'back' },
  'latissimus dorsi': { svgIds: ['muscle-lats'], view: 'back' },
  'upper back': { svgIds: ['muscle-traps', 'muscle-rhomboids'], view: 'back' },
  'lower back': { svgIds: ['muscle-lower-back'], view: 'back' },

  // Shoulders
  'shoulders': { svgIds: ['muscle-front-delt', 'muscle-rear-delt'], view: 'both' },
  'deltoids': { svgIds: ['muscle-front-delt', 'muscle-rear-delt'], view: 'both' },
  'front delts': { svgIds: ['muscle-front-delt'], view: 'front' },
  'rear delts': { svgIds: ['muscle-rear-delt'], view: 'back' },

  // Arms
  'biceps': { svgIds: ['muscle-biceps'], view: 'front' },
  'triceps': { svgIds: ['muscle-triceps'], view: 'back' },
  'forearms': { svgIds: ['muscle-forearm-front', 'muscle-forearm-back'], view: 'both' },

  // Core
  'core': { svgIds: ['muscle-abs', 'muscle-obliques'], view: 'front' },
  'abs': { svgIds: ['muscle-abs'], view: 'front' },
  'abdominals': { svgIds: ['muscle-abs'], view: 'front' },
  'obliques': { svgIds: ['muscle-obliques'], view: 'front' },

  // Legs - Front
  'quadriceps': { svgIds: ['muscle-quads'], view: 'front' },
  'quads': { svgIds: ['muscle-quads'], view: 'front' },
  'hip flexors': { svgIds: ['muscle-hip-flexors'], view: 'front' },
  'adductors': { svgIds: ['muscle-adductors'], view: 'front' },

  // Legs - Back
  'hamstrings': { svgIds: ['muscle-hamstrings'], view: 'back' },
  'glutes': { svgIds: ['muscle-glutes'], view: 'back' },
  'gluteus': { svgIds: ['muscle-glutes'], view: 'back' },
  'calves': { svgIds: ['muscle-calves'], view: 'back' },

  // Compound groups
  'legs': {
    svgIds: ['muscle-quads', 'muscle-hamstrings', 'muscle-glutes', 'muscle-calves'],
    view: 'both'
  },
  'arms': {
    svgIds: ['muscle-biceps', 'muscle-triceps', 'muscle-forearm-front', 'muscle-forearm-back'],
    view: 'both'
  },
};
```

---

## Image Generation Prompts (for Nana Pro 2.5)

### Base Body Silhouettes

**Front View Base:**
```
Anatomical human body silhouette, front view, standing neutral pose, arms slightly away from body, dark gray fill (#374151), no face details, stylized fitness app illustration style, clean vector art, black background, symmetrical, full body from head to feet
```

**Back View Base:**
```
Anatomical human body silhouette, back view, standing neutral pose, arms slightly away from body, dark gray fill (#374151), no face details, stylized fitness app illustration style, clean vector art, black background, symmetrical, full body from head to feet
```

### Individual Muscle Highlights

For each muscle, generate with the muscle glowing/highlighted:

**Chest (Front):**
```
Anatomical human body front view, chest muscles (pectoralis major) highlighted in bright lime green (#84CC16), rest of body in dark gray, clean stylized fitness app illustration, black background, vector art style
```

**Back/Lats (Back View):**
```
Anatomical human body back view, latissimus dorsi muscles highlighted in bright lime green (#84CC16), V-taper back muscles glowing, rest of body in dark gray, clean stylized fitness app illustration, black background
```

**Quadriceps (Front):**
```
Anatomical human body front view, quadriceps muscles highlighted in bright lime green (#84CC16), front thigh muscles glowing, rest of body in dark gray, clean stylized fitness app illustration, black background
```

*Continue for each muscle group...*

---

## Where to Use MuscleMap

### 1. Exercise Cards (WorkoutDayDetail)
Show small muscle map next to each exercise:
```tsx
<ExerciseCard>
  <MuscleMap
    primaryMuscles={exercise.primaryMuscles}
    secondaryMuscles={exercise.secondaryMuscles}
    size={80}
    view="front"
  />
  <ExerciseInfo ... />
</ExerciseCard>
```

### 2. Exercise Detail Bottom Sheet
Show larger muscle map in exercise details:
```tsx
<BottomSheet>
  <MuscleMap
    primaryMuscles={['chest']}
    secondaryMuscles={['triceps', 'shoulders']}
    size={200}
    view="both"
  />
  <Text>Primary: Chest</Text>
  <Text>Secondary: Triceps, Shoulders</Text>
</BottomSheet>
```

### 3. Workout Summary (Today's Workout Card)
Show aggregate muscles for entire workout:
```tsx
<WorkoutCard>
  <MuscleMap
    primaryMuscles={workout.focusMuscles}
    size={120}
    view="front"
  />
</WorkoutCard>
```

### 4. Weekly Plan Overview
Show which muscles each day targets:
```tsx
<WeekDayCard>
  <MuscleMap
    primaryMuscles={day.focusMuscles}
    size={60}
    view="front"
  />
</WeekDayCard>
```

---

## Implementation Steps

### Phase 1: Create SVG Assets
1. Design or source base body silhouettes (front + back)
2. Create SVG paths for each muscle group
3. Test scaling and coloring

### Phase 2: Build MuscleMap Component
1. Create component structure
2. Implement SVG rendering with react-native-svg
3. Add muscle highlighting logic
4. Add animation for transitions

### Phase 3: Integration
1. Add to ExerciseCard in WorkoutDayDetail
2. Add to Exercise BottomSheet
3. Add to ActiveWorkoutScreen
4. Add to Dashboard workout cards

### Phase 4: Polish
1. Fine-tune animations
2. Optimize performance
3. Add loading states
4. Test on various screen sizes

---

## Quick Start Implementation

For MVP, we can use a simpler approach with pre-composited images:

1. Generate 2 base images (front/back body)
2. Generate overlay images for common muscle combinations:
   - Upper body (chest, back, shoulders, arms)
   - Lower body (quads, hamstrings, glutes, calves)
   - Full body
   - Push muscles (chest, triceps, shoulders)
   - Pull muscles (back, biceps)
   - Core

This reduces the number of images needed while still providing good visual feedback.

---

## File Structure for Images

```
assets/
  images/
    muscles/
      # Base silhouettes
      body-front-base.png
      body-back-base.png

      # Individual muscle overlays (for full implementation)
      front/
        chest.png
        abs.png
        quads.png
        biceps.png
        shoulders-front.png
        ...
      back/
        lats.png
        traps.png
        hamstrings.png
        glutes.png
        triceps.png
        calves.png
        ...

      # Pre-composited combinations (for MVP)
      combos/
        upper-body-front.png
        upper-body-back.png
        lower-body-front.png
        lower-body-back.png
        push-muscles.png
        pull-muscles.png
        full-body-front.png
        full-body-back.png
```
