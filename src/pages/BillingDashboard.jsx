/**
 * BillingDashboard.jsx — /billing
 * Shows current plan, usage meters, renewal info, and cancel option.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Zap, Crown, Star, BarChart2, Mic, Brain, Camera,
  Salad, Calendar, AlertTriangle, CheckCircle, Loader, CreditCard, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlan from '../hooks/usePlan.js';
import { cancelSubscription } from '../services/api.js';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const PLAN_META = {
  free:  { icon: Star,  label: 'Free',  color: 'var(--text-muted)', gradient: 'var(--bg-surface)' },
  pro:   { icon: Zap,   label: 'Pro',   color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))' },
  elite: { icon: Crown, label: 'Elite', color: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.05))' },
};

/* ── Usage Bar Component ── */
const UsageBar = ({ icon: Icon, label, used, limit, color }) => {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit === 999;
  const isAtLimit = pct >= 100;
  const isWarning = pct >= 80 && !isAtLimit;

  const barColor = isAtLimit ? 'var(--error-500)' : isWarning ? '#f59e0b' : color;

  return (
    <div style={{ padding: '1rem', background: 'var(--bg-raised)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={15} color={barColor} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{label}</span>
          {isAtLimit && (
            <span style={{ fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', color: 'var(--error-500)', padding: '0.1rem 0.45rem', borderRadius: 99, fontWeight: 700 }}>
              LIMIT REACHED
            </span>
          )}
          {isWarning && (
            <AlertTriangle size={12} color="#f59e0b" />
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isUnlimited ? '20%' : `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', borderRadius: 99, background: barColor, transition: 'background 300ms' }}
        />
      </div>
      {!isUnlimited && (
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {Math.max(0, limit - used)} remaining this month
        </div>
      )}
    </div>
  );
};

/* ══ Main Page ══════════════════════════════════════════ */
export default function BillingDashboard() {
  const navigate = useNavigate();
  const { plan, status, usage, limits, expiresAt, loading, reloadPlan } = usePlan();
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const meta = PLAN_META[plan] || PLAN_META.free;
  const PlanIcon = meta.icon;

  const handleCancel = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    setCancelling(true);
    setCancelError('');
    try {
      await cancelSubscription();
      await reloadPlan();
      setCancelSuccess(true);
      setCancelConfirm(false);
    } catch (err) {
      console.error(err);
      setCancelError('Failed to cancel. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const renewalDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
      <Loader size={18} className="spin" />
      Loading billing…
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)', paddingBottom: '6rem' }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '0.875rem', padding: 0, fontWeight: 600,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <motion.h1 {...fadeUp} style={{ margin: 0, fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={22} color="var(--primary-500)" />
          Billing & Usage
        </motion.h1>

        {/* ── Current Plan Card ── */}
        <motion.div {...fadeUp} style={{
          background: meta.gradient,
          border: `1.5px solid ${plan === 'free' ? 'var(--border-subtle)' : meta.color + '44'}`,
          borderRadius: 'var(--r-xl)',
          padding: '1.5rem',
          boxShadow: plan !== 'free' ? `0 4px 32px ${meta.color}15` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-lg)',
                background: plan === 'free' ? 'var(--bg-raised)' : `${meta.color}20`,
                border: `1px solid ${plan === 'free' ? 'var(--border-subtle)' : `${meta.color}33`}`,
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <PlanIcon size={22} color={meta.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.1rem' }}>
                  Active Plan
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Runli {meta.label}
                </div>
                {status && status !== 'none' && (
                  <div style={{ fontSize: '0.75rem', color: status === 'active' ? '#10b981' : '#f59e0b', fontWeight: 600, marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {status === 'active' ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                    {status === 'active' ? 'Active' : status === 'past_due' ? 'Payment Past Due' : status}
                  </div>
                )}
              </div>
            </div>

            {/* Plan price */}
            <div style={{ textAlign: 'right' }}>
              {plan === 'free' ? (
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>Free</div>
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: meta.color, letterSpacing: '-0.02em' }}>
                    ₹{plan === 'pro' ? '99' : '199'}<span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
                  </div>
                  {renewalDate && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                      <Calendar size={11} /> Renews {renewalDate}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Upgrade CTA for free */}
          {plan === 'free' && (
            <button onClick={() => navigate('/upgrade')} style={{
              marginTop: '1rem', width: '100%', padding: '0.75rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: 'var(--r-lg)', color: '#fff',
              fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            }}>
              <Zap size={16} /> Upgrade to Pro — ₹99/mo
            </button>
          )}
        </motion.div>

        {/* ── Usage Meters ── */}
        <motion.div {...fadeUp} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="var(--primary-500)" /> Usage This Month
            </h2>
            <button onClick={reloadPlan} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {(plan === 'free' && !usage) ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <BarChart2 size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>Usage tracking is not available on the Free plan.</div>
              <button onClick={() => navigate('/upgrade')} style={{
                marginTop: '0.75rem', background: 'none', border: '1px solid var(--primary-500)',
                color: 'var(--primary-500)', borderRadius: 'var(--r-md)', padding: '0.4rem 1rem',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
              }}>
                Upgrade to track usage
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <UsageBar
                icon={Mic} label="Voice Minutes"
                used={usage?.voiceMinutes || 0}
                limit={limits?.voiceMinutes || 0}
                color={meta.color}
              />
              <UsageBar
                icon={Brain} label="AI Requests"
                used={usage?.aiRequests || 0}
                limit={limits?.aiRequests || 0}
                color="var(--purple-500)"
              />
              <UsageBar
                icon={Camera} label="Pose Analyses"
                used={usage?.poseAnalyses || 0}
                limit={limits?.poseAnalyses || 0}
                color="var(--blue-500)"
              />
              <UsageBar
                icon={Salad} label="Nutrition Scans"
                used={usage?.nutritionScans || 0}
                limit={limits?.nutritionScans || 0}
                color="var(--amber-500)"
              />
            </div>
          )}
        </motion.div>

        {/* ── Manage Subscription ── */}
        {plan !== 'free' && (
          <motion.div {...fadeUp} className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>Manage Subscription</h2>

            <button onClick={() => navigate('/upgrade')} style={{
              width: '100%', padding: '0.75rem', marginBottom: '0.75rem',
              background: `${meta.color}15`, border: `1px solid ${meta.color}33`,
              borderRadius: 'var(--r-lg)', color: meta.color,
              fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              <PlanIcon size={16} /> Change Plan
            </button>

            <AnimatePresence>
              {cancelSuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--r-md)', padding: '0.75rem', marginBottom: '0.75rem', color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={15} /> Subscription cancelled. You'll retain access until {renewalDate}.
                </motion.div>
              )}
            </AnimatePresence>

            {cancelError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '0.75rem', marginBottom: '0.75rem', color: 'var(--error-500)', fontSize: '0.875rem' }}>
                {cancelError}
              </div>
            )}

            <AnimatePresence>
              {cancelConfirm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-lg)', padding: '1rem', marginBottom: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={16} color="var(--error-500)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Are you sure?</strong> Your {meta.label} access will end on {renewalDate}. You can re-subscribe any time.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setCancelConfirm(false)} style={{
                      flex: 1, padding: '0.6rem', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--r-md)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                    }}>
                      Keep Plan
                    </button>
                    <button onClick={handleCancel} disabled={cancelling} style={{
                      flex: 1, padding: '0.6rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 'var(--r-md)', color: 'var(--error-500)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                    }}>
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!cancelConfirm && !cancelSuccess && (
              <button onClick={handleCancel} style={{
                width: '100%', padding: '0.65rem', background: 'transparent',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-lg)',
                color: 'var(--error-500)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                opacity: 0.8,
              }}>
                Cancel Subscription
              </button>
            )}
          </motion.div>
        )}

        {/* ── Need help? ── */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
          Questions? Contact <a href="mailto:support@runli.app" style={{ color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600 }}>support@runli.app</a>
        </div>

      </div>
    </motion.div>
  );
}
