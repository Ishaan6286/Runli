import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    achievementId: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        default: 0
    },
    unlocked: {
        type: Boolean,
        default: false
    },
    unlockedAt: {
        type: Date,
        default: null
    },
    history: {
        // To handle things like PRs
        type: [mongoose.Schema.Types.Mixed],
        default: []
    }
}, { timestamps: true });

// Ensure unique achievement per user
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model('Achievement', achievementSchema);
