/**
 * AdminAnalytics.jsx — Admin Dashboard (/admin/analytics)
 *
 * Only accessible to users with role === 'admin'.
 * Fetches GET /api/analytics/admin
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Users, TrendingUp, Activity,
  BarChart2, Loader, RefreshCw, Target, Utensils,
} from 'lucide-react';
import { trackPage } from '../utils/analyticsTracker.js';

const API = (path) => {
  const token = localStorage.getItem('runliToken');
  return fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => {
    if (r.status === 403) throw new Error('FORBIDDEN');
    return r.json();
  });
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Stat tile ──────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, sub, color = '#10b981' }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color}22`,
      borderRadius: 'var(--r-lg)', padding: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
        <Icon size={12} color={color} /> {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

/* ── Donut chart (pure SVG) ─────────────────────────── */
function DonutChart({ items = [], colorMap = {} }) {
  if (!items.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No data</div>;
  const total = items.reduce((s, i) => s + (i.count || i.dau || 0), 0) || 1;
  const defaultColors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  let cumulative = 0;
  const r = 40, cx = 55, cy = 55, strokeWidth = 18;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <svg width={110} height={110}>
        {items.map((item, i) => {
          const key = item.goal || item.diet || item.name || item.event || i;
          const color = colorMap[key] || defaultColors[i % defaultColors.length];
          const count = item.count || item.dau || 0;
          const pct = count / total;
          const offset = circ * (1 - cumulative);
          cumulative += pct;
          return (
            <circle key={key} cx={cx} cy={cy} r={r} fill="none" stroke={color}
              strokeWidth={strokeWidth} strokeDasharray={`${pct * circ} ${circ}`}
              strokeDashoffset={offset} style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
          );
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight={700}>{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {items.map((item, i) => {
          const key = item.goal || item.diet || item.name || item.event || i;
          const color = colorMap[key] || defaultColors[i % defaultColors.length];
          const count = item.count || item.dau || 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{key || 'Unknown'}</span>
              <span style={{ color: 'var(--text-muted)' }}>{Math.round((count / total) * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── DAU sparkline ──────────────────────────────────── */
function DAULine({ data = [] }) {
  if (data.length < 2) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Not enough data</div>;
  const vals = data.map(d => d.dau || 0);
  const max = Math.max(...vals) || 1;
  const W = 300, H = 56;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - (v / max) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
        <defs>
          <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={points + ` ${W},${H} 0,${H}`} fill="url(#dauGrad)" stroke="none" />
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
        <span>{data[0]?.date}</span><span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

/* ── Feature usage bar ──────────────────────────────── */
function FeatureBar({ items = [] }) {
  if (!items.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No events yet</div>;
  const max = items[0]?.count || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {items.slice(0, 8).map((item, i) => (
        <div key={item.event} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 130, fontSize: '0.725rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
            {item.event}
          </div>
          <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: `hsl(${160 - i * 15}, 70%, 48%)`, borderRadius: 99 }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>
            {item.count >= 1000 ? `${(item.count / 1000).toFixed(1)}k` : item.count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ Main Page ══════════════════════════════════════════ */
export default function AdminAnalytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [days, setDays]       = useState(30);

  useEffect(() => { trackPage('/admin/analytics'); }, []);

  const load = () => {
    setLoading(true); setError(null);
    API(`/analytics/admin?days=${days}`)
      .then(d => setData(d))
      .catch(e => setError(e.message === 'FORBIDDEN' ? 'Admin access required' : 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [days]);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
      <ShieldCheck size={48} color="var(--error-500)" />
      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{error}</div>
      <button onClick={load} className="btn btn-primary">Retry</button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="page-wrapper"
      style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', paddingTop: 'clamp(1.25rem, 4vw, 2rem)' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} color="#f59e0b" /> Admin Analytics
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Platform-wide insights</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={days === d ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>{d}D</button>
            ))}
            <button onClick={load} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
              <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader size={28} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : data && (
          <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Top-level KPIs ── */}
            <motion.div variants={fadeUp}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <StatTile icon={Users}      label="Total Users"  value={data.userStats?.total}              color="#10b981" sub={`+${data.userStats?.newUsers} this period`} />
              <StatTile icon={Activity}   label="Avg DAU"      value={data.dau?.length ? Math.round(data.dau.reduce((s, d) => s + d.dau, 0) / data.dau.length) : 0} color="#6366f1" sub="daily active users" />
              <StatTile icon={TrendingUp} label="Retention"    value={data.retention != null ? `${data.retention}%` : '—'} color="#f59e0b" sub="week-over-week" />
              <StatTile icon={BarChart2}  label="Events"       value={data.featureUsage?.reduce((s, f) => s + f.count, 0)?.toLocaleString()} color="#ef4444" sub="total tracked" />
            </motion.div>

            {/* ── DAU chart ── */}
            <motion.div variants={fadeUp} className="card">
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={15} color="#10b981" /> Daily Active Users
              </h2>
              <DAULine data={data.dau} />
            </motion.div>

            {/* ── Feature usage + archetype ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <BarChart2 size={15} color="#6366f1" /> Feature Usage
                </h2>
                <FeatureBar items={data.featureUsage} />
              </motion.div>

              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  🧬 Archetype Distribution
                </h2>
                <DonutChart items={data.archetypeDist?.length ? data.archetypeDist :
                  [{ name: 'No data yet', count: 1 }]} />
              </motion.div>
            </div>

            {/* ── Goal + Diet breakdown ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Target size={15} color="#ef4444" /> Goal Distribution
                </h2>
                <DonutChart items={data.goalDist}
                  colorMap={{ lose_weight: '#ef4444', maintain: '#f59e0b', gain_muscle: '#10b981' }} />
              </motion.div>

              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Utensils size={15} color="#8b5cf6" /> Diet Preferences
                </h2>
                <DonutChart items={data.dietDist}
                  colorMap={{ Vegetarian: '#10b981', 'Non-Vegetarian': '#ef4444', Eggetarian: '#f59e0b' }} />
              </motion.div>
            </div>

            {/* ── WAU trend table ── */}
            {data.wau?.length > 0 && (
              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUp size={15} color="#f59e0b" /> Weekly Active Users
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {data.wau.map(w => (
                    <div key={w.week} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>{w.week}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{w.wau}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
