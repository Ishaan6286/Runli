/**
 * analyticsService.js
 * ─────────────────────────────────────────────────────
 * All MongoDB aggregation queries for the analytics system.
 * Pure functions — no Express, no I/O, just DB calls.
 */

import AnalyticsEvent from '../models/AnalyticsEvent.js';
import DailyProgress from '../models/DailyProgress.js';
import FoodLog from '../models/FoodLog.js';
import User from '../models/User.js';

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ─────────────────────────────────────────────────────
   USER — PERSONAL ANALYTICS
───────────────────────────────────────────────────── */

/**
 * Workout frequency over the last N days
 */
export async function getWorkoutFrequency(userId, days = 30) {
  const since = daysAgo(days);
  const progress = await DailyProgress.find({
    userId, date: { $gte: since },
  }).sort({ date: 1 }).lean();

  return progress.map(p => ({
    date: p.date.toISOString().split('T')[0],
    wentToGym: p.wentToGym,
    calories: p.caloriesConsumed,
    protein: p.proteinIntake,
    water: p.waterIntake,
    weight: p.weight,
  }));
}

/**
 * Macro averages over the period
 */
export async function getMacroAverages(userId, days = 30) {
  const since = daysAgo(days);
  const [result] = await DailyProgress.aggregate([
    { $match: { userId, date: { $gte: since } } },
    {
      $group: {
        _id: null,
        avgCalories: { $avg: '$caloriesConsumed' },
        avgProtein:  { $avg: '$proteinIntake' },
        avgWater:    { $avg: '$waterIntake' },
        gymDays:     { $sum: { $cond: ['$wentToGym', 1, 0] } },
        totalDays:   { $sum: 1 },
        minWeight:   { $min: '$weight' },
        maxWeight:   { $max: '$weight' },
      },
    },
  ]);
  return result || {
    avgCalories: 0, avgProtein: 0, avgWater: 0,
    gymDays: 0, totalDays: 0,
  };
}

/**
 * Top exercises from GymMode event log
 */
export async function getTopExercises(userId, days = 30) {
  const since = daysAgo(days);
  return AnalyticsEvent.aggregate([
    {
      $match: {
        userId,
        event: 'set_logged',
        timestamp: { $gte: since },
      },
    },
    { $group: { _id: '$properties.exercise', count: { $sum: 1 }, avgWeight: { $avg: '$properties.weight' } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $project: { exercise: '$_id', count: 1, avgWeight: 1, _id: 0 } },
  ]);
}

/**
 * Form score history (pose detection sessions)
 */
export async function getFormScoreHistory(userId, days = 30) {
  const since = daysAgo(days);
  return AnalyticsEvent.aggregate([
    {
      $match: {
        userId,
        event: 'pose_analyzed',
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$properties.exercise',
        avgScore: { $avg: '$properties.formScore' },
        sessions: { $sum: 1 },
        totalReps: { $sum: '$properties.reps' },
      },
    },
    { $project: { exercise: '$_id', avgScore: 1, sessions: 1, totalReps: 1, _id: 0 } },
    { $sort: { sessions: -1 } },
  ]);
}

/**
 * Feature usage for personal summary (what the user actually uses)
 */
export async function getUserFeatureUsage(userId, days = 30) {
  const since = daysAgo(days);
  const results = await AnalyticsEvent.aggregate([
    { $match: { userId, timestamp: { $gte: since } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return results.map(r => ({ category: r._id, count: r.count }));
}

/**
 * Workout streak (current)
 */
export async function getCurrentStreak(userId) {
  const progress = await DailyProgress.find({ userId })
    .sort({ date: -1 }).limit(60).lean();

  let streak = 0;
  for (let i = 0; i < progress.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const actual   = progress[i]?.date?.toISOString().split('T')[0];
    if (actual === expected && progress[i].wentToGym) streak++;
    else break;
  }
  return streak;
}

/* ─────────────────────────────────────────────────────
   ADMIN — AGGREGATE ANALYTICS
───────────────────────────────────────────────────── */

/**
 * Total users, new users in period
 */
export async function getUserStats(days = 30) {
  const since = daysAgo(days);
  const [total, newUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
  ]);
  return { total, newUsers };
}

/**
 * Daily Active Users (distinct userId with events in last N days)
 */
export async function getDAU(days = 30) {
  const since = daysAgo(days);
  const results = await AnalyticsEvent.aggregate([
    { $match: { userId: { $ne: null }, timestamp: { $gte: since } } },
    {
      $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
        users: { $addToSet: '$userId' },
      },
    },
    { $project: { date: '$_id.date', dau: { $size: '$users' }, _id: 0 } },
    { $sort: { date: 1 } },
  ]);
  return results;
}

/**
 * User growth (new signups per day)
 */
export async function getUserGrowth(days = 30) {
  const since = daysAgo(days);
  return User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $project: { date: '$_id', count: 1, _id: 0 } },
    { $sort: { date: 1 } },
  ]);
}

/**
 * Most used features across all users
 */
export async function getFeatureUsage(days = 30) {
  const since = daysAgo(days);
  return AnalyticsEvent.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: '$event', count: { $sum: 1 }, users: { $addToSet: '$userId' } } },
    { $project: { event: '$_id', count: 1, uniqueUsers: { $size: '$users' }, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);
}

/**
 * Goal distribution across all users
 */
export async function getGoalDistribution() {
  return User.aggregate([
    { $group: { _id: '$goal', count: { $sum: 1 } } },
    { $project: { goal: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

/**
 * Diet preference distribution
 */
export async function getDietDistribution() {
  return User.aggregate([
    { $group: { _id: '$dietPreference', count: { $sum: 1 } } },
    { $project: { diet: '$_id', count: 1, _id: 0 } },
  ]);
}

/**
 * Archetype (cluster) distribution from events
 */
export async function getArchetypeDistribution(days = 90) {
  const since = daysAgo(days);
  return AnalyticsEvent.aggregate([
    {
      $match: {
        event: 'cluster_assigned',
        timestamp: { $gte: since },
      },
    },
    {
      $sort: { userId: 1, timestamp: -1 },
    },
    {
      // Only latest cluster per user
      $group: {
        _id: '$userId',
        clusterName: { $first: '$properties.clusterName' },
        clusterId:   { $first: '$properties.clusterId' },
      },
    },
    { $group: { _id: '$clusterName', count: { $sum: 1 } } },
    { $project: { name: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

/**
 * Weekly active users (last 4 weeks)
 */
export async function getWeeklyActiveUsers() {
  const results = [];
  for (let w = 0; w < 4; w++) {
    const end   = daysAgo(w * 7);
    const start = daysAgo((w + 1) * 7);
    const count = await AnalyticsEvent.distinct('userId', {
      userId: { $ne: null },
      timestamp: { $gte: start, $lt: end },
    });
    results.unshift({ week: `W-${w === 0 ? 'current' : w}`, wau: count.length });
  }
  return results;
}
