// server/services/ragService.js
// Shared RAG service to keep vector memory in sync
// These functions are fire-and-forget and gracefully fail if the AI service is down.

import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Core ingest function to send data to the Python AI service
 */
export const ragIngest = async (userId, sourceType, sourceId, memoryText, metadata = {}) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId.toString(),
                source_type: sourceType,
                source_id: sourceId,
                memory_text: memoryText,
                metadata
            }),
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
            console.warn(`[RAG] ingest warning: ${response.status} for ${sourceType}:${sourceId}`);
        }
    } catch (e) {
        console.warn(`[RAG] ingest failed silently: ${e.message}`);
    }
};

export const ingestProgress = async (userId, dateStr, progress) => {
    try {
        const { wentToGym, caloriesConsumed, proteinIntake, waterIntake, sleepHours, moodScore, steps, weight } = progress;
        const parts = [`On ${dateStr}:`];
        parts.push(`Gym: ${wentToGym ? 'Yes' : 'No'}`);
        if (caloriesConsumed) parts.push(`Calories: ${caloriesConsumed}`);
        if (proteinIntake) parts.push(`Protein: ${proteinIntake}g`);
        if (waterIntake) parts.push(`Water: ${waterIntake}ml`);
        if (sleepHours != null) parts.push(`Sleep: ${sleepHours}h`);
        if (moodScore != null) {
            const moodLabel = { 1: 'Very low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Excellent' }[moodScore] || moodScore;
            parts.push(`Mood: ${moodLabel}`);
        }
        if (weight) parts.push(`Weight: ${weight}kg`);
        if (steps) parts.push(`Steps: ${steps}`);

        const memoryText = parts.join(' | ');
        await ragIngest(userId, 'daily_progress', dateStr, memoryText, {
            date: dateStr,
            gym: wentToGym || false,
            calories: caloriesConsumed || 0,
            protein: proteinIntake || 0
        });
    } catch (e) {
        console.warn('[RAG] ingestProgress error:', e.message);
    }
};

export const ingestNutrition = async (userId, dateStr, foodLogId, totalCalories, totalProtein, foods) => {
    try {
        const sourceId = foodLogId || dateStr;
        const foodNames = Array.isArray(foods) ? foods.slice(0, 5).map(f => f.name || '').filter(Boolean) : [];
        let memoryText = `On ${dateStr}, nutrition log: ${totalCalories || 0} kcal total, ${totalProtein || 0}g protein.`;
        if (foodNames.length > 0) {
            memoryText += ` Foods: ${foodNames.join(', ')}.`;
        }

        await ragIngest(userId, 'nutrition', sourceId, memoryText, {
            date: dateStr,
            total_calories: totalCalories || 0,
            total_protein: totalProtein || 0
        });
    } catch (e) {
        console.warn('[RAG] ingestNutrition error:', e.message);
    }
};

export const ingestWorkout = async (userId, dateStr, exerciseId, exerciseName, reps, formScore) => {
    try {
        const sourceId = exerciseId || `${exerciseName}_${dateStr}`;
        let memoryText = `On ${dateStr}, performed ${exerciseName}: ${reps} reps.`;
        if (formScore != null) memoryText += ` Form score: ${formScore}/100.`;

        await ragIngest(userId, 'exercise', sourceId, memoryText, {
            date: dateStr,
            exercise: exerciseName,
            form_score: formScore || 0
        });
    } catch (e) {
        console.warn('[RAG] ingestWorkout error:', e.message);
    }
};

export const ingestGoal = async (userId, user) => {
    try {
        const goalMap = { lose_weight: 'fat loss', gain_muscle: 'muscle gain', maintain: 'maintaining weight' };
        const goalText = goalMap[user.goal] || user.goal || 'general fitness';

        const parts = [`User's fitness goal is ${goalText}.`];
        if (user.weight) parts.push(`Current weight: ${user.weight}kg.`);
        if (user.targetWeight) parts.push(`Target weight: ${user.targetWeight}kg.`);
        if (user.experience) parts.push(`Experience level: ${user.experience}.`);
        if (user.workoutEnvironment) parts.push(`Prefers working out: ${user.workoutEnvironment}.`);
        if (user.injuries?.length > 0) parts.push(`Known injuries: ${user.injuries.join(', ')}.`);
        if (user.dietPreference) parts.push(`Diet preference: ${user.dietPreference}.`);

        const memoryText = parts.join(' ');
        await ragIngest(userId, 'fitness_goal', 'profile', memoryText, {
            goal: user.goal || '',
            experience: user.experience || '',
            workout_env: user.workoutEnvironment || ''
        });
    } catch (e) {
        console.warn('[RAG] ingestGoal error:', e.message);
    }
};

export const deleteUserMemories = async (userId) => {
    try {
        await fetch(`${AI_SERVICE_URL}/rag/delete-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId.toString() }),
            signal: AbortSignal.timeout(10000)
        });
    } catch (e) {
        console.warn('[RAG] deleteUserMemories error:', e.message);
    }
};
