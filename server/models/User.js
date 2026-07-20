// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    // Profile fields
    height: {
      type: Number, // in cm
      default: null
    },
    weight: {
      type: Number, // in kg
      default: null
    },
    age: {
      type: Number,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', null],
      default: null
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', null],
      default: null
    },
    goal: {
      type: String,
      enum: ['lose_weight', 'maintain', 'gain_muscle', null],
      default: null
    },
    dietPreference: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', null],
      default: 'Vegetarian'
    },
    // Extended onboarding fields
    targetWeight: { type: Number, default: null },
    physiqueImage: { type: String, default: null },
    bodyFatEstimate: { type: Number, default: null },
    workoutEnvironment: { 
      type: String, 
      enum: ['Gym', 'Home', 'Outdoors', null], 
      default: null 
    },
    experience: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Athlete', null],
      default: null
    },
    stressLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Very High', null],
      default: null
    },
    sleepHours: { type: String, default: null },
    mealFrequency: { type: String, default: null },
    months: { type: String, default: null },
    injuries: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    // Monetisation
    plan: {
      type: String,
      enum: ['free', 'pro', 'elite'],
      default: 'free',
    },
    planStartedAt: { type: Date, default: null },
    planExpiresAt: { type: Date, default: null },
    planStatus: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'none'],
      default: 'none'
    },
    razorpayCustomerId: { type: String, default: null },
    razorpaySubscriptionId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    // Usage Tracking
    usage: {
      voiceMinutes: { type: Number, default: 0 },
      aiRequests: { type: Number, default: 0 },
      poseAnalyses: { type: Number, default: 0 },
      nutritionScans: { type: Number, default: 0 }
    },
    usageResetDate: { type: Date, default: null },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
