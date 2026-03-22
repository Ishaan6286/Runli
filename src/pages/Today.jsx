import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, fadeUp, stagger } from '../utils/motion.js';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Dumbbell, Salad, Droplets, CheckCircle2, Circle,
  Moon, Footprints, SmilePlus, ChevronRight, Plus, Minus,
  Flame, Activity, Lightbulb, Sparkles, TrendingUp, ArrowRight,
  Wind, Sun, Sunset, Stars
} from 'lucide-react';
import { getRecommendations } from '../utils/recommendationEngine';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { getDietPlan } from '../services/api';
import { getHabits, getTodayStatus, logHabit } from '../services/habitApi';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════ */
const SPLITS = [
  { focus: 'Chest + Triceps', emoji: '💪', exercises: ['Bench Press 4×8-12', 'Incline DB Press 4×10', 'Cable Flyes 3×15', 'Tricep Pushdowns 3×12'] },
  { focus: 'Back + Biceps',   emoji: '🦾', exercises: ['Pull-Ups 4×8-10', 'Seated Cable Row 4×10', 'Barbell Curl 3×12', 'Face Pulls 3×15'] },
  { focus: 'Legs + Core',     emoji: '🦵', exercises: ['Barbell Squat 4×8-12', 'Leg Press 3×12', 'Hamstring Curl 3×12', 'Hanging Leg Raises 3×15'] },
  { focus: 'Shoulders + Abs', emoji: '⚡', exercises: ['OHP 4×10', 'Lateral Raises 3×15', 'Rear Delt Fly 3×15', 'Plank 90s ×3'] },
  { focus: 'Full Body HIIT',  emoji: '🔥', exercises: ['Deadlift 4×6', 'Push-Ups 3×20', 'Walking Lunges 3×20', 'Mountain Climbers 40s×3'] },
  { focus: 'Active Recovery', emoji: '🧘', exercises: ['Yoga Flow 30min', 'Foam Rolling 10min', 'Walking 40min', 'Light Core 3×12'] },
  { focus: 'Upper Circuit',   emoji: '💥', exercises: ['Chin-Ups 3×8', 'Push-Ups 3×20', 'Front Raise 3×12', 'Tricep Extensions 3×15'] },
];

const DEFAULT_HABITS = [
  { id: 'water',   icon: '💧', label: 'Drink 8 glasses water' },
  { id: 'workout', icon: '🏋️', label: 'Complete workout' },
  { id: 'steps',   icon: '👟', label: 'Hit 10k steps' },
  { id: 'sleep',   icon: '🌙', label: 'Sleep by 11 PM' },
  { id: 'protein', icon: '🥩', label: 'Hit protein goal' },
];

const MOODS = [
  { v: 1, e: '😔', label: 'Low',     c: '#ef4444' },
  { v: 2, e: '😐', label: 'Meh',     c: '#f59e0b' },
  { v: 3, e: '🙂', label: 'Ok',      c: '#60a5fa' },
  { v: 4, e: '😊', label: 'Good',    c: '#4ade80' },
  { v: 5, e: '🤩', label: 'Amazing', c: '#22c55e' },
];

const MEAL_SUGGESTIONS = {
  bulk:    { b: 'Oats + eggs + banana', l: 'Chicken rice + veggies', d: 'Salmon + sweet potato', s: 'Greek yogurt + nuts' },
  cut:     { b: 'Egg whites + spinach', l: 'Salad + grilled chicken', d: 'Fish + broccoli', s: 'Apple + almonds' },
  default: { b: 'Oats + berries', l: 'Dal rice + salad', d: 'Chicken + roti', s: 'Banana + peanut butter' },
};

function getTodaysWorkout(userInfo) {
  const freq = Number(userInfo?.frequency) || 4;
  const day = new Date().getDay();
  const idx = day === 0 ? 6 : day - 1;
  return SPLITS[idx % Math.max(freq, 1)];
}

function getGreetingTime() {
  const h = new Date().getHours();
  if (h < 5)  return { timeText: 'Good night',    Icon: Stars };
  if (h < 12) return { timeText: 'Good morning',  Icon: Sun };
  if (h < 17) return { timeText: 'Good afternoon',Icon: Sunset };
  if (h < 21) return { timeText: 'Good evening',  Icon: Wind };
  return      { timeText: 'Good night',    Icon: Stars };
}

