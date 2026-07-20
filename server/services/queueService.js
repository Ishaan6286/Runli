import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Connect to Redis instance — BullMQ requires maxRetriesPerRequest: null
const connection = new Redis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null // Do not reconnect if it fails
});

// Create the AI jobs queue and events listener
export const aiQueue = new Queue('ai-jobs', { connection });
export const aiQueueEvents = new QueueEvents('ai-jobs', { connection });

/**
 * Enqueue an AI processing job
 * @param {string} jobName Name of the job (e.g., 'generate-digest')
 * @param {Object} data Job payload
 * @returns Job instance
 */
export const enqueueAiJob = async (jobName, data) => {
    return await aiQueue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false
    });
};

/**
 * Setup repeating Cron jobs
 */
export const setupCronJobs = async () => {
    // Remove old repeatable jobs to prevent duplicates during development restarts
    const repeatableJobs = await aiQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await aiQueue.removeRepeatableByKey(job.key);
    }

    // Run every day at 8:00 PM (20:00)
    await aiQueue.add('predict-churn-all-users', {}, {
        repeat: {
            pattern: '0 20 * * *'
        }
    });
    console.log("Cron jobs scheduled via BullMQ");
};
