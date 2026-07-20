// server/services/scoreService.js
/**
 * Fitness Score Service
 * ─────────────────────
 * Calculates a 0-100 score across 5 weighted categories:
 *   - workout:   0-20 pts  (workout consistency over 7 days)
 *   - nutrition: 0-20 pts  (calorie + protein adherence)
 *   - recovery:  0-20 pts  (sleep quality + mood)
 *   - habits:    0-20 pts  (habit completion rate)
 *   - weight:    0-20 pts  (progress towards target weight)
 *
 * Base architecture: pure functions with no side effects.
 * All DB access is handled in scoreRoutes.js.
 */

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MAX_PER_CATEGORY = 20;

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function clamp(value, min = 0, max = MAX_PER_CATEGORY) {
  return Math.min(max, Math.max(min, value));
}

function ratioToScore(ratio, max = MAX_PER_CATEGORY) {
  return clamp(Math.round(ratio * max), 0, max);
}

/**
 * Returns the last N days of progress from the array, sorted newest-first.
 * Handles missing days gracefully (they count against you, not as nulls).
 */
function filterLastNDays(progressArray, days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return progressArray.filter(p => new Date(p.date) >= cutoff);
}

// ─────────────────────────────────────────────
// CATEGORY SCORERS
// Each returns { score: Number, reasoning: Object }
// ─────────────────────────────────────────────

/**
 * Workout consistency (0-20)
 * Compares actual gym days vs the user's target weekly frequency.
 */
function scoreWorkout(progressArray, userFrequency = 4) {
  const recent = filterLastNDays(progressArray, 7);
  const gymDays = recent.filter(p => p.wentToGym).length;
  const ratio   = gymDays / Math.max(userFrequency, 1);
  const score   = ratioToScore(Math.min(ratio, 1));

  let text, emoji;
  if (ratio >= 1.0)      { text = `Hit all ${gymDays} gym days this week — elite consistency!`;           emoji = '💪'; }
  else if (ratio >= 0.75){ text = `${gymDays}/${userFrequency} gym days — strong week.`;                  emoji = '🏋️'; }
  else if (ratio >= 0.5) { text = `${gymDays}/${userFrequency} gym days — room to push more.`;            emoji = '📊'; }
  else if (ratio >= 0.25){ text = `Only ${gymDays}/${userFrequency} gym days — consistency needs work.`; emoji = '⚠️'; }
  else                   { text = `Missed almost all planned gym sessions this week.`;                     emoji = '🔴'; }

  return { score, reasoning: { category: 'workout', impact: score - 10, text, emoji } };
}

/**
 * Nutrition adherence (0-20)
 * Splits equally between calorie adherence (0-10) and protein adherence (0-10).
 */
function scoreNutrition(progressArray, targetCalories = 2000, targetProtein = 150) {
  const recent = filterLastNDays(progressArray, 7);
  const daysLogged = recent.filter(p => p.caloriesConsumed > 0).length;

  if (daysLogged === 0) {
    return {
      score: 5,
      reasoning: { category: 'nutrition', impact: -5, text: 'No nutrition logged this week.', emoji: '🍽️' }
    };
  }

  const avgCal  = recent.reduce((s, p) => s + (p.caloriesConsumed || 0), 0) / Math.max(daysLogged, 1);
  const avgProt = recent.reduce((s, p) => s + (p.proteinIntake || 0), 0)    / Math.max(daysLogged, 1);

  // Calorie score: penalise over-eating AND under-eating
  const calRatio  = avgCal / targetCalories;
  const calScore  = calRatio >= 0.85 && calRatio <= 1.15
    ? 10
    : calRatio >= 0.7 && calRatio <= 1.3
    ? 7
    : calRatio >= 0.5
    ? 4
    : 2;

  const protRatio = avgProt / targetProtein;
  const protScore = protRatio >= 0.9 ? 10 : protRatio >= 0.75 ? 7 : protRatio >= 0.5 ? 4 : 2;

  const score = clamp(calScore + protScore, 0, 20);

  const calDisplay  = Math.round(avgCal);
  const protDisplay = Math.round(avgProt);
  const text = `Avg ${calDisplay} kcal (target ${targetCalories}) · ${protDisplay}g protein (target ${targetProtein}g).`;
  const emoji = score >= 16 ? '🥗' : score >= 10 ? '🍱' : '⚠️';

  return { score, reasoning: { category: 'nutrition', impact: score - 10, text, emoji } };
}

