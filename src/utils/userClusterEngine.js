/**
 * userClusterEngine.js
 * ─────────────────────────────────────────────────────────
 * K-means-conceptual user clustering for Runli.
 *
 * Public API:
 *   getUserCluster()          → ClusterProfile (reads localStorage)
 *   buildFeatureVector()      → number[7]  (exposed for debugging)
 *   assignCluster(vector)     → ClusterProfile
 *   CLUSTER_PROFILES          → all 5 archetypes
 *
 * ClusterProfile shape:
 * {
 *   id:          number,       // 0–4
 *   name:        string,       // e.g. 'The Builder'
 *   emoji:       string,
 *   shortName:   string,       // e.g. 'Builder'
 *   color:       string,       // CSS colour
 *   description: string,
 *   traits:      string[],
 *   workoutTags: string[],     // tags to boost in recommendations
 *   mealTags:    string[],
 *   confidence:  number,       // 0–1 (1 = perfect centroid match)
 *   centroidDist:number,       // raw euclidean distance for debugging
 * }
 */

/* ─────────────────────────────────────────────────────────
   CLUSTER PROFILES (K = 5)
───────────────────────────────────────────────────────── */
export const CLUSTER_PROFILES = [
  {
    id: 0,
    name: 'The Shredder',
    shortName: 'Shredder',
    emoji: '🔥',
    color: '#ef4444',
    description: 'Laser-focused on fat loss, cardio-heavy, calorie-conscious.',
    traits: ['Fat loss priority', 'High cardio volume', 'Calorie deficit', 'HIIT training'],
    workoutTags: ['hiit', 'cardio', 'fat_loss', 'full_body', 'circuit'],
    mealTags:    ['low_calorie', 'high_protein', 'low_carb'],
  },
  {
    id: 1,
    name: 'The Builder',
    shortName: 'Builder',
    emoji: '💪',
    color: '#10b981',
    description: 'Hypertrophy and strength-focused, high protein, heavy compound lifts.',
    traits: ['Muscle growth priority', 'Compound movements', 'High protein intake', 'Progressive overload'],
    workoutTags: ['compound', 'strength', 'big_lifts', 'push', 'pull'],
    mealTags:    ['high_protein', 'meal_prep', 'post_workout'],
  },
  {
    id: 2,
    name: 'The Maintainer',
    shortName: 'Maintainer',
    emoji: '⚖️',
    color: '#6366f1',
    description: 'Balanced lifestyle, consistent moderate training, sustainable habits.',
    traits: ['Balanced nutrition', 'Consistent schedule', 'Moderate intensity', 'Long-term focus'],
    workoutTags: ['bodyweight', 'circuit', 'upper', 'lower'],
    mealTags:    ['fiber', 'slow_carb', 'vegetarian'],
  },
  {
    id: 3,
    name: 'The Athlete',
    shortName: 'Athlete',
    emoji: '⚡',
    color: '#f59e0b',
    description: 'Performance-driven, trains hard and frequently, cross-trains.',
    traits: ['High training frequency', 'Performance goals', 'Mixed training modes', 'Recovery focus'],
    workoutTags: ['compound', 'hiit', 'cardio', 'strength', 'big_lifts'],
    mealTags:    ['high_protein', 'energy', 'pre_workout', 'omega3'],
  },
  {
    id: 4,
    name: 'The Wellness Seeker',
    shortName: 'Wellness',
    emoji: '🧘',
    color: '#8b5cf6',
    description: 'Mind-body balance, prioritises sleep, recovery, and low-impact movement.',
    traits: ['Recovery-first mindset', 'Sleep optimisation', 'Light activity', 'Mindfulness'],
    workoutTags: ['recovery', 'mobility', 'yoga', 'morning', 'no_equipment'],
    mealTags:    ['probiotic', 'recovery', 'antioxidant', 'fiber'],
  },
];

/* ─────────────────────────────────────────────────────────
   HARD-CODED CENTROIDS
   Rows = clusters 0-4  |  Cols = feature dimensions 0-6
   Dimensions:
     0 activityLevel  (0=sedentary .. 1=very_active)
     1 goal           (0=lose .. 0.5=maintain .. 1=gain_muscle)
     2 gymConsistency (gymDays / 30, capped 0-1)
     3 avgCalories    (avgCal / 3000, capped 0-1)
     4 avgSleep       (avgSleep / 9, capped 0-1)
     5 proteinRatio   (avgProtein / (weight*2), capped 0-1)
     6 streak30       (streak / 30, capped 0-1)
───────────────────────────────────────────────────────── */
const CENTROIDS = [
  //  act   goal   gym   cal   slp   prot  strk
  [0.60, 0.00, 0.50, 0.40, 0.60, 0.40, 0.40],  // 0 Shredder
  [0.85, 1.00, 0.80, 0.80, 0.65, 0.90, 0.75],  // 1 Builder
  [0.50, 0.50, 0.40, 0.55, 0.75, 0.55, 0.30],  // 2 Maintainer
  [1.00, 0.70, 0.95, 0.85, 0.60, 0.80, 0.90],  // 3 Athlete
  [0.20, 0.50, 0.15, 0.45, 0.90, 0.40, 0.10],  // 4 Wellness
];

