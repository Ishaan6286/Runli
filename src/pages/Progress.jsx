import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Scale, Flame,
  Zap, Calendar, Award, Activity, ChevronLeft, ChevronRight,
  Target, Clock, Sparkles, Brain, Dumbbell, Utensils,
} from 'lucide-react';
import {
  predictWeightChange,
  computeGoalTimeline,
  buildProjectionPoints,
  buildCalorieSeries,
  computeConsistencyFactor,
} from '../utils/predictionEngine.js';
import { getPredictionData } from '../services/api.js';

/* ── Motion ─────────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};
const stagger = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const fadeUp  = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Helpers ─────────────────────────────────────────── */
function loadWeightLog() {
  try {
    const raw = JSON.parse(localStorage.getItem('runliWeightLog')) || [];
    // Also seed with current userInfo weight as starting point
    if (!raw.length) {
      const info = JSON.parse(localStorage.getItem('runliUserInfo')) || {};
      if (info.weight) {
        const today = new Date().toISOString().split('T')[0];
        return [{ date: today, weight: parseFloat(info.weight) }];
      }
    }
    return raw;
  } catch { return []; }
}

function saveWeightLog(log) {
  try { localStorage.setItem('runliWeightLog', JSON.stringify(log)); } catch {}
}

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('runliProgress')) || {}; } catch { return {}; }
}

function loadWellnessHistory() {
  try { return JSON.parse(localStorage.getItem('runliWellnessHistory')) || []; } catch { return []; }
}

// Build last 30-day calendar matrix
function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function xpLevel(xp) {
  const tiers = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11500, 16000, 22000];
  let lvl = 1;
  for (let i = 0; i < tiers.length; i++) { if (xp >= tiers[i]) lvl = i + 1; }
  const nextXP = tiers[Math.min(lvl, tiers.length - 1)];
  const currXP = tiers[lvl - 1] || 0;
  return { lvl, pct: Math.min(((xp - currXP) / (nextXP - currXP || 1)) * 100, 100), nextXP, currXP };
}

