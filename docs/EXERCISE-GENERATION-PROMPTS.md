# Exercise Generation Prompts for Claude Web

Use these prompts in Claude Web (claude.ai) to generate exercises. Copy each prompt, paste into Claude, and save the JSON output.

---

## How to Use

1. Go to [claude.ai](https://claude.ai)
2. Start a new conversation
3. Copy the **System Prompt** first (only once per session)
4. Then copy each **Batch Prompt** one by one
5. Ask Claude to continue if it stops mid-output
6. Save each batch as `exercises-batch-X.json`

---

## System Prompt (Use This First)

```
You are an expert exercise physiologist and certified strength & conditioning specialist creating a comprehensive exercise database. You have deep knowledge of:
- Exercise biomechanics and muscle activation patterns
- Progressive overload and exercise progressions
- Injury prevention and contraindications
- Equipment variations and modifications
- Goal-specific training protocols

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations, no code blocks
2. Every exercise must have ALL fields filled (no nulls except where specified)
3. Use scientifically accurate muscle activation percentages
4. Include realistic contraindications based on biomechanics
5. Ensure slugs are unique and URL-friendly (lowercase, hyphens only)
6. Link exercises to easier/harder variations using slugs
7. Be specific with exercise names (e.g., "Incline Dumbbell Press 45-degree" not just "Incline Press")

MUSCLE GROUPS (use these exact names):
chest, back, lats, shoulders, biceps, triceps, forearms, core, obliques, quads, hamstrings, glutes, calves, hip_flexors, traps, rear_delts, front_delts, side_delts

EQUIPMENT OPTIONS:
barbell, dumbbell, kettlebell, cable, machine, resistance_band, pull_up_bar, bench, squat_rack, smith_machine, ez_bar, trap_bar, medicine_ball, stability_ball, foam_roller, suspension_trainer, battle_ropes, sled, rowing_machine, stationary_bike, treadmill, elliptical, jump_rope, box, parallettes, rings, none

INJURY CONTRAINDICATIONS:
shoulder_injury, elbow_injury, wrist_injury, lower_back_injury, upper_back_injury, neck_injury, knee_injury, ankle_injury, hip_injury, heart_condition, high_blood_pressure, pregnancy
```

---

## JSON Schema (Reference)

```json
{
  "name": "string",
  "slug": "string (lowercase-with-hyphens)",
  "description": "string (2-3 sentences)",
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],

  "category": "STRENGTH | CARDIO | FLEXIBILITY | BALANCE | PLYOMETRIC | CALISTHENICS",
  "movementPattern": "HORIZONTAL_PUSH | HORIZONTAL_PULL | VERTICAL_PUSH | VERTICAL_PULL | SQUAT | HINGE | LUNGE | CARRY | ROTATION | ANTI_ROTATION | FLEXION | EXTENSION | ISOLATION | CARDIO",
  "exerciseType": "COMPOUND | ISOLATION | CARDIO_STEADY | CARDIO_HIIT | FLEXIBILITY | MOBILITY | WARMUP | COOLDOWN",

  "primaryMuscles": ["muscle1"],
  "secondaryMuscles": ["muscle2", "muscle3"],
  "muscleActivationMap": {"chest": 0.9, "triceps": 0.6, "front_delts": 0.4},

  "difficultyLevel": 1-5,
  "skillRequirement": 1-5,
  "isBeginnerFriendly": true/false,

  "equipmentRequired": ["dumbbell", "bench"],
  "equipmentOptional": ["spotter"],
  "suitableLocations": ["home", "gym", "outdoor"],

  "repRanges": {
    "strength": {"min": 3, "max": 6},
    "hypertrophy": {"min": 8, "max": 12},
    "endurance": {"min": 15, "max": 20}
  },
  "typicalSets": {"min": 3, "max": 5},
  "restSeconds": {"strength": 180, "hypertrophy": 90, "endurance": 45},

  "metValue": 5.0,
  "intensityFactor": 0.7,

  "contraindications": ["shoulder_injury", "elbow_injury"],
  "formCues": ["Keep chest up", "Drive through heels", "Squeeze at top"],
  "commonMistakes": ["Flaring elbows", "Bouncing weight", "Incomplete ROM"],

  "easierVariation": "exercise-slug-easier",
  "harderVariation": "exercise-slug-harder",
  "alternativeExercises": ["alt-exercise-1", "alt-exercise-2"],

  "tags": ["compound", "push", "strength", "powerlifting"],
  "suitableGoals": ["MUSCLE_GAIN", "STRENGTH"],

  "fitnessLevelSuitability": {
    "sedentary": 2,
    "lightlyActive": 3,
    "moderatelyActive": 4,
    "veryActive": 5,
    "athlete": 5
  },
  "experienceLevelSuitability": {
    "never": 2,
    "lessThan6Mo": 3,
    "sixTo24Mo": 4,
    "twoTo5Yr": 5,
    "fivePlusYr": 5
  },
  "goalEffectiveness": {
    "weightLoss": 0.6,
    "muscleGain": 0.95,
    "strength": 0.9,
    "endurance": 0.3,
    "flexibility": 0.1,
    "generalFitness": 0.7
  },

  "estimatedTimePerSet": 45,
  "setupTimeSeconds": 60,

  "homeCompatibility": 0.3,
  "gymCompatibility": 1.0,
  "outdoorCompatibility": 0.1
}
```

---

## Batch 1: CHEST EXERCISES (35 exercises)

```
Generate 35 chest exercises as a JSON array. Include:

BARBELL (8):
- Flat Barbell Bench Press
- Incline Barbell Bench Press (30°, 45°)
- Decline Barbell Bench Press
- Close-Grip Bench Press
- Wide-Grip Bench Press
- Floor Press
- Paused Bench Press

DUMBBELL (10):
- Flat Dumbbell Press
- Incline Dumbbell Press
- Decline Dumbbell Press
- Dumbbell Fly (flat, incline, decline)
- Squeeze Press
- Dumbbell Pullover
- Single-Arm Dumbbell Press
- Neutral-Grip Dumbbell Press

BODYWEIGHT (10):
- Standard Push-up
- Wide Push-up
- Diamond Push-up
- Incline Push-up (easier)
- Decline Push-up (harder)
- Archer Push-up
- Pseudo Planche Push-up
- Explosive Push-up
- Push-up with Rotation
- Pike Push-up to Chest

CABLE/MACHINE (5):
- Cable Fly (high, mid, low)
- Machine Chest Press
- Pec Deck Fly

RESISTANCE BAND (2):
- Banded Push-up
- Band Chest Press

Ensure progression chains: incline push-up → standard push-up → decline push-up → weighted push-up
Ensure progression chains: dumbbell press → barbell press → paused bench → close-grip bench

Output as a single JSON array with no additional text.
```

---

## Batch 2: BACK EXERCISES (40 exercises)

```
Generate 40 back exercises as a JSON array. Include:

HORIZONTAL PULLS - ROWS (15):
- Barbell Bent-Over Row (overhand, underhand)
- Pendlay Row
- Dumbbell Row (single-arm, chest-supported)
- Cable Row (seated, standing, single-arm)
- T-Bar Row
- Machine Row
- Inverted Row (bodyweight)
- Meadows Row
- Helms Row
- Resistance Band Row

VERTICAL PULLS (12):
- Pull-up (standard, wide, close)
- Chin-up
- Neutral-Grip Pull-up
- Lat Pulldown (wide, close, neutral, single-arm)
- Assisted Pull-up
- Negative Pull-up
- Archer Pull-up
- Muscle-up Progression

HINGE/DEADLIFT (8):
- Conventional Deadlift
- Romanian Deadlift
- Sumo Deadlift
- Trap Bar Deadlift
- Single-Leg Romanian Deadlift
- Good Morning
- Rack Pull
- Deficit Deadlift

ISOLATION (5):
- Straight-Arm Pulldown
- Face Pull
- Reverse Fly (dumbbell, cable)
- Shrug (barbell, dumbbell)

Ensure progression: assisted pull-up → negative pull-up → pull-up → weighted pull-up → archer pull-up

Output as a single JSON array with no additional text.
```

---

## Batch 3: LEGS - QUADS (30 exercises)

```
Generate 30 quadriceps-focused exercises as a JSON array. Include:

SQUAT VARIATIONS (12):
- Barbell Back Squat (high bar, low bar)
- Front Squat
- Goblet Squat
- Dumbbell Squat
- Zercher Squat
- Box Squat
- Pause Squat
- Bodyweight Squat
- Wall Sit
- Pistol Squat
- Sissy Squat
- Hack Squat (machine)

LUNGE VARIATIONS (10):
- Forward Lunge
- Reverse Lunge
- Walking Lunge
- Bulgarian Split Squat
- Deficit Lunge
- Lateral Lunge
- Curtsy Lunge
- Jump Lunge
- Step-up
- Box Step-up

MACHINE/ISOLATION (8):
- Leg Press
- Leg Extension
- Hack Squat Machine
- Smith Machine Squat
- Pendulum Squat
- Belt Squat
- Single-Leg Press
- Bodyweight Leg Extension

Ensure progression: bodyweight squat → goblet squat → back squat → front squat → pistol squat

Output as a single JSON array with no additional text.
```

---

## Batch 4: LEGS - HAMSTRINGS & GLUTES (35 exercises)

```
Generate 35 hamstring and glute exercises as a JSON array. Include:

HAMSTRINGS (18):
Hip Hinge:
- Romanian Deadlift (barbell, dumbbell, single-leg)
- Stiff-Leg Deadlift
- Good Morning
- Cable Pull-Through

Curl Variations:
- Lying Leg Curl
- Seated Leg Curl
- Standing Leg Curl
- Nordic Curl
- Sliding Leg Curl
- Swiss Ball Leg Curl
- Glute-Ham Raise
- Reverse Hyper

GLUTES (17):
Hip Thrust Variations:
- Barbell Hip Thrust
- Single-Leg Hip Thrust
- Dumbbell Hip Thrust
- Banded Hip Thrust
- Foot-Elevated Hip Thrust

Bridge Variations:
- Glute Bridge
- Single-Leg Glute Bridge
- Marching Glute Bridge
- Frog Pump

Abduction/Kickback:
- Cable Kickback
- Donkey Kick
- Fire Hydrant
- Clamshell
- Banded Lateral Walk
- Hip Abduction Machine
- Cable Hip Abduction
- Sumo Deadlift (glute focus)

Ensure progression: glute bridge → hip thrust → single-leg hip thrust → barbell hip thrust
Ensure progression: sliding leg curl → nordic curl negative → nordic curl

Output as a single JSON array with no additional text.
```

---

## Batch 5: SHOULDERS (35 exercises)

```
Generate 35 shoulder exercises as a JSON array. Include:

PRESSING/COMPOUND (12):
- Overhead Press (barbell, dumbbell, seated, standing)
- Push Press
- Arnold Press
- Z Press
- Landmine Press
- Pike Push-up
- Handstand Push-up (wall-assisted, freestanding)
- Machine Shoulder Press
- Single-Arm Dumbbell Press

LATERAL RAISES (8):
- Dumbbell Lateral Raise
- Cable Lateral Raise
- Leaning Lateral Raise
- Machine Lateral Raise
- Plate Front Raise
- Y-Raise
- Lu Raise
- Band Lateral Raise

FRONT RAISES (5):
- Dumbbell Front Raise
- Cable Front Raise
- Plate Front Raise
- Barbell Front Raise
- Alternating Front Raise

REAR DELTS (7):
- Reverse Pec Deck
- Dumbbell Reverse Fly
- Cable Reverse Fly
- Face Pull
- Prone Y-T-W Raises
- Band Pull-Apart
- Rear Delt Row

ROTATOR CUFF (3):
- External Rotation (cable, dumbbell)
- Internal Rotation
- Cuban Press

Ensure rear delts have contraindication for shoulder_injury
Include rotator cuff exercises marked as WARMUP/MOBILITY

Output as a single JSON array with no additional text.
```

---

## Batch 6: ARMS - BICEPS & TRICEPS (50 exercises)

```
Generate 50 arm exercises as a JSON array. Include:

BICEPS (25):
Barbell Curls:
- Barbell Curl
- EZ-Bar Curl
- Preacher Curl
- Drag Curl
- Reverse Curl

Dumbbell Curls:
- Dumbbell Curl (standing, seated, incline)
- Hammer Curl
- Concentration Curl
- Zottman Curl
- Spider Curl
- Cross-Body Curl

Cable Curls:
- Cable Curl (straight bar, rope, single-arm)
- High Cable Curl
- Lying Cable Curl
- Bayesian Curl

Other:
- Chin-up (bicep focus)
- Band Curl
- Machine Curl

TRICEPS (25):
Pressing:
- Close-Grip Bench Press
- Diamond Push-up
- Dips (tricep focus)
- JM Press
- Board Press

Extensions:
- Skull Crusher (barbell, dumbbell)
- Overhead Tricep Extension (dumbbell, cable, barbell)
- Tricep Pushdown (rope, straight bar, v-bar)
- Single-Arm Pushdown
- Tricep Kickback
- French Press
- Tate Press

Other:
- Bench Dips
- Ring Dips
- Cable Overhead Extension
- Band Pushdown
- Machine Tricep Extension

Mark all as ISOLATION and movementPattern as ISOLATION
Ensure proper difficulty scaling (dips harder than pushdowns)

Output as a single JSON array with no additional text.
```

---

## Batch 7: CORE & ABS (30 exercises)

```
Generate 30 core exercises as a JSON array. Include:

ANTI-EXTENSION (10):
- Plank (standard, forearm, side)
- Dead Bug
- Ab Wheel Rollout (kneeling, standing)
- Body Saw
- Hollow Body Hold
- Long Lever Plank
- Weighted Plank
- Stir the Pot

ANTI-ROTATION (6):
- Pallof Press (cable, band)
- Bird Dog
- Single-Arm Farmer Carry
- Renegade Row
- Plank with Shoulder Tap
- Anti-Rotation Press

FLEXION (8):
- Crunch
- Bicycle Crunch
- Reverse Crunch
- Hanging Leg Raise
- Lying Leg Raise
- V-Up
- Toe Touch
- Cable Crunch

ROTATION (6):
- Russian Twist
- Woodchop (cable, medicine ball)
- Landmine Rotation
- Bicycle
- Windshield Wiper
- Medicine Ball Slam

Mark planks as CALISTHENICS, movement as ANTI_ROTATION/ANTI_EXTENSION
Include core exercises safe with lower_back_injury (bird dog, dead bug, modified planks)

Output as a single JSON array with no additional text.
```

---

## Batch 8: CARDIO & HIIT (45 exercises)

```
Generate 45 cardio and HIIT exercises as a JSON array. Include:

HIIT MOVEMENTS (25):
Jumping:
- Burpee
- Box Jump
- Jump Squat
- Tuck Jump
- Broad Jump
- Star Jump
- Split Jump
- Skater Jump

Running in Place:
- High Knees
- Butt Kicks
- Mountain Climber
- Sprinter Start
- A-Skip
- B-Skip

Full Body:
- Jumping Jack
- Seal Jack
- Plyo Push-up
- Medicine Ball Slam
- Battle Rope Wave
- Kettlebell Swing
- Thruster
- Man Maker
- Devil Press

STEADY STATE (12):
- Treadmill Walk/Jog/Run
- Stationary Bike
- Rowing Machine
- Elliptical
- Stair Climber
- Swimming
- Jump Rope (basic, double under)
- Cycling Outdoor
- Walking
- Hiking
- Jogging
- Sprinting

LOW IMPACT (8):
- Marching in Place
- Step Touch
- Low-Impact Jumping Jack
- Swimming
- Water Aerobics
- Recumbent Bike
- Arm Ergometer
- Seated Cardio

Mark HIIT as category=CARDIO, exerciseType=CARDIO_HIIT
Mark steady state as exerciseType=CARDIO_STEADY
Include pregnancy-safe and heart_condition-safe options with appropriate contraindications
High metValues (6-12) for HIIT, lower (3-6) for steady state

Output as a single JSON array with no additional text.
```

---

## Batch 9: FLEXIBILITY & MOBILITY (40 exercises)

```
Generate 40 flexibility and mobility exercises as a JSON array. Include:

DYNAMIC STRETCHES (15):
- Arm Circles
- Leg Swings (front, side)
- Walking Lunges with Twist
- Inchworm
- World's Greatest Stretch
- Cat-Cow
- Hip Circles
- Torso Twist
- High Kicks
- Butt Kicks (dynamic)
- Shoulder Rolls
- Neck Rolls
- Ankle Circles
- Walking Knee Hugs
- Toy Soldier

STATIC STRETCHES (15):
- Hamstring Stretch (standing, seated)
- Quad Stretch
- Hip Flexor Stretch
- Pigeon Pose
- Figure Four Stretch
- Chest Doorway Stretch
- Tricep Stretch
- Shoulder Cross-Body Stretch
- Lat Stretch
- Calf Stretch
- Child's Pose
- Cobra Stretch
- Butterfly Stretch
- Frog Stretch
- Seated Spinal Twist

MOBILITY DRILLS (10):
- 90/90 Hip Switch
- Couch Stretch
- Thoracic Spine Rotation
- Ankle Mobility (wall stretch)
- Wrist Circles
- Shoulder Dislocates (with band/stick)
- Deep Squat Hold
- Jefferson Curl
- Prone Scorpion
- Thread the Needle

Mark as category=FLEXIBILITY
exerciseType=WARMUP for dynamic, COOLDOWN for static, MOBILITY for drills
All should have high flexibility goalEffectiveness (0.9+)
Low metValue (1.5-2.5)
Most should be home and outdoor compatible

Output as a single JSON array with no additional text.
```

---

## Batch 10: CALVES & FOREARMS (20 exercises)

```
Generate 20 calf and forearm exercises as a JSON array. Include:

CALVES (12):
Standing:
- Standing Calf Raise (barbell, machine, dumbbell)
- Single-Leg Calf Raise
- Donkey Calf Raise
- Smith Machine Calf Raise

Seated:
- Seated Calf Raise
- Seated Single-Leg Calf Raise

Other:
- Leg Press Calf Raise
- Tibialis Raise
- Jump Rope (calf focus)
- Calf Walk
- Farmer Walk (calf engagement)
- Box Calf Raises

FOREARMS (8):
- Wrist Curl (barbell, dumbbell)
- Reverse Wrist Curl
- Farmer Carry
- Dead Hang
- Plate Pinch
- Towel Pull-up
- Wrist Roller
- Gripper Squeeze

All ISOLATION exercises
Mark calf exercises as ankle_injury contraindication
High reps for calves (15-25)

Output as a single JSON array with no additional text.
```

---

## After Generation

Once you have all 10 batches:

1. Save each as `exercises-batch-1.json` through `exercises-batch-10.json`
2. Combine into a single file or import separately
3. Run the import script to load into database
4. Generate embeddings with OpenAI

**Expected Total: ~360 exercises** (enough for comprehensive coverage)

---

## Tips for Better Output

1. **If Claude stops mid-output**: Say "continue from where you stopped, output only the remaining JSON"

2. **If JSON is invalid**: Say "There was a JSON syntax error. Please output the corrected JSON array"

3. **For more variations**: Say "Generate 10 more [muscle group] exercises focusing on [equipment type]"

4. **To verify completeness**: Ask Claude to count the exercises and list any missing fields

5. **For progression chains**: After all batches, ask: "Review all exercises and output a JSON mapping of progression chains"
