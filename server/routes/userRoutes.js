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
        const {
            name, height, weight, age, gender, activityLevel, goal, dietPreference,
            targetWeight, experience, stressLevel, sleepHours, mealFrequency,
            months, injuries, allergies, physiqueImage, bodyFatEstimate, workoutEnvironment
        } = req.body;

        // ─── Deterministic validation (API-level bypass prevention) ───────────
        const validationErrors = [];

        if (age !== undefined && age !== null && age !== '') {
            const ageNum = Number(age);
            if (isNaN(ageNum) || ageNum < 12 || ageNum > 100) {
                validationErrors.push("Age must be between 12 and 100.");
            }
        }
        if (height !== undefined && height !== null && height !== '') {
            const heightNum = Number(height);
            if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
                validationErrors.push("Height must be between 50cm and 250cm.");
            }
        }
        if (weight !== undefined && weight !== null && weight !== '') {
            const weightNum = Number(weight);
            if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
                validationErrors.push("Weight must be between 20kg and 300kg.");
            }
        }
        if (targetWeight !== undefined && targetWeight !== null && targetWeight !== '') {
            const targetWeightNum = Number(targetWeight);
            if (isNaN(targetWeightNum) || targetWeightNum < 20 || targetWeightNum > 300) {
                validationErrors.push("Target weight must be between 20kg and 300kg.");
            }
        }
        if (name !== undefined && name !== null) {
            const trimmedName = String(name).trim();
            if (trimmedName.length < 1 || trimmedName.length > 100) {
                validationErrors.push("Name must be between 1 and 100 characters.");
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Validation failed", errors: validationErrors });
        }
        // ─────────────────────────────────────────────────────────────────────

        const updateFields = {};
        // Helper: treat empty strings as null so optional fields don't fail enum validation
        const val = (v) => (v === '' || v === undefined) ? null : v;
        if (name !== undefined)           updateFields.name = name;
        if (height !== undefined)         updateFields.height = val(height);
        if (weight !== undefined)         updateFields.weight = val(weight);
        if (age !== undefined)            updateFields.age = val(age);
        if (gender !== undefined)         updateFields.gender = val(gender);
        if (activityLevel !== undefined)  updateFields.activityLevel = val(activityLevel);
        if (goal !== undefined)           updateFields.goal = val(goal);
        if (dietPreference !== undefined) updateFields.dietPreference = val(dietPreference);
        if (targetWeight !== undefined)   updateFields.targetWeight = val(targetWeight);
        if (experience !== undefined)     updateFields.experience = val(experience);
        if (stressLevel !== undefined)    updateFields.stressLevel = val(stressLevel);
        if (sleepHours !== undefined)     updateFields.sleepHours = val(sleepHours);
        if (mealFrequency !== undefined)  updateFields.mealFrequency = val(mealFrequency);
        if (months !== undefined)         updateFields.months = val(months);
        if (injuries !== undefined)       updateFields.injuries = injuries;
        if (allergies !== undefined)      updateFields.allergies = allergies;
        if (physiqueImage !== undefined)  updateFields.physiqueImage = physiqueImage;
        if (bodyFatEstimate !== undefined) updateFields.bodyFatEstimate = val(bodyFatEstimate);
        if (workoutEnvironment !== undefined) updateFields.workoutEnvironment = val(workoutEnvironment);

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // --- RAG INGESTION (Fire and forget) ---
        import('../services/ragService.js').then(({ ingestGoal }) => {
            ingestGoal(req.userId, user);
        }).catch(err => console.error("Failed to load ragService:", err));

        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        console.error("Update profile error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
