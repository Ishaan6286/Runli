import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['workout', 'diet', 'water', 'habit', 'progress', 'system', 'ai'],
        default: 'system'
    },
    link: {
        type: String, // e.g., '/gym', '/diet'
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isClicked: {
        type: Boolean,
        default: false
    },
    isDismissed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
