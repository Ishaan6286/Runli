import express from 'express';
import Twin from '../models/Twin.js';
import { generateTwinInsights } from '../services/twinService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

router.get('/', authMiddleware, async (req, res) => {
    try {
        const twin = await Twin.findOne({ userId: req.userId });
        res.json({ twin });
    } catch (error) {
        console.error("Error fetching Twin:", error);
        res.status(500).json({ message: "Error fetching Twin data" });
    }
});

router.post('/learn', authMiddleware, async (req, res) => {
    try {
        const twin = await generateTwinInsights(req.userId);
        res.json({ twin, message: "Twin insights updated successfully" });
    } catch (error) {
        console.error("Error learning Twin:", error);
        res.status(500).json({ message: "Failed to update Twin insights" });
    }
});

export default router;
