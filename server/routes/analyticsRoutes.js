/**
 * analyticsRoutes.js
 * ─────────────────────────────────────────────────────
 * POST /api/analytics/event          — log a single event (auth optional)
 * GET  /api/analytics/personal       — personal dashboard data (auth required)
 * GET  /api/analytics/admin          — admin aggregate data (admin role required)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import User from '../models/User.js';
import * as svc from '../services/analyticsService.js';

const router = express.Router();

/* ─────────────────────────────────────────────────────
   AUTH MIDDLEWARE
───────────────────────────────────────────────────── */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Optional auth — attaches userId if token is valid, but doesn't block
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch {}
  }
  next();
}

// Admin guard — checks user.role === 'admin' in DB
async function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role').lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

/* ─────────────────────────────────────────────────────
   POST /api/analytics/event
   Log a single event from the client tracker.
   - Auth is optional (anonymous events allowed pre-login)
───────────────────────────────────────────────────── */
router.post('/event', optionalAuth, async (req, res) => {
  try {
    const { event, category, properties, sessionId, deviceType, appVersion, timestamp } = req.body;

    if (!event || !category || !sessionId) {
      return res.status(400).json({ message: 'event, category, sessionId required' });
    }

    await AnalyticsEvent.create({
      userId:     req.userId || null,
      sessionId,
      event,
      category,
      properties: properties || {},
      deviceType: deviceType || 'unknown',
      appVersion: appVersion || '1.0.0',
      timestamp:  timestamp ? new Date(timestamp) : new Date(),
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err.message);
    // Always 200 client-side — we never block UX for analytics
    res.status(200).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────
   GET /api/analytics/personal?days=30
   Full personal dashboard payload.
───────────────────────────────────────────────────── */
router.get('/personal', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const userId = req.userId;

    const [
      workoutFrequency,
      macros,
      topExercises,
      formScores,
      featureUsage,
      streak,
    ] = await Promise.all([
      svc.getWorkoutFrequency(userId, days),
      svc.getMacroAverages(userId, days),
      svc.getTopExercises(userId, days),
      svc.getFormScoreHistory(userId, days),
      svc.getUserFeatureUsage(userId, days),
      svc.getCurrentStreak(userId),
    ]);

    res.json({
      days,
      workoutFrequency,
      macros: {
        ...macros,
        avgCalories: Math.round(macros.avgCalories || 0),
        avgProtein:  Math.round(macros.avgProtein  || 0),
        avgWater:    Math.round(macros.avgWater     || 0),
      },
      topExercises,
      formScores,
      featureUsage,
      streak,
    });
  } catch (err) {
    console.error('Personal analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─────────────────────────────────────────────────────
   GET /api/analytics/admin?days=30
   Aggregated admin dashboard payload.
───────────────────────────────────────────────────── */
router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const [
      userStats,
      dau,
      userGrowth,
      featureUsage,
      goalDist,
      dietDist,
      archetypeDist,
      wau,
    ] = await Promise.all([
      svc.getUserStats(days),
      svc.getDAU(days),
      svc.getUserGrowth(days),
      svc.getFeatureUsage(days),
      svc.getGoalDistribution(),
      svc.getDietDistribution(),
      svc.getArchetypeDistribution(90),
      svc.getWeeklyActiveUsers(),
    ]);

    // Compute simple retention estimate (WAU W-1 / WAU W-2)
    const retention = wau.length >= 2 && wau[wau.length - 2].wau > 0
      ? Math.round((wau[wau.length - 1].wau / wau[wau.length - 2].wau) * 100)
      : null;

    res.json({
      days,
      userStats,
      dau,
      userGrowth,
      featureUsage,
      goalDist,
      dietDist,
      archetypeDist,
      wau,
      retention,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