function loadWellness() {
  try {
    const w = JSON.parse(localStorage.getItem('runliWellness')) || {};
    const today = new Date().toISOString().split('T')[0];
    return w.date === today ? w : { sleep: null, mood: null, steps: 0 };
  } catch { return { sleep: null, mood: null, steps: 0 }; }
}

function getAISuggestions(wellness, userInfo, habits) {
  const tips = [];
  const goal = userInfo?.target || '';
  const sleep = wellness.sleep;
  const mood  = wellness.mood;
  const completedCount = Object.values(habits).filter(Boolean).length;

  if (sleep != null && sleep < 6) {
    tips.push({ id: 'sleep', icon: Moon, color: 'var(--blue-400)',    text: `Only ${sleep}h sleep — try a lighter workout and prioritize rest tonight.`, action: 'Switch to recovery' });
  }
  if (mood != null && mood <= 2) {
    tips.push({ id: 'mood',  icon: SmilePlus, color: 'var(--purple-400)', text: 'Feeling low today — a 20-min walk can lift your mood significantly.', action: 'Start active recovery' });
  }
  if (/gain|bulk/i.test(goal)) {
    tips.push({ id: 'protein', icon: Flame, color: 'var(--amber-400)', text: 'Bulk goal: aim for 40g+ protein per meal to maximize muscle growth.', action: 'Open diet plan' });
  }
  if (completedCount === 0 && new Date().getHours() > 10) {
    tips.push({ id: 'habits', icon: Zap, color: 'var(--primary-500)', text: "You haven't started any habits yet today — let's get one done!", action: 'Check in now' });
  }
  if (tips.length === 0) {
    tips.push({ id: 'default', icon: Sparkles, color: 'var(--primary-500)', text: 'Great consistency! Stay hydrated and keep pushing — you\'re on track.', action: null });
  }
  return tips.slice(0, 2);
}

