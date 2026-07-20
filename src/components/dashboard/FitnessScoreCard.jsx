/**
 * FitnessScoreCard.jsx
 * ─────────────────────────────────────────────
 * Renders the main Fitness Score widget:
 *  - Animated circular gauge (SVG arc)
 *  - Grade badge (S / A / B / C / D / F)
 *  - Per-category breakdown pills
 *  - Detailed reasoning list with +/- impact
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Info } from 'lucide-react';

// ── Colour palette keyed by category ──
const CATEGORY_META = {
  workout:   { label: 'Workout',    emoji: '💪', color: '#22c55e' },
  nutrition: { label: 'Nutrition',  emoji: '🥗', color: '#f59e0b' },
  recovery:  { label: 'Recovery',   emoji: '🌙', color: '#818cf8' },
  habits:    { label: 'Habits',     emoji: '✅', color: '#38bdf8' },
  weight:    { label: 'Weight',     emoji: '⚖️', color: '#f472b6' },
};

// ── SVG circular gauge ──
const RADIUS = 52;
const CIRC   = 2 * Math.PI * RADIUS;

function CircularGauge({ score = 0, color = '#22c55e', size = 140 }) {
  const progress = (score / 100) * CIRC;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {/* Progress arc */}
      <motion.circle
        cx="60" cy="60" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        initial={{ strokeDashoffset: CIRC }}
        animate={{ strokeDashoffset: CIRC - progress }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

// ── Single reasoning row ──
function ReasoningRow({ item }) {
  const meta   = CATEGORY_META[item.category] ?? { label: item.category, emoji: '•', color: '#9ca3af' };
  const isPos  = item.impact >= 0;
  const impStr = isPos ? `+${item.impact}` : `${item.impact}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        padding: '0.55rem 0.75rem',
        borderRadius: '0.625rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.emoji || meta.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: meta.color, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
          {meta.label}
        </div>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {item.text}
        </div>
      </div>
      <span style={{
        fontSize: '0.875rem', fontWeight: 800, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
        color: isPos ? '#22c55e' : '#ef4444',
      }}>
        {impStr}
      </span>
    </motion.div>
  );
}

// ── Main component ──
export default function FitnessScoreCard({ score: scoreProp, loading, error, onRefresh }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const totalScore = scoreProp?.totalScore ?? 0;
  const grade      = scoreProp?.grade      ?? { grade: '—', label: 'No data', color: '#6b7280' };
  const reasoning  = scoreProp?.reasoning  ?? [];
  const breakdown  = scoreProp?.breakdown  ?? {};
  const completeness = scoreProp?.dataCompleteness ?? 0;

  return (
    <div
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${grade.color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} color={grade.color} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
            Fitness Score
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Recalculate score"
          style={{
            background: 'transparent', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '0.375rem',
            display: 'flex', alignItems: 'center',
          }}
        >
          <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 0.8, ease: 'linear' }}>
            <RefreshCw size={14} />
          </motion.div>
        </button>
      </div>

      {/* Score gauge + number */}
      {loading && !scoreProp ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.8125rem' }}>
          Score unavailable — connect your backend.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Gauge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CircularGauge score={totalScore} color={grade.color} size={130} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <motion.span
                key={totalScore}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
              >
                {totalScore}
              </motion.span>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em',
                color: grade.color, textTransform: 'uppercase',
              }}>
                {grade.grade} · {grade.label}
              </span>
            </div>
          </div>

          {/* Category breakdown pills */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const val = breakdown[key] ?? 0;
              const pct = (val / 20) * 100;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', width: 14, textAlign: 'center' }}>{meta.emoji}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      style={{ height: '100%', borderRadius: 99, background: meta.color, opacity: 0.85 }}
                    />
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: meta.color, width: 22, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data completeness warning */}
      {completeness < 0.8 && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 0.625rem', borderRadius: '0.5rem',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: '0.7rem', color: '#f59e0b',
        }}>
          <Info size={12} />
          Log sleep, mood, and meals to improve score accuracy ({Math.round(completeness * 100)}% data).
        </div>
      )}

      {/* Toggle breakdown */}
      {!loading && reasoning.length > 0 && (
        <>
          <button
            onClick={() => setShowBreakdown(v => !v)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.625rem', padding: '0.5rem 0.75rem', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            }}
          >
            <Info size={12} />
            {showBreakdown ? 'Hide reasoning' : 'Why this score?'}
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {reasoning.map((item, i) => (
                    <motion.div key={item.category} transition={{ delay: i * 0.07 }}>
                      <ReasoningRow item={item} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
