import User from '../models/User.js';

// Plan hierarchy
const PLAN_LEVELS = {
  free: 0,
  pro: 1,
  elite: 2
};

// Default monthly limits per plan
export const PLAN_LIMITS = {
  free: {
    voiceMinutes: 0,
    aiRequests: 10,
    poseAnalyses: 0,
    nutritionScans: 0
  },
  pro: {
    voiceMinutes: 30,
    aiRequests: 50,
    poseAnalyses: 10,
    nutritionScans: 15
  },
  elite: {
    voiceMinutes: 120,
    aiRequests: 500,
    poseAnalyses: 100,
    nutritionScans: 100
  }
};

/**
 * Middleware to require a minimum plan tier.
 */
export const requirePlan = (minimumPlan) => {
  return (req, res, next) => {
    const userPlan = req.user.plan || 'free';
    
    if (PLAN_LEVELS[userPlan] >= PLAN_LEVELS[minimumPlan]) {
      next();
    } else {
      res.status(403).json({ 
        error: `Requires ${minimumPlan.toUpperCase()} plan. Your plan: ${userPlan.toUpperCase()}`,
        code: 'UPGRADE_REQUIRED'
      });
    }
  };
};

/**
 * Middleware to track usage and block if limit exceeded.
 */
export const trackUsage = (featureName, cost = 1) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Initialize usage tracking if it doesn't exist
      if (!user.usageResetDate || new Date() > user.usageResetDate) {
        user.usage = { voiceMinutes: 0, aiRequests: 0, poseAnalyses: 0, nutritionScans: 0 };
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        user.usageResetDate = nextMonth;
      }

      const limit = PLAN_LIMITS[user.plan]?.[featureName] || 0;
      const currentUsage = user.usage[featureName] || 0;

      if (currentUsage + cost > limit) {
        return res.status(429).json({
          error: `Usage limit exceeded for ${featureName}. Limit: ${limit}`,
          code: 'LIMIT_EXCEEDED'
        });
      }

      // Increment usage
      user.usage[featureName] = currentUsage + cost;
      await user.save();

      // Proceed
      next();
    } catch (error) {
      console.error('Usage tracking error:', error);
      res.status(500).json({ error: 'Internal server error checking usage limits.' });
    }
  };
};
