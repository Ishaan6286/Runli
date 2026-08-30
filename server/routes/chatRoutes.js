import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const SYSTEM_INSTRUCTION = `
You are the Runli Fitness Assistant, a helpful and motivating AI coach for the Runli app.
Your goal is to help users with fitness, nutrition, wellness, and navigating the Runli app.

Key Runli Features:
- BMI Calculator (Home Page): Helps users understand their health status.
- Diet Plan (/plan): Generates personalized meal plans based on goals.
- Dashboard (/dashboard): Tracks daily water, calories, protein, and gym attendance.
- Shopping (/shopping): Offers fitness supplements and gear.
- Videos (/videos): Provides workout tutorials.
- Profile (/userinfo): User settings and goals.

Guidelines:
- Be encouraging, positive, and empathetic.
- Provide emotional support and motivation when users are feeling down.
- If asked about medical advice, suggest consulting a professional.
- If asked about app features, guide them to the specific page.
- Keep responses under 3-4 sentences unless a detailed explanation is requested.
- You can use emojis to be friendly! 🏃‍♂️💪🥗
- Be conversational and supportive, especially for emotional queries.
`;

const generateGroqChat = async (message, history = [], userData = null) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    let dynamicInstruction = SYSTEM_INSTRUCTION;
    if (userData) {
        dynamicInstruction += `\n\nUser Context Data:\n- Profile: ${JSON.stringify(userData.profile, null, 2)}\n- Workout Plan: ${JSON.stringify(userData.workoutPlan, null, 2)}\n- Gym History: ${JSON.stringify(userData.gymHistory, null, 2)}\nUse this data to give personalized, specific advice instead of generic responses.`;
    }

    const messages = [{ role: 'system', content: dynamicInstruction }];
    (history || []).slice(-10).forEach(m => {
        if (m.text?.trim()) {
            messages.push({
                role: m.type === 'user' ? 'user' : 'assistant',
                content: m.text
            });
        }
    });
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
            messages,
            temperature: 0.7,
            max_tokens: 300,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq chat failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
};

router.post('/', async (req, res) => {
    try {
        const { message, history = [], userData = null } = req.body;
        let text = '';

        // 1. Try Groq Primary
        if (process.env.GROQ_API_KEY) {
            try {
                text = await generateGroqChat(message, history, userData);
            } catch (groqErr) {
                console.warn('Groq chat endpoint error:', groqErr.message);
            }
        }

        // 2. Fallback if Groq fails
        if (!text) {
            return res.json({
                text: "I'm currently in offline mode. Please configure my API key in the server settings to unlock my full AI potential!",
                isOffline: true
            });
        }

        return res.json({ text, isOffline: false });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Error processing your message' });
    }
});

export default router;
