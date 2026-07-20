/**
 * usePlan.js
 * ─────────────────────────────────────────────────────
 * Central hook for freemium plan state and feature gating.
 *
 * Usage:
 *   const { plan, isPro, isElite, canUse, triggerUpgrade } = usePlan();
 *   if (!canUse('food_scanner')) triggerUpgrade('food_scanner');
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchSubscriptionStatus } from '../services/api.js';

/* ── Gate definitions ──────────────────────────────── */
export const GATES = {
  // PRO Features
  ai_digest:            { name: 'AI Weekly Digest',     desc: 'Personalized AI-powered weekly summary', tier: 'pro' },
  analytics_full:       { name: 'Full Analytics',       desc: 'All-time charts, trends & insights', tier: 'pro' },
  archetype_breakdown:  { name: 'Fitness Archetype',    desc: 'See your full archetype breakdown', tier: 'pro' },
  habits_unlimited:     { name: 'Unlimited Habits',     desc: 'Track more than 3 habits at once', tier: 'pro' },
  videos_full:          { name: 'Full Video Library',   desc: 'Access all workout videos', tier: 'pro' },
  progress_all_time:    { name: 'All-Time Progress',    desc: 'View progress beyond 7 days', tier: 'pro' },
  diet_plans_custom:    { name: 'Custom Diet Plans',    desc: 'Generate unlimited personalised plans', tier: 'pro' },

  // ELITE Features
  food_scanner:         { name: 'Food Scanner',         desc: 'Scan food photos to detect calories', tier: 'elite' },
  pose_detection:       { name: 'Pose Detection',       desc: 'Analyze your exercise form in real-time', tier: 'elite' },
  fitness_twin:         { name: 'AI Fitness Twin',      desc: 'Predictive analytics and personal twin', tier: 'elite' },
  premium_voice:        { name: 'Premium Voice',        desc: 'Advanced voice coach features', tier: 'elite' }
};

/* ── Plan hierarchy ────────────────────────────────── */
const PLAN_LEVELS = {
  free: 0,
  pro: 1,
  elite: 2
};

/* ── Singleton upgrade modal callback ──────────────── */
let _globalUpgradeTrigger = null;
export function registerUpgradeTrigger(fn) { _globalUpgradeTrigger = fn; }

/* ══ Hook ════════════════════════════════════════════ */
export default function usePlan() {
  const [planData, setPlanData] = useState({
    plan: 'free',
    status: 'none',
    usage: null,
    limits: null,
    loading: true
  });

  useEffect(() => {
    let mounted = true;
    const loadPlan = async () => {
      try {
        const data = await fetchSubscriptionStatus();
        if (mounted && data) {
          setPlanData({
            plan: data.plan || 'free',
            status: data.status || 'none',
            usage: data.usage || null,
            limits: data.limits || null,
            loading: false
          });
        }
      } catch (err) {
        console.error('Failed to fetch subscription status', err);
        if (mounted) setPlanData(prev => ({ ...prev, loading: false }));
      }
    };
    loadPlan();
  }, []);

  const isPro = PLAN_LEVELS[planData.plan] >= PLAN_LEVELS['pro'];
  const isElite = PLAN_LEVELS[planData.plan] >= PLAN_LEVELS['elite'];

  const canUse = useCallback((gateId) => {
    const gate = GATES[gateId];
    if (!gate) return true; // If gate doesn't exist, allow by default or block? Allow for safety.

    const reqTier = gate.tier || 'pro';
    return PLAN_LEVELS[planData.plan] >= PLAN_LEVELS[reqTier];
  }, [planData.plan]);

  const triggerUpgrade = useCallback((gate = null) => {
    if (_globalUpgradeTrigger) {
      _globalUpgradeTrigger(gate);
    } else {
      window.location.href = '/upgrade';
    }
  }, []);

  // Expose methods to reload plan (e.g. after successful checkout)
  const reloadPlan = useCallback(async () => {
    try {
      const data = await fetchSubscriptionStatus();
      if (data) {
        setPlanData({
          plan: data.plan || 'free',
          status: data.status || 'none',
          usage: data.usage || null,
          limits: data.limits || null,
          loading: false
        });
      }
    } catch (err) {
      console.error('Reload failed', err);
    }
  }, []);

  return { 
    ...planData, 
    isPro, 
    isElite, 
    canUse, 
    triggerUpgrade,
    reloadPlan
  };
}
