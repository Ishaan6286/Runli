/**
 * ProGate.jsx
 * ─────────────────────────────────────────────────────
 * Multi-pattern feature gate for the freemium system.
 *
 * Patterns:
 *   variant="blur"   — blurs children + overlay CTA (full-section lock)
 *   variant="inline" — renders children with a lock badge wrapper
 *   variant="modal"  — renders children; clicking them opens upgrade modal
 *
 * Also exports:
 *   ProUpgradeModal  — the bottom-sheet upgrade modal (global singleton)
 *   LockBadge        — small reusable 🔒 Pro badge chip
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Zap, Check, ChevronRight } from 'lucide-react';
import usePlan, { GATES, registerUpgradeTrigger } from '../hooks/usePlan.js';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────
   LOCK BADGE — inline "Pro" chip
───────────────────────────────────────────────────── */
export function LockBadge({ small = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      padding: small ? '0.1rem 0.4rem' : '0.2rem 0.5rem',
      borderRadius: 99,
      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      color: '#fff',
      fontSize: small ? '0.6rem' : '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <Zap size={small ? 8 : 9} fill="currentColor" /> PRO
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   PRO UPGRADE MODAL
   Global singleton — mounts once in App.jsx or layout.
───────────────────────────────────────────────────── */
const PRO_FEATURES = [
  '⚡ AI Weekly Digest & Insights',
  '📷 Food Scanner — photo → calories',
  '🎯 Pose Detection & Form Analysis',
  '📊 Full Analytics Dashboard',
  '🧬 Fitness Archetype Breakdown',
  '♾️  Unlimited Habits & Diet Plans',
  '🎬 Full Video Library Access',
  '📈 All-Time Progress Charts',
];

export function ProUpgradeModal() {
  const [open, setOpen] = useState(false);
  const [triggerGate, setTriggerGate] = useState(null);
  const navigate = useNavigate();
  const { grantPro } = usePlan();

  // Register this modal as the global trigger target
  useEffect(() => {
    registerUpgradeTrigger((gate) => {
      setTriggerGate(gate);
      setOpen(true);
    });
    return () => registerUpgradeTrigger(null);
  }, []);

  const gateInfo = triggerGate ? GATES[triggerGate] : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 990, backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-card)',
              borderRadius: '1.25rem 1.25rem 0 0',
              padding: '1.5rem 1.25rem 2rem',
              zIndex: 991,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
              maxWidth: 480, margin: '0 auto',
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-subtle)', margin: '-0.5rem auto 1.25rem' }} />

            {/* Close */}
            <button onClick={() => setOpen(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'var(--bg-raised)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, display: 'grid', placeItems: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
            }}><X size={15} /></button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.75rem',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'grid', placeItems: 'center',
              }}>
                <Zap size={24} fill="#fff" color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Unlock Runli Pro
              </h2>
              {gateInfo && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  🔒 {gateInfo.name} requires Pro
                </div>
              )}
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem' }}>
                  <Check size={14} color="#10b981" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <button
              onClick={() => { setOpen(false); navigate('/upgrade'); }}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 'var(--r-lg)',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none', color: '#fff', fontWeight: 800,
                fontSize: '1rem', cursor: 'pointer', letterSpacing: '-0.01em',
                boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              <Zap size={16} fill="#fff" color="#fff" />
              Go Pro — ₹299/mo
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => { setOpen(false); navigate('/upgrade'); }}
              style={{
                width: '100%', padding: '0.625rem', marginTop: '0.5rem',
                background: 'transparent', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)', color: 'var(--text-secondary)',
                fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600,
              }}
            >
              See Annual Plan — ₹1,999/yr
            </button>

            <button
              onClick={() => setOpen(false)}
              style={{ width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.35rem' }}
            >
              Maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────
   ProGate — main wrapper component
───────────────────────────────────────────────────── */
export default function ProGate({
  gate,           // gate ID from GATES
  variant = 'blur', // 'blur' | 'inline' | 'modal'
  children,
  fallback = null,  // custom fallback UI (optional)
  blurLabel,        // override the blur overlay label
}) {
  const { isPro, triggerUpgrade } = usePlan();

  if (isPro) return children;

  const gateInfo = GATES[gate] || { name: gate, desc: '' };

  /* Pattern B — Blur overlay */
  if (variant === 'blur') {
    return (
      <div style={{ position: 'relative', userSelect: 'none' }}>
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none', opacity: 0.6 }}>
          {fallback || children}
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            padding: '1.25rem 1.5rem', textAlign: 'center',
            border: '1px solid rgba(245,158,11,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: 280,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>⚡</div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
              {blurLabel || `Unlock ${gateInfo.name}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {gateInfo.desc}
            </div>
            <button
              onClick={() => triggerUpgrade(gate)}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 99,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none', color: '#fff', fontWeight: 700,
                fontSize: '0.8125rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto',
              }}
            >
              <Zap size={13} fill="#fff" color="#fff" /> Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Pattern A — Inline (render children, let parent handle the lock UI) */
  if (variant === 'inline') return fallback || null;

  /* Pattern C — Modal (render nothing visible, clicks trigger modal) */
  return (
    <div onClick={() => triggerUpgrade(gate)} style={{ cursor: 'pointer' }}>
      {fallback}
    </div>
  );
}