function loadTodayHabits() {
  try {
    const key = `runliTodayHabits_${new Date().toISOString().split('T')[0]}`;
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch { return {}; }
}
function saveTodayHabits(habits) {
  try {
    const key = `runliTodayHabits_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(key, JSON.stringify(habits));
  } catch {}
}

function loadWaterToday() {
  try {
    const key = `runliWater_${new Date().toISOString().split('T')[0]}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  } catch { return 0; }
}
function saveWaterToday(ml) {
  try {
    const key = `runliWater_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(key, String(ml));
  } catch {}
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* Sticky Header */
const StickyHeader = ({ name, streak, xp, title, subtitle }) => {
  const { timeText, Icon } = getGreetingTime();
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(10,10,11,0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.875rem clamp(1rem, 3vw, 1.5rem)',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
            <Icon size={12} /> {timeText}, {name ? name.split(' ')[0] : 'friend'}
          </div>
          <div style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.35rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {streak > 0 && (
            <span className="chip chip-primary" style={{ fontSize: '0.6875rem' }}>
              🔥 {streak}-day streak
            </span>
          )}
          <span className="chip" style={{ fontSize: '0.6875rem', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <Zap size={10} color="var(--purple-500)" /> {xp} XP
          </span>
        </div>
      </div>
    </div>
  );
};

/* AI Suggestion Card */
const AISuggestionCard = ({ tips, navigate }) => (
  <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(139,92,246,0.06) 100%)', borderRadius: 'var(--r-2xl)', border: '1px solid rgba(34,197,94,0.18)', padding: '1rem 1.125rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-500)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <Sparkles size={11} /> AI Coach
    </div>
    {tips.map((t, i) => (
      <div key={t.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', paddingTop: i > 0 ? '0.75rem' : 0, borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
        <span style={{ width: 30, height: 30, borderRadius: 'var(--r-md)', background: `${t.color}18`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
          <t.icon size={15} color={t.color} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.text}</p>
          {t.action && (
            <button
              onClick={() => { if (t.id === 'protein') navigate('/plan'); else if (t.id === 'habits' || t.id === 'sleep' || t.id === 'mood') navigate('/wellness'); }}
              style={{ marginTop: '0.35rem', background: 'none', border: 'none', padding: 0, color: t.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {t.action} <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
);

/* Workout Card */
const WorkoutCard = ({ workout, navigate }) => (
  <div
    onClick={() => navigate('/gym')}
    style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-2xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 200ms, box-shadow 200ms' }}
    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)'; }}
    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {/* Green top border */}
    <div style={{ height: 3, background: 'linear-gradient(90deg, var(--primary-500), var(--primary-600))' }} />
    <div style={{ padding: '1rem 1.125rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-500)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Dumbbell size={11} /> Today's Workout
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            {workout.emoji} {workout.focus}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); navigate('/gym'); }} className="btn btn-primary" style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', flexShrink: 0 }}>
          Start →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
        {workout.exercises.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, opacity: 0.7 }} />
            {ex}
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* Meal Summary Card */
const MealCard = ({ userInfo, dietPlan, navigate }) => {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`runliMealsDone_${new Date().toISOString().split('T')[0]}`)) || {}; } catch { return {}; }
  });

  const toggle = (slot) => {
    const updated = { ...done, [slot]: !done[slot] };
    setDone(updated);
    try { localStorage.setItem(`runliMealsDone_${new Date().toISOString().split('T')[0]}`, JSON.stringify(updated)); } catch {}
  };

  const doneCount = Object.values(done).filter(Boolean).length;
  const mealsCount = dietPlan ? dietPlan.meals.length : 4;

  const displayMeals = dietPlan ? dietPlan.meals.map(m => {
    let icon = m.name.toLowerCase().includes('break') ? '🌅' : m.name.toLowerCase().includes('lunch') ? '☀️' : m.name.toLowerCase().includes('din') ? '🌙' : '🍎';
    let time = m.name.toLowerCase().includes('break') ? '7–9 AM' : m.name.toLowerCase().includes('lunch') ? '1–2 PM' : m.name.toLowerCase().includes('din') ? '7–8 PM' : 'Anytime';
    let itemsStr = m.items.map(i => i.food).join(', ');
    return { key: m.name, icon, label: m.name, time, meal: itemsStr };
  }) : [
    { key: 'b', icon: '🌅', label: 'Breakfast', time: '7–9 AM', meal: 'Oats + berries' },
    { key: 'l', icon: '☀️', label: 'Lunch',     time: '1–2 PM', meal: 'Dal rice + salad' },
    { key: 'd', icon: '🌙', label: 'Dinner',    time: '7–8 PM', meal: 'Chicken + roti' },
    { key: 's', icon: '🍎', label: 'Snack',     time: 'Anytime', meal: 'Banana + peanut butter' },
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Salad size={17} color="var(--primary-500)" /> Today's Meals
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doneCount}/{mealsCount} done</span>
          <button onClick={() => navigate('/diet-plan')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayMeals.map(m => (
          <div
            key={m.key}
            onClick={() => toggle(m.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: 'var(--r-lg)',
              background: done[m.key] ? 'var(--primary-dim)' : 'var(--bg-raised)',
              border: `1px solid ${done[m.key] ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
              cursor: 'pointer', transition: 'all 180ms',
              opacity: done[m.key] ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{m.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{m.label}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.time}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {m.meal}
              </span>
            </div>
            {done[m.key]
              ? <CheckCircle2 size={17} color="var(--primary-500)" style={{ flexShrink: 0 }} />
              : <Circle       size={17} color="var(--text-muted)"  style={{ flexShrink: 0 }} />
            }
          </div>
        ))}
      </div>
    </div>
  );
};

