/**
 * server/routes/aiToolRoutes.js
 *
 * AI Service Tool Executor — Internal endpoint called by the Python AI service.
 * Security:
 *   - Protected by x-ai-service-secret (no JWT, internal service-to-service)
 *   - userId is ALWAYS taken from req.body — never from LLM output
 *   - Every query is strictly scoped to the authenticated userId
 *   - Destructive actions require confirmed:true flag
 *   - All mutations have strict server-side validation
 */

import express from 'express';
import DailyProgress from '../models/DailyProgress.js';
import FoodLog from '../models/FoodLog.js';
import ExerciseHistory from '../models/ExerciseHistory.js';
import FitnessScore from '../models/FitnessScore.js';
import User from '../models/User.js';
import DietPlan from '../models/DietPlan.js';

const router = express.Router();

// ── Internal auth: only the Python AI service may call this ──────────────────
const aiServiceAuth = (req, res, next) => {
    const secret = req.headers['x-ai-service-secret'];
    if (!secret || secret !== process.env.AI_SERVICE_SECRET) {
        return res.status(403).json({ error: 'Unauthorized AI Service request' });
    }
    next();
};

// ── Date helpers ──────────────────────────────────────────────────────────────
const startOfDay = (d) => { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; };
const dateRange  = (start, end) => ({
    $gte: startOfDay(new Date(start)),
    $lte: endOfDay(new Date(end)),
});

