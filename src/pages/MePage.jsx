import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2, Scale, TrendingUp, Award, ShoppingBag,
  Settings, LogOut, ChevronRight, Star, Zap, Target,
  Dumbbell, Flame, Activity, Calculator, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCluster, CLUSTER_PROFILES } from '../utils/userClusterEngine.js';
import usePlan, { } from '../hooks/usePlan.js';
import { getProfile, updateProfile } from '../services/api';
import { LockBadge } from '../components/ProGate.jsx';

/* ── Motion variants ── */
const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};
const stagger = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── BMI logic ── */
function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return (weight / ((height / 100) ** 2)).toFixed(1);
}
function bmiCategory(bmi) {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: 'Underweight', color: 'var(--blue-400)' };
  if (b < 25)   return { label: 'Healthy',     color: 'var(--primary-500)' };
  if (b < 30)   return { label: 'Overweight',  color: 'var(--amber-400)' };
  return             { label: 'Obese',         color: 'var(--error-500)' };
}

/* ── XP Tiers ── */
function xpLevel(xp) {
  const levels = [0, 500, 1200, 2500, 4500, 7000, 10000, 15000, 22000, 30000];
  let lvl = 1;
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i]) lvl = i + 1; }
  const nextXP = levels[Math.min(lvl, levels.length - 1)] || levels[levels.length - 1];
  const currXP = levels[lvl - 1] || 0;
  return { lvl, pct: Math.min(((xp - currXP) / (nextXP - currXP)) * 100, 100), nextXP };
}

/* ── Achievement definitions ── */
const ACHIEVEMENTS = [
  { id: 'first_workout', icon: Dumbbell, label: 'First Workout',  desc: 'Complete your first session',   color: 'var(--primary-500)' },
  { id: 'streak_7',      icon: Flame,    label: '7-Day Streak',   desc: 'Workout 7 days in a row',        color: 'var(--amber-500)' },
  { id: 'protein_goal',  icon: Target,   label: 'Protein King',   desc: 'Hit protein goal 5 times',       color: 'var(--purple-500)' },
  { id: 'steps_10k',     icon: Activity, label: '10K Steps',      desc: 'Walk 10,000 steps in a day',     color: 'var(--blue-500)' },
  { id: 'meal_log_7',    icon: Star,     label: 'Meal Planner',   desc: 'Log meals for 7 days',           color: 'var(--amber-400)' },
  { id: 'wellness_70',   icon: Zap,      label: 'Wellness Pro',   desc: 'Score 70+ for 3 days in a row',  color: 'var(--primary-400)' },
];

