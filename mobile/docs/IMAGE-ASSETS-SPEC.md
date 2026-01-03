# Image Assets Specification

## Design Philosophy

Inspired by **Nike Training Club** and **BetterMe**:
- Dark, cinematic photography with dramatic lighting
- Silhouettes and backlit athletes for versatility
- Gradient overlays (dark to transparent) for text legibility
- High contrast, moody aesthetic
- Motion blur for dynamic energy
- Minimalist backgrounds (gym, studio, outdoor)

## Color Palette for Image Generation

- Primary accent: Electric blue (#3B82F6)
- Energy accent: Orange/amber (#F97316)
- Success: Emerald (#10B981)
- Dark backgrounds: #0A0A0A to #1A1A1A
- Gradient overlays: rgba(0,0,0,0.7) to transparent

---

## 1. DASHBOARD IMAGES

### 1.1 Hero Carousel Images (1200x600px, 2:1 ratio)

| ID | Name | Usage | Prompt |
|----|------|-------|--------|
| `hero-morning` | Morning Motivation | Dashboard hero AM | "Silhouette of athletic person stretching at sunrise, dramatic orange and blue sky, gym window, cinematic lighting, fitness motivation, dark moody aesthetic, 8k quality" |
| `hero-intensity` | Workout Intensity | Dashboard hero default | "Athletic person mid-workout, dramatic side lighting, sweat droplets visible, dark gym background, motion blur, intense focus, cinematic fitness photography, moody blue tones" |
| `hero-strength` | Strength Focus | Dashboard hero weights | "Close-up of hands gripping barbell, chalk dust particles in dramatic lighting, dark background, powerful aesthetic, gym atmosphere, cinematic" |
| `hero-cardio` | Cardio Energy | Dashboard hero cardio | "Runner silhouette in motion, dramatic backlight, speed blur effect, urban environment, dawn lighting, energetic powerful mood, cinematic" |
| `hero-rest` | Recovery Day | Dashboard rest day | "Person in peaceful yoga pose, soft natural lighting, minimalist studio, calm serene atmosphere, recovery wellness mood, gentle blue tones" |
| `hero-achievement` | Achievement | After PR/milestone | "Victorious athlete pose, dramatic spotlight from above, dark background, celebration energy, gold and blue accent lighting, triumphant mood" |

### 1.2 Quick Stats Background (400x200px)

| ID | Name | Prompt |
|----|------|--------|
| `stats-streak` | Streak Fire | "Abstract flame pattern, orange to red gradient, dark background, minimal geometric style, app UI element" |
| `stats-volume` | Volume Growth | "Abstract upward trending lines, blue gradient, dark background, minimal geometric, data visualization aesthetic" |
| `stats-time` | Time Invested | "Abstract clock/time pattern, teal gradient, dark background, minimal geometric style" |

---

## 2. WEEKLY PLAN / SPLIT TYPE IMAGES (800x400px, 2:1 ratio)

These are the main workout category images shown on workout cards.

| ID | Split Type | Prompt |
|----|------------|--------|
| `split-upper` | UPPER_BODY | "Athletic torso silhouette doing dumbbell press, dramatic side lighting, defined muscles, dark gym background, blue accent light, cinematic fitness" |
| `split-lower` | LOWER_BODY | "Powerful leg muscles mid-squat, dramatic low angle, dark background, athletic silhouette, amber accent lighting, strength power mood" |
| `split-push` | PUSH | "Athlete pushing barbell overhead, dramatic backlight silhouette, explosive power, dark background, orange energy accents, dynamic motion" |
| `split-pull` | PULL | "Back muscles during pullup, dramatic lighting from below, defined lats, dark moody atmosphere, blue cool tones, strength aesthetic" |
| `split-legs` | LEGS | "Athlete in deep squat position, side profile silhouette, powerful thighs, dark background, dramatic rim lighting, athletic power" |
| `split-fullbody` | FULL_BODY | "Dynamic full body exercise pose, athletic silhouette, multiple muscle groups engaged, dramatic cross lighting, dark background, energetic" |
| `split-chest-tri` | CHEST_TRICEPS | "Chest and arm muscles during bench press, dramatic top lighting, defined pecs and triceps, dark gym, warm amber accents" |
| `split-back-bi` | BACK_BICEPS | "V-taper back silhouette with bicep curl, dramatic lighting, muscular definition, dark background, cool blue tones" |
| `split-shoulders` | SHOULDERS_ARMS | "Boulder shoulders during lateral raise, dramatic front lighting, athletic silhouette, dark background, powerful pose" |
| `split-core` | CORE | "Defined abs during plank hold, dramatic side lighting, core engagement visible, dark minimal background, focused intensity" |
| `split-cardio` | CARDIO | "Runner in motion, speed blur effect, dramatic backlight, urban dark environment, energetic dynamic, blue accent trails" |
| `split-hiit` | HIIT | "Explosive burpee jump, motion blur, sweat particles, dramatic flash lighting, intense energy, dark background, action shot" |
| `split-recovery` | ACTIVE_RECOVERY | "Peaceful stretching pose, soft natural light, calm atmosphere, yoga mat, serene recovery mood, gentle blue tones" |

---

## 3. MUSCLE GROUP ILLUSTRATIONS (400x400px, 1:1 ratio)

Stylized anatomical illustrations showing highlighted muscle groups.

| ID | Muscle | Prompt |
|----|--------|--------|
| `muscle-chest` | Chest | "Anatomical illustration human torso, chest muscles highlighted in glowing blue, dark background, medical fitness style, clean minimal, neon accent" |
| `muscle-back` | Back | "Anatomical illustration human back, latissimus and trapezius highlighted glowing blue, dark background, fitness anatomy style, clean" |
| `muscle-shoulders` | Shoulders | "Anatomical illustration deltoid muscles highlighted glowing orange, dark background, clean minimal fitness anatomy style" |
| `muscle-biceps` | Biceps | "Anatomical illustration arm, biceps brachii highlighted glowing blue, dark background, clean fitness anatomy style" |
| `muscle-triceps` | Triceps | "Anatomical illustration arm, triceps highlighted glowing orange, dark background, fitness anatomy style, minimal" |
| `muscle-forearms` | Forearms | "Anatomical illustration forearm muscles highlighted glowing teal, dark background, clean fitness anatomy" |
| `muscle-core` | Core/Abs | "Anatomical illustration torso, abdominal muscles highlighted glowing blue, dark background, fitness anatomy style" |
| `muscle-quads` | Quadriceps | "Anatomical illustration leg front, quadriceps highlighted glowing orange, dark background, fitness anatomy style" |
| `muscle-hamstrings` | Hamstrings | "Anatomical illustration leg back, hamstrings highlighted glowing blue, dark background, fitness anatomy" |
| `muscle-glutes` | Glutes | "Anatomical illustration hip area, gluteal muscles highlighted glowing purple, dark background, fitness anatomy" |
| `muscle-calves` | Calves | "Anatomical illustration lower leg, calf muscles highlighted glowing teal, dark background, fitness anatomy" |

---

## 4. MOVEMENT PATTERN IMAGES (600x400px)

| ID | Pattern | Prompt |
|----|---------|--------|
| `move-horizontal-push` | Horizontal Push | "Athletic silhouette doing bench press, side view, dramatic lighting, bar path visible, dark gym, form focus" |
| `move-horizontal-pull` | Horizontal Pull | "Athletic silhouette doing barbell row, side view, back engagement, dramatic rim light, dark background" |
| `move-vertical-push` | Vertical Push | "Overhead press silhouette, front view, arms extended up, dramatic under-lighting, powerful pose, dark" |
| `move-vertical-pull` | Vertical Pull | "Pullup silhouette at top position, dramatic backlight, wide grip, lat spread visible, dark background" |
| `move-squat` | Squat | "Deep squat side profile, perfect form, dramatic side lighting, athletic silhouette, dark minimal" |
| `move-hinge` | Hip Hinge | "Deadlift setup position, hip hinge form, dramatic lighting, barbell and athlete silhouette, dark gym" |
| `move-lunge` | Lunge | "Walking lunge mid-stride, dynamic pose, athletic silhouette, dramatic cross lighting, motion energy" |
| `move-carry` | Carry | "Farmer's walk pose, heavy dumbbells, walking stride, athletic silhouette, dramatic side light" |

---

## 5. UI ELEMENT IMAGES

### 5.1 Empty States (600x400px)

| ID | Usage | Prompt |
|----|-------|--------|
| `empty-no-plan` | No workout plan | "Minimalist illustration of barbell with sparkles, waiting energy, soft blue glow, dark background, friendly inviting mood" |
| `empty-rest-day` | Rest day | "Minimalist illustration of moon and stars, peaceful night, soft purple glow, dark background, calm relaxing" |
| `empty-completed` | All done | "Minimalist illustration of checkmark with celebration particles, gold and blue, achievement mood, dark background" |

### 5.2 Rest Timer Background (800x800px)

| ID | Usage | Prompt |
|----|-------|--------|
| `timer-rest` | Rest countdown | "Abstract circular gradient, breathing animation feel, calm blue to purple, dark center, meditative mood, minimal" |

### 5.3 Achievement/Celebration (600x600px)

| ID | Usage | Prompt |
|----|-------|--------|
| `achieve-pr` | Personal Record | "Explosion of gold particles, trophy silhouette center, celebration energy, dark background, achievement glory" |
| `achieve-streak` | Streak milestone | "Flame icon with ascending energy lines, orange to gold gradient, dark background, streak fire momentum" |
| `achieve-complete` | Workout complete | "Burst of blue energy particles, checkmark center, accomplishment feeling, dark background, satisfying completion" |

---

## 6. EXERCISE CATEGORY THUMBNAILS (300x300px)

| ID | Category | Prompt |
|----|----------|--------|
| `cat-strength` | Strength | "Dumbbell icon with power aura, metallic silver, dark background, strength energy, minimal iconic" |
| `cat-cardio` | Cardio | "Heart rate pulse line, energetic red glow, dark background, cardio energy, minimal iconic style" |
| `cat-flexibility` | Flexibility | "Yoga stretch silhouette icon, flowing lines, calm teal glow, dark background, flexibility grace" |
| `cat-balance` | Balance | "Balance scale icon, zen aesthetic, soft purple glow, dark background, stability focus" |
| `cat-plyometric` | Plyometric | "Explosive jump arrows icon, dynamic orange energy, dark background, power explosive feel" |
| `cat-calisthenics` | Calisthenics | "Body weight exercise icon, clean lines, blue accent, dark background, bodyweight mastery" |

---

## 7. PRIORITY GENERATION ORDER

### Phase 1 - Critical (Generate First)
1. `split-upper` - Upper Body
2. `split-lower` - Lower Body
3. `split-fullbody` - Full Body
4. `split-push` - Push
5. `split-pull` - Pull
6. `split-legs` - Legs
7. `hero-intensity` - Main dashboard hero

### Phase 2 - Important
8. `split-chest-tri` - Chest & Triceps
9. `split-back-bi` - Back & Biceps
10. `split-shoulders` - Shoulders & Arms
11. `split-core` - Core
12. `split-cardio` - Cardio
13. `split-hiit` - HIIT
14. `split-recovery` - Recovery
15. `hero-rest` - Rest day hero

### Phase 3 - Enhancement
16. All muscle group illustrations
17. Movement pattern images
18. Additional hero images
19. Achievement images
20. Empty state illustrations

---

## 8. IMAGE STORAGE STRUCTURE

```
mobile/
  assets/
    images/
      hero/
        morning.png
        intensity.png
        strength.png
        cardio.png
        rest.png
        achievement.png
      splits/
        upper-body.png
        lower-body.png
        full-body.png
        push.png
        pull.png
        legs.png
        chest-triceps.png
        back-biceps.png
        shoulders-arms.png
        core.png
        cardio.png
        hiit.png
        recovery.png
      muscles/
        chest.png
        back.png
        shoulders.png
        biceps.png
        triceps.png
        forearms.png
        core.png
        quads.png
        hamstrings.png
        glutes.png
        calves.png
      ui/
        empty-no-plan.png
        empty-rest-day.png
        timer-background.png
        achieve-pr.png
        achieve-streak.png
        achieve-complete.png
```

---

## 9. FALLBACK GRADIENTS

Until images are generated, use these gradient fallbacks:

```typescript
const SPLIT_GRADIENTS: Record<SplitType, [string, string]> = {
  UPPER_BODY: ['#3B82F6', '#1E40AF'],
  LOWER_BODY: ['#8B5CF6', '#5B21B6'],
  FULL_BODY: ['#10B981', '#047857'],
  PUSH: ['#F97316', '#C2410C'],
  PULL: ['#06B6D4', '#0E7490'],
  LEGS: ['#A855F7', '#7E22CE'],
  CHEST_TRICEPS: ['#EF4444', '#B91C1C'],
  BACK_BICEPS: ['#3B82F6', '#1E40AF'],
  SHOULDERS_ARMS: ['#EC4899', '#BE185D'],
  CORE: ['#14B8A6', '#0F766E'],
  CARDIO: ['#F43F5E', '#BE123C'],
  HIIT: ['#EAB308', '#A16207'],
  ACTIVE_RECOVERY: ['#22C55E', '#15803D'],
};
```