/**
 * Recovery & Sleep quality (0-20)
 * Evaluates sleep hours (0-12) and mood score (0-8).
 */
function scoreRecovery(progressArray) {
  const recent = filterLastNDays(progressArray, 7);
  const sleepDays = recent.filter(p => p.sleepHours != null);
  const moodDays  = recent.filter(p => p.moodScore != null);

  if (sleepDays.length === 0 && moodDays.length === 0) {
    return {
      score: 10,  // neutral if not tracked
      reasoning: { category: 'recovery', impact: 0, text: 'Log sleep & mood to get a recovery score.', emoji: '😴' }
    };
  }

  const avgSleep = sleepDays.reduce((s, p) => s + p.sleepHours, 0) / Math.max(sleepDays.length, 1);
  const avgMood  = moodDays.reduce((s, p)  => s + p.moodScore,  0) / Math.max(moodDays.length,  1);

  // Sleep scoring: optimal 7-9h
  const sleepScore = avgSleep >= 8 ? 12 : avgSleep >= 7 ? 10 : avgSleep >= 6 ? 7 : avgSleep >= 5 ? 4 : 2;
  // Mood scoring: scale 1-5 maps to 0-8
  const moodScore  = moodDays.length > 0 ? Math.round(((avgMood - 1) / 4) * 8) : 4;

  const score = clamp(sleepScore + moodScore, 0, 20);

  let sleepText = '';
  if (sleepDays.length > 0) sleepText = `Avg ${avgSleep.toFixed(1)}h sleep`;
  let moodText  = '';
  if (moodDays.length > 0) moodText = `mood ${avgMood.toFixed(1)}/5`;
  const text  = [sleepText, moodText].filter(Boolean).join(' · ') || 'Recovery data tracked.';
  const emoji = score >= 16 ? '🌙' : score >= 10 ? '💤' : '😩';

  return { score, reasoning: { category: 'recovery', impact: score - 10, text, emoji } };
}

/**
 * Habit completion (0-20)
 * Uses the ratio of completed habit logs over total possible in last 7 days.
 * @param {number} completed - total completed habit-log entries
 * @param {number} total - total possible habit-log entries (habits × days)
 */
function scoreHabits(completed = 0, total = 0) {
  if (total === 0) {
    return {
      score: 10,
      reasoning: { category: 'habits', impact: 0, text: 'Set daily habits to track your consistency.', emoji: '✅' }
    };
  }

  const ratio = completed / total;
  const score = ratioToScore(ratio);

  let text, emoji;
  if (ratio >= 0.9)      { text = `${completed}/${total} habits complete — incredible discipline!`; emoji = '🔥'; }
  else if (ratio >= 0.7) { text = `${completed}/${total} habits done — great consistency.`;          emoji = '✅'; }
  else if (ratio >= 0.5) { text = `${completed}/${total} habits — solid but room for improvement.`; emoji = '📋'; }
  else                   { text = `${completed}/${total} habits — try to lock in your daily habits.`; emoji = '⚠️'; }

  return { score, reasoning: { category: 'habits', impact: score - 10, text, emoji } };
}

/**
 * Weight progress (0-20)
 * Rewards users who are moving toward their target weight.
 * Neutral if no target or data.
 */