/* Water Tracker */
const WaterCard = ({ waterGoal }) => {
  const [water, setWater] = useState(loadWaterToday);
  const pct = Math.min((water / waterGoal) * 100, 100);
  const bottles = Math.round(water / 250);

  const add = (ml) => {
    const updated = Math.max(0, water + ml);
    setWater(updated);
    saveWaterToday(updated);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplets size={17} color="var(--blue-500)" /> Water
        </h2>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--blue-400)', fontVariantNumeric: 'tabular-nums' }}>{water}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / {waterGoal} ml</span>
        </div>
      </div>

      {/* Visual bottles */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            onClick={() => add(250)}
            style={{
              width: 28, height: 36, borderRadius: 'var(--r-md)',
              background: i < bottles ? 'var(--blue-dim)' : 'var(--bg-raised)',
              border: `1.5px solid ${i < bottles ? 'var(--blue-500)' : 'var(--border-subtle)'}`,
              cursor: 'pointer', transition: 'all 150ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem',
            }}
          >
            {i < bottles ? '💧' : ''}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="progress-track" style={{ marginBottom: '0.875rem' }}>
        <motion.div
          className="progress-fill progress-fill-blue"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Quick add buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[250, 500, 750].map(ml => (
          <button
            key={ml}
            onClick={() => add(ml)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: 'var(--r-lg)',
              background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
              color: 'var(--blue-400)', fontWeight: 600, fontSize: '0.8125rem',
              cursor: 'pointer', transition: 'all 150ms',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--blue-dim)'; e.currentTarget.style.borderColor = 'var(--blue-500)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            +{ml}ml
          </button>
        ))}
        <button
          onClick={() => add(-250)}
          disabled={water === 0}
          style={{
            width: 38, padding: '0.5rem', borderRadius: 'var(--r-lg)',
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', cursor: water === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: water === 0 ? 0.4 : 1, transition: 'all 150ms',
          }}
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};

