/**
 * Runli Recommendation Engine
 * ─────────────────────────────────────────────
 * Architecture: Rule-based scoring layer with ML-ready interfaces.
 *
 * ML-ready contract:
 *   Each recommendation has:
 *   { id, type, title, subtitle, tag, score, reasons[], source:'rule'|'ml', meta }
 *
 *   To plug in an ML model later, replace `scoreWorkouts/scoreMeals/scoreVideos`
 *   with async functions that call your model API and return the same shape.
 */

import { getUserCluster } from './userClusterEngine.js';

/* ═══════════════════════════════════════════════════════
   WORKOUT LIBRARY
   Each entry: { id, title, focus, duration, intensity,
     tags[], exercises[], suitableGoals[], muscleGroups[] }
═══════════════════════════════════════════════════════ */
const WORKOUT_LIBRARY = [
  {
    id: 'w1', title: 'Strength Builder', focus: 'Chest + Triceps', emoji: '💪',
    duration: 60, intensity: 'high',
    tags: ['compound', 'push', 'upper'],
    suitableGoals: ['gain', 'bulk', 'muscle', 'strength'],
    muscleGroups: ['chest', 'triceps'],
    exercises: ['Bench Press 4×8', 'Incline DB Press 4×10', 'Tricep Dips 3×12', 'Cable Flyes 3×15'],
  },
  {
    id: 'w2', title: 'Back & Biceps', focus: 'Back + Biceps', emoji: '🦾',
    duration: 55, intensity: 'high',
    tags: ['compound', 'pull', 'upper'],
    suitableGoals: ['gain', 'bulk', 'muscle', 'toning'],
    muscleGroups: ['back', 'biceps'],
    exercises: ['Pull-Ups 4×8', 'Barbell Row 4×10', 'Barbell Curl 3×12', 'Face Pulls 3×15'],
  },
  {
    id: 'w3', title: 'Leg Day', focus: 'Legs + Glutes', emoji: '🦵',
    duration: 65, intensity: 'high',
    tags: ['compound', 'lower', 'big lifts'],
    suitableGoals: ['gain', 'bulk', 'muscle', 'toning'],
    muscleGroups: ['quads', 'hamstrings', 'glutes'],
    exercises: ['Barbell Squat 4×8', 'Leg Press 3×12', 'Romanian Deadlift 3×10', 'Leg Curl 3×12'],
  },
  {
    id: 'w4', title: 'Fat Burn HIIT', focus: 'Full Body Cardio', emoji: '🔥',
    duration: 30, intensity: 'very_high',
    tags: ['hiit', 'cardio', 'fat_loss', 'full_body'],
    suitableGoals: ['lose', 'cut', 'shred', 'fat', 'toning'],
    muscleGroups: ['full_body'],
    exercises: ['Burpees 40s×4', 'Jump Squats 30s×4', 'Mountain Climbers 40s×4', 'Sprint 200m×4'],
  },
  {
    id: 'w5', title: 'Active Recovery', focus: 'Mobility + Stretch', emoji: '🧘',
    duration: 30, intensity: 'low',
    tags: ['recovery', 'mobility', 'yoga', 'rest_day'],
    suitableGoals: ['all'],
    muscleGroups: ['full_body'],
    exercises: ['Yoga Flow 20min', 'Foam Rolling 10min', 'Hip Flexor Stretch 5min', 'Child\'s Pose 3min'],
  },
  {
    id: 'w6', title: 'Shoulder + Abs', focus: 'Shoulders + Core', emoji: '⚡',
    duration: 50, intensity: 'medium',
    tags: ['isolation', 'upper', 'core'],
    suitableGoals: ['toning', 'gain', 'muscle'],
    muscleGroups: ['shoulders', 'abs'],
    exercises: ['OHP 4×10', 'Lateral Raises 3×15', 'Arnold Press 3×12', 'Cable Crunches 4×15'],
  },
  {
    id: 'w7', title: 'Morning Energizer', focus: 'Bodyweight Circuit', emoji: '☀️',
    duration: 20, intensity: 'medium',
    tags: ['bodyweight', 'circuit', 'morning', 'no_equipment'],
    suitableGoals: ['all'],
    muscleGroups: ['full_body'],
    exercises: ['Push-Ups 3×20', 'Air Squats 3×25', 'Plank 60s×3', 'Jumping Jacks 1min×3'],
  },
  {
    id: 'w8', title: 'Deadlift Focus', focus: 'Posterior Chain', emoji: '🏋',
    duration: 60, intensity: 'high',
    tags: ['compound', 'big_lifts', 'lower', 'strength'],
    suitableGoals: ['gain', 'bulk', 'muscle', 'strength'],
    muscleGroups: ['back', 'hamstrings', 'glutes'],
    exercises: ['Conventional Deadlift 5×5', 'Romanian DL 3×10', 'Hyperextensions 3×15', 'Pull-Throughs 3×15'],
  },
];

