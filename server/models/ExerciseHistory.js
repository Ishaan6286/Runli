import mongoose from 'mongoose';

const exerciseHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  exerciseName: {
    type: String,
    required: true,
  },
  reps: {
    type: Number,
    required: true,
  },
  formScore: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const ExerciseHistory = mongoose.model('ExerciseHistory', exerciseHistorySchema);
export default ExerciseHistory;
