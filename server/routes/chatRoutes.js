import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

const generateGroqChat = async (message, history = []) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
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
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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

// Gemini Fallback
const getGeminiModel = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PLACEHOLDER_KEY') {
        return null;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION
    });
};

router.post('/', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        let text = '';

        // 1. Try Groq Primary
        if (process.env.GROQ_API_KEY) {
            try {
                text = await generateGroqChat(message, history);
            } catch (groqErr) {
                console.warn('Groq chat endpoint error, trying Gemini fallback:', groqErr.message);
            }
        }

        // 2. Fallback to Gemini
        if (!text) {
            const model = getGeminiModel();
            if (!model) {
                return res.json({
                    text: "I'm currently in offline mode. Please configure my API key in the server settings to unlock my full AI potential!",
                    isOffline: true
                });
            }

            let chatHistory = history.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const firstUserIdx = chatHistory.findIndex(m => m.role === 'user');
            if (firstUserIdx !== -1) {
                chatHistory = chatHistory.slice(firstUserIdx);
            } else {
                chatHistory = [];
            }

            const chat = model.startChat({
                history: chatHistory,
                generationConfig: { maxOutputTokens: 300 },
            });

            const result = await chat.sendMessage(message);
            text = result.response.text();
        }

        res.json({ text });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ text: "I'm having trouble connecting to my brain right now. Please try again later." });
    }
});

export default router;
