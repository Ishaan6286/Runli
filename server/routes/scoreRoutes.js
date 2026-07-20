// server/routes/scoreRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/authMiddleware.js';
import DailyProgress from '../models/DailyProgress.js';
import HabitLog from '../models/HabitLog.js';
import FitnessScore from '../models/FitnessScore.js';
import User from '../models/User.js';
import { calculateFitnessScore, scoreToGrade } from '../services/scoreService.js';

const router = express.Router();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function startOfDay(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Core calculation logic — used by both GET /current and POST /calculate.
 * Returns the full score result and upserts it into FitnessScore collection.
 */
async function computeAndSaveScore(userId) {
  const user = await User.findById(userId).lean();

  // Fetch last 14 days of progress (enough for workout + weight trend)
  const progressArray = await DailyProgress.find({
    userId,
    date: { $gte: daysAgo(14) },
  }).lean();

  // Count habits for last 7 days
  const [habitStats] = await HabitLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: daysAgo(7) },
      },
    },
    {
      $group: {
        _id: null,
        total:     { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);

  const habitsCompleted = habitStats?.completed ?? 0;
  const habitsTotal     = habitStats?.total ?? 0;

  const result = calculateFitnessScore({
    progressArray,
    user,
    habitsCompleted,
    habitsTotal,
  });

  const today = startOfDay();

  // Upsert today's score
  const saved = await FitnessScore.findOneAndUpdate(
    { userId, date: today },
    {
      $set: {
        totalScore:       result.totalScore,
        breakdown:        result.breakdown,
        reasoning:        result.reasoning,
        dataCompleteness: result.dataCompleteness,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return { ...result, grade: scoreToGrade(result.totalScore), _id: saved._id };
}

// ─────────────────────────────────────────────
// GET /api/score/current
// Returns today's score (from cache or recalculated)
// ─────────────────────────────────────────────
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const today = startOfDay();

    // Serve cached score if it was computed less than 5 minutes ago
    const cached = await FitnessScore.findOne({
      userId: req.userId,
      date: today,
      updatedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    }).lean();

    if (cached) {
      return res.json({
        ...cached,
        grade: scoreToGrade(cached.totalScore),
        cached: true,
      });
    }

    const result = await computeAndSaveScore(req.userId);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error('[ScoreRoute] GET /current error:', err);
    res.status(500).json({ message: 'Failed to calculate fitness score', error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/score/calculate
// Force-recalculates and saves today's score
// ─────────────────────────────────────────────
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const result = await computeAndSaveScore(req.userId);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error('[ScoreRoute] POST /calculate error:', err);
    res.status(500).json({ message: 'Score calculation failed', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/score/history?days=30
// Returns historical score array for trend graphs
// ─────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);

    const scores = await FitnessScore.find({
      userId: req.userId,
      date: { $gte: daysAgo(days) },
    })
      .sort({ date: 1 })
      .select('date totalScore breakdown dataCompleteness')
      .lean();

    // Fill missing days with nulls so the chart has a continuous x-axis
    const map = new Map(scores.map(s => [s.date.toISOString().split('T')[0], s]));
    const filled = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = d.toISOString().split('T')[0];
      filled.push(map.get(key) ?? { date: d, totalScore: null, breakdown: null });
    }

    res.json({ history: filled, days });
  } catch (err) {
    console.error('[ScoreRoute] GET /history error:', err);
    res.status(500).json({ message: 'Failed to fetch score history', error: err.message });
  }
});

export default router;
