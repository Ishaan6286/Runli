import Achievement from '../models/Achievement.js';
import User from '../models/User.js';

// ------------------------------------------------------------------
// Achievement Definitions
// ------------------------------------------------------------------
export const ACHIEVEMENTS_DEF = {
    // Workouts
    WORKOUT_1:    { id: 'WORKOUT_1',    category: 'Workouts', title: 'First Workout', desc: 'Complete your first workout', target: 1, xp: 50 },
    WORKOUT_5:    { id: 'WORKOUT_5',    category: 'Workouts', title: 'Getting Started', desc: 'Complete 5 workouts', target: 5, xp: 100 },
    WORKOUT_10:   { id: 'WORKOUT_10',   category: 'Workouts', title: 'Consistent', desc: 'Complete 10 workouts', target: 10, xp: 150 },
    WORKOUT_25:   { id: 'WORKOUT_25',   category: 'Workouts', title: 'Dedicated', desc: 'Complete 25 workouts', target: 25, xp: 250 },
    WORKOUT_50:   { id: 'WORKOUT_50',   category: 'Workouts', title: 'Half Century', desc: 'Complete 50 workouts', target: 50, xp: 500 },
    WORKOUT_100:  { id: 'WORKOUT_100',  category: 'Workouts', title: 'Century', desc: 'Complete 100 workouts', target: 100, xp: 1000 },
    WORKOUT_250:  { id: 'WORKOUT_250',  category: 'Workouts', title: 'Elite', desc: 'Complete 250 workouts', target: 250, xp: 2500 },
    WORKOUT_500:  { id: 'WORKOUT_500',  category: 'Workouts', title: 'Master', desc: 'Complete 500 workouts', target: 500, xp: 5000 },
    WORKOUT_1000: { id: 'WORKOUT_1000', category: 'Workouts', title: 'Legend', desc: 'Complete 1000 workouts', target: 1000, xp: 10000 },

    // Streaks
    STREAK_3:   { id: 'STREAK_3',   category: 'Workout Streak', title: 'On Fire', desc: '3 Day Streak', target: 3, xp: 100 },
    STREAK_7:   { id: 'STREAK_7',   category: 'Workout Streak', title: 'Weekly Warrior', desc: '7 Day Streak', target: 7, xp: 150 },
    STREAK_14:  { id: 'STREAK_14',  category: 'Workout Streak', title: 'Two Weeks Strong', desc: '14 Day Streak', target: 14, xp: 300 },
    STREAK_30:  { id: 'STREAK_30',  category: 'Workout Streak', title: 'Monthly Master', desc: '30 Day Streak', target: 30, xp: 500 },
    STREAK_60:  { id: 'STREAK_60',  category: 'Workout Streak', title: 'Unstoppable', desc: '60 Day Streak', target: 60, xp: 1000 },
    STREAK_100: { id: 'STREAK_100', category: 'Workout Streak', title: 'Century Streak', desc: '100 Day Streak', target: 100, xp: 2500 },
    STREAK_365: { id: 'STREAK_365', category: 'Workout Streak', title: 'A Year of Sweat', desc: '365 Day Streak', target: 365, xp: 10000 },

    // Nutrition
    PROTEIN_1:   { id: 'PROTEIN_1',   category: 'Nutrition', title: 'Protein Goal', desc: 'Hit protein goal once', target: 1, xp: 50 },
    PROTEIN_5:   { id: 'PROTEIN_5',   category: 'Nutrition', title: 'Protein King', desc: 'Hit protein goal 5 times', target: 5, xp: 100 },
    PROTEIN_25:  { id: 'PROTEIN_25',  category: 'Nutrition', title: 'Protein Master', desc: 'Hit protein goal 25 times', target: 25, xp: 300 },
    PROTEIN_100: { id: 'PROTEIN_100', category: 'Nutrition', title: 'Protein Legend', desc: 'Hit protein goal 100 times', target: 100, xp: 1000 },

    MEAL_3:   { id: 'MEAL_3',   category: 'Nutrition', title: 'Meal Planner (3)', desc: 'Log meals for 3 days', target: 3, xp: 50 },
    MEAL_7:   { id: 'MEAL_7',   category: 'Nutrition', title: 'Meal Planner (7)', desc: 'Log meals for 7 days', target: 7, xp: 150 },
    MEAL_30:  { id: 'MEAL_30',  category: 'Nutrition', title: 'Meal Planner (30)', desc: 'Log meals for 30 days', target: 30, xp: 500 },
    MEAL_100: { id: 'MEAL_100', category: 'Nutrition', title: 'Meal Planner (100)', desc: 'Log meals for 100 days', target: 100, xp: 2000 },

    // Hydration
    WATER_7:   { id: 'WATER_7',   category: 'Hydration', title: 'Hydrated (7)', desc: 'Drink target water for 7 days', target: 7, xp: 100 },
    WATER_30:  { id: 'WATER_30',  category: 'Hydration', title: 'Hydrated (30)', desc: 'Drink target water for 30 days', target: 30, xp: 300 },
    WATER_100: { id: 'WATER_100', category: 'Hydration', title: 'Hydration Master', desc: 'Drink target water for 100 days', target: 100, xp: 1000 },

    // Cardio
    STEPS_1:   { id: 'STEPS_1',   category: 'Cardio', title: '10k Steps', desc: 'Hit 10k steps once', target: 1, xp: 50 },
    STEPS_25:  { id: 'STEPS_25',  category: 'Cardio', title: 'Walker', desc: 'Hit 10k steps 25 times', target: 25, xp: 250 },
    STEPS_100: { id: 'STEPS_100', category: 'Cardio', title: 'Marathoner', desc: 'Hit 10k steps 100 times', target: 100, xp: 1000 },

    // Habits
    HABITS_3:   { id: 'HABITS_3',   category: 'Habits', title: 'Habit Builder', desc: 'Complete all habits for 3 days', target: 3, xp: 100 },
    HABITS_7:   { id: 'HABITS_7',   category: 'Habits', title: 'Habit Master', desc: 'Complete all habits for 7 days', target: 7, xp: 250 },
    HABITS_30:  { id: 'HABITS_30',  category: 'Habits', title: 'Unbreakable', desc: 'Complete all habits for 30 days', target: 30, xp: 1000 },
    HABITS_100: { id: 'HABITS_100', category: 'Habits', title: 'Lifestyle', desc: 'Complete all habits for 100 days', target: 100, xp: 3000 },

    // Consistency
    CONSISTENCY_7:   { id: 'CONSISTENCY_7',   category: 'Consistency', title: 'Perfect Week', desc: 'Workout + Diet + Water + Habits for 7 days', target: 7, xp: 500 },
    CONSISTENCY_30:  { id: 'CONSISTENCY_30',  category: 'Consistency', title: 'Perfect Month', desc: 'Workout + Diet + Water + Habits for 30 days', target: 30, xp: 2000 },
    CONSISTENCY_100: { id: 'CONSISTENCY_100', category: 'Consistency', title: 'Perfect 100', desc: 'Workout + Diet + Water + Habits for 100 days', target: 100, xp: 5000 },

    // Custom Workouts
    CUSTOM_WORKOUT_1:  { id: 'CUSTOM_WORKOUT_1',  category: 'Custom Workouts', title: 'Creator', desc: 'Create a Custom Workout', target: 1, xp: 50 },
    CUSTOM_EXERCISE_10: { id: 'CUSTOM_EXERCISE_10', category: 'Custom Workouts', title: 'Innovator', desc: 'Create 10 Custom Exercises', target: 10, xp: 150 },
    WORKOUT_PLAN_EDIT: { id: 'WORKOUT_PLAN_EDIT', category: 'Custom Workouts', title: 'Architect', desc: 'Edit your Workout Plan', target: 1, xp: 50 },

    // AI Features
    AI_DIET:      { id: 'AI_DIET',      category: 'AI Features', title: 'AI Diet', desc: 'Generated Diet via AI', target: 1, xp: 50 },
    AI_WORKOUT:   { id: 'AI_WORKOUT',   category: 'AI Features', title: 'AI Workout', desc: 'Generated Workout via AI', target: 1, xp: 50 },
    AI_FORM:      { id: 'AI_FORM',      category: 'AI Features', title: 'AI Form', desc: 'Analyzed Form via AI', target: 1, xp: 50 },
    AI_VOICE:     { id: 'AI_VOICE',     category: 'AI Features', title: 'AI Voice', desc: 'Used Voice Coach', target: 1, xp: 50 },
    
    // Weight Goals
    WEIGHT_5KG:   { id: 'WEIGHT_5KG',   category: 'Weight Goal', title: 'Making Moves', desc: 'Lost 5kg', target: 1, xp: 200 },
    WEIGHT_10KG:  { id: 'WEIGHT_10KG',  category: 'Weight Goal', title: 'Transformation', desc: 'Lost 10kg', target: 1, xp: 500 },
    WEIGHT_GOAL:  { id: 'WEIGHT_GOAL',  category: 'Weight Goal', title: 'Goal Achieved', desc: 'Reached Goal Weight', target: 1, xp: 1000 },

    // PRs are handled specially because they have unbounded multiple instances (e.g., Bench PR, Squat PR)
    STRENGTH_PR: { id: 'STRENGTH_PR', category: 'Strength', title: 'New PR', desc: 'Set a new Personal Record', target: 1, xp: 100 }
};

