// server/routes/contextRoutes.js
import express from 'express';
import User from '../models/User.js';
import FitnessScore from '../models/FitnessScore.js';
import DailyProgress from '../models/DailyProgress.js';
import Twin from '../models/Twin.js';

const router = express.Router();

/**
 * GET /api/context/:userId
 * Internal endpoint used by the Python AI Service to fetch
 * structured context for injecting into the Deepgram / LLM prompt.
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. User Profile
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Latest Fitness Score
    const latestScore = await FitnessScore.findOne({ userId })
      .sort({ date: -1 })
      .lean();

    // 3. Recent Progress (last 3 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    const recentProgress = await DailyProgress.find({ userId, date: { $gte: cutoff } })
      .sort({ date: -1 })
      .lean();

    // 4. Fitness Twin Insights
    const twin = await Twin.findOne({ userId }).lean();
    let fitnessTwinStr = "No twin data yet.";
    if (twin) {
      fitnessTwinStr = [
        ...((twin.workoutBehavior || []).map(i => `Workout: ${i}`)),
        ...((twin.dietBehavior || []).map(i => `Diet: ${i}`)),
        ...((twin.recoveryPatterns || []).map(i => `Recovery: ${i}`)),
        ...((twin.motivationPatterns || []).map(i => `Motivation: ${i}`)),
        ...((twin.adherencePatterns || []).map(i => `Adherence: ${i}`))
      ].join('; ');
    }

    // Aggregate context
    const context = {
      profile: {
        name: user.name,
        age: user.age || 'Unknown',
        goal: user.goal || 'General Fitness',
        weight: user.weight || 'Unknown',
        targetWeight: user.targetWeight || 'Unknown',
        dietPreference: user.dietPreference || 'Any',
      },
      fitnessScore: latestScore ? {
        total: latestScore.totalScore,
        breakdown: latestScore.breakdown,
        latestReasoning: latestScore.reasoning.map(r => r.text)
      } : null,
      recentActivity: recentProgress.map(p => ({
        date: p.date.toISOString().split('T')[0],
        gym: p.wentToGym,
        calories: p.caloriesConsumed,
        protein: p.proteinIntake,
        sleep: p.sleepHours,
        mood: p.moodScore,
      })),
      // Future integrations:
      poseAnalysis: "No recent pose issues.",
      fitnessTwin: fitnessTwinStr
    };

    res.json(context);
  } catch (err) {
    console.error('[ContextRoute] Error:', err);
    res.status(500).json({ error: 'Server error fetching context' });
  }
});

export default router;
