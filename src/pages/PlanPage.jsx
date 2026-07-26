import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, RotateCcw, Check, X, Zap, Droplets, Flame, Dumbbell, ChevronRight } from "lucide-react";
import { getTargets, saveCustomTargets, resetTargets } from "../utils/nutritionTargets";
import { updateProfile } from "../services/api";

// ── Workout Split Data ─────────────────────────────────────────────
const SPLITS = [
  { focus: "Chest + Triceps", exercises: ["Barbell Bench Press 4×8-12", "Incline Dumbbell Press 4×10-12", "Cable Flyes 3×12-15", "Triceps Rope Pushdown 3×12-15"] },
  { focus: "Back + Biceps",   exercises: ["Pull-Ups / Lat Pulldowns 4×8-12", "Seated Cable Row 4×10-12", "Barbell Bicep Curl 3×10-12", "Face Pulls 3×12-15"] },
  { focus: "Legs + Core",     exercises: ["Barbell Squat 4×8-12", "Romanian Deadlift 3×10", "Leg Press 3×10-12", "Hanging Leg Raises 3×15"] },
  { focus: "Shoulders + Abs", exercises: ["Overhead Press 4×10-12", "Lateral Raises 3×12-15", "Rear Delt Flyes 3×15", "Plank (90 sec) ×3"] },
  { focus: "Full Body / HIIT", exercises: ["Deadlift 4×6", "Push-Ups 3×20", "Walking Lunges 3×20", "Mountain Climbers (40s) ×3"] },
  { focus: "Active Recovery",  exercises: ["Yoga Flow 30 min", "Foam Rolling 10 min", "Walking 40 min", "Bird-Dog + Dead Bug 3×12"] },
  { focus: "Upper Body Circuit", exercises: ["Chin-Ups 3×8", "Push-Ups 3×20", "Front Dumbbell Raise 3×12", "Cable Triceps Extension 3×15"] },
];
const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function activityToFreq(lv) { return ({ sedentary: 2, light: 3, moderate: 4, active: 5, very_active: 6 })[lv] || 4; }
function goalLabel(g) { return ({ lose_weight: "Lose Weight", maintain: "Maintain", gain_muscle: "Gain Muscle" })[g] || g || ""; }
function calculateBMI(w, h) { if (!w || !h) return null; return (Number(w) / ((Number(h) / 100) ** 2)).toFixed(1); }
function bmiCategory(b) { if (!b) return ""; if (b < 18.5) return "Underweight"; if (b < 25) return "Normal"; if (b < 30) return "Overweight"; return "Obese"; }
function getSplitByFrequency(freq = 4) {
  return Array.from({ length: freq }, (_, i) => {
    const isLast = freq >= 5 && i === freq - 1;
    const sidx   = isLast ? SPLITS.length - 1 : i % (SPLITS.length - 1);
    return { day: DAYNAMES[i % 7], focus: SPLITS[sidx].focus, exercises: SPLITS[sidx].exercises };
  });
}

