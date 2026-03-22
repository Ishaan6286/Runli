/**
 * usePlan.js
 * ─────────────────────────────────────────────────────
 * Central hook for freemium plan state.
 *
 * Usage:
 *   const { isPro, canUse, triggerUpgrade } = usePlan();
 *   if (!canUse('food_scanner')) triggerUpgrade('food_scanner');
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── Gate definitions ──────────────────────────────── */
export const GATES = {
  food_scanner:         { name: 'Food Scanner',         desc: 'Scan food photos to detect calories' },
  pose_detection:       { name: 'Pose Detection',       desc: 'Analyze your exercise form in real-time' },
  ai_digest:            { name: 'AI Weekly Digest',     desc: 'Personalized AI-powered weekly summary' },
  analytics_full:       { name: 'Full Analytics',       desc: 'All-time charts, trends & insights' },
  archetype_breakdown:  { name: 'Fitness Archetype',    desc: 'See your full archetype breakdown' },
  habits_unlimited:     { name: 'Unlimited Habits',     desc: 'Track more than 3 habits at once' },
  videos_full:          { name: 'Full Video Library',   desc: 'Access all workout videos' },
  progress_all_time:    { name: 'All-Time Progress',    desc: 'View progress beyond 7 days' },
  diet_plans_custom:    { name: 'Custom Diet Plans',    desc: 'Generate unlimited personalised plans' },
};

/* ── Plan constants ────────────────────────────────── */
const PLAN_KEY = 'runliPlan';           // 'free' | 'pro'
const PLAN_EXP_KEY = 'runliPlanExp';    // ISO date string

function readPlan() {
  try {
    const plan = localStorage.getItem(PLAN_KEY) || 'free';
    const exp  = localStorage.getItem(PLAN_EXP_KEY);
    // If plan is pro but expired, downgrade
    if (plan === 'pro' && exp && new Date(exp) < new Date()) {
      localStorage.setItem(PLAN_KEY, 'free');
      localStorage.removeItem(PLAN_EXP_KEY);
      return 'free';
    }
    return plan;
  } catch {
    return 'free';
  }
}

/* ── Singleton upgrade modal callback ──────────────── */
// Components register their modal opener here so usePlan can trigger it globally
let _globalUpgradeTrigger = null;
export function registerUpgradeTrigger(fn) { _globalUpgradeTrigger = fn; }

/* ══ Hook ════════════════════════════════════════════ */
export default function usePlan() {
  const [plan, setPlan] = useState(readPlan);

  // Listen for plan changes from other tabs / same-tab pro grant
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PLAN_KEY) setPlan(readPlan());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPro = plan === 'pro';

  const canUse = useCallback((gate) => {
    if (isPro) return true;
    // All gates locked on free tier
    return false;
  }, [isPro]);

  const triggerUpgrade = useCallback((gate = null) => {
    if (_globalUpgradeTrigger) {
      _globalUpgradeTrigger(gate);
    } else {
      // Fallback: navigate directly
      window.location.href = '/upgrade';
    }
  }, []);

  /** Simulate pro grant (dev helper + post-payment) */
  const grantPro = useCallback((months = 1) => {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + months);
    localStorage.setItem(PLAN_KEY, 'pro');
    localStorage.setItem(PLAN_EXP_KEY, exp.toISOString());
    setPlan('pro');
    // Dispatch storage event to sync other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: PLAN_KEY }));
  }, []);

  const revokePro = useCallback(() => {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(PLAN_EXP_KEY);
    setPlan('free');
  }, []);

  return { plan, isPro, canUse, triggerUpgrade, grantPro, revokePro };
}
