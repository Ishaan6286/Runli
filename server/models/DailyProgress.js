import mongoose from 'mongoose';

const dailyProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    waterIntake: {
        type: Number,
        default: 0
    },
    caloriesConsumed: {
        type: Number,
        default: 0
    },
    proteinIntake: {
        type: Number,
        default: 0
    },
    wentToGym: {
        type: Boolean,
        default: false
    },
    weight: {
        type: Number,
        default: null
    },
    dietPlanCompleted: {
        type: [String],
        default: []
    }
}, { timestamps: true });

// Ensure one entry per user per day
dailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyProgress = mongoose.model('DailyProgress', dailyProgressSchema);
export default DailyProgress;
