import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['water', 'sleep', 'steps', 'meditation', 'stretching', 'supplements', 'custom'],
        default: 'custom'
    },
    icon: {
        type: String,
        default: '✓'
    },
    color: {
        type: String,
        default: '#10b981' // emerald-500
    },
    goalType: {
        type: String,
        enum: ['count', 'duration', 'boolean'],
        required: true
    },
    goalValue: {
        type: Number,
        default: 1
    },
    unit: {
        type: String,
        default: ''
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient user queries
habitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model('Habit', habitSchema);
