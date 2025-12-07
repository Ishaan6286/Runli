// server/routes/foodRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import FoodLog from "../models/FoodLog.js";

const router = express.Router();

// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// POST /api/food - Add food item to log
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { date, food } = req.body;

        // Parse date to start of day
        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        // Find or create log for the date
        let foodLog = await FoodLog.findOne({
            userId: req.userId,
            date: logDate
        });

        if (!foodLog) {
            foodLog = await FoodLog.create({
                userId: req.userId,
                date: logDate,
                foods: [food],
                totalCalories: food.calories || 0,
                totalProtein: food.protein || 0,
                totalCarbs: food.carbs || 0,
                totalFats: food.fats || 0
            });
        } else {
            // Add food and update totals
            foodLog.foods.push(food);
            foodLog.totalCalories += food.calories || 0;
            foodLog.totalProtein += food.protein || 0;
            foodLog.totalCarbs += food.carbs || 0;
            foodLog.totalFats += food.fats || 0;
            await foodLog.save();
        }

        res.status(201).json({
            message: "Food logged successfully",
            foodLog
        });
    } catch (err) {
        console.error("Log food error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/food/:date - Get food log for specific date
router.get("/:date", authMiddleware, async (req, res) => {
    try {
        const logDate = new Date(req.params.date);
        logDate.setHours(0, 0, 0, 0);

        const foodLog = await FoodLog.findOne({
            userId: req.userId,
            date: logDate
        });

        res.json({ foodLog });
    } catch (err) {
        console.error("Get food log error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/food/range/:startDate/:endDate - Get food logs for date range
router.get("/range/:startDate/:endDate", authMiddleware, async (req, res) => {
    try {
        const startDate = new Date(req.params.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(req.params.endDate);
        endDate.setHours(23, 59, 59, 999);

        const foodLogs = await FoodLog.find({
            userId: req.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        res.json({ foodLogs });
    } catch (err) {
        console.error("Get food logs range error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/food/:date/:foodId - Delete specific food item
router.delete("/:date/:foodId", authMiddleware, async (req, res) => {
    try {
        const logDate = new Date(req.params.date);
        logDate.setHours(0, 0, 0, 0);

        const foodLog = await FoodLog.findOne({
            userId: req.userId,
            date: logDate
        });

        if (!foodLog) {
            return res.status(404).json({ message: "Food log not found" });
        }

        const foodItem = foodLog.foods.id(req.params.foodId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // Update totals
        foodLog.totalCalories -= foodItem.calories || 0;
        foodLog.totalProtein -= foodItem.protein || 0;
        foodLog.totalCarbs -= foodItem.carbs || 0;
        foodLog.totalFats -= foodItem.fats || 0;

        // Remove food item
        foodItem.remove();
        await foodLog.save();

        res.json({
            message: "Food item deleted successfully",
            foodLog
        });
    } catch (err) {
        console.error("Delete food item error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
