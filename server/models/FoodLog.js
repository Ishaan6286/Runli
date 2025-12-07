// server/models/FoodLog.js
import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
    name: String,
    quantity: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
    },
    time: {
        type: Date,
        default: Date.now
    }
});

const foodLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        foods: [foodItemSchema],
        totalCalories: {
            type: Number,
            default: 0
        },
        totalProtein: {
            type: Number,
            default: 0
        },
        totalCarbs: {
            type: Number,
            default: 0
        },
        totalFats: {
            type: Number,
            default: 0
        },
        notes: String
    },
    { timestamps: true }
);

// Index for efficient date-based queries
foodLogSchema.index({ userId: 1, date: 1 });

const FoodLog = mongoose.model("FoodLog", foodLogSchema);
export default FoodLog;