/* ═══════════════════════════════════════════════════════
   MEAL LIBRARY
   Each: { id, name, emoji, calories, protein, carbs, fat,
     meal_type, tags[], suitableGoals[] }
═══════════════════════════════════════════════════════ */
const MEAL_LIBRARY = [
  {
    id: 'm1', name: 'Chicken Rice Bowl', emoji: '🍚',
    calories: 520, protein: 45, carbs: 55, fat: 10,
    meal_type: 'lunch_dinner', tags: ['high_protein', 'lean', 'meal_prep'],
    suitableGoals: ['bulk', 'gain', 'muscle', 'toning'],
  },
  {
    id: 'm2', name: 'Egg White Omelette', emoji: '🍳',
    calories: 180, protein: 25, carbs: 5, fat: 6,
    meal_type: 'breakfast', tags: ['low_calorie', 'high_protein', 'quick'],
    suitableGoals: ['cut', 'lose', 'shred', 'toning'],
  },
  {
    id: 'm3', name: 'Greek Yogurt + Berries', emoji: '🫐',
    calories: 220, protein: 20, carbs: 28, fat: 4,
    meal_type: 'breakfast_snack', tags: ['recovery', 'probiotic', 'antioxidant'],
    suitableGoals: ['all'],
  },
  {
    id: 'm4', name: 'Salmon + Sweet Potato', emoji: '🐟',
    calories: 480, protein: 42, carbs: 38, fat: 14,
    meal_type: 'lunch_dinner', tags: ['omega3', 'anti_inflammatory', 'recovery'],
    suitableGoals: ['all'],
  },
  {
    id: 'm5', name: 'Whey Protein Shake', emoji: '🥤',
    calories: 150, protein: 30, carbs: 6, fat: 2,
    meal_type: 'snack_post_workout', tags: ['post_workout', 'quick', 'high_protein'],
    suitableGoals: ['bulk', 'gain', 'muscle'],
  },
  {
    id: 'm6', name: 'Masala Oats', emoji: '🥣',
    calories: 300, protein: 12, carbs: 50, fat: 6,
    meal_type: 'breakfast', tags: ['fiber', 'slow_carb', 'vegetarian'],
    suitableGoals: ['toning', 'all'],
  },
  {
    id: 'm7', name: 'Dal + Brown Rice', emoji: '🫘',
    calories: 420, protein: 18, carbs: 72, fat: 6,
    meal_type: 'lunch_dinner', tags: ['plant_protein', 'complex_carb', 'vegetarian'],
    suitableGoals: ['all'],
  },
  {
    id: 'm8', name: 'Paneer Bhurji + Roti', emoji: '🧀',
    calories: 450, protein: 28, carbs: 40, fat: 18,
    meal_type: 'lunch_dinner', tags: ['vegetarian', 'high_protein'],
    suitableGoals: ['bulk', 'toning'],
  },
  {
    id: 'm9', name: 'Apple + Peanut Butter', emoji: '🍎',
    calories: 210, protein: 7, carbs: 28, fat: 9,
    meal_type: 'snack', tags: ['fiber', 'healthy_fat', 'quick'],
    suitableGoals: ['all'],
  },
  {
    id: 'm10', name: 'Grilled Paneer Salad', emoji: '🥗',
    calories: 290, protein: 22, carbs: 12, fat: 16,
    meal_type: 'lunch', tags: ['low_carb', 'high_protein', 'vegetarian'],
    suitableGoals: ['cut', 'shred', 'toning'],
  },
  {
    id: 'm11', name: 'Banana + Nuts Pre-Workout', emoji: '🍌',
    calories: 250, protein: 6, carbs: 42, fat: 8,
    meal_type: 'snack_pre_workout', tags: ['energy', 'pre_workout', 'quick'],
    suitableGoals: ['all'],
  },
  {
    id: 'm12', name: 'Overnight Oats', emoji: '🥣',
    calories: 380, protein: 15, carbs: 62, fat: 8,
    meal_type: 'breakfast', tags: ['meal_prep', 'fiber', 'slow_carb'],
    suitableGoals: ['all'],
  },
];