// ── Edit Modal ─────────────────────────────────────────────────────
function EditTargetsModal({ currentTargets, profile, onSave, onReset, onClose }) {
  const [cal, setCal]     = useState(String(currentTargets.calories));
  const [prot, setProt]   = useState(String(currentTargets.protein));
  const [water, setWater] = useState(String(currentTargets.water));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const newTargets = saveCustomTargets({ calories: Number(cal), protein: Number(prot), water: parseFloat(water) });
    // Persist to backend so notifications / other pages can use it
    try {
      await updateProfile({ calorieGoal: newTargets.calories, proteinGoal: newTargets.protein, waterGoal: newTargets.water });
    } catch { /* non-critical */ }
    setSaving(false);
    onSave(newTargets);
  };

  const handleReset = async () => {
    resetTargets();
    try { await updateProfile({ calorieGoal: null, proteinGoal: null, waterGoal: null }); } catch { /* ok */ }
    onReset();
  };

  const field = (label, value, setter, unit, min, max, step = 1) => (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input
          type="number" min={min} max={max} step={step}
          value={value}
          onChange={e => setter(e.target.value)}
          className="input"
          style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: "1.125rem" }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", width: 40 }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-card)", borderRadius: "var(--r-xl) var(--r-xl) 0 0", padding: "1.75rem 1.5rem calc(1.75rem + env(safe-area-inset-bottom, 0px))", width: "100%", maxWidth: 520, boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Edit Daily Targets</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        {field("Daily Calories", cal, setCal, "kcal", 800, 6000)}
        {field("Daily Protein", prot, setProt, "g", 30, 400)}
        {field("Daily Water", water, setWater, "L", 1, 8, 0.1)}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          >
            <RotateCcw size={15} /> AI Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          >
            <Check size={15} /> {saving ? "Saving…" : "Save Targets"}
          </button>
        </div>
        <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
          Changes sync immediately across all pages and notifications.
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────
function MetricCard({ label, value, unit, color, icon: Icon, onEdit, isCustom }) {
  return (
    <div className="card" style={{ flex: "1 1 260px", position: "relative", borderColor: `${color}33`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {isCustom && (
        <span style={{ position: "absolute", top: "0.75rem", left: "0.75rem", fontSize: "0.6rem", background: "rgba(16,185,129,0.12)", color: "var(--primary-500)", border: "1px solid var(--primary-500)33", borderRadius: 99, padding: "0.1rem 0.4rem", fontWeight: 700 }}>
          CUSTOM
        </span>
      )}
      <button
        onClick={onEdit}
        className="btn-icon"
        style={{ position: "absolute", top: "0.625rem", right: "0.625rem", color: "var(--text-muted)", width: 30, height: 30 }}
        title="Edit this target"
      >
        <Edit2 size={13} />
      </button>
      <Icon size={22} color={color} style={{ marginBottom: "0.5rem" }} />
      <span style={{ color, fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.25rem" }}>{label}</span>
      <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</span>
      <span style={{ color: "var(--text-secondary)", fontWeight: 500, marginTop: "0.25rem" }}>{unit}</span>
    </div>
  );
}

// ══ Plan Page ══════════════════════════════════════════════════════
export default function Plan() {
  const navigate  = useNavigate();
  const [user, setUser]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [targets, setTargets]   = useState({ calories: 2000, protein: 120, water: 2.5, isCustom: false });
  const [showEdit, setShowEdit] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem("runliUserInfo") || "{}") || {}; } catch { /* ok */ }

    if (token && token !== "null" && token !== "undefined") {
      try {
        const r = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json();
        if (data.user) {
          profile = { ...profile, ...data.user };
          localStorage.setItem("runliUserInfo", JSON.stringify(profile));
        }
      } catch { /* network error; use cached profile */ }
    }

    setUser(profile);
    setTargets(getTargets(profile));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave   = (newT) => { setTargets({ ...newT, isCustom: true }); setShowEdit(false); };
  const handleReset  = ()     => { setTargets({ ...getTargets(user), isCustom: false }); setShowEdit(false); };

  const freq   = user.activityLevel ? activityToFreq(user.activityLevel) : (Number(user.frequency) || 4);
  const tgt    = user.goal ? goalLabel(user.goal) : (user.target || "");
  const bmiVal = calculateBMI(user.weight, user.height);
  const split  = (user.workoutPlan && user.workoutPlan.length > 0) ? user.workoutPlan : getSplitByFrequency(freq);

  let mainGoal = "-";
  if (user.targetWeight && user.months) mainGoal = `Reach ${user.targetWeight}kg in ${user.months} month${user.months > 1 ? "s" : ""}`;
  else if (tgt) mainGoal = tgt;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        <div className="spin" style={{ width: 32, height: 32, border: "2px solid var(--primary-500)", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 0.75rem" }} />
        <p>Loading your plan…</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", padding: "clamp(1rem, 3vw, 2rem)", paddingTop: "clamp(1.25rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: "1100px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)", fontWeight: 800, color: "var(--primary-400)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            Your Fitness Blueprint 🚀
          </h1>
          <div style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", fontWeight: 500 }}>
            Roadmap to your dream physique. Tap <Edit2 size={14} style={{ display: "inline", verticalAlign: "middle" }} /> on any card to customise your targets.
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "1.25rem", justifyContent: "center" }}>
          {/* Goal Card */}
          <div className="card" style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Zap size={22} color="var(--primary-500)" style={{ marginBottom: "0.5rem" }} />
            <span style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.25rem" }}>Main Goal</span>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--primary-400)", margin: "0.5rem 0" }}>{mainGoal}</div>
            {bmiVal && <div className="chip chip-primary" style={{ marginTop: "0.25rem" }}>BMI {bmiVal} — {bmiCategory(bmiVal)}</div>}
          </div>

          <MetricCard
            label="Calories" value={targets.calories} unit="kcal / day"
            color="var(--amber-500)" icon={Flame}
            onEdit={() => setShowEdit(true)} isCustom={targets.isCustom}
          />
          <MetricCard
            label="Protein" value={targets.protein} unit="g / day"
            color="var(--purple-400)" icon={Dumbbell}
            onEdit={() => setShowEdit(true)} isCustom={targets.isCustom}
          />
          <MetricCard
            label="Water" value={targets.water} unit="L / day"
            color="var(--blue-500)" icon={Droplets}
            onEdit={() => setShowEdit(true)} isCustom={targets.isCustom}
          />
        </div>

        {/* Workout Split */}
        <div className="card" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Weekly Workout Split 🏋️‍♂️
            </div>
            <button onClick={() => navigate("/workout-editor")} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Edit2 size={14} /> Edit Plan
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1rem" }}>
            {split.map((d, idx) => (
              <div key={idx} style={{ padding: "1rem", background: "var(--bg-raised)", borderRadius: "var(--r-lg)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--primary-400)", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.5rem" }}>
                  {d.day} <span style={{ color: "var(--text-primary)" }}>{d.focus}</span>
                  {d.isRestDay && <span style={{ marginLeft: "0.5rem" }}>🏖️</span>}
                </div>
                <ul style={{ marginLeft: "1.25rem", listStyleType: "disc", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {d.exercises && d.exercises.length > 0
                    ? d.exercises.map((ex, i) => <li key={i}>{typeof ex === "string" ? ex : `${ex.name} ${ex.sets}×${ex.reps}`}</li>)
                    : <li>Rest Day</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition Tips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.5rem", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card" style={{ borderColor: "rgba(234, 179, 8, 0.3)" }}>
              <div style={{ fontWeight: 700, color: "var(--amber-400)", marginBottom: "1rem" }}>⚠️ Remember</div>
              <ul style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <li><span style={{ color: "var(--amber-400)", fontWeight: 700 }}>Target:</span> {targets.protein}g protein / day</li>
                <li>Aim for <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>0.7-1g/lb</span> of lean mass.</li>
                <li>Spread intake across 4–5 meals.</li>
                <li>Example: <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>150g chicken breast</span> = ~45g</li>
              </ul>
            </div>
            <div className="card" style={{ borderColor: "rgba(244, 114, 182, 0.3)" }}>
              <div style={{ fontWeight: 700, color: "var(--purple-400)", marginBottom: "1rem" }}>Protein Sources</div>
              <ul style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <li>Lean chicken, turkey, fish, and dairy.</li>
                <li>Eggs and lentils for vegetarians.</li>
                <li style={{ color: "var(--purple-400)", opacity: 0.9 }}>Spread in 4–5 meals for best muscle synthesis.</li>
              </ul>
            </div>
          </div>
          <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "var(--blue-400)", marginBottom: "1rem" }}>💧 Daily Hydration</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "2.75rem", marginBottom: "0.25rem" }}>{targets.water} L</div>
            <div style={{ color: "var(--blue-500)", fontWeight: 500 }}>Stay hydrated!</div>
            {targets.isCustom && (
              <button onClick={() => setShowEdit(true)} className="btn btn-secondary" style={{ marginTop: "1rem", fontSize: "0.8125rem", padding: "0.4rem 1rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: "var(--text-secondary)" }}>
          <span style={{ marginBottom: "1.5rem", fontSize: "1.0625rem" }}>
            Stay consistent, eat clean, and trust the process. Runli's got your back. <span style={{ color: "var(--amber-400)" }}>💪</span>
          </span>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-secondary" style={{ padding: "0.875rem 2rem", fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={() => navigate("/diet-plan")}>
              View Diet Plan
            </button>
            <button className="btn btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={() => navigate("/dashboard")}>
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditTargetsModal
            currentTargets={targets}
            profile={user}
            onSave={handleSave}
            onReset={handleReset}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
