import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Gemini
const getModel = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PLACEHOLDER_KEY') {
        return null;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({
        model: "models/gemini-pro",
        systemInstruction: `
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
`
    });
};

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;
        const model = getModel();

        if (!model) {
            return res.json({
                text: "I'm currently in offline mode. Please configure my API key in the server settings to unlock my full AI potential! For now, I can help you navigate the app.",
                isOffline: true
            });
        }

        // Convert frontend history format to Gemini format
        const chatHistory = history.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 300,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ text: "I'm having trouble connecting to my brain right now. Please try again later." });
    }
});

export default router;
