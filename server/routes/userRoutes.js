// server/routes/userRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

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

// GET /api/user/profile - Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error("Get profile error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/user/profile - Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, height, weight, age, gender, activityLevel, goal, dietPreference } = req.body;

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (height !== undefined) updateFields.height = height;
        if (weight !== undefined) updateFields.weight = weight;
        if (age !== undefined) updateFields.age = age;
        if (gender !== undefined) updateFields.gender = gender;
        if (activityLevel !== undefined) updateFields.activityLevel = activityLevel;
        if (goal !== undefined) updateFields.goal = goal;
        if (dietPreference !== undefined) updateFields.dietPreference = dietPreference;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user
        });
    } catch (err) {
        console.error("Update profile error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
