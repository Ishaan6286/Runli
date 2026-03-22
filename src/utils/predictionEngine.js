/**
 * predictionEngine.js
 * Pure-JS progress prediction — regression-ready, time-series ready.
 *
 * All functions are stateless and importable individually.
 * The core interfaces are designed so that a future server-side ML route
 * can replace `predictWeightChange` without changing the callers.
 */

/* ─────────────────────────────────────────────────────────
   1. LINEAR REGRESSION
   Input:  points[] = [{ x: number, y: number }]
   Output: { slope, intercept, rSquared }
───────────────────────────────────────────────────────── */
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, rSquared: 0 };

  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² — coefficient of determination
  const meanY  = sumY / n;
  const ssTot  = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes  = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, rSquared };
}

/* ─────────────────────────────────────────────────────────
   2. TDEE (Total Daily Energy Expenditure)
   Uses Mifflin-St Jeor BMR × activity multiplier.
   Input:  { weight (kg), height (cm), age, gender, activityLevel }
   Output: kcal/day (number) or null if data missing
───────────────────────────────────────────────────────── */
const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
};

export function computeTDEE({ weight, height, age, gender, activityLevel }) {
  if (!weight || !height || !age) return null;
  const s  = gender === 'female' ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * age + s;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

/* ─────────────────────────────────────────────────────────
   3. GYM CONSISTENCY FACTOR  (0–1)
   gymDays: number of gym sessions in the last 30 days
   totalDays: number of days in the window (default 30)
───────────────────────────────────────────────────────── */
export function computeConsistencyFactor(gymDays, totalDays = 30) {
  if (!totalDays) return 0;
  // Scale: 0 sessions → 0.5 factor, 5/week → 1.0 factor
  // We assume 5 sessions/week = ideal = 1.0
  const idealSessions = (totalDays / 7) * 5;
  const raw = gymDays / idealSessions;
  // Clamp between 0.4 and 1.0 (even 0 gym still has some NEAT contribution)
  return Math.min(1.0, Math.max(0.4, raw));
}

/* ─────────────────────────────────────────────────────────
   4. BUILD CALORIE SERIES from API progress range
   Input:  progressArray from /api/prediction/forecast
   Output: [{ date, calories }]
───────────────────────────────────────────────────────── */
export function buildCalorieSeries(progressArray) {
  return (progressArray || [])
    .filter(d => d.caloriesConsumed > 0)
    .map(d => ({
      date: typeof d.date === 'string' ? d.date.slice(0, 10) : new Date(d.date).toISOString().slice(0, 10),
      calories: d.caloriesConsumed,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ─────────────────────────────────────────────────────────
   5. MASTER PREDICTION FUNCTION
   Input:
     weightLog:       [{ date: 'YYYY-MM-DD', weight: number }]
     caloriesHistory: [{ date: 'YYYY-MM-DD', calories: number }]
     gymDays:         number  (sessions in last 30 days)
     totalDays:       number  (window, default 30)
     userInfo:        { weight, height, age, gender, activityLevel, targetWeight }
     horizonDays:     number  (default 30)
   Output:
     {
       predictedWeightIn30Days: number | null,
       weeklyRate:              number | null,   // kg/week (neg = loss)
       confidence:              number,          // 0–1
       method:                  string,
       tdee:                    number | null,
       avgCalories:             number | null,
       dailyDeficit:            number | null,
       consistencyFactor:       number,
       rSquared:                number,
       regressionSlope:         number,
     }
───────────────────────────────────────────────────────── */
export function predictWeightChange({
  weightLog = [],
  caloriesHistory = [],
  gymDays = 0,
  totalDays = 30,
  userInfo = {},
  horizonDays = 30,
}) {
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sorted.length ? sorted[sorted.length - 1].weight : (userInfo.weight ?? null);

  // ── Regression on weight history ─────────────────────
  let regSlope = 0, regIntercept = currentWeight ?? 0, rSquared = 0;
  if (sorted.length >= 2) {
    const baseDate = new Date(sorted[0].date).getTime();
    const regPoints = sorted.map(d => ({
      x: (new Date(d.date).getTime() - baseDate) / 86400000,
      y: d.weight,
    }));
    ({ slope: regSlope, intercept: regIntercept, rSquared } = linearRegression(regPoints));
  }

  // ── Calorie-deficit projection ───────────────────────
  const tdee = computeTDEE({
    weight:        currentWeight ?? userInfo.weight,
    height:        userInfo.height,
    age:           userInfo.age,
    gender:        userInfo.gender,
    activityLevel: userInfo.activityLevel,
  });

  let avgCalories = null, dailyDeficit = null, calorieWeeklydelta = null;
  if (caloriesHistory.length >= 3) {
    avgCalories  = caloriesHistory.reduce((s, d) => s + d.calories, 0) / caloriesHistory.length;
    if (tdee) {
      dailyDeficit     = tdee - avgCalories;         // positive = deficit (weight loss)
      calorieWeeklydelta = -(dailyDeficit * 7) / 7700;  // kg/week (negative = loss)
    }
  }

  // ── Gym consistency ──────────────────────────────────
  const consistencyFactor = computeConsistencyFactor(gymDays, totalDays);

  // ── Blend regression + calorie model ─────────────────
  // If we have enough weight history, trust regression more (rSquared weighting).
  // Otherwise lean on TDEE calorie model.
  let weeklyRate = null;
  let predictedDelta = null;
  let method = 'insufficient_data';

  if (sorted.length >= 2) {
    const regressionWeeklyRate = regSlope * 7;   // slope is kg/day → kg/week
    if (calorieWeeklydelta !== null) {
      // Weighted blend
      const rWeight = Math.min(rSquared, 0.85);
      const cWeight = 1 - rWeight;
      weeklyRate = regressionWeeklyRate * rWeight + calorieWeeklydelta * cWeight;
      method = 'blended';
    } else {
      weeklyRate = regressionWeeklyRate;
      method = 'regression_only';
    }
  } else if (calorieWeeklydelta !== null) {
    weeklyRate = calorieWeeklydelta * consistencyFactor;
    method = 'calorie_model';
  }

  if (weeklyRate !== null) {
    // Apply consistency factor as a mild dampener on projected change
    // (low gym attendance → body retains more muscle, less efficient cut)
    const adjustedWeeklyRate = weeklyRate * consistencyFactor;
    predictedDelta = adjustedWeeklyRate * (horizonDays / 7);
  }

  const predictedWeightIn30Days = (predictedDelta !== null && currentWeight !== null)
    ? parseFloat((currentWeight + predictedDelta).toFixed(1))
    : null;

  // ── Confidence 0–1 ───────────────────────────────────
  // Based on: data quantity, rSquared, calorie data availability
  let confidence = 0;
  if (sorted.length >= 7) confidence += 0.4;
  else if (sorted.length >= 3) confidence += 0.2;
  else if (sorted.length >= 2) confidence += 0.1;

  confidence += rSquared * 0.35;

  if (caloriesHistory.length >= 7) confidence += 0.25;
  else if (caloriesHistory.length >= 3) confidence += 0.15;

  confidence = Math.min(1, parseFloat(confidence.toFixed(2)));

  return {
    predictedWeightIn30Days,
    weeklyRate:        weeklyRate !== null ? parseFloat(weeklyRate.toFixed(3)) : null,
    confidence,
    method,
    tdee,
    avgCalories:       avgCalories !== null ? Math.round(avgCalories) : null,
    dailyDeficit:      dailyDeficit !== null ? Math.round(dailyDeficit) : null,
    consistencyFactor: parseFloat(consistencyFactor.toFixed(2)),
    rSquared:          parseFloat(rSquared.toFixed(3)),
    regressionSlope:   parseFloat(regSlope.toFixed(4)),
    currentWeight,
  };
}

/* ─────────────────────────────────────────────────────────
   6. GOAL TIMELINE
   Input:  { currentWeight, goalWeight, weeklyRate }
   Output: { daysToGoal, targetDate (ISO string), isAchievable, weeksToGoal }
───────────────────────────────────────────────────────── */
export function computeGoalTimeline({ currentWeight, goalWeight, weeklyRate }) {
  if (!currentWeight || !goalWeight || weeklyRate == null) {
    return { daysToGoal: null, targetDate: null, isAchievable: false, weeksToGoal: null };
  }

  const delta = goalWeight - currentWeight;   // negative = need to lose

  // Already at goal
  if (Math.abs(delta) < 0.2) {
    return { daysToGoal: 0, targetDate: new Date().toISOString().slice(0, 10), isAchievable: true, weeksToGoal: 0 };
  }

  // Rate must be in the right direction
  const goingRight = (delta < 0 && weeklyRate < 0) || (delta > 0 && weeklyRate > 0);
  if (!goingRight || Math.abs(weeklyRate) < 0.01) {
    return { daysToGoal: null, targetDate: null, isAchievable: false, weeksToGoal: null };
  }

  const weeksToGoal = Math.abs(delta / weeklyRate);
  const daysToGoal  = Math.round(weeksToGoal * 7);

  // Cap at 2 years for sanity
  if (daysToGoal > 730) {
    return { daysToGoal: null, targetDate: null, isAchievable: false, weeksToGoal: null };
  }

  const targetDate = new Date(Date.now() + daysToGoal * 86400000).toISOString().slice(0, 10);

  return { daysToGoal, targetDate, isAchievable: true, weeksToGoal: parseFloat(weeksToGoal.toFixed(1)) };
}

/* ─────────────────────────────────────────────────────────
   7. BUILD PROJECTION POINTS (for chart extension)
   Returns an array of [{ date, weight }] for the next horizonDays
   to draw a dashed prediction line on the weight chart.
───────────────────────────────────────────────────────── */
export function buildProjectionPoints(currentWeight, weeklyRate, horizonDays = 30) {
  if (!currentWeight || weeklyRate == null) return [];
  const dailyRate = weeklyRate / 7;
  const points = [];
  const today = new Date();
  for (let i = 1; i <= horizonDays; i += 3) {
    const d = new Date(today.getTime() + i * 86400000);
    points.push({
      date:   d.toISOString().slice(0, 10),
      weight: parseFloat((currentWeight + dailyRate * i).toFixed(2)),
    });
  }
  return points;
}
