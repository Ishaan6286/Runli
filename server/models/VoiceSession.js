// server/models/VoiceSession.js
import mongoose from 'mongoose';

const voiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  topicSummary: {
    type: String,
    default: '',
  },
  transcript: {
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        text: String,
        timestamp: Date,
      }
    ],
    default: [],
  },
}, { timestamps: true });

export default mongoose.model('VoiceSession', voiceSessionSchema);
