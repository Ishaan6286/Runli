import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Footprints, Heart, Smile, Meh, Frown,
  TrendingUp, Plus, CheckCircle2, AlertCircle, Wind
} from 'lucide-react';

/* ── Motion variants ─────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};
const stagger = { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const fadeUp  = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Storage keys ─────────────────────────────────────── */
const KEY = 'runliWellness';

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY)) || {};
    const today = new Date().toISOString().split('T')[0];
    if (stored.date !== today) {
      return { date: today, sleep: null, mood: null, steps: 0, moodLog: stored.moodLog || [] };
    }
    return stored;
  } catch {
    return { date: new Date().toISOString().split('T')[0], sleep: null, mood: null, steps: 0, moodLog: [] };
  }
}
function saveData(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

/* ── Mood options ─────────────────────────────────────── */
const MOODS = [
  { value: 1, emoji: '😔', label: 'Low',     color: 'var(--error-500)' },
  { value: 2, emoji: '😐', label: 'Meh',     color: 'var(--amber-500)' },
  { value: 3, emoji: '🙂', label: 'Ok',      color: 'var(--blue-400)' },
  { value: 4, emoji: '😊', label: 'Good',    color: 'var(--primary-400)' },
  { value: 5, emoji: '🤩', label: 'Amazing', color: 'var(--primary-500)' },
];

/* ── Sleep presets ────────────────────────────────────── */
const SLEEP_PRESETS = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const SLEEP_GOAL = 8;
const STEPS_GOAL = 10000;

/* ── Wellness Score ───────────────────────────────────── */
function calcScore({ sleep, mood, steps }) {
  let score = 0;
  if (sleep != null) score += Math.min(40, Math.round((sleep / SLEEP_GOAL) * 40));
  if (mood  != null) score += Math.round((mood  / 5) * 30);
  score += Math.min(30, Math.round((steps / STEPS_GOAL) * 30));
  return score;
}

/* ── Ring component ───────────────────────────────────── */
const Ring = ({ pct, size = 88, stroke = 8, color = 'var(--primary-500)', label, sublabel }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 700ms var(--ease-out-expo)' }}
        />
      </svg>
      <div style={{ textAlign: 'center', marginTop: '-0.75rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{sublabel}</div>
      </div>
    </div>
  );
};

/* ── Wellness history chart (7-day sparkline) ─────────── */
const WellnessWeek = ({ history }) => {
  if (!history || history.length === 0) return null;
  const scores = history.slice(-7);
  const maxS = 100;
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 56 }}>
        {scores.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div
              style={{
                width: '100%', maxWidth: 28,
                height: `${Math.max(6, (d.score / maxS) * 52)}px`,
                background: `linear-gradient(180deg, var(--primary-500), var(--primary-700))`,
                borderRadius: 'var(--r-sm)',
                opacity: d.score > 0 ? 1 : 0.25,
                transition: 'height 500ms var(--ease-out-expo)',
              }}
            />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {new Date(d.date).toLocaleDateString('en', { weekday: 'narrow' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   WELLNESS PAGE
═══════════════════════════════════════════════════════ */
export default function Wellness() {
  const [data, setData]       = useState(loadData);
  const [sleepInput, setSleep] = useState('');
  const [stepsInput, setSteps] = useState('');
  const [history, setHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('runliWellnessHistory')) || []; }
    catch { return []; }
  });

  useEffect(() => { saveData(data); }, [data]);

  const todayScore = calcScore(data);

  const setMood = (val) => {
    const updated = { ...data, mood: val };
    setData(updated);
    // Append to mood log
    const entry = { date: data.date, mood: val, ts: Date.now() };
    const log = [...(data.moodLog || []).slice(-29), entry];
    setData({ ...updated, moodLog: log });
  };

  const logSleep = () => {
    const h = parseFloat(sleepInput);
    if (!isNaN(h) && h > 0 && h <= 24) {
      const updated = { ...data, sleep: h };
      setData(updated);
      setSleep('');
      saveHistory({ ...updated, score: calcScore(updated) });
    }
  };

  const logSteps = () => {
    const s = parseInt(stepsInput, 10);
    if (!isNaN(s) && s >= 0) {
      const updated = { ...data, steps: s };
      setData(updated);
      setSteps('');
      saveHistory({ ...updated, score: calcScore(updated) });
    }
  };

  const saveHistory = (entry) => {
    const today = new Date().toISOString().split('T')[0];
    const newHistory = [
      ...history.filter(h => h.date !== today),
      { date: today, sleep: entry.sleep, mood: entry.mood, steps: entry.steps, score: entry.score }
    ].slice(-30);
    setHistory(newHistory);
    try { localStorage.setItem('runliWellnessHistory', JSON.stringify(newHistory)); } catch {}
  };

  const sleepPct  = data.sleep ? Math.min((data.sleep / SLEEP_GOAL) * 100, 100) : 0;
  const moodPct   = data.mood  ? ((data.mood - 1) / 4) * 100 : 0;
  const stepsPct  = Math.min((data.steps / STEPS_GOAL) * 100, 100);
  const moodColor = data.mood ? MOODS[data.mood - 1].color : 'var(--text-muted)';

  const avgMood = history.length
    ? (history.filter(h => h.mood).reduce((s, h) => s + h.mood, 0) / history.filter(h => h.mood).length).toFixed(1)
    : null;
  const avgSleep = history.length
    ? (history.filter(h => h.sleep).reduce((s, h) => s + h.sleep, 0) / history.filter(h => h.sleep).length).toFixed(1)
    : null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Wellness
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Daily score badge */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '0.5rem 0.875rem', borderRadius: 'var(--r-xl)',
            background: todayScore >= 70 ? 'var(--primary-dim)' : 'var(--bg-raised)',
            border: `1px solid ${todayScore >= 70 ? 'rgba(34,197,94,0.25)' : 'var(--border-subtle)'}`,
          }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Score
            </span>
            <span style={{ fontSize: '1.375rem', fontWeight: 700, color: todayScore >= 70 ? 'var(--primary-500)' : 'var(--text-primary)', lineHeight: 1.1 }}>
              {todayScore}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>

        {/* Rings overview */}
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeUp} className="card-featured">
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-500)', marginBottom: '1.25rem' }}>
              Today's Rings
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
              <Ring pct={sleepPct} color="var(--blue-500)"     label={data.sleep ? `${data.sleep}h` : '—'} sublabel="Sleep" />
              <Ring pct={moodPct}  color={moodColor}            label={data.mood  ? MOODS[data.mood-1].emoji : '—'} sublabel="Mood" />
              <Ring pct={stepsPct} color="var(--purple-500)"   label={data.steps ? data.steps.toLocaleString() : '0'} sublabel="Steps" />
              <Ring pct={todayScore} size={88} stroke={8} color="var(--primary-500)" label={`${todayScore}%`} sublabel="Wellness" />
            </div>
          </motion.div>
        </motion.div>

        {/* Mood + Sleep + Steps grid */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}
        >

          {/* Mood Card */}
          <motion.div variants={fadeUp} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue-500)', marginBottom: '0.25rem' }}>
                  Mood
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {data.mood ? `${MOODS[data.mood - 1].emoji} ${MOODS[data.mood - 1].label}` : 'How are you feeling?'}
                </div>
              </div>
              <Heart size={18} color="var(--blue-500)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  title={m.label}
                  style={{
                    flex: 1, padding: '0.625rem 0.25rem', fontSize: '1.3rem',
                    borderRadius: 'var(--r-lg)',
                    background: data.mood === m.value ? `${m.color}22` : 'var(--bg-raised)',
                    border: `1px solid ${data.mood === m.value ? `${m.color}55` : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 180ms',
                    transform: data.mood === m.value ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            {avgMood && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <TrendingUp size={13} />
                7-day avg mood: <strong style={{ color: 'var(--text-primary)' }}>{avgMood}/5</strong>
              </div>
            )}
          </motion.div>

          {/* Sleep Card */}
          <motion.div variants={fadeUp} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue-500)', marginBottom: '0.25rem' }}>
                  Sleep
                </div>
                {data.sleep != null ? (
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {data.sleep}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/ {SLEEP_GOAL}h</span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>Not logged yet</div>
                )}
              </div>
              <Moon size={18} color="var(--blue-500)" />
            </div>
            {/* Progress */}
            <div className="progress-track" style={{ marginBottom: '1rem' }}>
              <div className="progress-fill progress-fill-blue" style={{ width: `${sleepPct}%` }} />
            </div>
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {SLEEP_PRESETS.map(h => (
                <button
                  key={h}
                  onClick={() => { setSleep(String(h)); }}
                  style={{
                    padding: '0.3rem 0.5rem', borderRadius: 'var(--r-md)', fontSize: '0.6875rem',
                    fontWeight: 600, cursor: 'pointer',
                    background: sleepInput === String(h) ? 'var(--blue-dim)' : 'var(--bg-raised)',
                    border: `1px solid ${sleepInput === String(h) ? 'var(--blue-500)' : 'var(--border-subtle)'}`,
                    color: sleepInput === String(h) ? 'var(--blue-400)' : 'var(--text-secondary)',
                    transition: 'all 150ms',
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number" step="0.5" min="0" max="24"
                placeholder="Custom hours..."
                value={sleepInput}
                onChange={e => setSleep(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logSleep()}
                className="input"
                style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button onClick={logSleep} className="btn btn-secondary" style={{
                padding: '0.45rem 0.875rem', fontSize: '0.75rem',
                color: 'var(--blue-400)', borderColor: 'rgba(59,130,246,0.35)'
              }}>
                Log
              </button>
            </div>
            {avgSleep && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                <TrendingUp size={13} />
                7-day avg: <strong style={{ color: 'var(--text-primary)' }}>{avgSleep}h</strong>
              </div>
            )}
          </motion.div>

          {/* Steps Card */}
          <motion.div variants={fadeUp} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--purple-500)', marginBottom: '0.25rem' }}>
                  Steps
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {data.steps.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/ {STEPS_GOAL.toLocaleString()}</span>
                </div>
              </div>
              <Footprints size={18} color="var(--purple-500)" />
            </div>
            <div className="progress-track" style={{ marginBottom: '1rem' }}>
              <div className="progress-fill progress-fill-purple" style={{ width: `${stepsPct}%` }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {[2000, 5000, 8000, 10000].map(s => (
                <button key={s} onClick={() => { setData(p => ({ ...p, steps: p.steps + s })); }}
                  style={{
                    padding: '0.3rem 0.5rem', borderRadius: 'var(--r-md)', fontSize: '0.6875rem',
                    fontWeight: 600, cursor: 'pointer',
                    background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', transition: 'all 150ms',
                  }}>
                  +{(s/1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number" min="0"
                placeholder="Enter steps..."
                value={stepsInput}
                onChange={e => setSteps(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logSteps()}
                className="input"
                style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button onClick={logSteps} className="btn btn-secondary" style={{
                padding: '0.45rem 0.875rem', fontSize: '0.75rem',
                color: 'var(--purple-400)', borderColor: 'rgba(139,92,246,0.35)'
              }}>
                Set
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Weekly Wellness Chart */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.45 } }} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary-500)" />
                Wellness Score — 7 Days
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                avg {Math.round(history.slice(-7).reduce((s, h) => s + h.score, 0) / Math.min(history.length, 7))} / 100
              </span>
            </div>
            <WellnessWeek history={history} />
          </motion.div>
        )}

        {/* Tips / Info */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.35 } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}
        >
          {[
            { icon: Moon,       color: 'var(--blue-400)',   label: 'Sleep goal',   val: `${SLEEP_GOAL}h / night` },
            { icon: Smile,      color: 'var(--amber-400)',  label: 'Mood target',  val: '4+ / 5 daily' },
            { icon: Footprints, color: 'var(--purple-400)', label: 'Steps goal',   val: '10,000 / day' },
            { icon: Wind,       color: 'var(--primary-400)',label: 'Score target', val: '70+ = healthy' },
          ].map(({ icon: Icon, color, label, val }) => (
            <div key={label} style={{
              background: 'var(--bg-raised)', padding: '0.875rem', borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <Icon size={18} color={color} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{val}</div>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}
