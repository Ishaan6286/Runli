// server/models/DietPlan.js
import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    time: String,
    items: [{
        food: String,
        quantity: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number,
        price: Number
    }]
});

const dietPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        planName: {
            type: String,
            default: "My Diet Plan"
        },
        targetCalories: Number,
        targetProtein: Number,
        targetCarbs: Number,
        targetFats: Number,
        meals: [mealSchema],
        notes: String,
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
export default DietPlan;
