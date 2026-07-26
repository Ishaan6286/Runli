/**
 * nutritionTargets.js
 * Single source of truth for calorie, protein, and water targets.
 * 1. Checks localStorage for user overrides (set from PlanPage edit modal)
 * 2. Falls back to computed values from the user profile
 * Used by: PlanPage, Dashboard, Today, DietPlan, Notifications
 */

const CUSTOM_KEY = 'runliCustomTargets';

// ── Calculation helpers ────────────────────────────────────────────
function calcBMR(weight, height, age, gender) {
  const w = Number(weight) || 70;
  const h = Number(height) || 170;
  const a = Number(age) || 25;
  if (gender === 'female') return 10 * w + 6.25 * h - 5 * a - 161;
  if (gender === 'male')   return 10 * w + 6.25 * h - 5 * a + 5;
  return 10 * w + 6.25 * h - 5 * a;
}

function activityToFactor(activityLevel) {
  const map = {
    sedentary: 1.3, light: 1.45, moderate: 1.6,
    active: 1.7, very_active: 1.78
  };
  return map[activityLevel] || 1.6;
}

function computeCalories(profile = {}) {
  const bmr = calcBMR(profile.weight, profile.height, profile.age, profile.gender);
  const factor = activityToFactor(profile.activityLevel);
  let cal = bmr * factor;
  const goal = (profile.goal || profile.target || '').toLowerCase();
  if (/gain|bulk|muscle/.test(goal)) cal *= 1.1;
  else if (/lose|fat|shred/.test(goal)) cal *= 0.85;
  return Math.round(cal);
}

function computeProtein(profile = {}) {
  const w = Number(profile.weight) || 70;
  const goal = (profile.goal || profile.target || '').toLowerCase();
  let factor = 1.2;
  if (/gain|bulk|muscle/.test(goal)) factor = 1.8;
  else if (/lose|fat|shred/.test(goal)) factor = 1.5;
  return Math.round(w * factor);
}

function computeWater(profile = {}) {
  const w = Number(profile.weight) || 70;
  return Math.round(w * 0.035 * 10) / 10;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Get the current targets, respecting manual overrides.
 * @param {Object} profile - User profile object (from API or localStorage)
 * @returns {{ calories: number, protein: number, water: number, isCustom: boolean }}
 */
export function getTargets(profile = {}) {
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null');
    if (custom && (custom.calories || custom.protein || custom.water)) {
      return {
        calories: custom.calories || computeCalories(profile),
        protein:  custom.protein  || computeProtein(profile),
        water:    custom.water    || computeWater(profile),
        isCustom: true,
      };
    }
  } catch { /* ignore parse errors */ }

  return {
    calories: computeCalories(profile),
    protein:  computeProtein(profile),
    water:    computeWater(profile),
    isCustom: false,
  };
}

/**
 * Save manual target overrides to localStorage.
 * Also returns the new targets object.
 */
export function saveCustomTargets({ calories, protein, water }) {
  const targets = {
    calories: Number(calories) || 0,
    protein:  Number(protein)  || 0,
    water:    parseFloat(water) || 0,
  };
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(targets));
  return targets;
}

/**
 * Clear manual overrides and revert to AI-calculated values.
 */
export function resetTargets() {
  localStorage.removeItem(CUSTOM_KEY);
}

/**
 * Get just the saved custom overrides without merging.
 */
export function getCustomTargets() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null');
  } catch {
    return null;
  }
}
