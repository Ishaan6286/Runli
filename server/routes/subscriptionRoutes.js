import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { PLAN_LIMITS } from '../middleware/subscriptionMiddleware.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables immediately before constructing Razorpay client
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

console.log('[Razorpay Init] Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('[Razorpay Init] Secret:', process.env.RAZORPAY_KEY_SECRET ? '***' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'undefined');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

const PLAN_IDS = {
  pro: process.env.RAZORPAY_PRO_PLAN_ID || 'plan_pro_dummy',
  elite: process.env.RAZORPAY_ELITE_PLAN_ID || 'plan_elite_dummy'
};

async function resolvePlanId(planTier) {
  let planId = PLAN_IDS[planTier];
  
  if (!planId || planId.includes('dummy') || planId.includes('xxx')) {
    try {
      console.log(`[Razorpay] Resolving plan ID for ${planTier} from API...`);
      const plansList = await razorpay.plans.all();
      const targetAmount = planTier === 'pro' ? 9900 : 19900;
      
      const existingPlan = plansList.items && plansList.items.find(p => 
        p.period === 'monthly' && 
        p.item.amount === targetAmount && 
        p.item.currency === 'INR' &&
        p.item.active !== false
      );
      
      if (existingPlan) {
        console.log(`[Razorpay] Found existing plan for ${planTier}: ${existingPlan.id}`);
        planId = existingPlan.id;
      } else {
        console.log(`[Razorpay] Creating new plan for ${planTier}...`);
        const isPro = planTier === 'pro';
        const newPlan = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: isPro ? 'Runli Pro' : 'Runli Elite',
            amount: targetAmount,
            currency: 'INR',
            description: isPro ? 'AI coaching to accelerate your results' : 'Everything Runli can offer, unlocked'
          }
        });
        console.log(`[Razorpay] Successfully created plan for ${planTier}: ${newPlan.id}`);
        planId = newPlan.id;
      }
      
      PLAN_IDS[planTier] = planId;
      
      // Write it back to the .env files
      const envPaths = [
        join(__dirname, '.env'),
        join(__dirname, '..', '.env')
      ];
      
      for (const envPath of envPaths) {
        try {
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            const varName = planTier === 'pro' ? 'RAZORPAY_PRO_PLAN_ID' : 'RAZORPAY_ELITE_PLAN_ID';
            if (envContent.includes(varName)) {
              envContent = envContent.replace(new RegExp(`${varName}=.*`, 'g'), `${varName}=${planId}`);
            } else {
              envContent += `\n${varName}=${planId}`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log(`[Razorpay] Saved ${varName}=${planId} to ${envPath}`);
          }
        } catch (err) {
          console.error(`[Razorpay] Error saving to ${envPath}:`, err);
        }
      }
    } catch (error) {
      console.error(`[Razorpay] Failed to resolve/create plan for ${planTier}:`, error);
    }
  }
  
  return planId;
}

// Automatically resolve plan IDs on startup
setTimeout(async () => {
  try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'dummy_key') {
      await resolvePlanId('pro');
      await resolvePlanId('elite');
    }
  } catch (err) {
    console.error('[Razorpay] Plan auto-resolution error:', err);
  }
}, 1000);