/* ═══════════════════════════════════════════════════════
   VIDEO LIBRARY
   Each: { id, title, channel, duration_min, tags[], emoji, url }
═══════════════════════════════════════════════════════ */
const VIDEO_LIBRARY = [
  { id: 'v1', title: 'Jeff Nippard: Science-Based Chest', channel: 'Jeff Nippard', duration: 18, emoji: '💪', tags: ['chest', 'compound', 'science'], suitableGoals: ['bulk', 'gain', 'muscle'] },
  { id: 'v2', title: 'Athlean-X: Fix Muscle Imbalances', channel: 'Athlean-X', duration: 14, emoji: '⚖️', tags: ['form', 'injury_prevention', 'recovery'], suitableGoals: ['all'] },
  { id: 'v3', title: 'HIIT Fat Burn — No Equipment', channel: 'MadFit', duration: 30, emoji: '🔥', tags: ['hiit', 'cardio', 'fat_loss', 'no_equipment'], suitableGoals: ['cut', 'shred', 'toning'] },
  { id: 'v4', title: 'Perfect Squat Tutorial', channel: 'Alan Thrall', duration: 12, emoji: '🦵', tags: ['squat', 'form', 'lower'], suitableGoals: ['all'] },
  { id: 'v5', title: '10-min Morning Yoga', channel: 'Yoga with Adriene', duration: 10, emoji: '🧘', tags: ['recovery', 'mobility', 'morning', 'yoga'], suitableGoals: ['all'] },
  { id: 'v6', title: 'Deadlift Masterclass', channel: 'Mark Rippetoe', duration: 22, emoji: '🏋', tags: ['deadlift', 'compound', 'strength'], suitableGoals: ['bulk', 'gain', 'strength'] },
  { id: 'v7', title: 'Meal Prep for Muscle Gain', channel: 'Remington James', duration: 16, emoji: '🍗', tags: ['meal_prep', 'nutrition', 'bulk'], suitableGoals: ['bulk', 'gain', 'muscle'] },
  { id: 'v8', title: 'How to Eat for Fat Loss', channel: 'Greg Doucette', duration: 20, emoji: '🥗', tags: ['nutrition', 'fat_loss', 'diet'], suitableGoals: ['cut', 'shred', 'toning'] },
  { id: 'v9', title: 'Sleep & Muscle Recovery', channel: 'Andrew Huberman', duration: 25, emoji: '🌙', tags: ['sleep', 'recovery', 'biohacking'], suitableGoals: ['all'] },
  { id: 'v10', title: 'Pull-Up Progression Guide', channel: 'Calisthenics Movement', duration: 14, emoji: '🤸', tags: ['bodyweight', 'upper', 'progression'], suitableGoals: ['all'] },
];

/* ═══════════════════════════════════════════════════════
   SCORING FUNCTIONS
═══════════════════════════════════════════════════════ */

/**
 * scoreWorkout — assigns a score + reasons to a workout
 * Returns null if filtered out (e.g., same muscle group recently)
 */
