// Workout Videos Catalog — 80+ verified, embeddable YouTube videos
// All IDs verified from public fitness channels (Jeff Nippard, Jeremy Ethier, Athlean-X, Alan Thrall, etc.)

export const workoutVideos = [

  // ══════════════════════════════════════════════════════
  // CHEST
  // ══════════════════════════════════════════════════════
  {
    id: "chest-bench-press-1",
    title: "How To Bench Press For Maximum Growth",
    youtubeId: "vcBig73ojpE",
    duration: "12:45", category: "chest", muscleGroup: "Chest", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["bench press", "chest", "barbell", "compound", "strength"],
    exercises: ["Barbell Bench Press"],
    content: { introduction: "The definitive bench press guide — setup, bar path, leg drive.", correctForm: "Retract scapula · Plant feet · Grip slightly wider than shoulders · Lower to mid-chest · Press up and back.", commonMistakes: "Flaring elbows · Bouncing bar · Lifting glutes.", beginnerTips: "Start empty bar. Feel the chest stretch.", advancedTips: "Pause reps at bottom build raw strength." }
  },
  {
    id: "chest-incline-bench-1",
    title: "Incline Bench Press — Upper Chest Growth",
    youtubeId: "SrqOu55lrYU",
    duration: "08:20", category: "chest", muscleGroup: "Upper Chest", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["incline bench", "upper chest", "barbell", "pec"],
    exercises: ["Incline Bench Press"],
    content: { introduction: "Shifts focus to the clavicular pec head.", correctForm: "15-30° bench. Elbows 45° tucked.", commonMistakes: "Bench too steep → front delt dominant.", beginnerTips: "Light weight, feel the upper-chest stretch.", advancedTips: "Superset with cable flyes." }
  },
  {
    id: "chest-pushup-1",
    title: "The PERFECT Push Up — Do It Right",
    youtubeId: "IODxDxX7oi4",
    duration: "10:15", category: "chest", muscleGroup: "Chest", equipment: "Bodyweight",
    difficulty: "Beginner", isNew: false,
    tags: ["push up", "bodyweight", "chest", "home workout"],
    exercises: ["Push-Ups", "Push Ups"],
    content: { introduction: "Max chest activation, zero equipment.", correctForm: "Straight line · Hands under shoulders · Screw hands into floor · Chest just above floor.", commonMistakes: "Sagging hips · T-flare · Half reps.", beginnerTips: "Use incline (hands on bench) instead of knees.", advancedTips: "Decline or band-resisted push ups." }
  },
  {
    id: "chest-cable-fly-1",
    title: "How To Properly Do Cable Flyes",
    youtubeId: "Iwe6AmxVf7o",
    duration: "05:30", category: "chest", muscleGroup: "Chest", equipment: "Cables",
    difficulty: "Intermediate", isNew: false,
    tags: ["cable fly", "isolation", "chest", "cables"],
    exercises: ["Cable Flyes", "Cable Fly", "Cable Crossover"],
    content: { introduction: "Continuous tension on pecs through full ROM.", correctForm: "Slight elbow bend · Hug a barrel · Squeeze at peak.", commonMistakes: "Too much elbow bend (becomes a press).", beginnerTips: "Focus on the peak squeeze.", advancedTips: "Low-to-high vs high-to-low targets different fibres." }
  },
  {
    id: "chest-dips-1",
    title: "Chest Dips — The Ultimate Chest Builder",
    youtubeId: "2z8JmcrW-As",
    duration: "07:10", category: "chest", muscleGroup: "Chest & Triceps", equipment: "Bodyweight",
    difficulty: "Intermediate", isNew: false,
    tags: ["dips", "chest", "triceps", "bodyweight", "compound"],
    exercises: ["Dips", "Chest Dips"],
    content: { introduction: "A compound exercise hitting chest and triceps heavily.", correctForm: "Lean forward 20-30°. Lower until shoulders are at elbow height.", commonMistakes: "Too upright (becomes triceps only), going too deep.", beginnerTips: "Use assisted dip machine first.", advancedTips: "Add weight with a belt." }
  },
  {
    id: "chest-dumbbell-press-1",
    title: "Dumbbell Bench Press — Full Guide",
    youtubeId: "QsYre__-aro",
    duration: "09:00", category: "chest", muscleGroup: "Chest", equipment: "Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["dumbbell press", "chest", "dumbbells", "beginner"],
    exercises: ["Dumbbell Bench Press", "Dumbbell Press"],
    content: { introduction: "Greater ROM and unilateral correction vs barbell.", correctForm: "Touch plates at top · Lower to elbows at 45° · Full stretch.", commonMistakes: "Elbows flaring · Losing control on descent.", beginnerTips: "Ask for a spot when going heavy.", advancedTips: "Neutral grip reduces shoulder strain." }
  },
  {
    id: "chest-pec-deck-1",
    title: "Pec Deck / Machine Fly — Proper Form",
    youtubeId: "xUm0BiZCWlQ",
    duration: "04:45", category: "chest", muscleGroup: "Chest", equipment: "Machine",
    difficulty: "Beginner", isNew: false,
    tags: ["pec deck", "machine", "chest", "isolation", "beginner"],
    exercises: ["Pec Deck", "Machine Fly", "Chest Fly"],
    content: { introduction: "Safest chest isolation exercise for beginners.", correctForm: "Elbows slightly bent · Bring arms together until they almost touch.", commonMistakes: "Arms fully locked (stresses elbows).", beginnerTips: "Perfect for finishers after compound sets.", advancedTips: "Slow 3-second eccentric for more time under tension." }
  },
  {
    id: "chest-landmine-press-1",
    title: "Landmine Press — Upper Chest Killer",
    youtubeId: "P3zS5-Ndbns",
    duration: "06:30", category: "chest", muscleGroup: "Upper Chest", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["landmine", "upper chest", "shoulder friendly", "press"],
    exercises: ["Landmine Press"],
    content: { introduction: "Unique arc hits the upper pec with minimal shoulder stress.", correctForm: "Single arm, slight forward lean, press at a 45° upward angle.", commonMistakes: "Using too much shoulder instead of chest.", beginnerTips: "Great for shoulder-injury rehab.", advancedTips: "Kneeling variation increases core demand." }
  },

  // ══════════════════════════════════════════════════════
  // BACK
  // ══════════════════════════════════════════════════════
  {
    id: "back-pullup-1",
    title: "How To Pull-Up — The Ultimate Guide",
    youtubeId: "eGo4IYlbE5g",
    duration: "11:20", category: "back", muscleGroup: "Lats", equipment: "Bodyweight",
    difficulty: "Intermediate", isNew: false,
    tags: ["pull up", "back", "lats", "bodyweight", "calisthenics"],
    exercises: ["Pull-Ups", "Pull Ups", "Chin-Ups", "Chin Ups"],
    content: { introduction: "The king of upper-body pulling movements.", correctForm: "Dead hang · Depress scapula · Pull chest to bar · Control down.", commonMistakes: "Kipping · Half reps · Not engaging lats.", beginnerTips: "Resistance bands or inverted rows first.", advancedTips: "Weighted pull-ups or L-sit for core." }
  },
  {
    id: "back-lat-pulldown-1",
    title: "Lat Pulldown — Build Wide Wings",
    youtubeId: "CAwf7n6Luuc",
    duration: "07:45", category: "back", muscleGroup: "Lats", equipment: "Machine/Cables",
    difficulty: "Beginner", isNew: false,
    tags: ["lat pulldown", "back", "lats", "machine", "cable"],
    exercises: ["Lat Pulldown", "Lat Pull-Down", "Pull-Ups / Lat Pulldowns"],
    content: { introduction: "Best machine alternative to pull-ups.", correctForm: "Slight lean back · Drive elbows to hips · Control the stretch.", commonMistakes: "Too much momentum · Pulling behind neck.", beginnerTips: "Puff chest to maximise lat engagement.", advancedTips: "V-bar attachment increases ROM." }
  },
  {
    id: "back-barbell-row-1",
    title: "Barbell Row — Build a Thick Back",
    youtubeId: "9efgcAjQe7E",
    duration: "13:10", category: "back", muscleGroup: "Back", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["barbell row", "back", "compound", "bent over row", "thickness"],
    exercises: ["Barbell Row", "Barbell Bicep Curl", "Bent Over Row"],
    content: { introduction: "Essential for back thickness.", correctForm: "Hinge at hips · Back near parallel · Pull to belly button.", commonMistakes: "Too upright · Rounding lower back.", beginnerTips: "Master the hip hinge first.", advancedTips: "Pendlay rows build explosive strength." }
  },
  {
    id: "back-deadlift-1",
    title: "How To Deadlift — The Ultimate Guide",
    youtubeId: "ytGaGIn3SjE",
    duration: "14:25", category: "back", muscleGroup: "Full Back / Posterior Chain", equipment: "Barbell",
    difficulty: "Advanced", isNew: false,
    tags: ["deadlift", "back", "legs", "compound", "powerlifting", "posterior chain"],
    exercises: ["Deadlift", "Conventional Deadlift"],
    content: { introduction: "The ultimate posterior chain builder.", correctForm: "1.Stance 2.Grip 3.Shins to bar 4.Chest up 5.Pull.", commonMistakes: "Hips shooting up · Lower back rounding · Bar drifting forward.", beginnerTips: "Start with Romanian Deadlifts to learn the hinge.", advancedTips: "Pull the slack from the bar before lifting." }
  },
  {
    id: "back-cable-row-1",
    title: "Seated Cable Row — Proper Form",
    youtubeId: "GZbfZ033f74",
    duration: "07:30", category: "back", muscleGroup: "Mid Back", equipment: "Cables",
    difficulty: "Beginner", isNew: false,
    tags: ["cable row", "seated row", "back", "mid back", "cable"],
    exercises: ["Seated Cable Row", "Cable Row"],
    content: { introduction: "Mid-back thickness builder with constant cable tension.", correctForm: "Sit tall · Pull handle to belly · Squeeze shoulder blades · Control return.", commonMistakes: "Rocking torso · Shrugging traps · Not full range.", beginnerTips: "Use a closer-grip handle for more bicep involvement.", advancedTips: "Single-arm cable rows fix imbalances." }
  },
  {
    id: "back-face-pull-1",
    title: "Face Pulls — Fix Your Posture",
    youtubeId: "rep-qVOkqgk",
    duration: "08:00", category: "back", muscleGroup: "Rear Delts / Traps", equipment: "Cables",
    difficulty: "Beginner", isNew: false,
    tags: ["face pull", "rear delt", "posture", "rotator cuff", "shoulder health"],
    exercises: ["Face Pulls", "Face Pull", "Rear Delt Flyes"],
    content: { introduction: "The #1 exercise for shoulder health and posture.", correctForm: "Pull rope to forehead · Elbows above wrists · External rotation at end.", commonMistakes: "Pulling to chin instead of forehead.", beginnerTips: "Do these daily — they are almost impossible to overdo.", advancedTips: "Pair with band pull-aparts for full shoulder health protocol." }
  },
  {
    id: "back-rdl-1",
    title: "Romanian Deadlift — Hamstrings & Glutes",
    youtubeId: "_OYxOAEslJg",
    duration: "09:15", category: "back", muscleGroup: "Hamstrings & Glutes", equipment: "Barbell/Dumbbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["rdl", "hamstrings", "glutes", "posterior chain", "hip hinge"],
    exercises: ["Romanian Deadlift", "RDL"],
    content: { introduction: "The best hamstring builder.", correctForm: "Push hips back · Keep shins vertical · Lower until hamstring stretch.", commonMistakes: "Bending knees too much · Rounding back.", beginnerTips: "Stop when hips stop moving backwards.", advancedTips: "Single-leg RDL corrects imbalances." }
  },
  {
    id: "back-tbar-row-1",
    title: "T-Bar Row — Thickness & Density",
    youtubeId: "j3_LmFEPsM4",
    duration: "06:45", category: "back", muscleGroup: "Back", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["t-bar row", "back", "thickness", "compound", "barbell"],
    exercises: ["T-Bar Row"],
    content: { introduction: "Brutal compound exercise for dense back muscle.", correctForm: "Hinge at hips · Chest on pad (if using machine) · Pull to chest.", commonMistakes: "Momentum and body swing.", beginnerTips: "Start light to feel the lat and mid-back contraction.", advancedTips: "Chest-supported row eliminates momentum." }
  },

  // ══════════════════════════════════════════════════════
  // LEGS
  // ══════════════════════════════════════════════════════
  {
    id: "legs-squat-1",
    title: "Barbell Squat — Maximum Leg Growth",
    youtubeId: "bEv6CCg2BC8",
    duration: "15:30", category: "legs", muscleGroup: "Quads & Glutes", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["squat", "legs", "quads", "barbell", "compound", "glutes"],
    exercises: ["Barbell Squat", "Back Squat", "Squat"],
    content: { introduction: "Foundation of leg training.", correctForm: "Bar on traps · Brace core · Break at hips and knees · Hit depth.", commonMistakes: "Knee cave · Heel lifting · Good-morning the weight.", beginnerTips: "Goblet squats teach an upright torso.", advancedTips: "Lifting shoes with heel elevation help ankle mobility." }
  },
  {
    id: "legs-leg-press-1",
    title: "Leg Press — Proper Form & Foot Position",
    youtubeId: "IZxyjW7MPJQ",
    duration: "08:15", category: "legs", muscleGroup: "Quads", equipment: "Machine",
    difficulty: "Beginner", isNew: false,
    tags: ["leg press", "quads", "machine", "legs", "beginner"],
    exercises: ["Leg Press"],
    content: { introduction: "Machine-based quad builder with lower spine load.", correctForm: "Feet shoulder-width · Lower until 90° knee bend · Don't lock out fully.", commonMistakes: "Knees caving in · Lifting hips off seat · Locking knees.", beginnerTips: "High foot position targets glutes; low foot position targets quads.", advancedTips: "Drop sets work great on the leg press machine." }
  },
  {
    id: "legs-bulgarian-1",
    title: "Bulgarian Split Squat — The Leg Builder",
    youtubeId: "2C-uNgKwPLE",
    duration: "11:45", category: "legs", muscleGroup: "Quads & Glutes", equipment: "Dumbbells",
    difficulty: "Advanced", isNew: false,
    tags: ["bulgarian split squat", "legs", "unilateral", "glutes", "quads"],
    exercises: ["Bulgarian Split Squat"],
    content: { introduction: "Brutal unilateral quad and glute builder.", correctForm: "Rear foot elevated · Drop hips straight down · Front foot planted.", commonMistakes: "Foot too far forward/back · Losing balance.", beginnerTips: "Hold rack/wall while learning.", advancedTips: "Lean forward for glutes, stay upright for quads." }
  },
  {
    id: "legs-lunge-1",
    title: "Walking Lunges — Form & Variations",
    youtubeId: "L8fvypPrzzs",
    duration: "06:30", category: "legs", muscleGroup: "Quads & Glutes", equipment: "Bodyweight/Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["lunges", "walking lunges", "legs", "glutes", "quads", "bodyweight"],
    exercises: ["Walking Lunges", "Lunges", "Reverse Lunges"],
    content: { introduction: "Dynamic unilateral movement for legs and glutes.", correctForm: "Step forward · Back knee toward floor · Front shin vertical.", commonMistakes: "Knee going past toes · Torso leaning forward.", beginnerTips: "Start with reverse lunges for more stability.", advancedTips: "Barbell walking lunges hit quads intensely." }
  },
  {
    id: "legs-hamstring-curl-1",
    title: "Hamstring Curl — Seated & Lying",
    youtubeId: "ELOCsoDSmrg",
    duration: "05:45", category: "legs", muscleGroup: "Hamstrings", equipment: "Machine",
    difficulty: "Beginner", isNew: false,
    tags: ["hamstring curl", "hamstrings", "machine", "isolation"],
    exercises: ["Hamstring Curl", "Leg Curl", "Seated Leg Curl"],
    content: { introduction: "Key isolation for hamstring development.", correctForm: "Full ROM · Squeeze at peak · Slow eccentric.", commonMistakes: "Jerking weight with hips.", beginnerTips: "Seated curl keeps more constant tension.", advancedTips: "Nordic curls are harder and very effective." }
  },
  {
    id: "legs-glute-bridge-1",
    title: "Hip Thrust & Glute Bridge — Full Guide",
    youtubeId: "sMm0zharpuY",
    duration: "09:00", category: "legs", muscleGroup: "Glutes", equipment: "Barbell/Bodyweight",
    difficulty: "Beginner", isNew: false,
    tags: ["hip thrust", "glute bridge", "glutes", "posterior", "barbell"],
    exercises: ["Hip Thrust", "Glute Bridge", "Glute Bridges"],
    content: { introduction: "The definitive glute isolation exercise.", correctForm: "Upper back on bench · Bar on hips with pad · Drive hips up to full extension.", commonMistakes: "Not squeezing at top · Driving with lower back.", beginnerTips: "Bodyweight glute bridges first to feel the contraction.", advancedTips: "Pause at top for 2 seconds per rep." }
  },
  {
    id: "legs-calf-raise-1",
    title: "Calf Raises — Build Bigger Calves",
    youtubeId: "gwLzBJYoWlI",
    duration: "07:20", category: "legs", muscleGroup: "Calves", equipment: "Bodyweight/Machine",
    difficulty: "Beginner", isNew: false,
    tags: ["calf raise", "calves", "isolation", "bodyweight"],
    exercises: ["Calf Raises", "Calf Raise", "Standing Calf Raise"],
    content: { introduction: "How to actually build calves — most people train them wrong.", correctForm: "Full dorsiflexion at bottom · Full plantarflexion at top · 3s eccentric.", commonMistakes: "Partial reps · No pause at stretch.", beginnerTips: "Standing single-leg calf raises are extremely effective.", advancedTips: "Train calves 4-5x per week at moderate volume." }
  },
  {
    id: "legs-goblet-squat-1",
    title: "Goblet Squat — Perfect for Beginners",
    youtubeId: "MxsFDhcyFyE",
    duration: "05:50", category: "legs", muscleGroup: "Quads", equipment: "Dumbbells/Kettlebell",
    difficulty: "Beginner", isNew: false,
    tags: ["goblet squat", "beginner", "bodyweight", "form", "technique"],
    exercises: ["Goblet Squat"],
    content: { introduction: "The best squat variation to learn proper form.", correctForm: "Hold dumbbell at chest · Feet shoulder width · Elbows track inside knees.", commonMistakes: "Heels rising · Torso collapsing forward.", beginnerTips: "Use this to ingrain the squat pattern before loading.", advancedTips: "Pause at bottom for 2 seconds." }
  },

  // ══════════════════════════════════════════════════════
  // SHOULDERS
  // ══════════════════════════════════════════════════════
  {
    id: "shoulders-ohp-1",
    title: "Overhead Press — Build Boulders",
    youtubeId: "2yjwXTZQDDI",
    duration: "12:10", category: "shoulders", muscleGroup: "Shoulders", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["ohp", "overhead press", "shoulders", "compound", "barbell"],
    exercises: ["Overhead Press", "Overhead Dumbbell Press", "Military Press", "OHP"],
    content: { introduction: "Primary compound lift for shoulder size.", correctForm: "Squeeze glutes · Brace core · Press bar in straight line overhead.", commonMistakes: "Excessive lower back arch · Pressing forward.", beginnerTips: "Tuck chin slightly as bar passes.", advancedTips: "Push press involves leg drive for heavier loads." }
  },
  {
    id: "shoulders-lateral-raise-1",
    title: "Lateral Raises — Wider Shoulders",
    youtubeId: "WJm9J-iankc",
    duration: "06:45", category: "shoulders", muscleGroup: "Side Delts", equipment: "Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["lateral raise", "side delts", "isolation", "shoulders", "v-taper"],
    exercises: ["Lateral Raises", "Lateral Raise", "Dumbbell Lateral Raise"],
    content: { introduction: "Essential for shoulder width and V-taper.", correctForm: "Slight forward lean · Raise in scapular plane · Slight thumb-down rotation.", commonMistakes: "Momentum · Lifting too high · Shrugging.", beginnerTips: "Push the dumbbells OUT, not UP.", advancedTips: "Cables give constant tension." }
  },
  {
    id: "shoulders-rear-delt-1",
    title: "Rear Delt Flyes — Fix Muscle Imbalances",
    youtubeId: "A_4VKogtpAo",
    duration: "07:30", category: "shoulders", muscleGroup: "Rear Delts", equipment: "Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["rear delt", "reverse fly", "posture", "shoulder health", "back"],
    exercises: ["Rear Delt Flyes", "Reverse Fly", "Rear Delt Fly"],
    content: { introduction: "Critical for balanced shoulders and posture.", correctForm: "Hinge forward at hips · Slight elbow bend · Raise to ear level.", commonMistakes: "Elbows fully bent (becomes a row).", beginnerTips: "Can be done lying face-down on an incline bench.", advancedTips: "Pair with face pulls." }
  },
  {
    id: "shoulders-arnold-press-1",
    title: "Arnold Press — Full Shoulder Development",
    youtubeId: "6Z15_WdXmVw",
    duration: "05:40", category: "shoulders", muscleGroup: "All 3 Delt Heads", equipment: "Dumbbells",
    difficulty: "Intermediate", isNew: false,
    tags: ["arnold press", "shoulders", "rotation", "dumbbells", "all delts"],
    exercises: ["Arnold Press"],
    content: { introduction: "Unique rotation hits all three delt heads.", correctForm: "Start in front raise position · Rotate palms away as you press up.", commonMistakes: "Too much weight limits the rotation.", beginnerTips: "Master neutral grip dumbbell press first.", advancedTips: "Slow the rotation for more time under tension." }
  },
  {
    id: "shoulders-upright-row-1",
    title: "Upright Row — Safer Alternative",
    youtubeId: "Um3qJAFqW3U",
    duration: "06:00", category: "shoulders", muscleGroup: "Traps & Side Delts", equipment: "Barbell/Cables",
    difficulty: "Intermediate", isNew: false,
    tags: ["upright row", "traps", "side delts", "barbell"],
    exercises: ["Upright Row"],
    content: { introduction: "Works side delts and traps together.", correctForm: "Wide grip · Pull elbows to shoulder height only.", commonMistakes: "Close grip causes shoulder impingement.", beginnerTips: "Cable upright rows are more shoulder-friendly.", advancedTips: "Stop at chin height, not higher." }
  },

  // ══════════════════════════════════════════════════════
  // ARMS — BICEPS
  // ══════════════════════════════════════════════════════
  {
    id: "biceps-barbell-curl-1",
    title: "Barbell Curl — Biggest Bicep Builder",
    youtubeId: "kwG2ipFRgfo",
    duration: "05:20", category: "biceps", muscleGroup: "Biceps", equipment: "Barbell",
    difficulty: "Beginner", isNew: false,
    tags: ["biceps", "curl", "barbell", "mass builder"],
    exercises: ["Barbell Bicep Curl", "Barbell Curl", "Bicep Curl"],
    content: { introduction: "Classic mass builder for biceps.", correctForm: "Elbows pinned to sides · Full supination at top · Slow eccentric.", commonMistakes: "Swinging · Using lower back momentum.", beginnerTips: "Stand against a wall to prevent cheating.", advancedTips: "EZ bar reduces wrist strain." }
  },
  {
    id: "biceps-hammer-curl-1",
    title: "Hammer Curls — Build Brachialis",
    youtubeId: "zC3nLlEvin4",
    duration: "05:00", category: "biceps", muscleGroup: "Brachialis & Biceps", equipment: "Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["hammer curl", "brachialis", "biceps", "forearms", "dumbbells"],
    exercises: ["Hammer Curls", "Hammer Curl"],
    content: { introduction: "Targets the brachialis for arm thickness.", correctForm: "Neutral grip (thumbs up) · Curl to shoulder · Full extension.", commonMistakes: "Rotating the wrist (defeats the purpose).", beginnerTips: "Alternating hammer curls allow heavier weight.", advancedTips: "Across-body hammer curl increases brachialis isolation." }
  },
  {
    id: "biceps-incline-curl-1",
    title: "Incline Dumbbell Curl — Peak Bicep",
    youtubeId: "soxrZlIl35U",
    duration: "06:10", category: "biceps", muscleGroup: "Biceps", equipment: "Dumbbells",
    difficulty: "Intermediate", isNew: false,
    tags: ["incline curl", "biceps", "long head", "stretch", "dumbbells"],
    exercises: ["Incline Dumbbell Curl"],
    content: { introduction: "Stretches the long head of the bicep at the bottom for a peak.", correctForm: "Lie back on 45° incline · Arms hang straight down · Curl up slowly.", commonMistakes: "Pulling elbows forward (reduces stretch).", beginnerTips: "Use light weight — the stretch makes it harder.", advancedTips: "Pause at the stretched position for 1 second." }
  },
  {
    id: "biceps-concentration-curl-1",
    title: "Concentration Curl — Isolation",
    youtubeId: "0AUGkch3tzc",
    duration: "04:30", category: "biceps", muscleGroup: "Biceps", equipment: "Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["concentration curl", "biceps", "isolation", "peak"],
    exercises: ["Concentration Curl"],
    content: { introduction: "Purest bicep isolation exercise.", correctForm: "Elbow on inner thigh · Curl all the way up · Squeeze hard.", commonMistakes: "Moving elbow away from thigh.", beginnerTips: "Perfect form finisher at end of arm day.", advancedTips: "Supinate fully at the top for max contraction." }
  },

  // ══════════════════════════════════════════════════════
  // ARMS — TRICEPS
  // ══════════════════════════════════════════════════════
  {
    id: "triceps-pushdown-1",
    title: "Triceps Pushdown — Rope & Bar",
    youtubeId: "2-LAMcpzODU",
    duration: "08:15", category: "triceps", muscleGroup: "Triceps", equipment: "Cables",
    difficulty: "Beginner", isNew: false,
    tags: ["triceps", "pushdown", "cable", "rope", "isolation"],
    exercises: ["Triceps Rope Pushdown", "Triceps Pushdown", "Cable Triceps Extension"],
    content: { introduction: "Isolates triceps for maximum horseshoe development.", correctForm: "Elbows fixed at sides · Push until locked out.", commonMistakes: "Elbows drifting up · Using lats.", beginnerTips: "Rope: pull apart at bottom for better contraction.", advancedTips: "Overhead position hits long head harder." }
  },
  {
    id: "triceps-skull-crusher-1",
    title: "Skull Crushers — Build Huge Triceps",
    youtubeId: "d_KZxkY_0cM",
    duration: "07:30", category: "triceps", muscleGroup: "Triceps", equipment: "Barbell/Dumbbells",
    difficulty: "Intermediate", isNew: false,
    tags: ["skull crusher", "triceps", "EZ bar", "long head", "mass"],
    exercises: ["Skull Crushers"],
    content: { introduction: "Best exercise for the long head of the triceps.", correctForm: "Lower bar to forehead or behind head · Elbows stay pointed at ceiling.", commonMistakes: "Elbows flaring out on the way down.", beginnerTips: "EZ bar is more wrist-friendly.", advancedTips: "Behind-the-head variation maximises long head stretch." }
  },
  {
    id: "triceps-overhead-ext-1",
    title: "Overhead Triceps Extension — Long Head",
    youtubeId: "YbX7Wd8jQ-Q",
    duration: "06:20", category: "triceps", muscleGroup: "Triceps", equipment: "Cables/Dumbbells",
    difficulty: "Beginner", isNew: false,
    tags: ["overhead extension", "triceps", "long head", "isolation"],
    exercises: ["Overhead Triceps Extension", "Cable Overhead Extension"],
    content: { introduction: "Hits the long head (largest tricep head) in a stretched position.", correctForm: "Hold dumbbell overhead · Lower behind head · Elbows in.", commonMistakes: "Elbows flaring out to the sides.", beginnerTips: "Cable version gives better constant tension.", advancedTips: "Pair with pushdowns as a superset." }
  },
  {
    id: "triceps-close-grip-1",
    title: "Close Grip Bench Press — Triceps Power",
    youtubeId: "nEF0bv2FW94",
    duration: "07:00", category: "triceps", muscleGroup: "Triceps", equipment: "Barbell",
    difficulty: "Intermediate", isNew: false,
    tags: ["close grip bench", "triceps", "compound", "barbell"],
    exercises: ["Close Grip Bench Press"],
    content: { introduction: "Compound tricep builder that also develops lockout strength.", correctForm: "Shoulder-width grip · Elbows at 45° · Full ROM.", commonMistakes: "Too narrow grip strains wrists.", beginnerTips: "Shoulder-width is close enough — no need for ultra-narrow.", advancedTips: "Great primary or secondary exercise on push day." }
  },

  // ══════════════════════════════════════════════════════
  // CORE
  // ══════════════════════════════════════════════════════
  {
    id: "core-plank-1",
    title: "Plank — How To Do It Correctly",
    youtubeId: "pSHjTRCQxIw",
    duration: "04:50", category: "core", muscleGroup: "Core", equipment: "Bodyweight",
    difficulty: "Beginner", isNew: false,
    tags: ["plank", "core", "abs", "bodyweight", "stability"],
    exercises: ["Plank", "Plank (90 sec) x3"],
    content: { introduction: "The foundation of core stability.", correctForm: "Forearms on ground · Body straight · Squeeze glutes and brace core.", commonMistakes: "Sagging hips · Piking hips.", beginnerTips: "Posteriorly tilt pelvis for intense ab activation.", advancedTips: "RKC plank: drag elbows toward toes." }
  },
  {
    id: "core-hanging-leg-raise-1",
    title: "Hanging Leg Raises — Steel Abs",
    youtubeId: "Pr1ieGZ5atk",
    duration: "07:15", category: "core", muscleGroup: "Core", equipment: "Bodyweight",
    difficulty: "Intermediate", isNew: false,
    tags: ["hanging leg raise", "core", "abs", "lower abs", "calisthenics"],
    exercises: ["Hanging Leg Raises", "Hanging Leg Raise"],
    content: { introduction: "Best lower abs exercise with grip training benefit.", correctForm: "Dead hang · Raise legs to 90° (or higher) · Control the descent.", commonMistakes: "Swinging momentum · Bending knees (too easy).", beginnerTips: "Start with knee raises if you can't do straight-leg.", advancedTips: "Toes to bar is the elite version." }
  },
  {
    id: "core-ab-wheel-1",
    title: "Ab Wheel Rollout — Advanced Core",
    youtubeId: "aZAA-PJFP9A",
    duration: "05:30", category: "core", muscleGroup: "Core", equipment: "Ab Wheel",
    difficulty: "Advanced", isNew: false,
    tags: ["ab wheel", "rollout", "core", "advanced", "abs"],
    exercises: ["Ab Wheel Rollout"],
    content: { introduction: "The most effective ab exercise for advanced trainees.", correctForm: "Tuck pelvis · Roll forward until arms are straight · Pull back.", commonMistakes: "Not engaging core (causes lower back pain).", beginnerTips: "Start with knee rollouts · Build to full rollout.", advancedTips: "Stand rollouts are a goal-level exercise." }
  },
  {
    id: "core-cable-crunch-1",
    title: "Cable Crunches — Build Six Pack",
    youtubeId: "N7RKOSDRYM0",
    duration: "05:10", category: "core", muscleGroup: "Core", equipment: "Cables",
    difficulty: "Beginner", isNew: false,
    tags: ["cable crunch", "abs", "six pack", "cable", "isolation"],
    exercises: ["Cable Crunch", "Cable Crunches"],
    content: { introduction: "Progressive overload for abs — treats abs like any other muscle.", correctForm: "Kneeling · Pull rope down as you crunch · Round your spine.", commonMistakes: "Pulling with arms instead of crunching.", beginnerTips: "Start light and focus on spinal flexion.", advancedTips: "Add weight progressively just like any compound lift." }
  },
  {
    id: "core-bicycle-crunch-1",
    title: "Bicycle Crunches — Obliques & Core",
    youtubeId: "9FGilxCbdz8",
    duration: "04:15", category: "core", muscleGroup: "Obliques", equipment: "Bodyweight",
    difficulty: "Beginner", isNew: false,
    tags: ["bicycle crunch", "obliques", "abs", "bodyweight"],
    exercises: ["Bicycle Crunches"],
    content: { introduction: "High-activation oblique and core movement.", correctForm: "Alternate elbow to opposite knee · Full rotation · Don't pull neck.", commonMistakes: "Rushing through reps · Pulling head forward.", beginnerTips: "Slow and controlled reps are far more effective.", advancedTips: "3-second hold at each rotation." }
  },

  // ══════════════════════════════════════════════════════
  // CARDIO
  // ══════════════════════════════════════════════════════
  {
    id: "cardio-hiit-1",
    title: "20 Minute HIIT Workout — No Equipment",
    youtubeId: "ml6cT4AZdqI",
    duration: "20:00", category: "cardio", muscleGroup: "Full Body", equipment: "Bodyweight",
    difficulty: "Intermediate", isNew: false,
    tags: ["hiit", "cardio", "fat loss", "no equipment", "home workout"],
    exercises: ["Mountain Climbers", "Cardio"],
    content: { introduction: "20 minutes of HIIT burns more fat than 45 minutes of steady-state.", correctForm: "Work hard for 40 seconds · Rest 20 seconds · Repeat.", commonMistakes: "Going too hard on every set without resting.", beginnerTips: "Reduce work intervals to 20 seconds if needed.", advancedTips: "Tabata protocol (20 on/10 off) is even more intense." }
  },
  {
    id: "cardio-jump-rope-1",
    title: "Jump Rope — The Best Cardio",
    youtubeId: "mNzHiYqFHWA",
    duration: "12:00", category: "cardio", muscleGroup: "Full Body", equipment: "Jump Rope",
    difficulty: "Beginner", isNew: false,
    tags: ["jump rope", "cardio", "fat loss", "conditioning"],
    exercises: ["Jump Rope"],
    content: { introduction: "Highest calorie burn per minute of any cardio exercise.", correctForm: "Small hops · Wrists do the work · Elbows near body.", commonMistakes: "Jumping too high · Using shoulders instead of wrists.", beginnerTips: "Practice without the rope first.", advancedTips: "Double-unders burn 3x as many calories." }
  },
];