// 1. Get Subscription Status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('plan planStatus planExpiresAt usage usageResetDate');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if limits need reset
    if (!user.usageResetDate || new Date() > user.usageResetDate) {
      user.usage = { voiceMinutes: 0, aiRequests: 0, poseAnalyses: 0, nutritionScans: 0 };
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      user.usageResetDate = nextMonth;
      await user.save();
    }

    res.json({
      plan: user.plan,
      status: user.planStatus,
      expiresAt: user.planExpiresAt,
      usage: user.usage,
      limits: PLAN_LIMITS[user.plan],
      resetDate: user.usageResetDate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Create Razorpay Subscription Checkout
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { planTier } = req.body; // 'pro' or 'elite'
    
    if (!['pro', 'elite'].includes(planTier)) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }

    const user = await User.findById(req.user._id);
    
    // Try to create customer
    try {
      if (!user.razorpayCustomerId) {
        const customer = await razorpay.customers.create({
          name: user.name,
          email: user.email,
          contact: "9999999999"
        });
        user.razorpayCustomerId = customer.id;
        await user.save();
      }
    } catch (custErr) {
      console.warn('[Razorpay] Customer creation failed (may not be supported or authorized):', custErr.message);
    }

    // Try Subscriptions flow
    try {
      const activePlanId = await resolvePlanId(planTier);
      
      // If we couldn't resolve a valid plan ID (e.g. 401 Unauthorized), throw to fallback
      if (!activePlanId || activePlanId.includes('dummy')) {
        throw new Error('Subscriptions feature unauthorized or plan ID invalid');
      }

      const subscription = await razorpay.subscriptions.create({
        plan_id: activePlanId,
        customer_id: user.razorpayCustomerId || undefined,
        total_count: 12, // 1 year billing cycle limit
        customer_notify: 1
      });

      user.razorpaySubscriptionId = subscription.id;
      user.razorpayOrderId = null; // Clear order id if subscription works
      await user.save();

      return res.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (subErr) {
      console.warn('[Razorpay] Subscription flow failed. Falling back to standard Order payment:', subErr.message || subErr);
      
      // FALLBACK: Create a standard Razorpay Order
      const amount = planTier === 'pro' ? 9900 : 19900; // in paise
      const order = await razorpay.orders.create({
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${user._id.toString().slice(-8)}_${Date.now()}`
      });

      user.razorpayOrderId = order.id;
      user.razorpaySubscriptionId = null; // Clear subscription if order is used
      await user.save();

      return res.json({
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
});

// 3. Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body) // req.body is a Buffer because of express.raw()
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payloadRaw = JSON.parse(req.body.toString('utf8'));
    const event = payloadRaw.event;
    const payload = payloadRaw.payload;

    if (event === 'subscription.charged') {
      const sub = payload.subscription.entity;
      const user = await User.findOne({ razorpaySubscriptionId: sub.id });
      
      if (user) {
        // Find which plan this maps to
        const planTier = Object.keys(PLAN_IDS).find(key => PLAN_IDS[key] === sub.plan_id) || 'pro';
        
        user.plan = planTier;
        user.planStatus = 'active';
        user.planStartedAt = new Date(sub.start_at * 1000);
        user.planExpiresAt = new Date(sub.current_end * 1000);
        
        // Reset usage
        user.usage = { voiceMinutes: 0, aiRequests: 0, poseAnalyses: 0, nutritionScans: 0 };
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        user.usageResetDate = nextMonth;
        
        await user.save();
      }
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const sub = payload.subscription.entity;
      const user = await User.findOne({ razorpaySubscriptionId: sub.id });
      
      if (user) {
        user.plan = 'free';
        user.planStatus = 'cancelled';
        await user.save();
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 4. Verify Payment Signature and Activate Subscription
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature, planTier } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (razorpay_order_id) {
      // ─── Standard Order Verification ───
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      user.plan = planTier || 'pro';
      user.planStatus = 'active';
      user.razorpayOrderId = razorpay_order_id;
      user.razorpaySubscriptionId = null;
      user.planStartedAt = new Date();
      
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30 days access
      user.planExpiresAt = expires;

    } else if (razorpay_subscription_id) {
      // ─── Subscription Verification ───
      const text = `${razorpay_payment_id}|${razorpay_subscription_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Retrieve subscription details from Razorpay to get the plan ID and status
      const sub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      const tier = Object.keys(PLAN_IDS).find(key => PLAN_IDS[key] === sub.plan_id) || 'pro';
      
      user.plan = tier;
      user.planStatus = 'active';
      user.razorpaySubscriptionId = sub.id;
      user.razorpayOrderId = null;
      user.planStartedAt = new Date(sub.start_at * 1000);
      user.planExpiresAt = new Date(sub.current_end * 1000);
    } else {
      return res.status(400).json({ error: 'Missing subscription_id or order_id' });
    }
    
    // Reset usage
    user.usage = { voiceMinutes: 0, aiRequests: 0, poseAnalyses: 0, nutritionScans: 0 };
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    user.usageResetDate = nextMonth;

    await user.save();

    res.json({ success: true, plan: user.plan, status: user.planStatus });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ error: 'Signature verification failed' });
  }
});

// 5. Cancel Subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, false);
    
    user.planStatus = 'cancelled';
    // We let the webhook downgrade them to free, or downgrade immediately:
    user.plan = 'free';
    await user.save();

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Error cancelling subscription' });
  }
});

// 6. 90-Day Trial
router.post('/trial', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.plan = 'elite';
    user.planStatus = 'active';
    user.planStartedAt = new Date();
    
    const expires = new Date();
    expires.setDate(expires.getDate() + 90);
    user.planExpiresAt = expires;
    
    // Reset usage
    user.usage = { voiceMinutes: 0, aiRequests: 0, poseAnalyses: 0, nutritionScans: 0 };
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    user.usageResetDate = nextMonth;
    
    await user.save();
    res.json({ success: true, plan: user.plan, status: user.planStatus });
  } catch (error) {
    console.error('Trial error:', error);
    res.status(500).json({ error: 'Trial activation failed' });
  }
});

export default router;
