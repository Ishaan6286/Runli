// server/routes/ragRoutes.js
// RAG Memory Management — server-side orchestration
// All routes protected by authMiddleware
// Calls Python ai-service for vector operations

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import DailyProgress from '../models/DailyProgress.js';
import FoodLog from '../models/FoodLog.js';
import ExerciseHistory from '../models/ExerciseHistory.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────
// Helper: Fire-and-forget ingest to Python service
// ─────────────────────────────────────────────
const ragIngest = async (userId, sourceType, sourceId, memoryText, metadata = {}) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId.toString(),
                source_type: sourceType,
                source_id: sourceId,
                memory_text: memoryText,
                metadata
            }),
            signal: AbortSignal.timeout(5000) // 5s timeout — non-blocking
        });
        if (!response.ok) {
            console.warn(`[RAG] ingest warning: ${response.status} for ${sourceType}:${sourceId}`);
        }
    } catch (e) {
        // Non-fatal — RAG is an enhancement, never blocks main flow
        console.warn(`[RAG] ingest failed silently: ${e.message}`);
    }
};

// ─────────────────────────────────────────────
// POST /api/rag/ingest-progress
// Called after daily progress update
// ─────────────────────────────────────────────
router.post('/ingest-progress', authMiddleware, async (req, res) => {
    const { date, progress } = req.body;
    const userId = req.userId;

    if (!date || !progress) {
        return res.status(400).json({ message: 'date and progress required' });
    }

    const dateStr = String(date).slice(0, 10);
    const { wentToGym, caloriesConsumed, proteinIntake, waterIntake,
            sleepHours, moodScore, steps, weight } = progress;

    const parts = [`On ${dateStr}:`];
    parts.push(`Gym: ${wentToGym ? 'Yes' : 'No'}`);
    if (caloriesConsumed) parts.push(`Calories: ${caloriesConsumed}`);
    if (proteinIntake) parts.push(`Protein: ${proteinIntake}g`);
    if (waterIntake) parts.push(`Water: ${waterIntake}ml`);
    if (sleepHours != null) parts.push(`Sleep: ${sleepHours}h`);
    if (moodScore != null) {
        const moodLabel = { 1: 'Very low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Excellent' }[moodScore] || moodScore;
        parts.push(`Mood: ${moodLabel}`);
    }
    if (weight) parts.push(`Weight: ${weight}kg`);
    if (steps) parts.push(`Steps: ${steps}`);

    const memoryText = parts.join(' | ');

    await ragIngest(userId, 'daily_progress', dateStr, memoryText, {
        date: dateStr,
        gym: wentToGym || false,
        calories: caloriesConsumed || 0,
        protein: proteinIntake || 0
    });

    res.json({ status: 'queued' });
});

// ─────────────────────────────────────────────
// POST /api/rag/ingest-nutrition
// Called after food log saved
// ─────────────────────────────────────────────
router.post('/ingest-nutrition', authMiddleware, async (req, res) => {
    const { date, foodLogId, totalCalories, totalProtein, foods } = req.body;
    const userId = req.userId;

    const dateStr = String(date || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const sourceId = foodLogId || dateStr;

    const foodNames = Array.isArray(foods) ? foods.slice(0, 5).map(f => f.name || '').filter(Boolean) : [];
    let memoryText = `On ${dateStr}, nutrition log: ${totalCalories || 0} kcal total, ${totalProtein || 0}g protein.`;
    if (foodNames.length > 0) {
        memoryText += ` Foods: ${foodNames.join(', ')}.`;
    }

    await ragIngest(userId, 'nutrition', sourceId, memoryText, {
        date: dateStr,
        total_calories: totalCalories || 0,
        total_protein: totalProtein || 0
    });

    res.json({ status: 'queued' });
});

// ─────────────────────────────────────────────
// POST /api/rag/ingest-workout
// Called after exercise history saved
// ─────────────────────────────────────────────
router.post('/ingest-workout', authMiddleware, async (req, res) => {
    const { exerciseId, exerciseName, reps, formScore, date } = req.body;
    const userId = req.userId;

    const dateStr = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0, 10);
    const sourceId = exerciseId || `${exerciseName}_${dateStr}`;

    let memoryText = `On ${dateStr}, performed ${exerciseName}: ${reps} reps.`;
    if (formScore != null) memoryText += ` Form score: ${formScore}/100.`;

    await ragIngest(userId, 'exercise', sourceId, memoryText, {
        date: dateStr,
        exercise: exerciseName,
        form_score: formScore || 0
    });

    res.json({ status: 'queued' });
});

