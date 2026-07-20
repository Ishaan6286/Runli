import mongoose from 'mongoose';

const TwinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    workoutBehavior: {
        type: [String],
        default: []
    },
    dietBehavior: {
        type: [String],
        default: []
    },
    recoveryPatterns: {
        type: [String],
        default: []
    },
    motivationPatterns: {
        type: [String],
        default: []
    },
    adherencePatterns: {
        type: [String],
        default: []
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Twin', TwinSchema);
