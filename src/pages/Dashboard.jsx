import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Droplets, Flame, TrendingUp, Calendar,
  Zap, Lightbulb, Search, Dumbbell, Target, RefreshCw,
  UtensilsCrossed, CheckCircle2, Circle, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { getProgress, updateProgress, getInsight, getDietPlan, getProgressRange } from '../services/api';

/* ── Helper functions (unchanged) ─────────────────────── */
function calcBMR(weight, height, age, gender) {
  if (gender === 'Female') return 10 * weight + 6.25 * height - 5 * age - 161;
  if (gender === 'Male')   return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age;
}
function caloriesTarget(bmr, freq, target) {
  const freqFactor = { 2: 1.3, 3: 1.45, 4: 1.6, 5: 1.7, 6: 1.78, 7: 1.83 }[freq] || 1.6;
  let value = bmr * freqFactor;
  if (/gain|bulk|muscle/i.test(target))  value *= 1.1;
  else if (/lose|fat|shred/i.test(target)) value *= 0.85;
  return Math.round(value);
}
function proteinTarget(weight, target) {
  let factor = 1.2;
  if (/gain|bulky|muscle/i.test(target)) factor = 1.8;
  else if (/lose|fat|shred/i.test(target)) factor = 1.5;
  return Math.round(Number(weight) * factor);
}
function waterTarget(weight) {
  if (!weight) return 3100;
  return Math.round(weight * 35);
}