/* ── Weight Sparkline (with optional projection) ─────── */
const WeightChart = ({ data, goal, projectionPoints = [] }) => {
  if (!data.length) return (
    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
      Log your first weigh-in below
    </div>
  );

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const allValues = [
    ...sorted.map(d => d.weight),
    ...projectionPoints.map(d => d.weight),
  ];
  const minVal = Math.min(...allValues) - 2;
  const maxVal = Math.max(...allValues) + 2;
  const range  = maxVal - minVal || 1;
  const W = 100, H = 70;

  // Historical points occupy left portion; projection the right 30%
  const histW = projectionPoints.length ? 70 : W;

  const pts = sorted.map((d, i) => [
    (i / (sorted.length - 1 || 1)) * histW,
    H - ((d.weight - minVal) / range) * H,
  ]);

  // Projection points start from where historical ends
  const lastHistX = pts.length ? pts[pts.length - 1][0] : histW;
  const lastHistY = pts.length ? pts[pts.length - 1][1] : H / 2;
  const projPts = projectionPoints.map((d, i) => [
    lastHistX + ((i + 1) / (projectionPoints.length)) * (W - lastHistX),
    H - ((d.weight - minVal) / range) * H,
  ]);

  const polyline    = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area        = `M${pts.map(([x, y]) => `${x},${y}`).join('L')} L${lastHistX},${H} L0,${H} Z`;
  const projLine    = projPts.length
    ? [[lastHistX, lastHistY], ...projPts].map(([x, y]) => `${x},${y}`).join(' ')
    : '';

  const goalY = goal ? H - ((goal - minVal) / range) * H : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 80, overflow: 'visible' }}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="projg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--purple-500)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--purple-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Historical area */}
        <path d={area} fill="url(#wg)" />
        {/* Historical line */}
        <polyline points={polyline} fill="none" stroke="var(--primary-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Projection line (dashed) */}
        {projLine && (
          <polyline points={projLine} fill="none"
            stroke="var(--purple-500)" strokeWidth="1.5"
            strokeDasharray="4,3" strokeLinecap="round" opacity="0.75" />
        )}
        {/* Goal line */}
        {goalY != null && (
          <line x1="0" y1={goalY} x2={W} y2={goalY}
            stroke="var(--amber-500)" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
        )}
        {/* Last historical dot */}
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5"
            fill="var(--primary-500)" stroke="var(--bg-surface)" strokeWidth="1.5" />
        )}
        {/* Projected end dot */}
        {projPts.length > 0 && (
          <circle cx={projPts[projPts.length - 1][0]} cy={projPts[projPts.length - 1][1]} r="2"
            fill="var(--purple-500)" stroke="var(--bg-surface)" strokeWidth="1.5" opacity="0.85" />
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        <span>{sorted[0]?.date?.slice(5)}</span>
        {projectionPoints.length > 0 && (
          <span style={{ color: 'var(--purple-500)', opacity: 0.75 }}>→ {projectionPoints[projectionPoints.length - 1]?.date?.slice(5)}</span>
        )}
        <span>{sorted[sorted.length - 1]?.date?.slice(5)}</span>
      </div>
      {projectionPoints.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 14, height: 2, background: 'var(--primary-500)', borderRadius: 2, display: 'inline-block' }} /> Actual
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--purple-500)', opacity: 0.75, display: 'inline-block' }} /> Projected
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Streak Calendar ─────────────────────────────────── */
const StreakCalendar = ({ gymProgress }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const cells = buildCalendar(viewDate.year, viewDate.month);
  const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => setViewDate(p => {
    if (p.month === 0) return { year: p.year - 1, month: 11 };
    return { ...p, month: p.month - 1 };
  });
  const nextMonth = () => setViewDate(p => {
    if (p.month === 11) return { year: p.year + 1, month: 0 };
    return { ...p, month: p.month + 1 };
  });

  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleString('en', { month: 'long', year: 'numeric' });

  const isGymDay = (d) => {
    if (!d) return false;
    const key = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return gymProgress[key]?.wentToGym;
  };

  const isToday = (d) => {
    if (!d) return false;
    return d === today.getDate() && viewDate.month === today.getMonth() && viewDate.year === today.getFullYear();
  };

  const isFuture = (d) => {
    if (!d) return false;
    const cellDate = new Date(viewDate.year, viewDate.month, d);
    return cellDate > today;
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={prevMonth} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.35rem 0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{monthLabel}</span>
        <button onClick={nextMonth} disabled={viewDate.year === today.getFullYear() && viewDate.month === today.getMonth()}
          style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.35rem 0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', opacity: (viewDate.year === today.getFullYear() && viewDate.month === today.getMonth()) ? 0.3 : 1 }}>
          <ChevronRight size={15} />
        </button>
      </div>
      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.4rem' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
        {cells.map((d, i) => {
          const gym = isGymDay(d);
          const today_ = isToday(d);
          const future = isFuture(d);
          return (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: today_ ? 700 : 400,
              background: gym ? 'var(--primary-dim)' : (today_ ? 'var(--bg-raised)' : 'transparent'),
              border: today_ ? '1px solid var(--primary-500)' : 'none',
              color: d ? (gym ? 'var(--primary-400)' : future ? 'var(--text-muted)' : 'var(--text-secondary)') : 'transparent',
              transition: 'background 200ms',
            }}>
              {d || ''}
              {gym && <span style={{ position: 'absolute', bottom: 1, fontSize: '0.45rem' }}>●</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 10, height: 10, background: 'var(--primary-dim)', borderRadius: 2, border: '1px solid var(--primary-500)', display: 'inline-block' }} />
          Gym day
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 10, height: 10, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--primary-500)', display: 'inline-block' }} />
          Today
        </span>
      </div>
    </div>
  );
};