const XP_LEVELS = [0, 500, 1200, 2500, 4500, 7000, 10000, 15000, 22000, 30000];
function calculateLevel(xp) {
    let lvl = 1;
    for (let i = 0; i < XP_LEVELS.length; i++) {
        if (xp >= XP_LEVELS[i]) lvl = i + 1;
    }
    return lvl;
}

/**
 * Core function to process events and unlock achievements incrementally.
 * 
 * @param {ObjectId} userId 
 * @param {String} eventType e.g., 'WORKOUT_COMPLETED', 'STREAK_INCREASED', 'PROTEIN_HIT', 'PR_ACHIEVED'
 * @param {Object} data e.g. { progressDelta: 1, streak: 5, exercise: 'Bench', oldPR: 100, newPR: 105 }
 * @returns {Array} List of newly unlocked achievement definitions to send back to client
 */
export async function processEvent(userId, eventType, data = {}) {
    try {
        const unlockedList = [];
        let totalXPEarned = 0;

        // Map eventType to the list of Achievement IDs it affects
        let targetIds = [];
        let delta = data.progressDelta || 1;
        let isAbsolute = false; // if true, `data.value` sets the absolute progress

        switch (eventType) {
            case 'WORKOUT_COMPLETED':
                targetIds = ['WORKOUT_1', 'WORKOUT_5', 'WORKOUT_10', 'WORKOUT_25', 'WORKOUT_50', 'WORKOUT_100', 'WORKOUT_250', 'WORKOUT_500', 'WORKOUT_1000'];
                break;
            case 'STREAK_INCREASED':
                targetIds = ['STREAK_3', 'STREAK_7', 'STREAK_14', 'STREAK_30', 'STREAK_60', 'STREAK_100', 'STREAK_365'];
                isAbsolute = true;
                delta = data.streak || 0; 
                break;
            case 'PROTEIN_HIT':
                targetIds = ['PROTEIN_1', 'PROTEIN_5', 'PROTEIN_25', 'PROTEIN_100'];
                break;
            case 'MEAL_LOGGED':
                targetIds = ['MEAL_3', 'MEAL_7', 'MEAL_30', 'MEAL_100'];
                break;
            case 'WATER_COMPLETED':
                targetIds = ['WATER_7', 'WATER_30', 'WATER_100'];
                break;
            case 'STEPS_10K':
                targetIds = ['STEPS_1', 'STEPS_25', 'STEPS_100'];
                break;
            case 'HABITS_ALL':
                targetIds = ['HABITS_3', 'HABITS_7', 'HABITS_30', 'HABITS_100'];
                break;
            case 'PERFECT_DAY':
                targetIds = ['CONSISTENCY_7', 'CONSISTENCY_30', 'CONSISTENCY_100'];
                break;
            case 'CUSTOM_WORKOUT_CREATED':
                targetIds = ['CUSTOM_WORKOUT_1'];
                break;
            case 'CUSTOM_EXERCISE_CREATED':
                targetIds = ['CUSTOM_EXERCISE_10'];
                break;
            case 'WORKOUT_PLAN_EDIT':
                targetIds = ['WORKOUT_PLAN_EDIT'];
                break;
            case 'AI_DIET': targetIds = ['AI_DIET']; break;
            case 'AI_WORKOUT': targetIds = ['AI_WORKOUT']; break;
            case 'AI_FORM': targetIds = ['AI_FORM']; break;
            case 'AI_VOICE': targetIds = ['AI_VOICE']; break;
            case 'PR_ACHIEVED':
                // Special handling for PRs, we will create a dynamic record
                const prAchievement = await handleSpecialPR(userId, data);
                if (prAchievement) {
                    unlockedList.push(prAchievement);
                    totalXPEarned += ACHIEVEMENTS_DEF.STRENGTH_PR.xp;
                }
                break;
            default:
                break;
        }

        // Process standard incremental achievements
        for (const aid of targetIds) {
            const def = ACHIEVEMENTS_DEF[aid];
            if (!def) continue;

            // Fetch or create the progress record
            let record = await Achievement.findOne({ userId, achievementId: aid });
            if (!record) {
                record = new Achievement({ userId, achievementId: aid, progress: 0, unlocked: false });
            }

            if (record.unlocked) {
                // For Streaks, progress can go up even if unlocked, but won't re-unlock
                if (isAbsolute) record.progress = delta;
                await record.save();
                continue;
            }

            if (isAbsolute) {
                record.progress = delta;
            } else {
                record.progress += delta;
            }

            // Did it just unlock?
            if (record.progress >= def.target) {
                record.unlocked = true;
                record.unlockedAt = new Date();
                record.progress = def.target; // Cap it
                unlockedList.push(def);
                totalXPEarned += def.xp;
            }

            await record.save();
        }

        // Update User XP
        if (totalXPEarned > 0) {
            const user = await User.findById(userId);
            if (user) {
                user.xp += totalXPEarned;
                user.level = calculateLevel(user.xp);
                await user.save();
            }
        }

        return unlockedList;
    } catch (error) {
        console.error('Error processing achievement event:', error);
        return [];
    }
}

// Special handler for PRs since they can happen multiple times (e.g. diff exercises)
async function handleSpecialPR(userId, data) {
    const aid = 'STRENGTH_PR';
    const def = ACHIEVEMENTS_DEF[aid];
    
    let record = await Achievement.findOne({ userId, achievementId: aid });
    if (!record) {
        record = new Achievement({ userId, achievementId: aid, progress: 0, unlocked: false, history: [] });
    }

    record.history.push({
        exercise: data.exercise,
        oldPR: data.oldPR,
        newPR: data.newPR,
        date: new Date()
    });

    record.progress += 1;
    let unlocked = false;

    // It technically unlocks every time a PR is hit, so we always return it as "unlocked" for the UI toast
    unlocked = true;
    record.unlocked = true;
    record.unlockedAt = new Date();

    await record.save();

    return {
        ...def,
        title: `${data.exercise} PR!`,
        desc: `New record: ${data.newPR} (was ${data.oldPR})`,
        xp: def.xp
    };
}
