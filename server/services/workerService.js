import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DailyProgress from '../models/DailyProgress.js';

dotenv.config();

// Connect to Redis instance — BullMQ requires maxRetriesPerRequest: null
const connection = new Redis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null // Do not reconnect if it fails
});
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const startAiWorker = () => {
    const worker = new Worker('ai-jobs', async job => {
        console.log(`Processing job ${job.id} of type ${job.name}`);

        if (job.name === 'generate-digest') {
            const { userId, meta } = job.data;
            const user = await User.findById(userId);
            
            if (!user) throw new Error("User not found");

            try {
                const response = await fetch(`${AI_SERVICE_URL}/generate/digest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user._id || "unknown",
                        user_name: user.name,
                        goal: user.goal || 'General Fitness',
                        weight: user.weight || 70,
                        gymDays: meta.gymDays || 0,
                        avgCalories: meta.avgCalories || 0,
                        avgProtein: meta.avgProtein || 0,
                        avgFormScore: meta.avgFormScore || null,
                        weightChange: meta.weightChange || null
                    })
                });

                if (!response.ok) throw new Error(`FastAPI returned ${response.status}`);
                const data = await response.json();
                return data.digest;
            } catch (err) {
                console.error("FastAPI call failed for digest:", err);
                throw err;
            }
        }

        if (job.name === 'generate-insight') {
            const { user, progress } = job.data;
            
            const progressSummary = progress.map(p => `
            - Date: ${new Date(p.date).toDateString()}
            - Gym: ${p.wentToGym ? 'Yes' : 'No'}
            - Calories: ${p.caloriesConsumed}
            - Protein: ${p.proteinIntake}g
            `).join('\n');

            try {
                const response = await fetch(`${AI_SERVICE_URL}/generate/insight`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user._id || "unknown",
                        user_name: user.name,
                        target: user.target || 'General Fitness',
                        weight: user.weight || 70,
                        progress_summary: progressSummary
                    })
                });

                if (!response.ok) throw new Error(`FastAPI returned ${response.status}`);
                const data = await response.json();
                return data.insight;
            } catch (err) {
                console.error("FastAPI call failed:", err);
                throw err;
            }
        }

        if (job.name === 'predict-churn-all-users') {
            console.log("Running nightly churn prediction for all users...");
            const users = await User.find({});
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            for (const user of users) {
                const progress = await DailyProgress.find({
                    userId: user._id,
                    date: { $gte: sevenDaysAgo }
                }).sort({ date: 1 }).lean();

                const gymDays = progress.filter(p => p.wentToGym).length;
                const avgCalories = progress.length ? progress.reduce((s, p) => s + (p.caloriesConsumed || 0), 0) / progress.length : 0;
                const avgProtein = progress.length ? progress.reduce((s, p) => s + (p.proteinIntake || 0), 0) / progress.length : 0;
                
                // Calculate days since last gym
                let daysSinceLastGym = 7; // default max
                const lastGymDay = progress.slice().reverse().find(p => p.wentToGym);
                if (lastGymDay) {
                    const diffTime = Math.abs(new Date() - new Date(lastGymDay.date));
                    daysSinceLastGym = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                try {
                    const response = await fetch(`${AI_SERVICE_URL}/predict/skip`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user._id.toString(),
                            gym_days_last_7: gymDays,
                            avg_calories_last_7: avgCalories,
                            avg_protein_last_7: avgProtein,
                            days_since_last_gym: daysSinceLastGym
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.risk_level === 'High') {
                            // Simulate sending push notification
                            console.log(`[CHURN ALERT] High risk for ${user.name}. Sending push notification: ${data.actionable_insight}`);
                        }
                    }
                } catch (e) {
                    console.error(`Prediction failed for ${user.name}:`, e);
                }
            }
            return { status: "Churn prediction completed", usersProcessed: users.length };
        }

    }, { connection });

    worker.on('completed', job => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} has failed with ${err.message}`);
    });

    return worker;
};