function scoreWeight(progressArray, userWeight, targetWeight) {
  if (!userWeight || !targetWeight) {
    return {
      score: 10,
      reasoning: { category: 'weight', impact: 0, text: 'Set a target weight to track progress.', emoji: '⚖️' }
    };
  }

  const recent = filterLastNDays(progressArray, 14);
  const loggedWeights = recent.filter(p => p.weight != null).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loggedWeights.length < 2) {
    return {
      score: 10,
      reasoning: { category: 'weight', impact: 0, text: 'Log your weight more often to track progress.', emoji: '⚖️' }
    };
  }

  const startW  = loggedWeights[0].weight;
  const latestW = loggedWeights[loggedWeights.length - 1].weight;
  const change  = latestW - startW;

  const isLosingGoal = targetWeight < userWeight;
  const isGainingGoal = targetWeight > userWeight;

  let score, text, emoji;
  const changeAbs = Math.abs(change).toFixed(1);

  if (isLosingGoal) {
    if (change < -0.1)       { score = 18; text = `Lost ${changeAbs}kg — great progress toward your goal!`;    emoji = '📉'; }
    else if (change <= 0.2)  { score = 14; text = `Weight stable at ${latestW}kg — maintaining well.`;         emoji = '⚖️'; }
    else                     { score = 8;  text = `Weight up ${changeAbs}kg — refocus on your calorie deficit.`; emoji = '⚠️'; }
  } else if (isGainingGoal) {
    if (change > 0.1)        { score = 18; text = `Gained ${changeAbs}kg — bulk is on track!`;                 emoji = '📈'; }
    else if (change >= -0.2) { score = 14; text = `Weight stable at ${latestW}kg — maintain your surplus.`;    emoji = '⚖️'; }
    else                     { score = 8;  text = `Weight dropped ${changeAbs}kg — increase calorie intake.`;  emoji = '⚠️'; }
  } else {
    score = 15;
    text  = `Weight stable at ${latestW}kg — maintenance goal on track.`;
    emoji = '🎯';
  }

  return { score: clamp(score, 0, 20), reasoning: { category: 'weight', impact: score - 10, text, emoji } };
}

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────

/**
 * Calculate the complete fitness score for a user.
 *
 * @param {Object} params
 * @param {Array}  params.progressArray   - Array of DailyProgress docs (last 14 days)
 * @param {Object} params.user            - User document (frequency, weight, targetWeight, goal, etc.)
 * @param {number} params.habitsCompleted - Count of completed HabitLog entries this week
 * @param {number} params.habitsTotal     - Count of total possible HabitLog entries this week
 *
 * @returns {{ totalScore, breakdown, reasoning, dataCompleteness }}
 */
export function calculateFitnessScore({ progressArray, user, habitsCompleted, habitsTotal }) {
  const targetCalories = 2000; // TODO: derive from user's DietPlan if available
  const targetProtein  = user?.weight ? Math.round(user.weight * 1.8) : 150;
  const userFrequency  = Number(user?.frequency) || 4;

  const wResult = scoreWorkout(progressArray, userFrequency);
  const nResult = scoreNutrition(progressArray, targetCalories, targetProtein);
  const rResult = scoreRecovery(progressArray);
  const hResult = scoreHabits(habitsCompleted, habitsTotal);
  const gResult = scoreWeight(progressArray, user?.weight, user?.targetWeight);

  const breakdown = {
    workout:   wResult.score,
    nutrition: nResult.score,
    recovery:  rResult.score,
    habits:    hResult.score,
    weight:    gResult.score,
  };

  const totalScore = clamp(
    wResult.score + nResult.score + rResult.score + hResult.score + gResult.score,
    0,
    100
  );

  const reasoning = [
    wResult.reasoning,
    nResult.reasoning,
    rResult.reasoning,
    hResult.reasoning,
    gResult.reasoning,
  ];

  // Determine data completeness: 1.0 if all categories have real data
  const trackedCategories = [
    progressArray.some(p => p.wentToGym !== undefined),
    progressArray.some(p => p.caloriesConsumed > 0),
    progressArray.some(p => p.sleepHours != null),
    habitsTotal > 0,
    user?.weight && user?.targetWeight,
  ].filter(Boolean).length;

  const dataCompleteness = Math.round((trackedCategories / 5) * 100) / 100;

  return { totalScore, breakdown, reasoning, dataCompleteness };
}

/**
 * Returns a grade label for the total score.
 */
export function scoreToGrade(score) {
  if (score >= 90) return { grade: 'S', label: 'Elite',        color: '#a855f7' };
  if (score >= 80) return { grade: 'A', label: 'Excellent',    color: '#22c55e' };
  if (score >= 70) return { grade: 'B', label: 'Great',        color: '#84cc16' };
  if (score >= 60) return { grade: 'C', label: 'Good',         color: '#f59e0b' };
  if (score >= 40) return { grade: 'D', label: 'Needs Work',   color: '#f97316' };
  return                 { grade: 'F', label: 'Struggling',    color: '#ef4444' };
}