/* ─────────────────────────────────────────────────────────
   FEATURE VECTOR BUILDER
───────────────────────────────────────────────────────── */

const ACTIVITY_MAP = {
  sedentary: 0, light: 0.25, moderate: 0.5, active: 0.75, very_active: 1,
};
const GOAL_MAP = {
  lose_weight: 0, maintain: 0.5, gain_muscle: 1,
};

export function buildFeatureVector() {
  let userInfo = {}, progress = {}, wellness = {};
  try { userInfo  = JSON.parse(localStorage.getItem('runliUserInfo')) || {}; } catch {}
  try { progress  = JSON.parse(localStorage.getItem('runliProgress')) || {}; } catch {}
  try {
    const raw = JSON.parse(localStorage.getItem('runliWellness')) || {};
    // Allow any recent date (within 7 days) for fallback
    wellness = raw;
  } catch {}

  // ── dim 0: activity level ──────────────────────────────
  const actRaw = (userInfo.activityLevel || 'moderate').toLowerCase();
  const actVal = ACTIVITY_MAP[actRaw] ?? 0.5;

  // ── dim 1: goal direction ──────────────────────────────
  const goalRaw = (userInfo.target || userInfo.goal || 'maintain').toLowerCase();
  let goalVal = 0.5;
  for (const [key, val] of Object.entries(GOAL_MAP)) {
    if (goalRaw.includes(key.replace('_', ' ')) || goalRaw.includes(key)) {
      goalVal = val; break;
    }
  }
  // Also handle short forms
  if (/lose|cut|shred/.test(goalRaw)) goalVal = 0;
  if (/gain|bulk|muscle/.test(goalRaw)) goalVal = 1;

  // ── dim 2: gym consistency (last 30 days) ──────────────
  const sortedDays = Object.entries(progress).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30);
  const gymDays = sortedDays.filter(([, d]) => d?.wentToGym).length;
  const gymVal  = Math.min(1, gymDays / 30);

  // ── dim 3: average daily calories ─────────────────────
  const calEntries = sortedDays.filter(([, d]) => d?.caloriesConsumed > 0);
  const avgCal = calEntries.length
    ? calEntries.reduce((s, [, d]) => s + (d.caloriesConsumed || 0), 0) / calEntries.length
    : 1800;
  const calVal = Math.min(1, avgCal / 3000);

  // ── dim 4: average sleep ───────────────────────────────
  const sleepVal = wellness.sleep != null ? Math.min(1, wellness.sleep / 9) : 0.7;

  // ── dim 5: protein ratio ───────────────────────────────
  const weight = parseFloat(userInfo.weight) || 70;
  const protEntries = sortedDays.filter(([, d]) => d?.proteinIntake > 0);
  const avgProt = protEntries.length
    ? protEntries.reduce((s, [, d]) => s + (d.proteinIntake || 0), 0) / protEntries.length
    : 0;
  const protVal = Math.min(1, avgProt / (weight * 2));

  // ── dim 6: streak / 30 ────────────────────────────────
  let streak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (sortedDays[i]?.[0] === expected && sortedDays[i]?.[1]?.wentToGym) streak++;
    else break;
  }
  const streakVal = Math.min(1, streak / 30);

  return [actVal, goalVal, gymVal, calVal, sleepVal, protVal, streakVal];
}

/* ─────────────────────────────────────────────────────────
   EUCLIDEAN DISTANCE
───────────────────────────────────────────────────────── */
function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));
}

/* ─────────────────────────────────────────────────────────
   CLUSTER ASSIGNMENT
───────────────────────────────────────────────────────── */
export function assignCluster(vector) {
  const distances = CENTROIDS.map(c => euclidean(vector, c));
  const minDist   = Math.min(...distances);
  const clusterId = distances.indexOf(minDist);

  // Confidence: 1 = perfect match (dist=0), 0 = at max theoretical distance (sqrt(7)≈2.65)
  const maxDist   = Math.sqrt(CENTROIDS[0].length);
  const confidence = Math.max(0, 1 - minDist / maxDist);

  return {
    ...CLUSTER_PROFILES[clusterId],
    confidence: Math.round(confidence * 100) / 100,
    centroidDist: Math.round(minDist * 1000) / 1000,
    featureVector: vector,
    // Include distance to all clusters for the breakdown modal
    allDistances: CLUSTER_PROFILES.map((p, i) => ({
      ...p,
      distance: Math.round(distances[i] * 1000) / 1000,
      score: Math.round((1 - distances[i] / maxDist) * 100),
    })).sort((a, b) => a.distance - b.distance),
  };
}

/* ─────────────────────────────────────────────────────────
   PUBLIC API — reads localStorage, caches result
───────────────────────────────────────────────────────── */
const CACHE_KEY = 'runliUserCluster';
const CACHE_TTL = 3600_000; // 1 hour

export function getUserCluster(forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
        return cached.cluster;
      }
    } catch {}
  }

  const vector  = buildFeatureVector();
  const cluster = assignCluster(vector);

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      cluster,
      computedAt: Date.now(),
    }));
  } catch {}

  return cluster;
}

/** Force a fresh cluster recalculation (call after profile changes) */
export function invalidateCluster() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}