/* ── Nav link row ── */
const NavRow = ({ icon: Icon, label, sub, onClick, accent = 'var(--text-secondary)' }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
    padding: '0.875rem 0', background: 'transparent', border: 'none',
    borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left',
  }}>
    <span style={{ width: 34, height: 34, borderRadius: 'var(--r-md)', background: `${accent}1a`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon size={17} color={accent} />
    </span>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
    <ChevronRight size={16} color="var(--text-muted)" />
  </button>
);

/* ═══════════════════════════════════════════════════════
   ME PAGE
═══════════════════════════════════════════════════════ */
export default function MePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState({});
  const [xp, setXp] = useState(0);
  const [earnedAchievements, setEarned] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [cluster, setCluster] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { isPro, triggerUpgrade } = usePlan();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('runliUserInfo')) || {};
        setInfo(stored);

        const res = await getProfile();
        if (res.user) {
          const fresh = { ...stored, ...res.user };
          setInfo(fresh);
          localStorage.setItem('runliUserInfo', JSON.stringify(fresh));
        }
      } catch (e) { console.error('Error syncing profile', e); }
    };
    loadProfile();

    // Derive XP from activity data
    try {
      const progress = JSON.parse(localStorage.getItem('runliProgress')) || {};
      const days = Object.keys(progress).length;
      const gymDays = Object.values(progress).filter(p => p.wentToGym).length;
      setXp(days * 40 + gymDays * 80);
    } catch {}
    // Check earned achievements
    const earned = [];
    try {
      const history = JSON.parse(localStorage.getItem('gymModeHistory')) || {};
      if (Object.keys(history).length > 0) earned.push('first_workout');
    } catch {}
    setEarned(earned);
    // Assign fitness archetype cluster
    try { setCluster(getUserCluster()); } catch {}
  }, []);

  const bmi = calcBMI(info.weight, info.height);
  const bmiCat = bmiCategory(bmi);
  const level = xpLevel(xp);
  const displayName = info.name || user?.displayName || user?.email?.split('@')[0] || 'Athlete';

  const logWeight = async () => {
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 0) {
      const updated = { ...info, weight: w };
      setInfo(updated);
      localStorage.setItem('runliUserInfo', JSON.stringify(updated));
      setNewWeight('');
      try {
        await updateProfile(updated);
      } catch (e) {
        console.error("Failed to sync weight to backend", e);
      }
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/'); } catch {}
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
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Profile Header ── */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="card-featured">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 62, height: 62, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <UserCircle2 size={36} color="var(--text-inverse)" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                {displayName}
              </h1>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {info.goal || 'Fitness Goal'} · {info.frequency ? `${info.frequency}x / wk` : 'Set your plan'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="chip chip-primary">
                  <Zap size={10} fill="currentColor" /> Lvl {level.lvl}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
          {/* XP bar */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span>Level {level.lvl}</span>
              <span>{level.pct.toFixed(0)}% → Level {level.lvl + 1}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill-primary" style={{ width: `${level.pct}%` }} />
            </div>
          </div>
        </motion.div>

        {/* ── Fitness Archetype (Cluster Badge) ── */}
        {cluster && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
            className="card"
            style={{ border: `1px solid ${cluster.color}33`, background: `color-mix(in srgb, ${cluster.color} 6%, var(--bg-card))` }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--r-lg)',
                background: `${cluster.color}20`,
                border: `1.5px solid ${cluster.color}44`,
                display: 'grid', placeItems: 'center', fontSize: '1.5rem', flexShrink: 0,
              }}>{cluster.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: cluster.color, fontWeight: 700, marginBottom: '0.15rem' }}
                >Fitness Archetype</div>
                <div style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>{cluster.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{cluster.description}</div>
              </div>
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <span>Match confidence</span>
                <span style={{ color: cluster.color, fontWeight: 700 }}>{Math.round(cluster.confidence * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${cluster.confidence * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${cluster.color}, ${cluster.color}aa)` }}
                />
              </div>
            </div>

            {/* Trait chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {cluster.traits.map(t => (
                <span key={t} style={{
                  fontSize: '0.6875rem', fontWeight: 600, padding: '0.2rem 0.55rem',
                  borderRadius: 99, background: `${cluster.color}18`,
                  color: cluster.color, border: `1px solid ${cluster.color}33`,
                }}>{t}</span>
              ))}
            </div>

            {/* Breakdown toggle — Pro gated */}
            <button
              onClick={() => {
                if (!isPro) { triggerUpgrade('archetype_breakdown'); return; }
                setShowBreakdown(s => !s);
              }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, padding: 0,
              }}
            >
              {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showBreakdown ? 'Hide' : 'Show'} all archetypes
              {!isPro && <LockBadge small />}
            </button>

            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {cluster.allDistances.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{p.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: p.id === cluster.id ? 700 : 500, marginBottom: '0.2rem' }}>
                            <span style={{ color: p.id === cluster.id ? p.color : 'var(--text-primary)' }}>{p.shortName}</span>
                            <span style={{ color: p.id === cluster.id ? p.color : 'var(--text-muted)' }}>{p.score}%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 99, width: `${p.score}%`, background: p.id === cluster.id ? p.color : 'var(--border-subtle)', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Body Metrics ── */}
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeUp} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--purple-500)" />
                Body Metrics
              </h2>
              <button onClick={() => navigate('/userinfo')} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                Edit
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Weight',  val: info.weight ? `${info.weight} kg` : '—', color: 'var(--primary-500)' },
                { label: 'Height',  val: info.height ? `${info.height} cm` : '—', color: 'var(--blue-500)' },
                { label: 'Age',     val: info.age    ? `${info.age} yrs`   : '—', color: 'var(--amber-500)' },
                { label: 'BMI',     val: bmi || '—',                               color: bmiCat?.color || 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} className="card-stat" style={{
                  textAlign: 'center', padding: '0.75rem 0.5rem',
                }}>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    {s.label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                    {s.val}
                  </div>
                  {s.label === 'BMI' && bmiCat && (
                    <div style={{ fontSize: '0.6rem', color: bmiCat.color, marginTop: '0.15rem' }}>{bmiCat.label}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick weight update */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number" step="0.1" min="30" max="300"
                placeholder="Update weight (kg)"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logWeight()}
                className="input"
                style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button onClick={logWeight} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', flexShrink: 0 }}>
                Log
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Achievements ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--amber-500)" />
            Achievements
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {ACHIEVEMENTS.map(({ id, icon: Icon, label, desc, color }) => {
              const earned = earnedAchievements.includes(id);
              return (
                <div key={id} style={{
                  padding: '0.875rem', borderRadius: 'var(--r-lg)',
                  background: earned ? `${color}11` : 'var(--bg-raised)',
                  border: `1px solid ${earned ? `${color}33` : 'var(--border-subtle)'}`,
                  opacity: earned ? 1 : 0.5,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem',
                  transition: 'all 200ms',
                }}>
                  <span style={{
                    width: 42, height: 42, borderRadius: 'var(--r-md)',
                    background: earned ? `${color}22` : 'rgba(255,255,255,0.04)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon size={20} color={earned ? color : 'var(--text-muted)'} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                  {earned && <span className="chip chip-primary">Earned</span>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Links ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: '0 0 0.5rem' }}>More</h2>
          <NavRow icon={Calculator}  label="BMI Calculator"  sub="Check your body mass index" onClick={() => navigate('/bmi')}         accent="var(--blue-500)" />
          <NavRow icon={ShoppingBag} label="Shopping"        sub="Supplements, gear & more"   onClick={() => navigate('/shopping')}    accent="var(--amber-500)" />
          <NavRow icon={TrendingUp}  label="Habit Tracker"   sub="Build lasting habits"       onClick={() => navigate('/habits')}      accent="var(--purple-500)" />
          <NavRow icon={Settings}    label="Edit Profile"    sub="Update your info & goals"   onClick={() => navigate('/userinfo')}    accent="var(--text-secondary)" />
          <div style={{ height: '0.5rem' }} />
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem', background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.18)', borderRadius: 'var(--r-lg)',
              cursor: 'pointer', color: 'var(--error-500)', fontWeight: 600, fontSize: '0.9375rem',
              transition: 'background 200ms',
            }}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
