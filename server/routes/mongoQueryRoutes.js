import express from 'express';
import DailyProgress from '../models/DailyProgress.js';
import ExerciseHistory from '../models/ExerciseHistory.js';
import FoodLog from '../models/FoodLog.js';

const router = express.Router();

// Internal middleware: only the Python AI service can call this
const aiServiceAuth = (req, res, next) => {
    const secret = req.headers['x-ai-service-secret'];
    if (!secret || secret !== process.env.AI_SERVICE_SECRET) {
        return res.status(403).json({ error: 'Unauthorized AI Service request' });
    }
    next();
};

/**
 * Internal route for Python RAG service to fetch user data.
 * Body can specify filters for arbitrary date ranges, metric names, etc.
 */
router.post('/user-data', aiServiceAuth, async (req, res) => {
    try {
        const { userId, collections = [], dateRange = {}, limit = 100 } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const data = {};
        
        // Build date filter
        const dateFilter = {};
        if (dateRange.start) dateFilter.$gte = new Date(dateRange.start);
        if (dateRange.end) dateFilter.$lte = new Date(dateRange.end);
        
        const queryWithDate = Object.keys(dateFilter).length > 0 
            ? { userId, date: dateFilter } 
            : { userId };

        // Fetch requested collections
        if (collections.includes('DailyProgress')) {
            data.dailyProgress = await DailyProgress.find(queryWithDate)
                .sort({ date: -1 })
                .limit(limit)
                .lean();
        }

        if (collections.includes('ExerciseHistory')) {
            // Support filtering by exercise name if provided in req.body
            const exerciseFilter = req.body.exerciseName 
                ? { ...queryWithDate, 'exerciseName': new RegExp(req.body.exerciseName, 'i') } 
                : queryWithDate;
                
            data.exerciseHistory = await ExerciseHistory.find(exerciseFilter)
                .sort({ date: -1 })
                .limit(limit)
                .lean();
        }

        if (collections.includes('FoodLog')) {
            data.foodLog = await FoodLog.find(queryWithDate)
                .sort({ date: -1 })
                .limit(limit)
                .lean();
        }

        return res.json({ success: true, data });
    } catch (error) {
        console.error('[AI Bridge] Error fetching user data:', error);
        return res.status(500).json({ error: 'Internal bridge error' });
    }
});

export default router;
