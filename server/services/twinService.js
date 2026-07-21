import { GoogleGenerativeAI } from '@google/generative-ai';
import DailyProgress from '../models/DailyProgress.js';
import FitnessScore from '../models/FitnessScore.js';
import User from '../models/User.js';
import Twin from '../models/Twin.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export const generateTwinInsights = async (userId) => {
    try {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error("User not found");

        // Fetch last 30 days of data to find patterns
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);

        const progressList = await DailyProgress.find({
            userId,
            date: { $gte: cutoff }
        }).sort({ date: 1 }).lean();

        const scoreList = await FitnessScore.find({
            userId,
            date: { $gte: cutoff }
        }).sort({ date: 1 }).lean();

        // Summarize history
        const historyText = progressList.map(p => {
            const date = p.date.toISOString().split('T')[0];
            return `Date: ${date} - Gym: ${p.wentToGym ? 'Yes' : 'No'} - Calories: ${p.caloriesConsumed} - Protein: ${p.proteinIntake}g - Weight: ${p.weight || 'N/A'}`;
        }).join('\n');

        const scoreText = scoreList.map(s => {
            const date = s.date.toISOString().split('T')[0];
            return `Date: ${date} - Score: ${s.totalScore}`;
        }).join('\n');

        const prompt = `
        You are the AI Learning Engine for Runli. Your job is to analyze the user's past 30 days of activity and distill their habits into a structured "Digital Twin" JSON.
        
        User Profile: Name: ${user.name}, Goal: ${user.goal || 'Fitness'}, Target Weight: ${user.targetWeight || 'N/A'}
        
        Recent Activity (Progress):
        ${historyText}
        
        Recent Fitness Scores:
        ${scoreText}
        
        Identify recurring patterns and insights about the user's:
        1. Workout Behavior (e.g., "Tends to skip workouts on weekends", "Consistent 4 days a week")
        2. Diet Behavior (e.g., "Protein intake drops after missed workouts", "Consistently hits calorie goals")
        3. Recovery Patterns (e.g., "Performance score drops when logging low calories for 2 days")
        4. Motivation Patterns (e.g., "High streaks follow good weigh-ins")
        5. Adherence Patterns (e.g., "Struggles with consistency mid-month")
        
        Respond ONLY with a valid JSON object in this exact format. Limit each array to 2-3 of the most accurate, concise, personalized insights (1-2 sentences each). DO NOT wrap in markdown blocks like \`\`\`json.
        {
            "workoutBehavior": ["insight 1", "insight 2"],
            "dietBehavior": ["insight 1", "insight 2"],
            "recoveryPatterns": ["insight 1"],
            "motivationPatterns": ["insight 1"],
            "adherencePatterns": ["insight 1"]
        }
        `;

        let text = '';
        if (process.env.GROQ_API_KEY) {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    text = data.choices?.[0]?.message?.content?.trim() || '';
                }
            } catch (groqErr) {
                console.warn("Groq failed in twinService, attempting Gemini:", groqErr.message);
            }
        }

        if (!text) {
            const result = await model.generateContent(prompt);
            text = result.response.text().trim();
        }
        
        if (text.startsWith('```json')) text = text.substring(7);
        if (text.startsWith('```')) text = text.substring(3);
        if (text.endsWith('```')) text = text.slice(0, -3);
        text = text.trim();

        const insights = JSON.parse(text);

        const updatedTwin = await Twin.findOneAndUpdate(
            { userId },
            {
                ...insights,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );

        return updatedTwin;
    } catch (error) {
        console.error("Twin Learning Engine Error:", error);
        throw error;
    }
};
