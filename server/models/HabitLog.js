import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    habitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    value: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries and uniqueness
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

// Index for date range queries
habitLogSchema.index({ habitId: 1, date: -1 });

export default mongoose.model('HabitLog', habitLogSchema);
