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
      enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', null],
      default: 'Vegetarian'
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
