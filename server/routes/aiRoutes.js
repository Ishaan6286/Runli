import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import DailyProgress from '../models/DailyProgress.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

dotenv.config();

const router = express.Router();

// Initialize Gemini — use 2.0 Flash for speed + quality
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Middleware to verify token (optional for chat — chat can work for guests too)
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

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/chat — Conversational AI Coach
   Supports: multi-turn history, user context, emotional intelligence
───────────────────────────────────────────────────────────── */
router.post('/chat', async (req, res) => {
    const { message, history = [], systemPrompt, userContext } = req.body;

    if (!message?.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // ── Emotional tone detection (server-side reinforcement) ──
    const msg = message.toLowerCase();
    let emotionalHint = '';
    if (/tired|exhausted|burnout|drained|low energy/i.test(msg)) {
        emotionalHint = '\n[USER EMOTIONAL STATE: Low energy / tired. Lead with empathy and recovery advice, DO NOT push hard training.]';
    } else if (/sad|depressed|unmotivated|don.?t want|can.?t be bothered|feel low|feeling low/i.test(msg)) {
        emotionalHint = '\n[USER EMOTIONAL STATE: Emotionally down. Acknowledge feelings first. Be warm, kind, human. Short reply. One gentle actionable nudge at most.]';
    } else if (/skip|skipped|missed|didn.?t go|couldn.?t make it/i.test(msg)) {
        emotionalHint = '\n[USER EMOTIONAL STATE: Feeling guilty about skipping. Do NOT shame. Normalize it, refocus on tomorrow, keep it brief and warm.]';
    } else if (/angry|frustrated|stress|overwhelmed/i.test(msg)) {
        emotionalHint = '\n[USER EMOTIONAL STATE: Stressed or frustrated. Use exercise as a stress relief tool. Be calm, understanding, grounding.]';
    } else if (/great|amazing|crushed|killed it|best|pr|personal best/i.test(msg)) {
        emotionalHint = '\n[USER EMOTIONAL STATE: Positive and energized. Match their energy! Celebrate and channel it forward.]';
    }

    // ── Build the full system prompt ──
    const finalSystemPrompt = (systemPrompt || `You are Runli Coach — a personal AI fitness coach. You are concise, warm, science-backed, and deeply personal. Never be generic. Replies must be SHORT (2-4 sentences max) unless the user explicitly asks for a full plan. Never mention OpenAI, ChatGPT, or Gemini.`) + emotionalHint;

    try {
        // ── Build conversation history for Gemini ──
        // Gemini uses alternating user/model roles
        const chatHistory = history
            .filter(m => m.text?.trim())
            .slice(-10) // last 5 turns (10 messages)
            .map(m => ({
                role: m.type === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
            }));

        const chat = model.startChat({
            history: chatHistory,
            systemInstruction: { parts: [{ text: finalSystemPrompt }] },
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.75,
                topP: 0.9,
            },
        });

        const result = await chat.sendMessage(message);
        const text = (await result.response).text().trim();

        return res.json({ text });
    } catch (error) {
        console.error('Chat error:', error?.message || error);
        return res.status(500).json({ error: 'AI unavailable', message: error?.message });
    }
});


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

/* ─────────────────────────────────────────────────────
   GET /api/ai/digest — Weekly AI analytics digest.
───────────────────────────────────────────────────── */
router.get('/digest', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [progress, poseEvents] = await Promise.all([
            DailyProgress.find({ userId: req.userId, date: { $gte: sevenDaysAgo } }).sort({ date: 1 }).lean(),
            AnalyticsEvent.find({ userId: req.userId, event: 'pose_analyzed', timestamp: { $gte: sevenDaysAgo } }).lean(),
        ]);

        const gymDays     = progress.filter(p => p.wentToGym).length;
        const avgCalories = progress.length ? Math.round(progress.reduce((s, p) => s + (p.caloriesConsumed || 0), 0) / progress.length) : 0;
        const avgProtein  = progress.length ? Math.round(progress.reduce((s, p) => s + (p.proteinIntake  || 0), 0) / progress.length) : 0;
        const avgFormScore = poseEvents.length ? Math.round(poseEvents.reduce((s, e) => s + (e.properties?.formScore || 0), 0) / poseEvents.length) : null;
        const weights = progress.filter(p => p.weight > 0).map(p => p.weight);
        const weightChange = weights.length >= 2 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null;

        const prompt = `You are an expert fitness analytics AI. Generate a weekly report in STRICT JSON (no markdown).

User: ${user.name}, Goal: ${user.goal || 'General Fitness'}, Weight: ${user.weight}kg
Last 7 Days: gym ${gymDays}/7, avg cal ${avgCalories}, avg protein ${avgProtein}g, form score ${avgFormScore ?? 'N/A'}, weight change ${weightChange ?? 'N/A'}kg

Return ONLY this JSON:
{"headline":"string","weeklyScore":0-100,"insights":[{"type":"positive|warn|predict|challenge","text":"string"},{"type":"...","text":"..."},{"type":"...","text":"..."}],"tip":"string"}`;

        const result  = await model.generateContent(prompt);
        const rawText = (await result.response).text().trim();

        let digest;
        try {
            digest = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, ''));
        } catch {
            digest = { headline: rawText.slice(0, 100), weeklyScore: 70, insights: [{ type: 'positive', text: rawText }], tip: 'Keep it up!' };
        }

        res.json({ digest, meta: { gymDays, avgCalories, avgProtein, avgFormScore, weightChange } });

    } catch (error) {
        console.error("Digest error:", error);
        res.status(500).json({ message: "Failed to generate digest" });
    }
});

export default router;