/* Habits Checklist */
const HabitsCard = ({ realHabits, todayHabitStatus, onToggle, navigate }) => {
  const doneCount = todayHabitStatus?.summary?.completed || 0;
  const total = todayHabitStatus?.summary?.total || 0;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={17} color="var(--primary-500)" /> Daily Habits
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: doneCount === total && total > 0 ? 'var(--primary-500)' : 'var(--text-secondary)', fontWeight: doneCount === total && total > 0 ? 700 : 400 }}>
            {doneCount}/{total} {(doneCount === total && total > 0) ? '🎉' : ''}
          </span>
          <button onClick={() => navigate('/habits')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-500)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', marginLeft: '0.4rem' }}>
            Edit <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="progress-track" style={{ marginBottom: '1rem' }}>
        <motion.div
          className="progress-fill progress-fill-primary"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {total === 0 && (
           <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>No habits added yet!</p>
        )}
        {todayHabitStatus?.habits?.map(habitStatus => {
          const habitDef = realHabits.find(h => h._id === habitStatus.habitId);
          if (!habitDef) return null;
          const done = habitStatus.completed;
          return (
            <motion.div
              key={habitDef._id}
              onClick={() => { if (!done) onToggle(habitDef._id, habitStatus.value, habitStatus.goal, habitDef.goalType); }}
              whileTap={{ scale: done ? 1 : 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: 'var(--r-lg)',
                background: done ? 'var(--primary-dim)' : 'var(--bg-raised)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : 'var(--border-subtle)'}`,
                cursor: done ? 'default' : 'pointer', transition: 'background 200ms, border 200ms',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{habitDef.icon || '📌'}</span>
              <span style={{
                flex: 1, fontSize: '0.875rem', fontWeight: 500,
                color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: done ? 'line-through' : 'none',
                transition: 'all 200ms',
              }}>
                {habitDef.name}
              </span>
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div key="done" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <CheckCircle2 size={18} color="var(--primary-500)" />
                  </motion.div>
                ) : (
                  <motion.div key="open" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Circle size={18} color="var(--text-muted)" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const GymCheckin = () => {
  const [wentToGym, setWentToGym] = useState(false);
  useEffect(() => {
     try {
       const today = new Date().toISOString().split('T')[0];
       const prog = JSON.parse(localStorage.getItem('runliProgress')) || {};
       if (prog[today]?.wentToGym) setWentToGym(true);
     } catch {}
  }, []);

  const toggleGym = () => {
      const next = !wentToGym;
      setWentToGym(next);
      try {
         const today = new Date().toISOString().split('T')[0];
         const prog = JSON.parse(localStorage.getItem('runliProgress')) || {};
         if (!prog[today]) prog[today] = {};
         prog[today].wentToGym = next;
         localStorage.setItem('runliProgress', JSON.stringify(prog));
      } catch {}
  };

  return (
    <div className="card" onClick={toggleGym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: wentToGym ? 'var(--primary-dim)' : 'var(--bg-surface)' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: wentToGym ? 'var(--primary-500)' : 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Dumbbell size={20} color={wentToGym ? '#000' : 'var(--text-muted)'} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Gym Check-in</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{wentToGym ? 'Workout logged for today! 💪' : 'Did you go to the gym today?'}</p>
          </div>
       </div>
       {wentToGym ? <CheckCircle2 size={24} color="var(--primary-500)" /> : <Circle size={24} color="var(--text-muted)" />}
    </div>
  );
};

/* Wellness Snapshot Row */
const WellnessSnapshotCard = ({ wellness, navigate }) => {
  const moodObj = wellness.mood ? MOODS[wellness.mood - 1] : null;
  return (
    <div
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate('/wellness')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={17} color="var(--blue-500)" /> Wellness
        </h2>
        <ChevronRight size={15} color="var(--text-muted)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
        {[
          {
            icon: Moon, color: 'var(--blue-400)',
            label: 'Sleep',
            value: wellness.sleep ? `${wellness.sleep}h` : '—',
            sub: wellness.sleep ? (wellness.sleep >= 7 ? 'Good' : 'Catch up') : 'Log sleep',
            ring: wellness.sleep ? Math.min((wellness.sleep / 8) * 100, 100) : 0,
          },
          {
            icon: SmilePlus, color: moodObj?.c || 'var(--text-muted)',
            label: 'Mood',
            value: moodObj ? moodObj.e : '—',
            sub: moodObj ? moodObj.label : 'Log mood',
            ring: wellness.mood ? ((wellness.mood - 1) / 4) * 100 : 0,
          },
          {
            icon: Footprints, color: 'var(--purple-400)',
            label: 'Steps',
            value: wellness.steps > 0 ? wellness.steps.toLocaleString() : '—',
            sub: wellness.steps > 0 ? `${Math.round((wellness.steps / 10000) * 100)}%` : 'Log steps',
            ring: wellness.steps ? Math.min((wellness.steps / 10000) * 100, 100) : 0,
          },
        ].map(({ icon: Icon, color, label, value, sub, ring }) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
            padding: '0.75rem 0.5rem', borderRadius: 'var(--r-xl)',
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', textAlign: 'center',
          }}>
            {/* Mini ring */}
            <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={20} cy={20} r={15} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
              <circle cx={20} cy={20} r={15} fill="none" stroke={color} strokeWidth={4}
                strokeDasharray={`${(ring / 100) * (2 * Math.PI * 15)} ${2 * Math.PI * 15}`}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray 700ms ease' }}
              />
            </svg>
            <div style={{ marginTop: '-0.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>{value}</div>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{label}</div>
              <div style={{ fontSize: '0.625rem', color: color, marginTop: '0.1rem' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TODAY PAGE (main)
═══════════════════════════════════════════════════════ */
// pageVariants, fadeUp, stagger are imported from ../utils/motion.js

export default function Today() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userContext, getGreetingState, adjustWorkout } = usePersonalization();

  const [userInfo, setUserInfo] = useState({});
  const [wellness, setWellness] = useState({ sleep: null, mood: null, steps: 0 });
  const [dietPlan, setDietPlan] = useState(null);
  const [realHabits, setRealHabits] = useState([]);
  const [todayHabitStatus, setTodayHabitStatus] = useState(null);
  const [date] = useState(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

  useEffect(() => {
    try { setUserInfo(JSON.parse(localStorage.getItem('runliUserInfo')) || {}); } catch {}
    setWellness(loadWellness());

    getDietPlan().then(r => r.dietPlan && setDietPlan(r.dietPlan)).catch(console.error);
    Promise.all([getHabits(), getTodayStatus()]).then(([hab, tod]) => {
      if (hab.success) setRealHabits(hab.habits);
      if (tod.success) setTodayHabitStatus(tod);
    }).catch(console.error);
  }, []);

  // Auto-sync dashboard progress to backend
  useEffect(() => {
    if (!user) return;
    const sync = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const waterIntake = parseInt(localStorage.getItem(`runliWater_${todayStr}`) || '0', 10);
        const mealsDone = JSON.parse(localStorage.getItem(`runliMealsDone_${todayStr}`)) || {};
        const mealCompletion = Object.values(mealsDone).filter(Boolean).length;
        const wentToGym = (JSON.parse(localStorage.getItem('runliProgress')) || {})[todayStr]?.wentToGym || false;
        
        // Dynamically import updateProgress to avoid circular deps if any, or just use it
        const { updateProgress } = await import('../services/api.js');
        await updateProgress(todayStr, { waterIntake, wentToGym, mealCompletion });
      } catch (e) {
        console.error('Failed to sync progress to API', e);
      }
    };
    
    sync(); // Initial sync
    const interval = setInterval(sync, 15000); // Poll every 15s while on dashboard
    return () => clearInterval(interval);
  }, [user]);

  const toggleRealHabit = useCallback(async (habitId, currentValue, goalValue, goalType) => {
    try {
      await logHabit(habitId, {
        date: new Date().toISOString().split('T')[0],
        completed: true,
        value: goalValue
      });
      getTodayStatus().then(tod => {
        if (tod.success) setTodayHabitStatus(tod);
      });
    } catch (e) { console.error('Error logging habit', e); }
  }, []);

  // Derived values
  const baseWorkout = getTodaysWorkout(userInfo);
  const workout = {
      ...baseWorkout,
      focus: adjustWorkout(baseWorkout.focus, 'strength')
  };
  const { title, subtitle } = getGreetingState();
  const waterGoal = userInfo.weight ? Math.round(userInfo.weight * 35) : 3000;
  const aiTips    = getAISuggestions(wellness, userInfo, habits);
  const name      = user?.displayName || userInfo?.name || '';
  const habitsDoneCount = Object.values(habits).filter(Boolean).length;

  // XP from progress
  let xp = 0;
  try {
    const prog = JSON.parse(localStorage.getItem('runliProgress')) || {};
    const days = Object.keys(prog).length;
    const gymDays = Object.values(prog).filter(p => p.wentToGym).length;
    xp = days * 40 + gymDays * 80;
  } catch {}

  // Streak
  let streak = 0;
  try {
    const prog = JSON.parse(localStorage.getItem('runliProgress')) || {};
    const sorted = Object.entries(prog).sort(([a], [b]) => b.localeCompare(a));
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      if (sorted[i]?.[0] === expected && sorted[i]?.[1]?.wentToGym) streak++;
      else break;
    }
  } catch {}

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100vh', paddingBottom: 90 }}
    >
      {/* Sticky header */}
      <StickyHeader name={name} streak={streak} xp={xp} title={title} subtitle={subtitle} />

      {/* Date line */}
      <div style={{ padding: '0.875rem clamp(1rem, 3vw, 1.5rem) 0', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{date}</p>
      </div>

      {/* Scrollable content */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        style={{ padding: '0.875rem clamp(1rem, 3vw, 1.5rem)', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {/* AI Suggestions */}
        <motion.div variants={fadeUp}>
          <AISuggestionCard tips={aiTips} navigate={navigate} />
        </motion.div>

        {/* Today's Workout */}
        <motion.div variants={fadeUp}>
          <WorkoutCard workout={workout} navigate={navigate} />
        </motion.div>

        {/* Gym Check-in */}
        <motion.div variants={fadeUp}>
          <GymCheckin />
        </motion.div>

        {/* Meals */}
        <motion.div variants={fadeUp}>
          <MealCard userInfo={userInfo} dietPlan={dietPlan} navigate={navigate} />
        </motion.div>

        {/* Water Tracker */}
        <motion.div variants={fadeUp}>
          <WaterCard waterGoal={waterGoal} />
        </motion.div>

        {/* Habits Checklist */}
        <motion.div variants={fadeUp}>
          <HabitsCard realHabits={realHabits} todayHabitStatus={todayHabitStatus} onToggle={toggleRealHabit} navigate={navigate} />
        </motion.div>

        {/* Wellness Snapshot */}
        <motion.div variants={fadeUp}>
          <WellnessSnapshotCard wellness={wellness} navigate={navigate} />
        </motion.div>

        {/* Bottom motivational line */}
        <motion.div variants={fadeUp} style={{ textAlign: 'center', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {todayHabitStatus?.summary?.completed === todayHabitStatus?.summary?.total && todayHabitStatus?.summary?.total > 0
              ? '🎉 You nailed every habit today. Absolutely locked in.'
              : `${todayHabitStatus?.summary?.total - (todayHabitStatus?.summary?.completed || 0)} habit${(todayHabitStatus?.summary?.total - (todayHabitStatus?.summary?.completed || 0)) > 1 ? 's' : ''} left — you've got this.`}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