// ── Validation helpers ────────────────────────────────────────────────────────
const validateNumber = (val, min, max, name) => {
    const n = Number(val);
    if (isNaN(n)) throw new Error(`${name} must be a number`);
    if (n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}`);
    return n;
};

const validateDate = (str) => {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) throw new Error('date must be YYYY-MM-DD');
    const d = new Date(str);
    if (isNaN(d.getTime())) throw new Error('Invalid date');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d > tomorrow) throw new Error('Cannot log dates in the future');
    return str;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SINGLE ENTRY POINT: POST /api/ai/tools
//  Body: { userId, tool, args, confirmed }
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/tools', aiServiceAuth, async (req, res) => {
    const { userId, tool, args = {}, confirmed = false } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!tool)   return res.status(400).json({ error: 'tool is required' });
    try {
        const result = await dispatch(userId, tool, args, confirmed);
        return res.json({ success: true, tool, result });
    } catch (err) {
        console.error(`[AITools] ${tool} error:`, err.message);
        return res.status(400).json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TOOL DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════
async function dispatch(userId, tool, args, confirmed) {
    switch (tool) {

        // ── READ: Daily Progress ────────────────────────────────────────────
        case 'get_daily_progress': {
            const date = args.date || new Date().toISOString().slice(0, 10);
            const doc = await DailyProgress.findOne({
                userId,
                date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) }
            }).lean();
            if (!doc) return { found: false, date };
            return {
                found: true,
                date: doc.date?.toISOString().slice(0, 10),
                wentToGym: doc.wentToGym,
                waterIntake: doc.waterIntake,
                caloriesConsumed: doc.caloriesConsumed,
                proteinIntake: doc.proteinIntake,
                weight: doc.weight,
                sleepHours: doc.sleepHours,
                moodScore: doc.moodScore,
                steps: doc.steps,
                recoveryScore: doc.recoveryScore,
            };
        }

        // ── READ: Progress History ──────────────────────────────────────────
        case 'get_progress_history': {
            const { start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const docs = await DailyProgress.find({ userId, date: dateRange(start_date, end_date) })
                .sort({ date: 1 }).limit(90).lean();
            return docs.map(d => ({
                date: d.date?.toISOString().slice(0, 10),
                wentToGym: d.wentToGym,
                waterIntake: d.waterIntake,
                caloriesConsumed: d.caloriesConsumed,
                proteinIntake: d.proteinIntake,
                weight: d.weight,
                sleepHours: d.sleepHours,
                moodScore: d.moodScore,
                steps: d.steps,
            }));
        }

        // ── READ: Food Log ──────────────────────────────────────────────────
        case 'get_food_log': {
            const { start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const docs = await FoodLog.find({ userId, date: dateRange(start_date, end_date) })
                .sort({ date: -1 }).limit(30).lean();
            return docs.map(d => ({
                date: d.date?.toISOString().slice(0, 10),
                totalCalories: d.totalCalories,
                totalProtein: d.totalProtein,
                totalCarbs: d.totalCarbs,
                totalFats: d.totalFats,
                foods: d.foods?.map(f => ({
                    name: f.name,
                    calories: f.calories,
                    protein: f.protein,
                    mealType: f.mealType,
                    quantity: f.quantity,
                })) || [],
            }));
        }

        // ── READ: Exercise History ──────────────────────────────────────────
        case 'get_exercise_history': {
            const { exercise_name, start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const query = { userId, date: dateRange(start_date, end_date) };
            if (exercise_name) query.exerciseName = new RegExp(exercise_name, 'i');
            const docs = await ExerciseHistory.find(query).sort({ date: -1 }).limit(100).lean();
            return docs.map(d => ({
                date: d.date?.toISOString().slice(0, 10),
                exerciseName: d.exerciseName,
                reps: d.reps,
            }));
        }

        // ── READ: User Profile / Goals ──────────────────────────────────────
        case 'get_user_profile': {
            const user = await User.findById(userId)
                .select('name goal targetWeight weight height age experience workoutEnvironment dietPreference calorieGoal proteinGoal waterGoal injuries allergies')
                .lean();
            if (!user) throw new Error('User not found');
            return {
                name: user.name,
                goal: user.goal,
                currentWeight: user.weight,
                targetWeight: user.targetWeight,
                height: user.height,
                age: user.age,
                experience: user.experience,
                workoutEnvironment: user.workoutEnvironment,
                dietPreference: user.dietPreference,
                calorieGoal: user.calorieGoal,
                proteinGoal: user.proteinGoal,
                waterGoal: user.waterGoal,
                injuries: user.injuries,
                allergies: user.allergies,
            };
        }

        // ── READ: Diet Plan ─────────────────────────────────────────────────
        case 'get_diet_plan': {
            const plan = await DietPlan.findOne({ userId, isActive: true }).lean();
            if (!plan) return { found: false };
            return {
                found: true,
                planName: plan.planName,
                targetCalories: plan.targetCalories,
                targetProtein: plan.targetProtein,
                targetCarbs: plan.targetCarbs,
                targetFats: plan.targetFats,
                meals: plan.meals?.map(m => ({
                    name: m.name,
                    time: m.time,
                    items: m.items?.map(i => ({ food: i.food, calories: i.calories, protein: i.protein, quantity: i.quantity })),
                })) || [],
            };
        }

        // ── READ: Fitness Score History ─────────────────────────────────────
        case 'get_fitness_score_history': {
            const { start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const docs = await FitnessScore.find({ userId, date: dateRange(start_date, end_date) })
                .sort({ date: 1 }).limit(90).lean();
            return docs.map(d => ({
                date: d.date?.toISOString().slice(0, 10),
                totalScore: d.totalScore,
                breakdown: d.breakdown,
            }));
        }

        // ── READ: Progress Summary (aggregated) ─────────────────────────────
        case 'get_progress_summary': {
            const { start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const [progress, food] = await Promise.all([
                DailyProgress.find({ userId, date: dateRange(start_date, end_date) }).lean(),
                FoodLog.find({ userId, date: dateRange(start_date, end_date) }).lean(),
            ]);
            const gymDays = progress.filter(p => p.wentToGym).length;
            const weights = progress.filter(p => p.weight > 0).map(p => ({ date: p.date?.toISOString().slice(0,10), weight: p.weight }));
            const foodWithCal = food.filter(f => f.totalCalories > 0);
            const foodWithPro = food.filter(f => f.totalProtein > 0);
            const sleepDays = progress.filter(p => p.sleepHours != null && p.sleepHours > 0);
            return {
                period: { start: start_date, end: end_date },
                totalDays: progress.length,
                gymDays,
                gymAttendanceRate: progress.length ? `${Math.round((gymDays / progress.length) * 100)}%` : '0%',
                avgDailyCalories: foodWithCal.length ? Math.round(foodWithCal.reduce((s, f) => s + f.totalCalories, 0) / foodWithCal.length) : null,
                avgDailyProtein:  foodWithPro.length ? Math.round(foodWithPro.reduce((s, f) => s + f.totalProtein, 0)  / foodWithPro.length) : null,
                avgSleepHours: sleepDays.length ? Number((sleepDays.reduce((s, p) => s + p.sleepHours, 0) / sleepDays.length).toFixed(1)) : null,
                weightEntries: weights,
            };
        }

        // ── READ: Personal Records ──────────────────────────────────────────
        case 'get_personal_records': {
            const { exercise_name } = args;
            const query = { userId };
            if (exercise_name) query.exerciseName = new RegExp(exercise_name, 'i');
            const docs = await ExerciseHistory.find(query).lean();
            const records = {};
            for (const d of docs) {
                const name = d.exerciseName;
                if (!records[name] || d.reps > records[name].maxReps) {
                    records[name] = { exerciseName: name, maxReps: d.reps, date: d.date?.toISOString().slice(0,10) };
                }
            }
            return Object.values(records).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
        }

        // ── READ: Exercise Summary ──────────────────────────────────────────
        case 'get_exercise_summary': {
            const { start_date, end_date } = args;
            if (!start_date || !end_date) throw new Error('start_date and end_date required');
            const docs = await ExerciseHistory.find({ userId, date: dateRange(start_date, end_date) }).lean();
            const freq = {};
            for (const d of docs) { freq[d.exerciseName] = (freq[d.exerciseName] || 0) + 1; }
            return {
                period: { start: start_date, end: end_date },
                totalSessions: docs.length,
                uniqueExercises: Object.keys(freq).length,
                frequency: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ exerciseName: name, sessions: count })),
            };
        }

        // ── READ: Compare Two Periods ───────────────────────────────────────
        case 'compare_progress_periods': {
            const { period1_start, period1_end, period2_start, period2_end } = args;
            if (!period1_start || !period1_end || !period2_start || !period2_end)
                throw new Error('All four period dates required');
            const summarize = async (start, end) => {
                const [prog, food, ex] = await Promise.all([
                    DailyProgress.find({ userId, date: dateRange(start, end) }).lean(),
                    FoodLog.find({ userId, date: dateRange(start, end) }).lean(),
                    ExerciseHistory.find({ userId, date: dateRange(start, end) }).lean(),
                ]);
                const gymDays = prog.filter(p => p.wentToGym).length;
                const foodC = food.filter(f => f.totalCalories > 0);
                const foodP = food.filter(f => f.totalProtein > 0);
                const sleepD = prog.filter(p => p.sleepHours > 0);
                return {
                    period: `${start} to ${end}`,
                    gymDays,
                    avgCalories: foodC.length ? Math.round(foodC.reduce((s,f)=>s+f.totalCalories,0)/foodC.length) : null,
                    avgProtein:  foodP.length ? Math.round(foodP.reduce((s,f)=>s+f.totalProtein,0)/foodP.length) : null,
                    exerciseSessions: ex.length,
                    avgSleepHours: sleepD.length ? Number((sleepD.reduce((s,p)=>s+p.sleepHours,0)/sleepD.length).toFixed(1)) : null,
                };
            };
            const [p1, p2] = await Promise.all([summarize(period1_start, period1_end), summarize(period2_start, period2_end)]);
            return { period1: p1, period2: p2 };
        }

        // ── MUTATION: Log Water ─────────────────────────────────────────────
        case 'log_water': {
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const amount = validateNumber(args.amount_ml, 1, 10000, 'amount_ml');
            await DailyProgress.findOneAndUpdate(
                { userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } },
                { $set: { userId, date: new Date(date) }, $inc: { waterIntake: amount } },
                { upsert: true, new: true }
            );
            return { logged: true, amount_ml: amount, date };
        }

        // ── MUTATION: Mark Gym Attendance ───────────────────────────────────
        case 'mark_gym_attendance': {
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            await DailyProgress.findOneAndUpdate(
                { userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } },
                { $set: { userId, date: new Date(date), wentToGym: true } },
                { upsert: true, new: true }
            );
            return { logged: true, wentToGym: true, date };
        }

        // ── MUTATION: Log Weight ────────────────────────────────────────────
        case 'log_weight': {
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const weight = validateNumber(args.weight_kg, 20, 500, 'weight_kg');
            await DailyProgress.findOneAndUpdate(
                { userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } },
                { $set: { userId, date: new Date(date), weight } },
                { upsert: true, new: true }
            );
            return { logged: true, weight_kg: weight, date };
        }

        // ── MUTATION: Log Sleep ─────────────────────────────────────────────
        case 'log_sleep': {
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const hours = validateNumber(args.hours, 0, 24, 'hours');
            await DailyProgress.findOneAndUpdate(
                { userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } },
                { $set: { userId, date: new Date(date), sleepHours: hours } },
                { upsert: true, new: true }
            );
            return { logged: true, sleep_hours: hours, date };
        }

        // ── MUTATION: Log Mood ──────────────────────────────────────────────
        case 'log_mood': {
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const score = validateNumber(args.score, 1, 5, 'score');
            await DailyProgress.findOneAndUpdate(
                { userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } },
                { $set: { userId, date: new Date(date), moodScore: Math.round(score) } },
                { upsert: true, new: true }
            );
            return { logged: true, mood_score: Math.round(score), date };
        }

        // ── DESTRUCTIVE: Delete Daily Progress ─────────────────────────────
        case 'delete_daily_progress': {
            if (!confirmed) return { requires_confirmation: true, message: `I can delete your daily progress record for ${args.date || 'today'}. Please confirm.` };
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const r = await DailyProgress.deleteOne({ userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } });
            return { deleted: r.deletedCount > 0, date };
        }

        // ── DESTRUCTIVE: Delete Food Log ────────────────────────────────────
        case 'delete_food_log': {
            if (!confirmed) return { requires_confirmation: true, message: `I can delete your food log for ${args.date || 'today'}. Please confirm.` };
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            const r = await FoodLog.deleteOne({ userId, date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) } });
            return { deleted: r.deletedCount > 0, date };
        }

        // ── DESTRUCTIVE: Delete Exercise Entry ──────────────────────────────
        case 'delete_exercise_entry': {
            if (!confirmed) return { requires_confirmation: true, message: `I can delete your ${args.exercise_name || 'exercise'} entry from ${args.date || 'today'}. Please confirm.` };
            const date = validateDate(args.date || new Date().toISOString().slice(0,10));
            if (!args.exercise_name) throw new Error('exercise_name is required');
            const r = await ExerciseHistory.deleteOne({
                userId,
                date: { $gte: startOfDay(new Date(date)), $lte: endOfDay(new Date(date)) },
                exerciseName: new RegExp(args.exercise_name, 'i'),
            });
            return { deleted: r.deletedCount > 0, date, exercise: args.exercise_name };
        }

        default:
            throw new Error(`Unknown tool: ${tool}`);
    }
}

export default router;