function scoreWorkout(workout, ctx) {
  const { goal, sleep, mood, streak, lastMuscleGroups, dayOfWeek } = ctx;
  let score = 50; // baseline
  const reasons = [];

  // ── Goal alignment (biggest signal) ──────────────────
  const g = (goal || '').toLowerCase();
  const matchesGoal = workout.suitableGoals.includes('all') ||
    workout.suitableGoals.some(s => g.includes(s));
  if (matchesGoal) { score += 30; reasons.push(`Matches your ${goal || 'fitness'} goal`); }
  else score -= 20;

  // ── Recovery override ─────────────────────────────────
  if (sleep !== null && sleep < 6) {
    if (workout.intensity === 'low') { score += 25; reasons.push(`Best for ${sleep}h sleep`); }
    else if (workout.intensity === 'very_high') { score -= 30; }
  }

  // ── Mood adjustment ───────────────────────────────────
  if (mood !== null) {
    if (mood <= 2 && workout.intensity === 'low') { score += 20; reasons.push('Good for low-energy days'); }
    if (mood <= 2 && workout.intensity === 'very_high') { score -= 25; }
    if (mood >= 4 && workout.intensity === 'high') { score += 10; reasons.push('Matches your energy'); }
  }

  // ── Streak boost for challenge ────────────────────────
  if (streak >= 5 && workout.tags.includes('compound')) {
    score += 12;
    reasons.push(`${streak}-day streak — time to push harder`);
  }

  // ── Muscle group rotation (avoid repeated groups) ────
  const alreadyHit = workout.muscleGroups.some(mg => lastMuscleGroups.includes(mg));
  if (alreadyHit && workout.muscleGroups[0] !== 'full_body') {
    score -= 20;
  } else if (!alreadyHit) {
    score += 15;
    reasons.push('Fresh muscle groups');
  }

  // ── Day of week hints ────────────────────────────────
  if (dayOfWeek === 0 && workout.tags.includes('recovery')) { score += 10; reasons.push('Sunday recovery day'); }
  if (dayOfWeek === 1 && workout.tags.includes('compound')) { score += 8; reasons.push('Monday heavy start'); }

  // ── Short session boost if available time signals ────
  if (workout.duration <= 25) { score += 5; reasons.push('Quick session'); }

  // ── Cluster boost (archetype-aware scoring) ──────────
  if (ctx.cluster) {
    const clusterTagMatch = workout.tags.some(t => ctx.cluster.workoutTags.includes(t));
    if (clusterTagMatch) {
      score += 18;
      reasons.push(`Matched to your ${ctx.cluster.shortName} profile`);
    }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function scoreMeal(meal, ctx) {
  const { goal, sleep, proteinTarget, calorieTarget, hour } = ctx;
  let score = 40;
  const reasons = [];
  const g = (goal || '').toLowerCase();

  // ── Goal alignment ────────────────────────────────────
  const matchesGoal = meal.suitableGoals.includes('all') ||
    meal.suitableGoals.some(s => g.includes(s));
  if (matchesGoal) { score += 30; reasons.push(`Great for ${goal || 'your'} goal`); }
  else score -= 15;

  // ── Time-of-day relevance ─────────────────────────────
  if (hour < 10 && meal.meal_type.includes('breakfast')) { score += 20; reasons.push('Perfect for morning'); }
  if (hour >= 12 && hour < 15 && meal.meal_type.includes('lunch')) { score += 20; reasons.push('Great lunch option'); }
  if (hour >= 17 && meal.meal_type.includes('dinner')) { score += 20; reasons.push('Ideal for dinner'); }
  if (meal.meal_type.includes('snack')) { score += 8; reasons.push('Easy snack'); }
  if (meal.meal_type.includes('post_workout')) { score += 15; reasons.push('Optimal post-workout'); }
  if (meal.meal_type.includes('pre_workout') && (hour >= 9 && hour <= 19)) { score += 12; reasons.push('Fuels your workout'); }

  // ── Protein priority ──────────────────────────────────
  if (proteinTarget && meal.protein >= 30) {
    score += 15;
    reasons.push(`${meal.protein}g protein`);
  }

  // ── Sleep recovery ────────────────────────────────────
  if (sleep !== null && sleep < 6 && meal.tags.includes('recovery')) {
    score += 12;
    reasons.push('Aids recovery');
  }

  // ── Cut vs. bulk calorie signal ──────────────────────
  if (/cut|lose|shred/.test(g) && meal.calories < 300) { score += 10; reasons.push('Low calorie'); }
  if (/bulk|gain/.test(g) && meal.calories >= 400) { score += 10; reasons.push('Calorie-dense'); }

  // ── Cluster boost ──────────────────────────────────
  if (ctx.cluster) {
    const clusterTagMatch = meal.tags.some(t => ctx.cluster.mealTags.includes(t));
    if (clusterTagMatch) {
      score += 15;
      reasons.push(`Great for ${ctx.cluster.shortName}s`);
    }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function scoreVideo(video, ctx) {
  const { goal, sleep, lastWorkoutTags } = ctx;
  let score = 40;
  const reasons = [];
  const g = (goal || '').toLowerCase();

  const matchesGoal = video.suitableGoals.includes('all') ||
    video.suitableGoals.some(s => g.includes(s));
  if (matchesGoal) { score += 30; reasons.push(`Aligned with ${goal || 'your'} goal`); }

  if (sleep !== null && sleep < 6 && video.tags.includes('recovery')) {
    score += 25;
    reasons.push('Recovery focus for your sleep');
  }

  // Recommend video matching last workout type
  if (lastWorkoutTags) {
    const overlap = video.tags.filter(t => lastWorkoutTags.includes(t)).length;
    if (overlap > 0) { score += overlap * 8; reasons.push('Matches your training focus'); }
  }

  // ── Cluster boost ─────────────────────────────────
  if (ctx.cluster) {
    const clusterTagMatch = video.tags.some(t => ctx.cluster.workoutTags.includes(t));
    if (clusterTagMatch) {
      score += 12;
      reasons.push(`Aligns with your ${ctx.cluster.shortName} archetype`);
    }
  }

  if (video.duration <= 15) { score += 8; reasons.push('Quick watch'); }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

/* ═══════════════════════════════════════════════════════
   MAIN ENGINE EXPORT
   Input: raw localStorage data
   Output: { workouts, meals, videos } — sorted by score
═══════════════════════════════════════════════════════ */
export function getRecommendations() {
  // ── Read all context from localStorage ───────────────
  let userInfo = {}, progress = {}, wellness = {};
  try { userInfo  = JSON.parse(localStorage.getItem('runliUserInfo')) || {}; } catch {}
  try { progress  = JSON.parse(localStorage.getItem('runliProgress')) || {}; } catch {}
  try {
    const raw = JSON.parse(localStorage.getItem('runliWellness')) || {};
    const today = new Date().toISOString().split('T')[0];
    wellness = raw.date === today ? raw : {};
  } catch {}

  // ── Derived fields ────────────────────────────────────
  const goal    = userInfo.target || '';
  const weight  = parseFloat(userInfo.weight) || 70;
  const sleep   = wellness.sleep ?? null;
  const mood    = wellness.mood ?? null;
  const now     = new Date();
  const hour    = now.getHours();
  const dow     = now.getDay(); // 0=Sun

  const sortedDays = Object.entries(progress)
    .sort(([a], [b]) => b.localeCompare(a));
  let streak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (sortedDays[i]?.[0] === expected && sortedDays[i]?.[1]?.wentToGym) streak++;
    else break;
  }

  // Last muscle groups worked (from progress data — simplified to day-of-week rotation)
  const lastMuscleGroups = (() => {
    if (sortedDays.length < 2) return [];
    // In a real system, pull from workout log. Here, use dow-1 index.
    const splits = [['chest','triceps'],['back','biceps'],['quads','hamstrings'],['shoulders','abs'],['full_body']];
    return splits[(dow + 6) % 5] || [];
  })();

  const proteinTarget = Math.round(weight * (/gain|bulk/i.test(goal) ? 1.8 : 1.5));
  const lastWorkoutTags = (() => {
    const splits = [['recovery','yoga'],['compound','push'],['compound','pull'],['compound','lower'],['hiit','cardio']];
    return splits[(dow + 6) % 5] || [];
  })();

  const cluster = getUserCluster();
  const ctx = { goal, sleep, mood, streak, hour, dayOfWeek: dow, lastMuscleGroups, proteinTarget, lastWorkoutTags, cluster };

  // ── Score & rank ──────────────────────────────────────
  const workouts = WORKOUT_LIBRARY
    .map(w => { const s = scoreWorkout(w, ctx); return { ...w, score: s.score, reasons: s.reasons, source: 'rule', type: 'workout' }; })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const meals = MEAL_LIBRARY
    .map(m => { const s = scoreMeal(m, ctx); return { ...m, score: s.score, reasons: s.reasons, source: 'rule', type: 'meal' }; })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const videos = VIDEO_LIBRARY
    .map(v => { const s = scoreVideo(v, ctx); return { ...v, score: s.score, reasons: s.reasons, source: 'rule', type: 'video' }; })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { workouts, meals, videos, meta: { goal, sleep, mood, streak, hour, proteinTarget } };
}

/**
 * ML-ready hook point.
 * Replace this function with an async API call to your ML service.
 * The return shape is identical to `getRecommendations()`.
 *
 * async function getMLRecommendations(userId, context) {
 *   const res = await fetch('/api/recommendations', { ... });
 *   return res.json(); // { workouts, meals, videos }
 * }
 */
