// Workout Videos Catalog

export const workoutVideos = [
  // CHEST
  {
    id: "chest-bench-press-1",
    title: "How To Bench Press For Growth (Form Masterclass)",
    youtubeId: "vcBig73ojpE", // Jeff Nippard Bench Press
    duration: "12:45",
    category: "chest",
    muscleGroup: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tags: ["bench press", "chest", "barbell", "hypertrophy", "strength"],
    content: {
      introduction: "The barbell bench press is the king of chest exercises. This video breaks down the optimal setup, bar path, and leg drive.",
      correctForm: "1. Retract scapula\\n2. Plant feet firmly\\n3. Grip slightly wider than shoulder width\\n4. Lower bar to mid-chest\\n5. Press up and slightly back.",
      commonMistakes: "- Flaring elbows too much\\n- Bouncing the bar off the chest\\n- Lifting the glutes off the bench",
      beginnerTips: "Start with an empty bar to nail the form. Focus on feeling the chest stretch at the bottom.",
      advancedTips: "Incorporate pauses at the bottom to eliminate the stretch reflex and build raw starting strength."
    }
  },
  {
    id: "chest-incline-bench-1",
    title: "How to Incline Bench Press for Upper Chest",
    youtubeId: "SrqOu55lrYU", // Jeremy Ethier Incline Bench
    duration: "08:20",
    category: "chest",
    muscleGroup: "Upper Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tags: ["incline bench", "upper chest", "barbell"],
    content: {
      introduction: "The incline bench press shifts the focus to the clavicular head of the pectoralis major.",
      correctForm: "Set the bench angle to 15-30 degrees. Keep elbows tucked at roughly 45 degrees.",
      commonMistakes: "Setting the bench too steep (targets front delts).",
      beginnerTips: "Keep the weight light and focus on the mind-muscle connection in the upper chest.",
      advancedTips: ""
    }
  },
  {
    id: "chest-pushups-1",
    title: "The PERFECT Push Up (Do It Right!)",
    youtubeId: "IODxDxX7oi4", // Athlean X Pushup
    duration: "10:15",
    category: "chest",
    muscleGroup: "Chest",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    tags: ["push up", "bodyweight", "chest", "home workout"],
    content: {
      introduction: "The definitive guide to performing the perfect push-up for maximum chest activation.",
      correctForm: "Body in a straight line, hands under shoulders, screw hands into the floor, lower until chest is slightly above the floor.",
      commonMistakes: "Sagging hips, flared elbows (T-shape), half-reps.",
      beginnerTips: "Start on an incline (hands on a bench or wall) rather than on your knees.",
      advancedTips: "Try decline pushups or add resistance bands."
    }
  },
  {
    id: "chest-cable-fly-1",
    title: "How To PROPERLY Do Cable Flyes",
    youtubeId: "Iwe6AmxVf7o", // Scott Herman
    duration: "05:30",
    category: "chest",
    muscleGroup: "Chest",
    equipment: "Cables",
    difficulty: "Intermediate",
    tags: ["cable fly", "isolation", "chest"],
    content: {
      introduction: "Cable flyes are excellent for providing continuous tension on the pecs throughout the full range of motion.",
      correctForm: "Keep a slight bend in the elbows. Hug a barrel. Squeeze pecs at the top.",
      commonMistakes: "Turning it into a press by bending the elbows too much.",
      beginnerTips: "Focus on the squeeze at the peak contraction.",
      advancedTips: ""
    }
  },

  // BACK
  {
    id: "back-pullup-1",
    title: "How To Pull Up (The Ultimate Guide!)",
    youtubeId: "eGo4IYlbE5g", // Athlean-X Pullup
    duration: "11:20",
    category: "back",
    muscleGroup: "Lats",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    tags: ["pull up", "back", "lats", "bodyweight"],
    content: {
      introduction: "Master the pull-up to build a wide, strong back.",
      correctForm: "Dead hang, depress scapula, pull chest to bar, control the eccentric.",
      commonMistakes: "Kipping, half reps, not engaging lats.",
      beginnerTips: "Use resistance bands or do inverted rows to build strength first.",
      advancedTips: "Try weighted pull-ups or L-sit pull-ups for more core activation."
    }
  },
  {
    id: "back-lat-pulldown-1",
    title: "How To Lat Pulldown FOR WINGS",
    youtubeId: "CAwf7n6Luuc", // JPG Coaching
    duration: "07:45",
    category: "back",
    muscleGroup: "Lats",
    equipment: "Cables",
    difficulty: "Beginner",
    tags: ["lat pulldown", "back", "lats", "machine"],
    content: {
      introduction: "The best machine alternative to pull-ups for building wide lats.",
      correctForm: "Slight lean back, drive elbows down to hips, control the stretch.",
      commonMistakes: "Using too much momentum, pulling behind the neck.",
      beginnerTips: "Keep your chest puffed out to maximize lat engagement.",
      advancedTips: ""
    }
  },
  {
    id: "back-barbell-row-1",
    title: "How To Barbell Row FOR A THICK BACK",
    youtubeId: "9efgcAjQe7E", // Jeff Nippard Row
    duration: "13:10",
    category: "back",
    muscleGroup: "Back",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tags: ["barbell row", "back", "thickness", "compound"],
    content: {
      introduction: "The barbell row is essential for back thickness and overall pulling strength.",
      correctForm: "Hinge at hips, back parallel to floor, pull bar to belly button.",
      commonMistakes: "Standing too upright, rounding the lower back.",
      beginnerTips: "Master the hip hinge with a broomstick first.",
      advancedTips: "Pendlay rows (resting weight on the floor each rep) build explosive strength."
    }
  },
  {
    id: "back-deadlift-1",
    title: "How To Deadlift: The Ultimate Guide",
    youtubeId: "ytGaGIn3SjE", // Alan Thrall Deadlift
    duration: "14:25",
    category: "back",
    muscleGroup: "Full Back / Posterior Chain",
    equipment: "Barbell",
    difficulty: "Advanced",
    tags: ["deadlift", "back", "legs", "compound", "powerlifting"],
    content: {
      introduction: "The ultimate posterior chain builder. Master the 5-step setup.",
      correctForm: "1. Stance 2. Grip 3. Shins to bar 4. Chest up 5. Pull",
      commonMistakes: "Hips shooting up early, rounding lower back, bar drifting forward.",
      beginnerTips: "Start with Romanian Deadlifts to learn the hinge pattern.",
      advancedTips: "Learn to pull the slack out of the bar before initiating the lift."
    }
  },

  // LEGS
  {
    id: "legs-squat-1",
    title: "How To Squat For Maximum Growth",
    youtubeId: "bEv6CCg2BC8", // Jeff Nippard Squat
    duration: "15:30",
    category: "legs",
    muscleGroup: "Quads & Glutes",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tags: ["squat", "legs", "quads", "barbell"],
    content: {
      introduction: "The barbell back squat is the foundation of leg training.",
      correctForm: "Bar on traps/rear delts, brace core, break at hips and knees simultaneously, hit depth.",
      commonMistakes: "Knees caving in (valgus collapse), heel lifting, good-morning the weight.",
      beginnerTips: "Practice goblet squats to engrain an upright torso.",
      advancedTips: "Use lifting shoes with an elevated heel if ankle mobility is poor."
    }
  },
  {
    id: "legs-rdl-1",
    title: "How to Romanian Deadlift (RDL)",
    youtubeId: "_OYxOAEslJg", // Jeremy Ethier RDL
    duration: "09:15",
    category: "legs",
    muscleGroup: "Hamstrings & Glutes",
    equipment: "Barbell/Dumbbell",
    difficulty: "Intermediate",
    tags: ["rdl", "hamstrings", "glutes", "posterior chain"],
    content: {
      introduction: "The RDL heavily targets the hamstrings and glutes through a deep stretch.",
      correctForm: "Push hips back like closing a car door with your butt. Keep shins vertical.",
      commonMistakes: "Bending knees too much (turns into a squat), rounding back.",
      beginnerTips: "Stop descending when your hips stop moving backwards.",
      advancedTips: ""
    }
  },
  {
    id: "legs-bulgarian-1",
    title: "The Perfect Bulgarian Split Squat",
    youtubeId: "2C-uNgKwPLE", // Renaissance Periodization
    duration: "11:45",
    category: "legs",
    muscleGroup: "Quads & Glutes",
    equipment: "Dumbbells",
    difficulty: "Advanced",
    tags: ["bulgarian split squat", "legs", "unilateral"],
    content: {
      introduction: "A brutal but effective unilateral leg builder.",
      correctForm: "Elevate rear foot on bench. Drop hips straight down. Keep front foot planted.",
      commonMistakes: "Setting foot too far forward or back, losing balance.",
      beginnerTips: "Hold onto a rack or wall for balance while learning.",
      advancedTips: "Lean forward to target glutes, stay upright to target quads."
    }
  },

  // SHOULDERS
  {
    id: "shoulders-ohp-1",
    title: "How To Overhead Press",
    youtubeId: "2yjwXTZQDDI", // Jeff Nippard OHP
    duration: "12:10",
    category: "shoulders",
    muscleGroup: "Shoulders",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tags: ["ohp", "overhead press", "shoulders", "compound"],
    content: {
      introduction: "The primary compound lift for shoulder size and strength.",
      correctForm: "Squeeze glutes, brace core, press bar in a straight line overhead.",
      commonMistakes: "Excessive lower back arch, pressing bar out in front.",
      beginnerTips: "Tuck chin slightly to let bar pass, then push head through 'the window'.",
      advancedTips: ""
    }
  },
  {
    id: "shoulders-lateral-raise-1",
    title: "How To Lateral Raise For Wider Shoulders",
    youtubeId: "WJm9J-iankc", // Renaissance Periodization
    duration: "06:45",
    category: "shoulders",
    muscleGroup: "Side Delts",
    equipment: "Dumbbells",
    difficulty: "Beginner",
    tags: ["lateral raise", "side delts", "isolation"],
    content: {
      introduction: "Essential for building shoulder width and the 'V-taper'.",
      correctForm: "Slight lean forward, raise dumbbells in the scapular plane (slightly in front of you).",
      commonMistakes: "Using momentum, lifting too high, shrugging the traps.",
      beginnerTips: "Think about pushing the dumbbells OUT, not UP.",
      advancedTips: "Use cables for constant tension."
    }
  },

  // ARMS (BICEPS/TRICEPS)
  {
    id: "biceps-barbell-curl-1",
    title: "How To Barbell Curl",
    youtubeId: "kwG2ipFRgfo", // Scott Herman
    duration: "05:20",
    category: "biceps",
    muscleGroup: "Biceps",
    equipment: "Barbell",
    difficulty: "Beginner",
    tags: ["biceps", "curl", "barbell"],
    content: {
      introduction: "The classic mass builder for biceps.",
      correctForm: "Keep elbows pinned to sides, curl weight up, control the eccentric.",
      commonMistakes: "Swinging the weight, using lower back momentum.",
      beginnerTips: "Stand against a wall to prevent cheating.",
      advancedTips: ""
    }
  },
  {
    id: "triceps-pushdown-1",
    title: "How To Triceps Pushdown",
    youtubeId: "2-LAMcpzODU", // Athlean-X
    duration: "08:15",
    category: "triceps",
    muscleGroup: "Triceps",
    equipment: "Cables",
    difficulty: "Beginner",
    tags: ["triceps", "pushdown", "cable"],
    content: {
      introduction: "Isolates the triceps for maximum horseshoe development.",
      correctForm: "Keep elbows fixed at your sides, push down until arms are locked out.",
      commonMistakes: "Letting elbows drift up, using lats to push the weight down.",
      beginnerTips: "Use a rope attachment to pull apart at the bottom for a better contraction.",
      advancedTips: ""
    }
  },

  // CORE
  {
    id: "core-plank-1",
    title: "How To Plank Correctly",
    youtubeId: "pSHjTRCQxIw", // Jeremy Ethier Plank
    duration: "04:50",
    category: "core",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    tags: ["plank", "core", "abs", "bodyweight"],
    content: {
      introduction: "The foundation of core stability.",
      correctForm: "Forearms on ground, body in a straight line, squeeze glutes and brace core.",
      commonMistakes: "Sagging hips, piking hips up in the air.",
      beginnerTips: "Posteriorly tilt the pelvis (tuck your tailbone) for intense ab activation.",
      advancedTips: "Try RKC planks: actively drag elbows toward toes."
    }
  }
];
