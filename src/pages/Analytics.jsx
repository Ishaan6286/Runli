/**
 * Analytics.jsx — Personal Analytics Dashboard (/analytics)
 *
 * Charts powered by native SVG (no library dependency).
 * Data fetched from GET /api/analytics/personal
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Dumbbell, Flame, TrendingUp, Zap,
  Activity, Award, Clock, ChevronDown, Loader,
} from 'lucide-react';
import { trackPage } from '../utils/analyticsTracker.js';
import ProGate from '../components/ProGate.jsx';
import { pageVariants, fadeUp, stagger } from '../utils/motion.js';

/* ── tiny helpers ───────────────────────────────────── */
const API = (path) => {
  const token = localStorage.getItem('runliToken');
  return fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
};

// pageVariants, fadeUp imported from ../utils/motion.js

/* ── Stat chip ─────────────────────────────────────── */
function StatChip({ icon: Icon, label, value, color = '#10b981', sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--r-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        <Icon size={13} color={color} /> {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

/* ── SVG bar list (top exercises) ──────────────────── */
function BarList({ items, color = '#10b981' }) {
  if (!items?.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No data yet — log some sets!</div>;
  const max = Math.max(...items.map(i => i.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {items.slice(0, 6).map((item) => (
        <div key={item.exercise} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 110, fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', flexShrink: 0 }}>
            {item.exercise}
          </div>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: color, borderRadius: 99 }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{item.count}x</div>
        </div>
      ))}
    </div>
  );
}

/* ── Mini line sparkline (workout + calorie trend) ─── */
function Sparkline({ data = [], valueKey = 'calories', color = '#10b981', h = 60 }) {
  if (data.length < 2) return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Log more days to see trend</div>;
  const vals = data.map(d => d[valueKey] || 0);
  const max = Math.max(...vals) || 1;
  const min = Math.min(...vals);
  const W = 300, H = h;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: h, overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / (max - min || 1)) * H * 0.85 - H * 0.075;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

/* ── AI Digest card ─────────────────────────────────── */
function DigestCard() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await API('/ai/digest');
      setDigest(data.digest);
    } catch { setError('Failed to load digest'); }
    finally { setLoading(false); }
  };

  const insightColor = { positive: '#10b981', warn: '#f59e0b', predict: '#6366f1', challenge: '#ef4444' };

  return (
    <motion.div variants={fadeUp} className="card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Zap size={17} color="#6366f1" fill="#6366f1" /> AI Weekly Digest
        </h2>
        <button onClick={load} disabled={loading} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Generate'}
        </button>
      </div>

      {!digest && !loading && !error && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
          Click Generate to get your AI-powered weekly summary
        </div>
      )}
      {error && <div style={{ color: 'var(--error-500)', fontSize: '0.8125rem' }}>{error}</div>}
      {digest && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800 }}>{digest.headline}</div>
            <div style={{
              padding: '0.2rem 0.6rem', borderRadius: 99, fontWeight: 800, fontSize: '0.875rem',
              background: digest.weeklyScore >= 75 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              color: digest.weeklyScore >= 75 ? '#10b981' : '#f59e0b',
              border: `1px solid ${digest.weeklyScore >= 75 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              flexShrink: 0,
            }}>{digest.weeklyScore}/100</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.875rem' }}>
            {digest.insights?.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <span style={{ color: insightColor[ins.type] || '#10b981', fontWeight: 700, flexShrink: 0 }}>
                  {ins.type === 'positive' ? '✓' : ins.type === 'warn' ? '⚠' : ins.type === 'predict' ? '→' : '★'}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{ins.text}</span>
              </div>
            ))}
          </div>
          {digest.tip && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--r-md)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              💡 <strong style={{ color: '#6366f1' }}>Tip: </strong>{digest.tip}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ══ Main Page ══════════════════════════════════════════ */
export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(30);

  useEffect(() => { trackPage('/analytics'); }, []);

  useEffect(() => {
    setLoading(true);
    API(`/analytics/personal?days=${days}`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const gymRate = data ? Math.round((data.macros?.gymDays / days) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="page-wrapper"
      style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', paddingTop: 'clamp(1.25rem, 4vw, 2rem)' }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={22} color="#10b981" /> My Analytics
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Your personal fitness data</div>
          </div>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={days === d ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                {d}D
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <ProGate gate="analytics_full" variant="blur"
            blurLabel="Unlock Full Analytics"
            fallback={
              <motion.div variants={{ animate: { transition: { staggerChildren: 0.07 } } }} initial="initial" animate="animate"
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <motion.div variants={fadeUp}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <StatChip icon={Dumbbell}   label="Gym Days"     value={5}     color="#10b981"  sub="last 30 days" />
                  <StatChip icon={Flame}      label="Avg Calories" value={2100}  color="#ef4444"  sub="kcal / day" />
                  <StatChip icon={Activity}   label="Avg Protein"  value="142g"  color="#6366f1"  sub="per day" />
                  <StatChip icon={Award}      label="Streak"       value="7🔥"   color="#f59e0b"  sub="days in a row" />
                </motion.div>
                <motion.div variants={fadeUp} className="card">
                  <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700 }}>Calorie Trend</h2>
                  <div style={{ height: 72, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)' }} />
                </motion.div>
              </motion.div>
            }
          >
            <motion.div variants={{ animate: { transition: { staggerChildren: 0.07 } } }} initial="initial" animate="animate"
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Stat grid ── */}
            <motion.div variants={fadeUp}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <StatChip icon={Dumbbell}   label="Gym Days"     value={data?.macros?.gymDays ?? 0}         color="#10b981"  sub={`${gymRate}% of ${days} days`} />
              <StatChip icon={Flame}      label="Avg Calories" value={data?.macros?.avgCalories ?? 0}     color="#ef4444"  sub="kcal / day" />
              <StatChip icon={Activity}   label="Avg Protein"  value={`${data?.macros?.avgProtein ?? 0}g`}color="#6366f1"  sub="per day" />
              <StatChip icon={Award}      label="Streak"       value={`${data?.streak ?? 0}🔥`}          color="#f59e0b"  sub="days in a row" />
            </motion.div>

            {/* ── Calorie trend ── */}
            <motion.div variants={fadeUp} className="card">
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Flame size={15} color="#ef4444" /> Calorie Trend
              </h2>
              <Sparkline data={data?.workoutFrequency || []} valueKey="calories" color="#ef4444" h={72} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                <span>{data?.workoutFrequency?.[0]?.date}</span>
                <span>{data?.workoutFrequency?.[data.workoutFrequency.length - 1]?.date}</span>
              </div>
            </motion.div>

            {/* ── Protein trend ── */}
            <motion.div variants={fadeUp} className="card">
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={15} color="#6366f1" /> Protein Trend
              </h2>
              <Sparkline data={data?.workoutFrequency || []} valueKey="protein" color="#6366f1" h={72} />
            </motion.div>

            {/* ── Top exercises ── */}
            <motion.div variants={fadeUp} className="card">
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Dumbbell size={15} color="#10b981" /> Top Exercises
              </h2>
              <BarList items={data?.topExercises} />
            </motion.div>

            {/* ── Form Scores ── */}
            {data?.formScores?.length > 0 && (
              <motion.div variants={fadeUp} className="card">
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUp size={15} color="#f59e0b" /> Form Scores
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.625rem' }}>
                  {data.formScores.map(fs => (
                    <div key={fs.exercise} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{fs.exercise}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: fs.avgScore >= 80 ? '#10b981' : fs.avgScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(fs.avgScore)}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/100</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fs.sessions} session{fs.sessions > 1 ? 's' : ''} · {fs.totalReps} reps</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── AI Digest ── */}
            <DigestCard />

          </motion.div>
          </ProGate>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
