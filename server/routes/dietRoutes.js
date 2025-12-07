// server/routes/dietRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import DietPlan from "../models/DietPlan.js";

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

// POST /api/diet - Create or update diet plan
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { planName, targetCalories, targetProtein, targetCarbs, targetFats, meals, notes } = req.body;

        // Deactivate previous active plans
        await DietPlan.updateMany(
            { userId: req.userId, isActive: true },
            { $set: { isActive: false } }
        );

        const dietPlan = await DietPlan.create({
            userId: req.userId,
            planName,
            targetCalories,
            targetProtein,
            targetCarbs,
            targetFats,
            meals,
            notes,
            isActive: true
        });

        res.status(201).json({
            message: "Diet plan created successfully",
            dietPlan
        });
    } catch (err) {
        console.error("Create diet plan error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/diet - Get active diet plan
router.get("/", authMiddleware, async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            userId: req.userId,
            isActive: true
        }).sort({ createdAt: -1 });

        res.json({ dietPlan });
    } catch (err) {
        console.error("Get diet plan error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/diet/all - Get all diet plans
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const dietPlans = await DietPlan.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        res.json({ dietPlans });
    } catch (err) {
        console.error("Get all diet plans error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/diet/:id - Update diet plan
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { planName, targetCalories, targetProtein, targetCarbs, targetFats, meals, notes } = req.body;

        const dietPlan = await DietPlan.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            {
                $set: {
                    planName,
                    targetCalories,
                    targetProtein,
                    targetCarbs,
                    targetFats,
                    meals,
                    notes
                }
            },
            { new: true }
        );

        if (!dietPlan) {
            return res.status(404).json({ message: "Diet plan not found" });
        }

        res.json({
            message: "Diet plan updated successfully",
            dietPlan
        });
    } catch (err) {
        console.error("Update diet plan error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/diet/:id - Delete diet plan
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!dietPlan) {
            return res.status(404).json({ message: "Diet plan not found" });
        }

        res.json({ message: "Diet plan deleted successfully" });
    } catch (err) {
        console.error("Delete diet plan error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
