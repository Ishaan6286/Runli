import express from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function to calculate streak
function calculateStreak(logs) {
    if (logs.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort logs by date descending
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate current streak
    let checkDate = new Date(today);
    for (let log of sortedLogs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((checkDate - logDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 0 && log.completed) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (dayDiff === 0) {
            break;
        } else if (dayDiff > 1) {
            break;
        }
    }

    // Calculate longest streak
    tempStreak = 0;
    let prevDate = null;

    for (let log of sortedLogs.reverse()) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);

        if (log.completed) {
            if (!prevDate) {
                tempStreak = 1;
            } else {
                const dayDiff = Math.floor((logDate - prevDate) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            prevDate = logDate;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
            prevDate = null;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
}

// Get today's status for all habits - MOVED TO TOP to avoid conflict with /:id
router.get('/today/status', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const habits = await Habit.find({
            userId: req.user.id,
            isActive: true
        });

        const habitsStatus = await Promise.all(habits.map(async (habit) => {
            const log = await HabitLog.findOne({
                userId: req.user.id,
                habitId: habit._id,
                date: today
            });

            const completed = log ? log.completed : false;
            const value = log ? log.value : 0;
            const percentage = habit.goalValue > 0
                ? Math.min(100, Math.round((value / habit.goalValue) * 100))
                : (completed ? 100 : 0);

            return {
                habitId: habit._id,
                name: habit.name,
                icon: habit.icon,
                color: habit.color,
                type: habit.type,
                completed,
                value,
                goal: habit.goalValue,
                unit: habit.unit,
                percentage
            };
        }));

        const completedCount = habitsStatus.filter(h => h.completed).length;
        const totalCount = habitsStatus.length;
        const overallCompletion = totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;

        res.json({
            success: true,
            date: today,
            habits: habitsStatus,
            summary: {
                completed: completedCount,
                total: totalCount,
                percentage: overallCompletion
            }
        });
    } catch (error) {
        console.error('Error fetching today\'s status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s status',
            error: error.message
        });
    }
});

// Create a new habit
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, icon, color, goalType, goalValue, unit, frequency } = req.body;

        const habit = new Habit({
            userId: req.user.id,
            name,
            type: type || 'custom',
            icon: icon || '✓',
            color: color || '#10b981',
            goalType,
            goalValue: goalValue || 1,
            unit: unit || '',
            frequency: frequency || 'daily'
        });

        await habit.save();

        res.json({
            success: true,
            habit
        });
    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create habit',
            error: error.message
        });
    }
});

// Get all user habits with stats
router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({
            userId: req.user.id,
            isActive: true
        }).sort({ createdAt: -1 });

        // Get stats for each habit
        const habitsWithStats = await Promise.all(habits.map(async (habit) => {
            const logs = await HabitLog.find({
                userId: req.user.id,
                habitId: habit._id
            }).sort({ date: -1 });

            const streaks = calculateStreak(logs);
            const completedLogs = logs.filter(log => log.completed);
            const completionRate = logs.length > 0
                ? Math.round((completedLogs.length / logs.length) * 100)
                : 0;

            return {
                ...habit.toObject(),
                currentStreak: streaks.current,
                longestStreak: streaks.longest,
                completionRate,
                totalLogs: logs.length
            };
        }));

        res.json({
            success: true,
            habits: habitsWithStats
        });
    } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch habits',
            error: error.message
        });
    }
});

// Get a specific habit
router.get('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.json({
            success: true,
            habit
        });
    } catch (error) {
        console.error('Error fetching habit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch habit',
            error: error.message
        });
    }
});

// Update a habit
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, icon, color, goalValue, unit, isActive } = req.body;

        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            {
                $set: {
                    ...(name && { name }),
                    ...(icon && { icon }),
                    ...(color && { color }),
                    ...(goalValue !== undefined && { goalValue }),
                    ...(unit !== undefined && { unit }),
                    ...(isActive !== undefined && { isActive })
                }
            },
            { new: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.json({
            success: true,
            habit
        });
    } catch (error) {
        console.error('Error updating habit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update habit',
            error: error.message
        });
    }
});

// Delete a habit (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.json({
            success: true,
            message: 'Habit deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete habit',
            error: error.message
        });
    }
});

// Log habit completion
router.post('/:id/log', auth, async (req, res) => {
    try {
        const { date, completed, value, notes } = req.body;

        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        const logDate = date ? new Date(date) : new Date();
        logDate.setHours(0, 0, 0, 0);

        // Upsert the log
        const log = await HabitLog.findOneAndUpdate(
            {
                userId: req.user.id,
                habitId: req.params.id,
                date: logDate
            },
            {
                $set: {
                    completed: completed !== undefined ? completed : true,
                    value: value || 0,
                    notes: notes || ''
                }
            },
            { upsert: true, new: true }
        );

        // Calculate updated streak
        const logs = await HabitLog.find({
            userId: req.user.id,
            habitId: req.params.id
        }).sort({ date: -1 });

        const streaks = calculateStreak(logs);

        res.json({
            success: true,
            log,
            streak: streaks
        });
    } catch (error) {
        console.error('Error logging habit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log habit',
            error: error.message
        });
    }
});

// Get habit logs for a date range
router.get('/:id/logs', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        const query = {
            userId: req.user.id,
            habitId: req.params.id
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const logs = await HabitLog.find(query).sort({ date: -1 });

        // Calculate statistics
        const streaks = calculateStreak(logs);
        const completedLogs = logs.filter(log => log.completed);
        const totalDays = logs.length;
        const completedDays = completedLogs.length;
        const completionRate = totalDays > 0
            ? Math.round((completedDays / totalDays) * 100)
            : 0;

        res.json({
            success: true,
            logs,
            stats: {
                totalDays,
                completedDays,
                completionRate,
                currentStreak: streaks.current,
                longestStreak: streaks.longest
            }
        });
    } catch (error) {
        console.error('Error fetching habit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch habit logs',
            error: error.message
        });
    }
});

export default router;
