// server/models/FitnessScore.js
import mongoose from 'mongoose';

/**
 * Stores a daily fitness score snapshot for a user.
 * One document per user per day.
 */

const reasoningItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['workout', 'nutrition', 'recovery', 'habits', 'weight'],
    required: true,
  },
  impact: { type: Number, required: true }, // e.g. +12, -6
  text: { type: String, required: true },   // e.g. "Missed 2 of 4 gym days"
  emoji: { type: String, default: '' },
}, { _id: false });

const scoreBreakdownSchema = new mongoose.Schema({
  workout:   { type: Number, default: 0 }, // 0-20
  nutrition: { type: Number, default: 0 }, // 0-20
  recovery:  { type: Number, default: 0 }, // 0-20
  habits:    { type: Number, default: 0 }, // 0-20
  weight:    { type: Number, default: 0 }, // 0-20
}, { _id: false });

const fitnessScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
  },
  // The final clamped score [0, 100]
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  // Per-category contribution (each 0-20, sum ≤ 100)
  breakdown: {
    type: scoreBreakdownSchema,
    default: () => ({}),
  },
  // Human-readable explanations for each category
  reasoning: {
    type: [reasoningItemSchema],
    default: [],
  },
  // Was this score computed from full data (true) or estimated from partial data (false)?
  dataCompleteness: {
    type: Number, // 0.0 - 1.0
    default: 1.0,
  },
}, { timestamps: true });

// One score per user per day
fitnessScoreSchema.index({ userId: 1, date: -1 }, { unique: true });

// Efficient range queries for history charts
fitnessScoreSchema.index({ userId: 1, date: 1 });

const FitnessScore = mongoose.model('FitnessScore', fitnessScoreSchema);
export default FitnessScore;
