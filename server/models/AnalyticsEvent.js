// server/models/AnalyticsEvent.js
import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,   // null = anonymous/pre-login
    index: true,
  },
  sessionId: {
    type: String,    // UUID per browser tab session
    required: true,
  },
  event: {
    type: String,
    required: true,
    index: true,
    // e.g. 'page_view' | 'workout_started' | 'meal_logged' ...
  },
  category: {
    type: String,
    enum: ['navigation', 'workout', 'diet', 'feature', 'habit', 'system'],
    required: true,
  },
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown',
  },
  appVersion: {
    type: String,
    default: '1.0.0',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  // No updatedAt needed for immutable event log
  timestamps: false,
});

// Compound indexes for common query patterns
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ event: 1, timestamp: -1 });
analyticsEventSchema.index({ category: 1, timestamp: -1 });

// Auto-delete events after 90 days (TTL index)
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
