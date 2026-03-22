import express from 'express';
import jwt from 'jsonwebtoken';
import DailyProgress from '../models/DailyProgress.js';

const router = express.Router();

// ── JWT Middleware ────────────────────────────────────────
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

/**
 * GET /api/prediction/forecast
 * Returns the last 90 days of DailyProgress data structured as clean series
 * for the frontend prediction engine (or a future ML service).
 *
 * Response shape:
 * {
 *   weightSeries:    [{ date, weight }],         // days with weight logged
 *   calorieSeries:   [{ date, calories }],        // all days with calorie data
 *   gymSeries:       [{ date, wentToGym }],       // all days
 *   gymDays:         number,                      // count of gym sessions
 *   totalDays:       number,                      // total days in window
 *   consistencyPct:  number,                      // 0–100
 *   windowDays:      90,
 * }
 */
router.get('/forecast', authMiddleware, async (req, res) => {
    try {
        const windowDays = parseInt(req.query.days) || 90;

        const end   = new Date();
        const start = new Date(Date.now() - windowDays * 86400000);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const records = await DailyProgress.find({
            userId: req.userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: 1 }).lean();

        // ── Build series ────────────────────────────────────
        const weightSeries = records
            .filter(r => r.weight != null && r.weight > 0)
            .map(r => ({
                date:   r.date.toISOString().slice(0, 10),
                weight: r.weight,
            }));

        const calorieSeries = records
            .filter(r => r.caloriesConsumed > 0)
            .map(r => ({
                date:     r.date.toISOString().slice(0, 10),
                calories: r.caloriesConsumed,
            }));

        const gymSeries = records.map(r => ({
            date:      r.date.toISOString().slice(0, 10),
            wentToGym: r.wentToGym || false,
        }));

        const gymDays      = gymSeries.filter(r => r.wentToGym).length;
        const totalDays    = records.length;
        const consistencyPct = totalDays > 0 ? Math.round((gymDays / totalDays) * 100) : 0;

        res.json({
            weightSeries,
            calorieSeries,
            gymSeries,
            gymDays,
            totalDays,
            consistencyPct,
            windowDays,
        });
    } catch (err) {
        console.error('[prediction/forecast]', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
