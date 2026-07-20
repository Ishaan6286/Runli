import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import DailyProgress from '../models/DailyProgress.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { enqueueAiJob, aiQueue, aiQueueEvents } from '../services/queueService.js';

dotenv.config();

const router = express.Router();

// Initialize Gemini — use 2.0 Flash for speed + quality
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Helper: fallback to Groq LLM when Gemini is unavailable
const generateViaGroq = async (prompt) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq request failed: ${response.status} ${err}`);
    }
    const data = await response.json();
    // Groq returns choices[0].message.content
    return { response: { text: () => data.choices[0].message.content } };
};

// Try Gemini first, then Groq fallback with retry on 429
const generateWithRetry = async (prompt, maxRetries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            lastError = error;
            if (error.status === 429 && attempt < maxRetries) {
                const retryInfo = Array.isArray(error.errorDetails)
                    ? error.errorDetails.find(d => d['@type']?.includes('RetryInfo'))
                    : null;
                const delaySec = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) + 3 : 25;
                console.warn(`Gemini rate limit hit (429). Waiting ${delaySec}s before retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
                continue;
            }
            console.warn('Gemini failed, attempting Groq fallback:', error.message);
            try {
                const groqResult = await generateViaGroq(prompt);
                return groqResult;
            } catch (groqErr) {
                console.error('Groq fallback also failed:', groqErr);
                throw lastError;
            }
        }
    }
    throw lastError;
};

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
   Now fully RAG-enabled, powered by Python microservice.
