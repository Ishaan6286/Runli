import express from 'express';
import webPush from 'web-push';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Apply middleware to all routes
router.use(authMiddleware);

// Initialize web-push with VAPID keys from .env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@runli.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// 1. Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription } = req.body;
        
        // Save subscription to user profile
        await User.findByIdAndUpdate(req.userId, {
            pushSubscription: subscription
        });
        
        res.status(200).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        res.status(500).json({ success: false, message: 'Subscription failed' });
    }
});

// 2. Unsubscribe
router.post('/unsubscribe', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, {
            pushSubscription: null
        });
        res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ success: false, message: 'Unsubscribe failed' });
    }
});

// 3. Get notification settings
router.get('/settings', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.status(200).json({ success: true, settings: user.notificationSettings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

// 4. Update notification settings
router.put('/settings', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { notificationSettings: req.body.settings } },
            { new: true }
        );
        res.status(200).json({ success: true, settings: user.notificationSettings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// 5. Get notification history
router.get('/history', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
});

// 6. Mark notification as read
router.put('/history/:id/read', async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { isRead: true }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});

// 7. Mark all as read
router.put('/history/read-all', async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
});

// 8. Delete notification
router.delete('/history/:id', async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});

// 9. Analytics: track notification interaction (clicked, dismissed)
router.post('/track', async (req, res) => {
    try {
        const { id, action } = req.body; // action = 'clicked' | 'dismissed'
        if (id) {
            const update = action === 'clicked' ? { isClicked: true, isRead: true } : { isDismissed: true };
            await Notification.findOneAndUpdate({ _id: id, userId: req.userId }, update);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error tracking notification:', error);
        res.status(500).json({ success: false });
    }
});

export default router;
