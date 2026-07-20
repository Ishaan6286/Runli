/**
 * FitnessScoreTrend.jsx
 * ─────────────────────────────────────────────
 * Line chart showing fitness score over time (last 7 / 14 / 30 days).
 * Built with Recharts — already a project dependency.
 */
import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, Dot,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RANGES = [
  { label: '7D',  days: 7  },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Custom tooltip shown on hover */
function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const score = payload[0].value;
  const grade =
    score >= 90 ? { label: 'Elite',       color: '#a855f7' } :
    score >= 80 ? { label: 'Excellent',   color: '#22c55e' } :
    score >= 70 ? { label: 'Great',       color: '#84cc16' } :
    score >= 60 ? { label: 'Good',        color: '#f59e0b' } :
    score >= 40 ? { label: 'Needs Work',  color: '#f97316' } :
                  { label: 'Struggling',  color: '#ef4444' };

  return (
    <div style={{
      background: 'rgba(15,15,25,0.95)',
      border: `1px solid ${grade.color}44`,
      borderRadius: '0.75rem',
      padding: '0.625rem 0.875rem',
      boxShadow: `0 4px 24px ${grade.color}22`,
    }}>
      <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
        {formatDate(label)}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: grade.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {grade.label}
      </div>
    </div>
  );
}

/** Custom dot — only shows for non-null values */
function ScoreDot(props) {
  const { cx, cy, payload } = props;
  if (payload.totalScore == null) return null;
  return <Dot cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#0f1117" strokeWidth={2} />;
}

export default function FitnessScoreTrend({ history = [], loading }) {
  const [activeDays, setActiveDays] = useState(7);

  const visibleHistory = history
    .slice(-activeDays)
    .map(h => ({
      date:       new Date(h.date).toISOString().split('T')[0],
      totalScore: h.totalScore,
    }));

  // Compute trend (compare latest vs oldest in visible window)
  const validPoints = visibleHistory.filter(h => h.totalScore != null);
  let trendDiff = null;
  let TrendIcon = Minus;
  let trendColor = '#9ca3af';
  if (validPoints.length >= 2) {
    trendDiff = validPoints[validPoints.length - 1].totalScore - validPoints[0].totalScore;
    if (trendDiff > 2)       { TrendIcon = TrendingUp;   trendColor = '#22c55e'; }
    else if (trendDiff < -2) { TrendIcon = TrendingDown; trendColor = '#ef4444'; }
    else                     { TrendIcon = Minus;         trendColor = '#9ca3af'; }
  }

  return (
    <div style={{
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '1.25rem',
      padding: '1.25rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendIcon size={15} color={trendColor} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Score Trend
            </span>
          </div>
          {trendDiff !== null && (
            <div style={{ fontSize: '0.6875rem', color: trendColor, fontWeight: 600, marginTop: '0.1rem' }}>
              {trendDiff > 0 ? '+' : ''}{trendDiff} pts over {activeDays} days
            </div>
          )}
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setActiveDays(r.days)}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                background: activeDays === r.days ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                color: activeDays === r.days ? '#22c55e' : 'var(--text-muted)',
                letterSpacing: '0.03em',
                transition: 'all 0.15s ease',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 160, borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : validPoints.length === 0 ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          No score data yet. Start logging to see your trend.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={visibleHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ScoreTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              {/* Reference line at score 60 = "Good" threshold */}
              <ReferenceLine y={60} stroke="rgba(245,158,11,0.25)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="totalScore"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={<ScoreDot />}
                activeDot={{ r: 6, fill: '#22c55e', stroke: '#0f1117', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
        {[
          { label: 'Good threshold', color: 'rgba(245,158,11,0.5)', dash: true },
          { label: 'Your score',     color: '#22c55e',              dash: false },
        ].map(({ label, color, dash }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 16, height: 2, background: dash ? 'none' : color, borderTop: dash ? `2px dashed ${color}` : 'none' }} />
            <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