/* ── Motion variants ──────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Select custom styles ─────────────────────────────── */
const selectStyles = {
  control: (b) => ({
    ...b,
    background: 'var(--bg-raised)',
    borderColor: 'var(--border-base)',
    borderRadius: 'var(--r-xl)',
    boxShadow: 'none',
    color: 'var(--text-primary)',
    '&:hover': { borderColor: 'var(--border-strong)' },
    padding: '0.1rem 0',
    minHeight: 46,
  }),
  menu:      (b) => ({ ...b, background: 'var(--bg-overlay)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-base)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }),
  option:    (b, s) => ({ ...b, background: s.isFocused ? 'var(--bg-raised)' : 'var(--bg-overlay)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }),
  singleValue:(b)=> ({ ...b, color: 'var(--text-primary)', fontSize: '0.875rem' }),
  input:     (b) => ({ ...b, color: 'var(--text-primary)' }),
  placeholder:(b)=> ({ ...b, color: 'var(--text-muted)', fontSize: '0.875rem' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator:(b)=>({ ...b, color: 'var(--text-muted)' }),
};

/* ── Progress Bar helper ──────────────────────────────── */
const ProgressBar = ({ value, max, colorClass = 'primary', style = {} }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="progress-track" style={style}>
      <div
        className={`progress-fill progress-fill-${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ── Stat Card helper ─────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, max, unit, colorClass, accentColor, children }) => (
  <div className="card-stat">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: accentColor, marginBottom: '0.25rem' }}>
          {label}
        </div>
        <div className="stat-value" style={{ fontSize: '1.75rem' }}>
          {value}
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>
            / {max}{unit}
          </span>
        </div>
      </div>
      <span style={{ width: 38, height: 38, borderRadius: 'var(--r-lg)', background: `${accentColor}1a`, display: 'grid', placeItems: 'center' }}>
        <Icon size={18} color={accentColor} />
      </span>
    </div>
    <ProgressBar value={value} max={max} colorClass={colorClass} style={{ marginBottom: '0.75rem' }} />
    {children}
  </div>
);

/* ── Quick Action Card ────────────────────────────────── */
const QuickAction = ({ icon: Icon, label, sub, onClick, accentColor }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.015, y: -2 }}
    whileTap={{ scale: 0.97 }}
    className="card"
    style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left',
      background: 'var(--bg-surface)',
    }}
  >
    <span style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: `${accentColor}1a`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon size={22} color={accentColor} />
    </span>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.15rem' }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub}</div>
    </div>
  </motion.button>
);

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  const [waterIntake,      setWaterIntake]      = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinIntake,    setProteinIntake]    = useState(0);
  const [currentWeight,    setCurrentWeight]    = useState(0);
  const [wentToGym,        setWentToGym]        = useState(false);

  const [customCalories, setCustomCalories] = useState('');
  const [customProtein,  setCustomProtein]  = useState('');
  const [newWeight,      setNewWeight]      = useState('');

  const [foods,        setFoods]        = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [streak,       setStreak]       = useState(0);
  const [insight,      setInsight]      = useState('Loading your daily tip...');
  const [dietPlanCompleted, setDietPlanCompleted] = useState([]);

  const [dietPlan,      setDietPlan]      = useState(null);
  const [mealCompletion, setMealCompletion] = useState([]);
  const [weightHistory,  setWeightHistory]  = useState([]);

  const [calendarView,    setCalendarView]    = useState('weekly');
  const [currentMonth,    setCurrentMonth]    = useState(new Date());
  const [monthlyActivity, setMonthlyActivity] = useState({});
  const [completedDays,   setCompletedDays]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('runliCompletedDays')) || Array(7).fill(false); }
    catch { return Array(7).fill(false); }
  });
  const [dailyGoals, setDailyGoals] = useState({ water: 3100, calories: 3044, protein: 107 });
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  /* ── Effects (unchanged logic) ──────────────────── */
  useEffect(() => {
    fetch('/foods.csv').then(r => r.text()).then(text => {
      const parsed = Papa.parse(text, { header: true });
      setFoods(parsed.data.filter(row => row['Dish Name'] && row['Calories (kcal)']));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    try {
      const info = JSON.parse(localStorage.getItem('runliUserInfo')) || {};
      if (info.weight) {
        const age = Number(info.age) || 25;
        const weight = Number(info.weight) || 70;
        setCurrentWeight(weight);
        const height = Number(info.height) || 170;
        const gender = info.gender || 'Male';
        const freq   = Number(info.frequency) || 4;
        const target = info.target || '';
        const bmr = calcBMR(weight, height, age, gender);
        setDailyGoals({
          water:    waterTarget(weight),
          calories: caloriesTarget(bmr, freq, target),
          protein:  proteinTarget(weight, target),
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const check = () => {
      const last  = localStorage.getItem('lastDashboardDate');
      const today = new Date().toISOString().split('T')[0];
      if (last && last !== today) {
        setWaterIntake(0); setCaloriesConsumed(0); setProteinIntake(0); setWentToGym(false);
        if (new Date().getDay() === 1) setCompletedDays(Array(7).fill(false));
      }
      localStorage.setItem('lastDashboardDate', today);
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    getProgress(today).then(res => {
      if (res.progress) {
        setWaterIntake(res.progress.waterIntake);
        setCaloriesConsumed(res.progress.caloriesConsumed);
        setProteinIntake(res.progress.proteinIntake);
        setWentToGym(res.progress.wentToGym);
        if (res.progress.weight) setCurrentWeight(res.progress.weight);
        if (res.progress.dietPlanCompleted) setDietPlanCompleted(res.progress.dietPlanCompleted);
        if (res.progress.mealCompletion)    setMealCompletion(res.progress.mealCompletion || []);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));

    getInsight().then(r => r.insight && setInsight(r.insight)).catch(() => setInsight('Stay consistent!'));
    getDietPlan().then(r => r.dietPlan && setDietPlan(r.dietPlan)).catch(console.error);

    const end   = new Date();
    const start = new Date(); start.setDate(start.getDate() - 30);
    getProgressRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]).then(r => {
      if (r.progress) {
        setWeightHistory(r.progress.filter(p => p.weight).map(p => ({ date: p.date, weight: p.weight })));
        const map = {};
        r.progress.forEach(p => { if (p.wentToGym) map[p.date] = true; });
        setMonthlyActivity(map);
      }
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    const today = new Date().toISOString().split('T')[0];
    const t = setTimeout(() => {
      updateProgress(today, { waterIntake, caloriesConsumed, proteinIntake, wentToGym, weight: currentWeight, dietPlanCompleted, mealCompletion }).catch(console.error);
    }, 1000);
    return () => clearTimeout(t);
  }, [waterIntake, caloriesConsumed, proteinIntake, wentToGym, currentWeight, dietPlanCompleted, mealCompletion, loaded, user]);

  useEffect(() => localStorage.setItem('runliCompletedDays', JSON.stringify(completedDays)), [completedDays]);

  /* ── Actions (unchanged) ────────────────────────── */
  const addWater    = (a) => setWaterIntake(p => Math.min(p + a, dailyGoals.water));
  const addCalories = (a) => setCaloriesConsumed(p => Math.min(p + a, dailyGoals.calories * 1.5));
  const addProtein  = (a) => setProteinIntake(p => Math.min(p + a, dailyGoals.protein * 1.5));
  const getProgressPercent = (c, t) => Math.min((c / t) * 100, 100);

  const ToggleGym = () => {
    const next = !wentToGym;
    setWentToGym(next);
    const today = new Date().toISOString().split('T')[0];
    setMonthlyActivity(prev => ({ ...prev, [today]: next }));
    if (next) {
      setStreak(s => s + 1);
      const d = [...completedDays]; d[(new Date().getDay() + 6) % 7] = true; setCompletedDays(d);
    } else {
      setStreak(s => Math.max(0, s - 1));
      const d = [...completedDays]; d[(new Date().getDay() + 6) % 7] = false; setCompletedDays(d);
    }
  };

  const toggleMealCompletion = (idx) => setMealCompletion(prev =>
    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
  );

  const logWeight = () => {
    if (newWeight && !isNaN(newWeight)) {
      const w = Number(newWeight);
      setCurrentWeight(w);
      const today = new Date().toISOString().split('T')[0];
      setWeightHistory(prev => [...prev.filter(x => x.date !== today), { date: today, weight: w }].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setNewWeight('');
    }
  };

  /* ── Calendar helpers (unchanged) ─────────────── */
  const getDaysInMonth = () => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (first === 0 ? 6 : first - 1); i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(i);
    return days;
  };
  const isToday = (day) => {
    if (!day) return false;
    const t = new Date();
    return day === t.getDate() && currentMonth.getMonth() === t.getMonth() && currentMonth.getFullYear() === t.getFullYear();
  };
  const isDayCompleted = (day) => {
    if (!day) return false;
    const str = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return !!monthlyActivity[str];
  };
  const foodOptions = foods.map(f => ({
    value: f['Dish Name'],
    label: `${f['Dish Name']} (${f['Calories (kcal)']} kcal)`,
    ...f,
  }));

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
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

        {/* ── Page Header ───────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Today
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {streak > 0 && (
            <span className="chip chip-amber">
              <Zap size={11} fill="currentColor" />
              {streak} day streak
            </span>
          )}
        </div>

        {/* ── AI Daily Brief ────────────────────────── */}
        <motion.div variants={staggerItem} initial="initial" animate="animate">
          <div className="card-featured" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
            <span style={{ width: 38, height: 38, borderRadius: 'var(--r-lg)', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Lightbulb size={18} color="var(--primary-500)" />
            </span>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-500)', marginBottom: '0.3rem' }}>
                AI Daily Brief
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
                "{insight}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ─────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}
        >
          {[
            { icon: Dumbbell,  label: 'Gym Mode',      sub: 'Start workout',      path: '/gym-mode',   color: 'var(--primary-500)' },
            { icon: Target,    label: 'Habit Tracker',  sub: 'Track streaks',      path: '/habits',     color: 'var(--purple-500)' },
            { icon: RefreshCw, label: 'Diet Plan',      sub: 'Manage meals',       path: '/diet-plan',  color: 'var(--blue-500)' },
            { icon: Target,    label: 'Plan Page',      sub: 'View fitness plan',  path: '/plan',       color: 'var(--amber-500)' },
          ].map(({ icon, label, sub, path, color }) => (
            <motion.div key={label} variants={staggerItem}>
              <QuickAction icon={icon} label={label} sub={sub} onClick={() => navigate(path)} accentColor={color} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Tracker Row: Gym + Activity Calendar ──── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

          {/* Gym Check-in */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--primary-500)" />
                  Daily Tracker
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>Consistency is key</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem' }}>
              {/* Toggle switch */}
              <button
                onClick={ToggleGym}
                aria-label={wentToGym ? 'Mark gym incomplete' : 'Mark gym complete'}
                style={{
                  width: 88, height: 44, borderRadius: 'var(--r-full)',
                  background: wentToGym ? 'var(--primary-500)' : 'var(--bg-raised)',
                  border: `1px solid ${wentToGym ? 'transparent' : 'var(--border-base)'}`,
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 300ms, border-color 300ms',
                  boxShadow: wentToGym ? 'var(--glow-primary)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'white',
                  position: 'absolute', top: 3,
                  left: wentToGym ? 48 : 3,
                  transition: 'left 300ms var(--ease-out-expo)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }} />
              </button>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0, color: wentToGym ? 'var(--primary-500)' : 'var(--text-secondary)' }}>
                {wentToGym ? 'Workout Complete! 💪' : 'Tap to Check In'}
              </p>
            </div>
          </div>

          {/* Activity Calendar */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--primary-500)" />
                Activity
              </h2>
              {/* Toggle pills */}
              <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 'var(--r-full)', padding: '2px', gap: '2px' }}>
                {['weekly', 'monthly'].map(v => (
                  <button key={v} onClick={() => setCalendarView(v)} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 'var(--r-full)',
                    border: 'none', cursor: 'pointer',
                    background: calendarView === v ? 'var(--primary-500)' : 'transparent',
                    color: calendarView === v ? 'var(--text-inverse)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    transition: 'background 200ms, color 200ms',
                  }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {calendarView === 'weekly' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {weekDays.map((day, idx) => (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 'var(--r-md)',
                      background: completedDays[idx] ? 'var(--primary-500)' : 'var(--bg-raised)',
                      border: `1px solid ${completedDays[idx] ? 'transparent' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: completedDays[idx] ? 'var(--text-inverse)' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 700,
                      boxShadow: completedDays[idx] ? 'var(--glow-primary)' : 'none',
                      transition: 'all 200ms',
                    }}>
                      {completedDays[idx] ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="btn-icon" style={{ width: 28, height: 28 }}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="btn-icon" style={{ width: 28, height: 28 }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>{d}</div>
                  ))}
                  {getDaysInMonth().map((day, idx) => (
                    <div key={idx} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 'var(--r-sm)',
                      background: day && isDayCompleted(day) ? 'var(--primary-500)' : day ? 'var(--bg-raised)' : 'transparent',
                      border: day && isToday(day) ? '1.5px solid var(--primary-500)' : '1px solid transparent',
                      color: day && isDayCompleted(day) ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontSize: '0.7rem', fontWeight: day && isToday(day) ? 700 : 400,
                    }}>
                      {day || ''}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Macros Row ────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}
        >
          {/* Water */}
          <motion.div variants={staggerItem}>
            <StatCard
              icon={Droplets} label="Water" colorClass="blue"
              value={waterIntake} max={dailyGoals.water} unit="ml"
              accentColor="var(--blue-500)"
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => addWater(250)} className="btn btn-secondary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', color: 'var(--blue-500)', borderColor: 'rgba(59,130,246,0.35)' }}>+250ml</button>
                <button onClick={() => addWater(500)} className="btn btn-secondary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', color: 'var(--blue-500)', borderColor: 'rgba(59,130,246,0.35)' }}>+500ml</button>
              </div>
            </StatCard>
          </motion.div>

          {/* Calories */}
          <motion.div variants={staggerItem}>
            <StatCard
              icon={Flame} label="Calories" colorClass="amber"
              value={caloriesConsumed} max={dailyGoals.calories} unit=" kcal"
              accentColor="var(--amber-500)"
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number" value={customCalories}
                  onChange={e => setCustomCalories(e.target.value)}
                  placeholder="Add kcal..."
                  className="input"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                />
                <button
                  onClick={() => { if (customCalories) { addCalories(Number(customCalories)); setCustomCalories(''); }}}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', background: 'var(--amber-500)', flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
            </StatCard>
          </motion.div>

          {/* Protein */}
          <motion.div variants={staggerItem}>
            <StatCard
              icon={Activity} label="Protein" colorClass="purple"
              value={proteinIntake} max={dailyGoals.protein} unit="g"
              accentColor="var(--purple-500)"
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number" value={customProtein}
                  onChange={e => setCustomProtein(e.target.value)}
                  placeholder="Add grams..."
                  className="input"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                />
                <button
                  onClick={() => { if (customProtein) { addProtein(Number(customProtein)); setCustomProtein(''); }}}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', background: 'var(--purple-500)', flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
            </StatCard>
          </motion.div>
        </motion.div>

        {/* ── Diet Plan Tracker ─────────────────────── */}
        {dietPlan && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UtensilsCrossed size={18} color="var(--primary-500)" />
                  Today's Meal Plan
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  {mealCompletion.length} of {dietPlan.meals.reduce((s, m) => s + m.items.length, 0)} meals completed
                </p>
              </div>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--primary-500)' }}>
                {Math.round((mealCompletion.length / Math.max(dietPlan.meals.reduce((s, m) => s + m.items.length, 0), 1)) * 100)}%
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {dietPlan.meals.map((meal, mealIdx) => (
                <div key={mealIdx} style={{ background: 'var(--bg-raised)', padding: '0.875rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.625rem', margin: '0 0 0.625rem' }}>{meal.name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {meal.items.map((item, itemIdx) => {
                      const gIdx = dietPlan.meals.slice(0, mealIdx).reduce((s, m) => s + m.items.length, 0) + itemIdx;
                      const done = mealCompletion.includes(gIdx);
                      return (
                        <div
                          key={itemIdx}
                          onClick={() => toggleMealCompletion(gIdx)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem', borderRadius: 'var(--r-md)', cursor: 'pointer',
                            background: done ? 'var(--primary-dim)' : 'transparent',
                            border: `1px solid ${done ? 'rgba(34,197,94,0.22)' : 'var(--border-subtle)'}`,
                            transition: 'all 200ms',
                          }}
                        >
                          {done
                            ? <CheckCircle2 size={16} color="var(--primary-500)" />
                            : <Circle       size={16} color="var(--text-muted)" />
                          }
                          <span style={{ flex: 1, fontSize: '0.8125rem', color: done ? 'var(--primary-400)' : 'var(--text-primary)' }}>
                            {item.food}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.calories} cal</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Weight Log ────────────────────────────── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--purple-500)" />
              Weight Progress
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number" value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="Weight (kg)"
                className="input"
                style={{ width: 130, padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button onClick={logWeight} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', gap: '0.35rem' }}>
                <Plus size={15} /> Log
              </button>
            </div>
          </div>
          {weightHistory.length > 0
            ? <WeightChart data={weightHistory} />
            : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No weight data yet. Start logging above!
              </div>
            )
          }
        </div>

        {/* ── Food Lookup ───────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--primary-500)" />
            Food Lookup
          </h2>
          <Select
            options={foodOptions}
            value={selectedFood}
            onChange={setSelectedFood}
            styles={selectStyles}
            placeholder="Search food item..."
            isClearable
          />
          {selectedFood && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                { label: 'Calories', val: selectedFood['Calories (kcal)'],     unit: 'kcal', color: 'var(--amber-500)' },
                { label: 'Protein',  val: selectedFood['Protein (g)'],          unit: 'g',    color: 'var(--purple-500)' },
                { label: 'Carbs',    val: selectedFood['Carbohydrates (g)'],    unit: 'g',    color: 'var(--blue-500)' },
                { label: 'Fats',     val: selectedFood['Fats (g)'],             unit: 'g',    color: 'var(--amber-400)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-raised)', padding: '0.75rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{s.label}</div>
                  <div className="stat-value" style={{ fontSize: '1.125rem', color: s.color }}>
                    {s.val}<span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '2px' }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

/* ── Weight Chart (SVG) ──────────────────────────────── */
const WeightChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxW = Math.max(...data.map(d => d.weight)) + 2;
  const minW = Math.min(...data.map(d => d.weight)) - 2;
  const range = maxW - minW;
  const W = 800, H = 180, P = 36;

  const pts = data.map((d, i) => ({
    x: P + (i / Math.max(data.length - 1, 1)) * (W - 2 * P),
    y: H - P - ((d.weight - minW) / range) * (H - 2 * P),
    ...d,
  }));

  const path = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${path} L ${pts[pts.length - 1].x} ${H - P} L ${pts[0].x} ${H - P} Z`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 300, height: 'auto' }}>
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(139,92,246,0.25)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0)" />
          </linearGradient>
          {/* Chart grid lines */}
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={P} y1={P + f * (H - 2 * P)} x2={W - P} y2={P + f * (H - 2 * P)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#wGrad)" />
        {/* Line */}
        <path d={path} fill="none" stroke="var(--purple-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="var(--purple-500)"
            stroke="var(--bg-surface)" strokeWidth="2" />
        ))}
        {/* Y-axis labels */}
        {[minW + range * 0.25, minW + range * 0.5, minW + range * 0.75].map((v, i) => (
          <text key={i} x={P - 6} y={H - P - (v - minW) / range * (H - 2 * P) + 4}
            textAnchor="end" fontSize="10" fill="var(--text-muted)">{Math.round(v)}</text>
        ))}
        {/* X-axis labels */}
        {pts.filter((_, i) => i % Math.max(Math.floor(pts.length / 5), 1) === 0).map((pt, i) => (
          <text key={i} x={pt.x} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
            {pt.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
};