import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import DailyProgress from '../models/DailyProgress.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Middleware to verify token
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

router.get('/insight', authMiddleware, async (req, res) => {
    try {
        // 1. Fetch User Profile
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Fetch Recent Progress (Last 3 days)
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const progress = await DailyProgress.find({
            userId: req.userId,
            date: { $gte: threeDaysAgo }
        }).sort({ date: 1 });

        // 3. Construct Prompt
        const prompt = `
        Act as a motivational fitness coach. Based on the following user data, provide a SINGLE, short, punchy, and personalized daily insight or tip (max 2 sentences).
        
        User Profile:
        - Name: ${user.name}
        - Goal: ${user.target || 'General Fitness'}
        - Weight: ${user.weight}kg
        
        Recent Activity (Last 3 Days):
        ${progress.map(p => `
        - Date: ${p.date.toDateString()}
        - Gym: ${p.wentToGym ? 'Yes' : 'No'}
        - Calories: ${p.caloriesConsumed} (Goal: ~${user.target === 'Lose Weight' ? 2000 : 2500})
        - Protein: ${p.proteinIntake}g
        `).join('\n')}
        
        If the user has been consistent, praise them. If they missed the gym or goals, gently encourage them. Focus on ONE specific thing (e.g., protein, hydration, or gym consistency).
        `;

        // 4. Generate Insight
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ insight: text });

    } catch (error) {
        console.error("Error generating insight:", error);
        res.status(500).json({ message: "Failed to generate insight" });
    }
});

export default router;