// ─────────────────────────────────────────────
// POST /api/rag/ingest-goal
// Called after user profile update (goal/weight changes)
// ─────────────────────────────────────────────
router.post('/ingest-goal', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const goalMap = { lose_weight: 'fat loss', gain_muscle: 'muscle gain', maintain: 'maintaining weight' };
        const goalText = goalMap[user.goal] || user.goal || 'general fitness';

        const parts = [`User's fitness goal is ${goalText}.`];
        if (user.weight) parts.push(`Current weight: ${user.weight}kg.`);
        if (user.targetWeight) parts.push(`Target weight: ${user.targetWeight}kg.`);
        if (user.experience) parts.push(`Experience level: ${user.experience}.`);
        if (user.workoutEnvironment) parts.push(`Prefers working out: ${user.workoutEnvironment}.`);
        if (user.injuries?.length > 0) parts.push(`Known injuries: ${user.injuries.join(', ')}.`);
        if (user.dietPreference) parts.push(`Diet preference: ${user.dietPreference}.`);

        const memoryText = parts.join(' ');
        await ragIngest(userId, 'fitness_goal', 'profile', memoryText, {
            goal: user.goal || '',
            experience: user.experience || '',
            workout_env: user.workoutEnvironment || ''
        });

        res.json({ status: 'queued' });
    } catch (e) {
        console.error('[RAG] ingest-goal error:', e);
        res.json({ status: 'error', message: e.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/rag/ingest-conversation
// Store durable insights from coach conversations
// ─────────────────────────────────────────────
router.post('/ingest-conversation', authMiddleware, async (req, res) => {
    const { insight, timestamp } = req.body;
    const userId = req.userId;

    if (!insight || insight.trim().length < 10) {
        return res.json({ status: 'skipped', reason: 'Too short to be useful' });
    }

    const dateStr = timestamp
        ? new Date(timestamp).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const timeStr = timestamp
        ? new Date(timestamp).toISOString().replace(/[:.]/g, '-')
        : new Date().toISOString().replace(/[:.]/g, '-');

    await ragIngest(userId, 'coach_conversation', timeStr, insight.trim(), {
        date: dateStr,
        type: 'coach_insight'
    });

    res.json({ status: 'queued' });
});

// ─────────────────────────────────────────────
// DELETE /api/rag/user-memories
// Full cleanup — called on account deletion
// ─────────────────────────────────────────────
router.delete('/user-memories', authMiddleware, async (req, res) => {
    const userId = req.userId;
    try {
        const response = await fetch(`${AI_SERVICE_URL}/rag/delete-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId.toString() }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await response.json();
        res.json({ status: 'success', ...data });
    } catch (e) {
        console.error('[RAG] delete-user-memories error:', e);
        res.status(500).json({ message: 'Failed to delete memories', error: e.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/rag/source-memory
// Delete memory for a specific deleted record
// ─────────────────────────────────────────────
router.delete('/source-memory', authMiddleware, async (req, res) => {
    const { sourceType, sourceId } = req.body;
    const userId = req.userId;

    if (!sourceType || !sourceId) {
        return res.status(400).json({ message: 'sourceType and sourceId required' });
    }

    try {
        const response = await fetch(`${AI_SERVICE_URL}/rag/delete-source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId.toString(),
                source_type: sourceType,
                source_id: sourceId
            }),
            signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();
        res.json({ status: 'success', ...data });
    } catch (e) {
        console.error('[RAG] delete-source-memory error:', e);
        res.status(500).json({ message: 'Failed to delete source memory', error: e.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/rag/backfill
// On-demand idempotent backfill for authenticated user
// ─────────────────────────────────────────────
router.post('/backfill', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch user's last 30 days of data in parallel
        const [user, progressRecords, foodLogs, exerciseHistory] = await Promise.all([
            User.findById(userId).select('-password').lean(),
            DailyProgress.find({ userId, date: { $gte: thirtyDaysAgo } }).lean(),
            FoodLog.find({ userId, date: { $gte: thirtyDaysAgo } }).lean(),
            ExerciseHistory.find({ userId, date: { $gte: thirtyDaysAgo } }).lean()
        ]);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const response = await fetch(`${AI_SERVICE_URL}/rag/backfill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId.toString(),
                progress_records: progressRecords,
                food_logs: foodLogs,
                exercise_history: exerciseHistory,
                user_profile: {
                    goal: user.goal,
                    weight: user.weight,
                    targetWeight: user.targetWeight,
                    experience: user.experience,
                    injuries: user.injuries,
                    workoutEnvironment: user.workoutEnvironment,
                    dietPreference: user.dietPreference
                }
            }),
            signal: AbortSignal.timeout(60000) // backfill can take time
        });

        const data = await response.json();
        res.json({
            status: 'success',
            message: `Backfill complete: ${data.ingested || 0} memories ingested`,
            ...data
        });
    } catch (e) {
        console.error('[RAG] backfill error:', e);
        res.status(500).json({ message: 'Backfill failed', error: e.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/rag/health
// Check RAG system status
// ─────────────────────────────────────────────
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/rag/health`, {
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.json({ status: 'unavailable', error: e.message });
    }
});

export default router;