/* ── XP Timeline ─────────────────────────────────────── */
const XPTimeline = ({ gymProgress }) => {
  const entries = Object.entries(gymProgress)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  if (!entries.length) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0' }}>
      Start checking in to earn XP
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {entries.map(([date, data]) => {
        const xp = (data.wentToGym ? 80 : 0) + 40;
        return (
          <div key={date} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.625rem 0.875rem', borderRadius: 'var(--r-lg)',
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {data.wentToGym ? '🏋 Workout complete' : '✓ Check-in'}
              </div>
            </div>
            <span className="chip chip-primary">
              <Zap size={10} fill="currentColor" /> +{xp} XP
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Prediction Panel ───────────────────────────────────
   Reads prediction data and renders:
   - Predicted weight card + confidence
   - Goal timeline card
   - Factor breakdown (calories, consistency, regression)
═══════════════════════════════════════════════════════ */
const ConfidenceBadge = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'var(--primary-500)'
    : pct >= 40 ? 'var(--amber-500)'
    : 'var(--text-muted)';
  const label = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low';
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', color,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      padding: '0.15rem 0.45rem', borderRadius: 'var(--r-sm)',
    }}>
      {label} {pct}%
    </span>
  );
};

const PredictionPanel = ({ weightLog, gymProgress, userInfo }) => {
  const [apiData, setApiData]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPredictionData(90)
      .then(d => { if (!cancelled) setApiData(d); })
      .catch(() => { /* Use localStorage fallback */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const prediction = useMemo(() => {
    // Build calorie history from API data or fall back to empty
    const caloriesHistory = apiData
      ? buildCalorieSeries(apiData.calorieSeries?.map(c => ({ caloriesConsumed: c.calories, date: c.date })))
      : [];

    // Gym stats: API is source of truth, fall back to gymProgress localStorage
    const gymDaysCount = apiData
      ? apiData.gymDays
      : Object.values(gymProgress).filter(d => d.wentToGym).length;
    const windowDays = apiData?.totalDays || 30;

    return predictWeightChange({
      weightLog,
      caloriesHistory,
      gymDays:    gymDaysCount,
      totalDays:  windowDays,
      userInfo,
      horizonDays: 30,
    });
  }, [weightLog, apiData, gymProgress, userInfo]);

  const goalWeight = userInfo.targetWeight ? parseFloat(userInfo.targetWeight) : null;
  const timeline   = computeGoalTimeline({
    currentWeight: prediction.currentWeight,
    goalWeight,
    weeklyRate: prediction.weeklyRate,
  });

  const hasEnoughData = weightLog.length >= 2;

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
        <Brain size={18} color="var(--purple-500)" />
      </motion.div>
      Running prediction model…
    </motion.div>
  );

  if (!hasEnoughData) return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }} className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Sparkles size={16} color="var(--purple-500)" />
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600 }}>Progress Prediction</h2>
      </div>
      <div style={{ textAlign: 'center', padding: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Log at least <strong>2 weight entries</strong> to unlock predictions
      </div>
    </motion.div>
  );

  const delta30 = prediction.predictedWeightIn30Days != null
    ? parseFloat((prediction.predictedWeightIn30Days - prediction.currentWeight).toFixed(1))
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={15} color="var(--purple-500)" />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--purple-500)' }}>AI-Powered Prediction</span>
        <ConfidenceBadge value={prediction.confidence} />
      </div>

      {/* Two main cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.75rem' }}>

        {/* Predicted weight change */}
        <div className="card" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--purple-500) 8%, var(--bg-surface)), var(--bg-surface))', border: '1px solid color-mix(in srgb, var(--purple-500) 22%, var(--border-subtle))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>30-Day Forecast</div>
              {delta30 != null ? (
                <div style={{ fontWeight: 800, fontSize: '1.625rem', lineHeight: 1, color: delta30 < 0 ? 'var(--primary-500)' : delta30 > 0 ? 'var(--amber-500)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {delta30 > 0 ? '+' : ''}{delta30} kg
                </div>
              ) : <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>—</div>}
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {prediction.predictedWeightIn30Days != null ? `→ ${prediction.predictedWeightIn30Days} kg` : 'Insufficient data'}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, var(--purple-500) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {delta30 == null  ? <Minus size={20} color="var(--text-muted)" />
              : delta30 < 0    ? <TrendingDown size={20} color="var(--primary-500)" />
              : delta30 > 0    ? <TrendingUp size={20} color="var(--amber-500)" />
              : <Minus size={20} color="var(--text-muted)" />}
            </div>
          </div>
          {/* Weekly rate chip */}
          {prediction.weeklyRate != null && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: '0.625rem' }}>
                {prediction.weeklyRate < 0 ? '' : '+'}{prediction.weeklyRate.toFixed(2)} kg/wk
              </span>
              <span className="chip" style={{ fontSize: '0.625rem', textTransform: 'capitalize' }}>
                {prediction.method.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Goal timeline */}
        <div className="card" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--amber-500) 8%, var(--bg-surface)), var(--bg-surface))', border: '1px solid color-mix(in srgb, var(--amber-500) 22%, var(--border-subtle))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Goal Timeline</div>
              {!goalWeight ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No goal set</div>
              ) : timeline.daysToGoal === 0 ? (
                <div style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--primary-500)' }}>🎯 Reached!</div>
              ) : timeline.isAchievable ? (
                <>
                  <div style={{ fontWeight: 800, fontSize: '1.625rem', lineHeight: 1, color: 'var(--amber-500)', fontVariantNumeric: 'tabular-nums' }}>
                    ~{timeline.daysToGoal}d
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {new Date(timeline.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Not on track</div>
              )}
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, var(--amber-500) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {timeline.isAchievable ? <Clock size={20} color="var(--amber-500)" /> : <Target size={20} color="var(--text-muted)" />}
            </div>
          </div>
          {goalWeight && timeline.isAchievable && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: '0.625rem' }}>
                Goal: {goalWeight} kg
              </span>
              <span className="chip" style={{ fontSize: '0.625rem' }}>
                {timeline.weeksToGoal} weeks
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="card">
        <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>Prediction Factors</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

          {/* Calorie deficit */}
          {prediction.tdee != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Utensils size={13} color="var(--amber-500)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  <span>Calorie {(prediction.dailyDeficit ?? 0) >= 0 ? 'Deficit' : 'Surplus'}</span>
                  <span style={{ color: (prediction.dailyDeficit ?? 0) > 0 ? 'var(--primary-500)' : 'var(--amber-500)', fontVariantNumeric: 'tabular-nums' }}>
                    {prediction.avgCalories != null ? `${prediction.avgCalories} kcal avg` : '—'}
                  </span>
                </div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill progress-fill-primary" style={{
                    width: prediction.avgCalories && prediction.tdee
                      ? `${Math.min(100, (prediction.avgCalories / prediction.tdee) * 100).toFixed(0)}%`
                      : '0%',
                    transition: 'width 0.8s var(--ease-out-expo)',
                  }} />
                </div>
                {prediction.tdee && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TDEE: {prediction.tdee} kcal</div>
                )}
              </div>
            </div>
          )}

          {/* Gym consistency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Dumbbell size={13} color="var(--primary-500)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <span>Gym Consistency</span>
                <span style={{ color: 'var(--primary-500)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(prediction.consistencyFactor * 100)}%
                </span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div className="progress-fill progress-fill-primary" style={{
                  width: `${Math.round(prediction.consistencyFactor * 100)}%`,
                  transition: 'width 0.8s var(--ease-out-expo)',
                }} />
              </div>
            </div>
          </div>

          {/* Regression quality */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'color-mix(in srgb, var(--purple-500) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={13} color="var(--purple-500)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <span>Trend Signal (R²)</span>
                <span style={{ color: 'var(--purple-500)', fontVariantNumeric: 'tabular-nums' }}>
                  {prediction.rSquared.toFixed(2)}
                </span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div style={{
                  height: '100%', width: `${Math.round(prediction.rSquared * 100)}%`,
                  background: 'var(--purple-500)', borderRadius: 'inherit',
                  transition: 'width 0.8s var(--ease-out-expo)',
                }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   PROGRESS PAGE
═══════════════════════════════════════════════════════ */
export default function Progress() {
  const [weightLog, setWeightLog]   = useState(loadWeightLog);
  const [gymProgress]               = useState(loadProgress);
  const [wellnessHist]              = useState(loadWellnessHistory);
  const [newWeight, setNewWeight]   = useState('');
  const [weightDate, setWeightDate] = useState('');

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('runliUserInfo')) || {}; } catch { return {}; }
  }, []);

  // Derived stats
  const sortedLog = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sortedLog.length ? sortedLog[sortedLog.length - 1].weight : null;
  const startWeight   = sortedLog.length ? sortedLog[0].weight : null;
  const goalWeight    = userInfo.targetWeight ? parseFloat(userInfo.targetWeight) : null;
  const weightChange  = (currentWeight != null && startWeight != null) ? +(currentWeight - startWeight).toFixed(1) : null;

  // Gym streak
  const gymDays = Object.entries(gymProgress)
    .sort(([a], [b]) => b.localeCompare(a));
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < gymDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (gymDays[i]?.[0] === expected && gymDays[i]?.[1]?.wentToGym) streak++;
    else break;
  }
  const totalGymDays = gymDays.filter(([, d]) => d.wentToGym).length;

  // XP
  const xp    = gymDays.length * 40 + totalGymDays * 80;
  const level = xpLevel(xp);

  // Avg wellness
  const avgWellness = wellnessHist.length
    ? Math.round(wellnessHist.slice(-7).reduce((s, h) => s + (h.score || 0), 0) / Math.min(wellnessHist.length, 7))
    : null;

  const logWeight = () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) return;
    const date = weightDate || new Date().toISOString().split('T')[0];
    const updated = [
      ...weightLog.filter(e => e.date !== date),
      { date, weight: w }
    ].sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(updated);
    saveWeightLog(updated);
    setNewWeight('');
    setWeightDate('');
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
      style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', paddingTop: 'clamp(1.25rem, 4vw, 2rem)' }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Progress
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── Stat row ── */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}
        >
          {[
            {
              label: 'Current',
              value: currentWeight ? `${currentWeight} kg` : '—',
              sub: goalWeight ? `Goal: ${goalWeight}kg` : 'Set goal',
              color: 'var(--primary-500)',
              Icon: Scale,
            },
            {
              label: 'Change',
              value: weightChange != null
                ? `${weightChange > 0 ? '+' : ''}${weightChange} kg`
                : '—',
              sub: 'since start',
              color: weightChange == null ? 'var(--text-muted)'
                : weightChange < 0 ? 'var(--primary-500)' : 'var(--amber-500)',
              Icon: weightChange == null ? Minus : weightChange < 0 ? TrendingDown : TrendingUp,
            },
            {
              label: 'Gym Streak',
              value: `${streak} days`,
              sub: `${totalGymDays} total`,
              color: 'var(--amber-500)',
              Icon: Flame,
            },
            {
              label: 'Level',
              value: `Lvl ${level.lvl}`,
              sub: `${xp.toLocaleString()} XP`,
              color: 'var(--purple-500)',
              Icon: Zap,
            },
            ...(avgWellness != null ? [{
              label: 'Wellness',
              value: `${avgWellness}/100`,
              sub: '7-day avg',
              color: 'var(--blue-500)',
              Icon: Activity,
            }] : []),
          ].map(({ label, value, sub, color, Icon }) => (
            <motion.div key={label} variants={fadeUp} style={{
              padding: '0.875rem', borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: '0.35rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
                <Icon size={14} color={color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem', color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── XP Bar ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="card-featured">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-500)', marginBottom: '0.2rem' }}>
                Level {level.lvl} · XP Progress
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{xp.toLocaleString()} XP</div>
            </div>
            <span className="chip chip-primary">
              <Zap size={10} fill="currentColor" /> {level.pct.toFixed(0)}% to Lvl {level.lvl + 1}
            </span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill progress-fill-primary"
              initial={{ width: 0 }}
              animate={{ width: `${level.pct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            <span>Level {level.lvl}</span>
            <span>Level {level.lvl + 1} at {level.nextXP.toLocaleString()} XP</span>
          </div>
        </motion.div>

        {/* ── Weight Chart + Log ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={17} color="var(--primary-500)" />
              Weight Trend
              {goalWeight && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--amber-400)', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--amber-dim)', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-sm)' }}>
                  Goal: {goalWeight} kg
                </span>
              )}
            </h2>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {sortedLog.length} entries
            </span>
          </div>

          <WeightChart
            data={sortedLog}
            goal={goalWeight}
            projectionPoints={
              sortedLog.length >= 2
                ? (() => {
                    const quick = predictWeightChange({
                      weightLog: sortedLog,
                      caloriesHistory: [],
                      gymDays: totalGymDays,
                      totalDays: Math.max(gymDays.length, 1),
                      userInfo,
                      horizonDays: 30,
                    });
                    return buildProjectionPoints(quick.currentWeight, quick.weeklyRate, 30);
                  })()
                : []
            }
          />

          {/* Log new weight */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input
              type="number" step="0.1" min="30" max="300"
              placeholder="Weight (kg)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logWeight()}
              className="input"
              style={{ flex: '1 1 100px', minWidth: 0, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            />
            <input
              type="date"
              value={weightDate || new Date().toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setWeightDate(e.target.value)}
              className="input"
              style={{ flex: '1 1 130px', minWidth: 0, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            />
            <button onClick={logWeight} className="btn btn-primary" style={{ flexShrink: 0, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Log
            </button>
          </div>

          {/* Mini log */}
          {sortedLog.length > 1 && (
            <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {[...sortedLog].reverse().slice(0, 4).map(entry => {
                const prev = sortedLog[sortedLog.findIndex(e => e.date === entry.date) - 1];
                const delta = prev ? +(entry.weight - prev.weight).toFixed(1) : null;
                return (
                  <div key={entry.date} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.4rem 0.75rem', borderRadius: 'var(--r-md)',
                    background: 'var(--bg-raised)', fontSize: '0.8125rem',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {delta !== null && (
                        <span style={{ fontSize: '0.6875rem', color: delta < 0 ? 'var(--primary-500)' : delta > 0 ? 'var(--amber-500)' : 'var(--text-muted)' }}>
                          {delta > 0 ? '+' : ''}{delta} kg
                        </span>
                      )}
                      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.weight} kg</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Prediction Panel ── */}
        <PredictionPanel
          weightLog={sortedLog}
          gymProgress={gymProgress}
          userInfo={userInfo}
        />

        {/* ── Workout Calendar + XP Timeline ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="card">
            <h2 style={{ margin: '0 0 0.875rem', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={17} color="var(--amber-500)" />
              Gym Calendar
            </h2>
            <StreakCalendar gymProgress={gymProgress} />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              {[
                { label: 'Streak', value: `${streak}d 🔥`, color: 'var(--amber-500)' },
                { label: 'Total',  value: `${totalGymDays} sessions`, color: 'var(--primary-500)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }} className="card">
            <h2 style={{ margin: '0 0 0.875rem', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={17} color="var(--purple-500)" />
              Recent Activity
            </h2>
            <XPTimeline gymProgress={gymProgress} />
          </motion.div>
        </div>

        {/* ── Wellness score history ── */}
        {wellnessHist.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }} className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={17} color="var(--blue-500)" />
              Wellness Score — 14 Days
            </h2>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', height: 64 }}>
              {wellnessHist.slice(-14).map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '100%', maxWidth: 28,
                    height: `${Math.max(6, ((d.score || 0) / 100) * 56)}px`,
                    background: `linear-gradient(180deg, var(--blue-500), var(--blue-700))`,
                    borderRadius: 'var(--r-sm)',
                    opacity: d.score ? 1 : 0.2,
                    transition: 'height 500ms var(--ease-out-expo)',
                  }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {new Date(d.date).toLocaleDateString('en', { weekday: 'narrow' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