───────────────────────────────────────────────────────────── */
router.post('/chat', authMiddleware, async (req, res) => {
    const { message, history = [], systemPrompt, userContext } = req.body;
    const userId = req.userId;

    if (!message?.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Prepare context data (profile and recent activity)
        let userProfile = {};
        let recentActivity = [];
        try {
            const user = await User.findById(userId).select('-password').lean();
            if (user) {
                userProfile = {
                    name: user.name,
                    goal: user.goal,
                    weight: user.weight,
                    targetWeight: user.targetWeight,
                    experience: user.experience,
                    dietPreference: user.dietPreference,
                    workoutEnvironment: user.workoutEnvironment,
                    injuries: user.injuries,
                    sleepHours: user.sleepHours
                };
            }
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const progress = await DailyProgress.find({ userId, date: { $gte: thirtyDaysAgo } })
                .sort({ date: -1 })
                .limit(3)
                .lean();
            
            recentActivity = progress.map(p => ({
                date: p.date.toISOString().slice(0, 10),
                gym: p.wentToGym,
                calories: p.caloriesConsumed,
                protein: p.proteinIntake,
                sleep: p.sleepHours,
                mood: p.moodScore
            }));
        } catch (e) {
            console.warn('[RAG] Failed to fetch context for Python service:', e.message);
        }

        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        
        // 1. Try Python RAG Service (Groq primary)
        try {
            const response = await fetch(`${AI_SERVICE_URL}/rag/coach-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId.toString(),
                    message,
                    history,
                    user_profile: userProfile,
                    recent_activity: recentActivity,
                    system_prompt: systemPrompt
                }),
                signal: AbortSignal.timeout(15000)
            });

            if (response.ok) {
                const data = await response.json();
                // Store RAG conversation back into memory if it generated a substantial reply
                if (data.text && data.text.length > 50) {
                    import('../services/ragService.js').then(({ ragIngest }) => {
                        const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
                        const insightText = `Coach told user: ${data.text}`;
                        ragIngest(userId, 'coach_conversation', timeStr, insightText, { type: 'coach_insight', date: new Date().toISOString().slice(0, 10) });
                    }).catch(() => {});
                }
                return res.json(data);
            }
            console.warn(`[RAG] Python service failed: ${response.status} — falling back to legacy Gemini`);
        } catch (e) {
            console.warn(`[RAG] Python service error: ${e.message} — falling back to legacy Gemini`);
        }

        // 2. Legacy Fallback: Gemini direct (no RAG)
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

        const finalSystemPrompt = (systemPrompt || `You are Runli Coach — a personal AI fitness coach. You are concise, warm, science-backed, and deeply personal. Never be generic. Replies must be SHORT (2-4 sentences max) unless the user explicitly asks for a full plan. Never mention OpenAI, ChatGPT, or Gemini.`) + emotionalHint;

        const chatHistory = history
            .filter(m => m.text?.trim())
            .slice(-10)
            .map(m => ({
                role: m.type === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
            }));

        const chat = model.startChat({
            history: chatHistory,
            systemInstruction: { parts: [{ text: finalSystemPrompt }] },
            generationConfig: { maxOutputTokens: 300, temperature: 0.75, topP: 0.9 },
        });

        const result = await chat.sendMessage(message);
        const text = (await result.response).text().trim();

        return res.json({ 
            text, 
            rag_sources: [], 
            memories_used: 0, 
            rag_enabled: false, 
            fallback_used: true 
        });

    } catch (error) {
        console.error('Chat error:', error?.message || error);
        return res.status(500).json({ error: 'AI unavailable', message: error?.message });
    }
});


router.get('/insight', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const progress = await DailyProgress.find({
            userId: req.userId,
            date: { $gte: threeDaysAgo }
        }).sort({ date: 1 });

        // Enqueue the job for worker processing
        const job = await enqueueAiJob('generate-insight', {
            user: {
                name: user.name,
                target: user.target,
                weight: user.weight
            },
            progress
        });

        // Wait for the job to finish using QueueEvents (keeps API synchronous for the frontend)
        const result = await job.waitUntilFinished(aiQueueEvents);
        
        res.json({ insight: result });

    } catch (error) {
        console.error("Error generating insight:", error);
        res.status(500).json({ message: "Failed to generate insight" });
    }
});

/* ─────────────────────────────────────────────────────
   POST /api/ai/digest — Weekly AI analytics digest (QUEUED)
───────────────────────────────────────────────────── */
router.post('/digest', authMiddleware, async (req, res) => {
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

        // Add job to the queue instead of waiting for Gemini
        const job = await enqueueAiJob('generate-digest', {
            userId: req.userId,
            meta: { gymDays, avgCalories, avgProtein, avgFormScore, weightChange }
        });

        res.status(202).json({ 
            message: "Digest generation started", 
            jobId: job.id 
        });

    } catch (error) {
        console.error("Digest error:", error);
        res.status(500).json({ message: "Failed to enqueue digest job" });
    }
});

/* ─────────────────────────────────────────────────────
   GET /api/ai/job/:id — Check AI background job status
───────────────────────────────────────────────────── */
router.get('/job/:id', authMiddleware, async (req, res) => {
    try {
        const job = await aiQueue.getJob(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });

        const state = await job.getState();
        
        if (state === 'completed') {
            return res.json({ status: 'completed', result: job.returnvalue });
        }
        
        if (state === 'failed') {
            return res.json({ status: 'failed', error: job.failedReason });
        }
        
        return res.json({ status: state }); // active, waiting, delayed, etc.
    } catch (error) {
        console.error("Job status error:", error);
        res.status(500).json({ message: "Failed to get job status" });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/generate-diet — AI Nutrition Optimization Engine
───────────────────────────────────────────────────────────── */
router.post('/generate-diet', authMiddleware, async (req, res) => {
    try {
        const { userProfile, targetCalories, targetProtein, budget, availableFoods, dietType } = req.body;

        // ─── 1. DETERMINISTIC BUDGET ENFORCEMENT ─────────────────────────────
        // Monthly range: ₹3,000 – ₹10,000  =>  daily range: ₹100 – ₹333
        const BUDGET_MIN_DAILY = 100;  // ₹3,000 / 30
        const BUDGET_MAX_DAILY = 334;  // ₹10,000 / 30 (rounded up)
        const rawBudget = Number(budget);
        const validatedDailyBudget = isNaN(rawBudget)
            ? BUDGET_MAX_DAILY
            : Math.min(BUDGET_MAX_DAILY, Math.max(BUDGET_MIN_DAILY, rawBudget));
        // ─────────────────────────────────────────────────────────────────────

        const prompt = `You are an elite AI sports nutritionist. Your task is to generate a daily meal plan using ONLY the provided foods database.

USER PROFILE:
- Goal: ${userProfile.goal}
- Weight: ${userProfile.weight}kg
- Diet Type: ${dietType}

TARGETS:
- Calories: ~${targetCalories} kcal
- Protein: >= ${targetProtein}g
- Daily Budget: <= ₹${validatedDailyBudget}

AVAILABLE FOODS (DO NOT INVENT FOODS. USE EXACT NAMES, PRICES, MACROS FROM THIS LIST):
${JSON.stringify(availableFoods)}

INSTRUCTIONS:
1. Select 3-4 items for breakfast, 3-4 items for lunch, 3-4 items for dinner, and 2-4 items for snacks.
2. Maximize protein per rupee (₹) without exceeding the total budget of ₹${validatedDailyBudget}.
3. The total calories should be within 10% of ${targetCalories} kcal.
4. Provide a JSON response EXACTLY matching this structure:
{
  "meals": {
    "breakfast": [{"name": "Exact Food Name"}],
    "lunch": [{"name": "Exact Food Name"}],
    "dinner": [{"name": "Exact Food Name"}],
    "snacks": [{"name": "Exact Food Name"}]
  },
  "explanation": {
    "whySelected": "A short, engaging explanation of why this plan fits their goal.",
    "budgetUtilization": "Explain how the ₹ budget was spent efficiently.",
    "proteinOptimization": "Explain how protein targets were hit.",
    "calorieCoverage": "Explain the calorie distribution."
  }
}
Do not include any markdown formatting like \`\`\`json. Return only raw JSON.`;

        const result = await generateWithRetry(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('\`\`\`json')) {
            text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
        }
        
        const plan = JSON.parse(text);

        // ─── 2. POST-GENERATION COST VALIDATION ──────────────────────────────
        // Build a lookup map from the submitted food database (name → price).
        // This is the ground-truth cost, not whatever the LLM claims.
        const allFoodsFlat = Array.isArray(availableFoods)
            ? availableFoods
            : Object.values(availableFoods || {}).flat();
        const foodPriceMap = new Map();
        allFoodsFlat.forEach(food => {
            if (food?.name) {
                foodPriceMap.set(String(food.name).trim().toLowerCase(), Number(food.price) || 0);
            }
        });

        let generatedTotalCost = 0;
        const mealSlots = plan?.meals ? Object.values(plan.meals) : [];
        for (const slot of mealSlots) {
            if (Array.isArray(slot)) {
                for (const item of slot) {
                    const foodName = (typeof item === 'string' ? item : item?.name || '').trim().toLowerCase();
                    generatedTotalCost += foodPriceMap.get(foodName) || 0;
                }
            }
        }

        if (generatedTotalCost > validatedDailyBudget * 1.05) {
            // 5% tolerance for rounding. If exceeded, reject the LLM plan.
            const err = new Error(`AI plan cost ₹${generatedTotalCost.toFixed(0)} exceeds validated daily budget ₹${validatedDailyBudget}. Triggering fallback.`);
            err.budgetExceeded = true;
            throw err;
        }
        // ─────────────────────────────────────────────────────────────────────

        res.json(plan);

    } catch (error) {
        console.error("AI Diet Generation Error:", error);
        res.status(500).json({ message: "Failed to generate AI diet plan", error: error.message });
    }
});


/* ─────────────────────────────────────────────────────────────
   POST /api/ai/swap-food — Intelligent Food Swapping
───────────────────────────────────────────────────────────── */
router.post('/swap-food', authMiddleware, async (req, res) => {
    try {
        const { slot, currentFood, availableFoods, remainingBudget, targetCalories, targetProtein } = req.body;

        const prompt = `You are an AI nutritionist. The user wants to swap "${currentFood.name}" from their ${slot}.
        
Constraints:
- Max extra cost allowed: ₹${remainingBudget} (The replacement's price must be <= this value)
- Try to match or exceed ${targetProtein}g protein and match ~${targetCalories} kcal.

AVAILABLE FOODS FOR THIS SLOT:
${JSON.stringify(availableFoods)}

Select EXACTLY ONE replacement food from the list that is NOT "${currentFood.name}".

Return raw JSON only:
{
  "replacement": { "name": "Exact Food Name from list" }
}`;

        const result = await generateWithRetry(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('\`\`\`json')) {
            text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
        }

        const swap = JSON.parse(text);
        res.json(swap);

    } catch (error) {
        console.error("AI Food Swap Error:", error);
        res.status(500).json({ message: "Failed to swap food", error: error.message });
    }
});

export default router;
