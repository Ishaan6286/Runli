import express from 'express';
import jwt from 'jsonwebtoken';
import DailyProgress from '../models/DailyProgress.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Get progress for a range (MUST be before /:date route)
router.get('/range/:startDate/:endDate', authMiddleware, async (req, res) => {
    try {
        const start = new Date(req.params.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(req.params.endDate);
        end.setHours(23, 59, 59, 999);

        const progress = await DailyProgress.find({
            userId: req.userId,
            date: { $gte: start, $lte: end }
        });
        res.json({ progress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get progress for a specific date
router.get('/:date', authMiddleware, async (req, res) => {
    try {
        const dateStr = req.params.date; // YYYY-MM-DD
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const progress = await DailyProgress.findOne({
            userId: req.userId,
            date: date
        });
        res.json({ progress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Update progress for a specific date (Upsert)
router.post('/:date', authMiddleware, async (req, res) => {
    try {
        const dateStr = req.params.date;
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const { waterIntake, caloriesConsumed, proteinIntake, wentToGym } = req.body;

        const updateData = {};
        if (waterIntake !== undefined) updateData.waterIntake = waterIntake;
        if (caloriesConsumed !== undefined) updateData.caloriesConsumed = caloriesConsumed;
        if (proteinIntake !== undefined) updateData.proteinIntake = proteinIntake;
        if (wentToGym !== undefined) updateData.wentToGym = wentToGym;
        if (req.body.weight !== undefined) updateData.weight = req.body.weight;
        if (req.body.dietPlanCompleted !== undefined) updateData.dietPlanCompleted = req.body.dietPlanCompleted;
        // Wellness / recovery fields
        if (req.body.sleepHours !== undefined) updateData.sleepHours = req.body.sleepHours;
        if (req.body.moodScore !== undefined) updateData.moodScore = req.body.moodScore;
        if (req.body.steps !== undefined) updateData.steps = req.body.steps;
        if (req.body.recoveryScore !== undefined) updateData.recoveryScore = req.body.recoveryScore;

        const progress = await DailyProgress.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        // --- RAG INGESTION (Fire and forget) ---
        import('../services/ragService.js').then(({ ingestProgress }) => {
            ingestProgress(req.userId, dateStr, progress);
        }).catch(err => console.error("Failed to load ragService:", err));


        res.json({ progress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
