import cron from 'node-cron';
import webPush from 'web-push';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
// Helper to send push and save to history
async function sendNotification(user, title, message, category, link = null) {
    // 1. Check quiet hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);

    const { quietHoursStart, quietHoursEnd } = user.notificationSettings || {};
    if (quietHoursStart && quietHoursEnd) {
        const [startH, startM] = quietHoursStart.split(':').map(Number);
        const [endH, endM] = quietHoursEnd.split(':').map(Number);
        const start = startH + (startM / 60);
        const end = endH + (endM / 60);

        let inQuietHours = false;
        if (start < end) {
            inQuietHours = currentTime >= start && currentTime < end;
        } else {
            // wraps around midnight
            inQuietHours = currentTime >= start || currentTime < end;
        }

        if (inQuietHours) {
            console.log(`Skipping notification for ${user.email} due to quiet hours`);
            return;
        }
    }

    // 2. Save to history
    const notification = await Notification.create({
        userId: user._id,
        title,
        message,
        category,
        link
    });

    // 3. Send Web Push if subscribed
    if (user.pushSubscription) {
        try {
            const payload = JSON.stringify({
                title,
                message,
                category,
                link,
                id: notification._id
            });
            await webPush.sendNotification(user.pushSubscription, payload);
        } catch (error) {
            console.error(`Failed to send push to ${user.email}:`, error.message);
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription has expired or is no longer valid
                await User.findByIdAndUpdate(user._id, { pushSubscription: null });
            }
        }
    }
}

// -------------------------------------------------------------
// Schedulers
// -------------------------------------------------------------

export function startNotificationEngine() {
    console.log('Starting Notification Engine...');

    // 1. Smart Workout Reminders (Runs every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
        const users = await User.find({ 'notificationSettings.workout': true });
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const user of users) {
            if (!user.workoutSchedule || !user.workoutSchedule.enabled || !user.workoutSchedule.preferredTime) continue;
            
            // e.g. "18:30"
            const [prefH, prefM] = user.workoutSchedule.preferredTime.split(':').map(Number);
            const leadTime = user.workoutSchedule.reminderLeadTime || 30;

            // Calculate notification time
            let notifTime = new Date(now);
            notifTime.setHours(prefH, prefM, 0, 0);
            notifTime.setMinutes(notifTime.getMinutes() - leadTime);

            // If current time is within a 15-minute window of the notifTime
            const diffMin = Math.floor((now - notifTime) / 60000);
            if (diffMin >= 0 && diffMin < 15) {
                // Determine if today is a scheduled day
                const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                if (user.workoutSchedule.days && user.workoutSchedule.days.length > 0) {
                    if (!user.workoutSchedule.days.includes(todayName)) continue; // Rest day
                }

                await sendNotification(
                    user,
                    'Workout Upcoming 🏋️',
                    `Your workout starts in ${leadTime} minutes. Let's get after it!`,
                    'workout',
                    '/gym'
                );
            }
        }
    });

    // 2. Evening Habit / Progress Check (8:00 PM)
    cron.schedule('0 20 * * *', async () => {
        const users = await User.find({ 'notificationSettings.habits': true });
        for (const user of users) {
            await sendNotification(
                user,
                'Evening Review',
                'Did you complete all your habits today? Check in before bed.',
                'habit',
                '/habits'
            );
        }
    });

    // 3. Water Reminder (Every 3 hours during day 9AM-6PM)
    cron.schedule('0 9,12,15,18 * * *', async () => {
        const users = await User.find({ 'notificationSettings.water': true });
        for (const user of users) {
            await sendNotification(
                user,
                'Hydration Check 💧',
                'Time for a glass of water! Keep your hydration streak going.',
                'water'
            );
        }
    });

    // 4. Weekly AI Report (Sunday 9:00 AM)
    cron.schedule('0 9 * * 0', async () => {
        const users = await User.find({ 'notificationSettings.weeklyReport': true });
        for (const user of users) {
            await sendNotification(
                user,
                'Weekly Report Ready 📊',
                'Your personalized AI progress report for the week is ready to view.',
                'progress',
                '/analytics'
            );
        }
    });
}
