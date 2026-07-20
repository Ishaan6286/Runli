import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, User, Dumbbell,
  Salad, Brain, Moon, Zap, Target, Calendar, Scale,
  Ruler, Activity, Heart, Flame, Coffee, Loader2,
  Camera, UploadCloud, Percent, MapPin, X
} from "lucide-react";
import { getProfile, updateProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Step definitions (Expanded to 20) ──────────────────────────────── */
const STEPS = [
  {
    id: "name", icon: User, color: "var(--primary-500)", title: "What's your name?",
    subtitle: "We'll personalise everything just for you.",
    field: "name", type: "text", placeholder: "e.g. Ishaan", required: true,
  },
  {
    id: "age", icon: Calendar, color: "var(--blue-400)", title: "How old are you?",
    subtitle: "Age affects your calorie needs and recovery rate.",
    field: "age", type: "number", placeholder: "e.g. 21", min: 12, max: 100, required: true,
  },
  {
    id: "gender", icon: User, color: "var(--purple-400)", title: "What's your gender?",
    subtitle: "Helps us calibrate your metabolic baseline.",
    field: "gender", type: "chips",
    options: ["Male", "Female", "Other"], required: true,
  },
  {
    id: "height", icon: Ruler, color: "var(--amber-400)", title: "How tall are you?",
    subtitle: "Enter your height in centimetres.",
    field: "height", type: "number", placeholder: "e.g. 178", min: 50, max: 250, required: true,
  },
  {
    id: "weight", icon: Scale, color: "var(--primary-500)", title: "What's your current weight?",
    subtitle: "Enter your weight in kilograms.",
    field: "weight", type: "number", placeholder: "e.g. 75", min: 20, max: 300, required: true,
  },
  {
    id: "targetWeight", icon: Target, color: "var(--blue-400)", title: "What's your target weight?",
    subtitle: "Where do you want to get to?",
    field: "targetWeight", type: "number", placeholder: "e.g. 68", min: 20, max: 300, required: true,
  },
  {
    id: "target", icon: Flame, color: "var(--amber-400)", title: "What's your primary goal?",
    subtitle: "Pick the outcome you're chasing.",
    field: "target", type: "gridCards", // Uses visual cards
    options: [
      { id: "Fat Loss", label: "Fat Loss", desc: "Shed body fat and lean out" },
      { id: "Muscle Gain", label: "Muscle Gain", desc: "Build size and strength" },
      { id: "Toning", label: "Toning", desc: "Firm up and build definition" },
      { id: "General Fitness", label: "General Fitness", desc: "Improve overall health" },
      { id: "Athletic Performance", label: "Athletic Performance", desc: "Speed, agility, power" }
    ], required: true,
  },
  {
    id: "workoutEnvironment", icon: MapPin, color: "var(--primary-500)", title: "Where will you be training?",
    subtitle: "We'll build your plan around available equipment.",
    field: "workoutEnvironment", type: "gridCards",
    options: [
      { id: "Gym", label: "Commercial Gym", desc: "Full equipment access" },
      { id: "Home", label: "Home Workouts", desc: "Bodyweight or basic gear" },
      { id: "Outdoors", label: "Outdoors / Track", desc: "Running, calisthenics" }
    ], required: true,
  },
  {
    id: "frequency", icon: Dumbbell, color: "var(--blue-400)", title: "How many days per week can you train?",
    subtitle: "Be realistic — consistency beats intensity.",
    field: "frequency", type: "chips",
    options: ["2", "3", "4", "5", "6", "7"], labels: ["2 days", "3 days", "4 days", "5 days", "6 days", "7 days"], required: true,
  },
  {
    id: "experience", icon: Activity, color: "var(--purple-400)", title: "What's your training experience?",
    subtitle: "We'll tailor the difficulty of your plan.",
    field: "experience", type: "chips",
    options: ["Beginner", "Intermediate", "Advanced", "Athlete"], required: true,
  },
  {
    id: "dietPreference", icon: Salad, color: "var(--amber-400)", title: "What's your diet preference?",
    subtitle: "So we can build you the right meal plan.",
    field: "dietPreference", type: "chips",
    options: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan"], required: true,
  },
  {
    id: "allergies", icon: Heart, color: "var(--primary-500)", title: "Any food allergies?",
    subtitle: "We'll keep them out of your plan.",
    field: "allergies", type: "multiChips",
    options: ["None", "Lactose", "Gluten", "Nuts", "Eggs", "Soy", "Shellfish"], required: false,
  },
  {
    id: "mealFrequency", icon: Coffee, color: "var(--blue-400)", title: "How many meals do you prefer per day?",
    subtitle: "We'll spread your macros accordingly.",
    field: "mealFrequency", type: "chips",
    options: ["2", "3", "4", "5", "6"], labels: ["2 meals", "3 meals", "4 meals", "5 meals", "6 meals"], required: false,
  },
  {
    id: "sleep", icon: Moon, color: "var(--purple-400)", title: "How many hours do you sleep per night?",
    subtitle: "Recovery is half the battle.",
    field: "sleep", type: "chips",
    options: ["4", "5", "6", "7", "8", "9+"], labels: ["< 5h", "5h", "6h", "7h", "8h", "9h+"], required: false,
  },
  {
    id: "activityLevel", icon: Zap, color: "var(--amber-400)", title: "How active is your daily lifestyle?",
    subtitle: "Outside the gym — walking, standing, job type.",
    field: "activityLevel", type: "chips",
    options: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extremely Active"], required: true,
  },
  {
    id: "stressLevel", icon: Brain, color: "var(--primary-500)", title: "What's your typical stress level?",
    subtitle: "Stress affects cortisol, recovery, and fat loss.",
    field: "stressLevel", type: "chips",
    options: ["Low", "Moderate", "High", "Very High"], required: false,
  },
  {
    id: "injuries", icon: Heart, color: "var(--blue-400)", title: "Any injuries or physical limitations?",
    subtitle: "We'll modify exercises to keep you safe.",
    field: "injuries", type: "multiChips",
    options: ["None", "Lower Back", "Knee", "Shoulder", "Hip", "Wrist/Elbow", "Ankle"], required: false,
  },
  {
    id: "bodyFatEstimate", icon: Percent, color: "var(--purple-400)", title: "Estimated Body Fat %",
    subtitle: "Helps us calculate lean mass (Optional).",
    field: "bodyFatEstimate", type: "number", placeholder: "e.g. 15", min: 3, max: 60, required: false,
  },
  {
    id: "physiqueImage", icon: Camera, color: "var(--amber-400)", title: "Upload a Physique Photo",
    subtitle: "Optional: AI will analyze this for your starting point.",
    field: "physiqueImage", type: "imageUpload", required: false,
  },
  {
    id: "months", icon: Calendar, color: "var(--primary-500)", title: "What's your timeline?",
    subtitle: "How many months are you committing to this plan?",
    field: "months", type: "chips",
    options: ["1", "2", "3", "6", "9", "12"], labels: ["1 mo", "2 mo", "3 mo", "6 mo", "9 mo", "12 mo"], required: true,
  },
];

const TOTAL = STEPS.length;

/* ─── Animation variants ──────────────────────────── */
const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60, filter: "blur(4px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, filter: "blur(4px)", transition: { duration: 0.22 } }),
};

/* ─── Helpers ─────────────────────────────────────── */
const mapTargetToGoal = (t) => ({
  "Fat Loss": "lose_weight", "Muscle Gain": "gain_muscle",
  "Toning": "maintain", "General Fitness": "maintain", "Athletic Performance": "gain_muscle",
}[t] || "maintain");

const mapFreqToActivity = (f) => {
  const n = parseInt(f);
  if (n <= 2) return "sedentary";
  if (n === 3) return "light";
  if (n === 4) return "moderate";
  if (n === 5) return "active";
  return "very_active";
};

const mapGoalToTarget = (g) => ({
  "lose_weight": "Fat Loss", "gain_muscle": "Muscle Gain", "maintain": "General Fitness",
}[g] || "");

/* ─── Image Uploader Component ────────────────────── */
function ImageUploader({ value, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ width: "100%", marginTop: "1rem" }}>
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: "none" }} 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      {!value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed rgba(255,255,255,0.15)",
            borderRadius: "var(--r-xl)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease"
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = "var(--primary-400)";
            e.currentTarget.style.background = "rgba(34,197,94,0.05)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.background = "rgba(0,0,0,0.2)";
          }}
        >
          <UploadCloud size={32} color="var(--primary-400)" style={{ marginBottom: "1rem" }} />
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Tap to upload an image</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>JPEG, PNG up to 5MB</p>
        </div>
      ) : (
        <div style={{ position: "relative", width: "100%", borderRadius: "var(--r-xl)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <img src={value} alt="Physique upload" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
          <button
            onClick={() => onChange(null)}
            style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
              border: "none", color: "white", width: 32, height: 32,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Grid Card Option Component ──────────────────── */
function GridCard({ label, desc, selected, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      style={{
        padding: "1rem",
        borderRadius: "var(--r-xl)",
        border: selected ? "2px solid var(--primary-500)" : "1px solid var(--border-base)",
        background: selected ? "var(--primary-dim)" : "var(--bg-raised)",
        cursor: "pointer",
        transition: "all 150ms ease",
        boxShadow: selected ? "var(--glow-primary)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: selected ? "var(--primary-400)" : "var(--text-primary)", fontSize: "0.95rem" }}>
          {label}
        </span>
        {selected && <CheckCircle2 size={16} color="var(--primary-400)" />}
      </div>
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{desc}</span>
    </motion.div>
  );
}

/* ─── OptionChip ──────────────────────────────────── */
function OptionChip({ label, selected, onClick, multi }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      style={{
        padding: "0.6rem 1.1rem",
        borderRadius: "var(--r-full)",
        border: selected ? "1.5px solid var(--primary-500)" : "1.5px solid var(--border-base)",
        background: selected ? "var(--primary-dim)" : "var(--bg-raised)",
        color: selected ? "var(--primary-400)" : "var(--text-secondary)",
        fontWeight: selected ? 700 : 500,
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "all 180ms ease",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        boxShadow: selected ? "var(--glow-primary)" : "none",
        whiteSpace: "nowrap",
      }}
    >
      {multi && selected && <CheckCircle2 size={13} />}
      {label}
    </motion.button>
  );
}

/* ─── Main Component ──────────────────────────────── */
export default function UserInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isEditMode = location.state?.editMode || false;

  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    name: "", age: "", gender: "", height: "", weight: "",
    targetWeight: "", target: "", frequency: "", experience: "",
    dietPreference: "", allergies: [], mealFrequency: "", sleep: "",
    activityLevel: "", stressLevel: "", months: "", injuries: [],
    workoutEnvironment: "", bodyFatEstimate: "", physiqueImage: null
  });

  /* Load existing profile */
  useEffect(() => {
    const load = async () => {
      try {
        const draft = localStorage.getItem("runliUserInfo_draft");
        if (draft) {
          setData(JSON.parse(draft));
        } else {
          const res = await getProfile();
          const p = res.user;
          if (p) {
            setData(d => ({
              ...d,
              name: p.name || "",
              age: p.age || "",
              gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "",
              height: p.height || "",
              weight: p.weight || "",
              target: p.goal ? mapGoalToTarget(p.goal) : "",
              dietPreference: p.dietPreference || "",
              // Fill new fields if they exist
              targetWeight: p.targetWeight || "",
              experience: p.experience || "",
              workoutEnvironment: p.workoutEnvironment || "",
              bodyFatEstimate: p.bodyFatEstimate || "",
            }));
          }
        }
      } catch {}
      finally { setLoadingProfile(false); }
    };
    load();
  }, []);

  const step = STEPS[stepIndex];
  const pct = ((stepIndex) / TOTAL) * 100;

  /* Field helpers */
  const val = data[step.field];

  const setSingle = (v) => setData(d => ({ ...d, [step.field]: v }));
  const toggleMulti = (v) => {
    setData(d => {
      const arr = d[step.field] || [];
      if (v === "None") return { ...d, [step.field]: ["None"] };
      const without = arr.filter(x => x !== "None");
      return {
        ...d,
        [step.field]: without.includes(v) ? without.filter(x => x !== v) : [...without, v]
      };
    });
  };

  /* Validation */
  const isStepValid = () => {
    if (!step.required) return true;
    if (step.type === "multiChips") return (data[step.field] || []).length > 0;
    if (step.type === "imageUpload") return !!data[step.field];
    return !!data[step.field] && String(data[step.field]).trim() !== "";
  };

  const goNext = () => {
    if (!isStepValid()) { setError("This field is required."); return; }
    setError("");
    if (stepIndex < TOTAL - 1) { setDir(1); setStepIndex(i => i + 1); }
    else { handleSubmit(); }
  };

  const goSkip = () => {
    setError("");
    if (stepIndex < TOTAL - 1) { setDir(1); setStepIndex(i => i + 1); }
    else { handleSubmit(); }
  };

  const goBack = () => {
    setError("");
    if (stepIndex > 0) { setDir(-1); setStepIndex(i => i - 1); }
    else if (isEditMode) navigate(-1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender.toLowerCase(),
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        activityLevel: data.activityLevel === "Sedentary" ? "sedentary" :
                       data.activityLevel === "Lightly Active" ? "light" :
                       data.activityLevel === "Moderately Active" ? "moderate" :
                       data.activityLevel === "Very Active" ? "active" :
                       data.activityLevel === "Extremely Active" ? "very_active" :
                       mapFreqToActivity(data.frequency),
        goal: mapTargetToGoal(data.target),
        dietPreference: data.dietPreference,
        experience: data.experience,
        stressLevel: data.stressLevel,
        sleepHours: data.sleep,
        mealFrequency: data.mealFrequency,
        injuries: data.injuries,
        allergies: data.allergies,
        months: data.months,
        targetWeight: parseFloat(data.targetWeight),
        bodyFatEstimate: data.bodyFatEstimate ? parseFloat(data.bodyFatEstimate) : null,
        workoutEnvironment: data.workoutEnvironment,
        physiqueImage: data.physiqueImage,
      };
      // Save locally first so if token is expired, they don't lose data on refresh
      localStorage.setItem("runliUserInfo_draft", JSON.stringify(data));
      
      await updateProfile(payload);
      
      localStorage.removeItem("runliUserInfo_draft");
      localStorage.setItem("runliUserInfo", JSON.stringify(data));
      navigate(isEditMode ? "/profile" : "/plan");
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
      if (err.message === "Invalid token" || err.message.includes("Session expired")) {
         setError("Session expired. Your progress is saved. Please refresh the page or log in again in a new tab, then click Generate Plan.");
      }
      setSaving(false);
    }
  };

  /* Keyboard support */
  const handleKey = (e) => {
    if (e.key === "Enter" && step.type !== "chips" && step.type !== "multiChips" && step.type !== "gridCards") {
      if (isStepValid()) goNext();
      else if (!step.required) goSkip();
    }
  };

  if (loadingProfile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ margin: 0 }}>Loading your profile…</p>
        </motion.div>
      </div>
    );
  }

  const StepIcon = step.icon;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem 1rem 5rem" }}>

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "var(--bg-raised)", zIndex: 100 }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: "100%", background: "linear-gradient(90deg, var(--primary-600), var(--primary-400))", borderRadius: "0 var(--r-full) var(--r-full) 0" }}
        />
      </div>

      {/* Header row */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <button
          onClick={goBack}
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", padding: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 180ms" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--bg-overlay)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "var(--bg-raised)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Step {stepIndex + 1} of {TOTAL}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.15rem", flexWrap: "wrap", maxWidth: "40%", justifyContent: "flex-end" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === stepIndex ? 12 : 4, height: 4, borderRadius: "var(--r-full)", background: i < stepIndex ? "var(--primary-500)" : i === stepIndex ? "var(--primary-400)" : "var(--bg-raised)", transition: "all 300ms ease" }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 520, overflow: "visible" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepIndex}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="card-glass" style={{ borderRadius: "var(--r-3xl)", padding: "2rem 1.75rem", position: "relative", overflow: "hidden" }}>

              {/* Decorative background blur */}
              <div style={{
                position: "absolute", top: "-20%", right: "-20%", width: "60%", height: "60%",
                background: `radial-gradient(circle, ${step.color}15 0%, transparent 70%)`,
                filter: "blur(40px)", zIndex: -1, pointerEvents: "none"
              }} />

              {/* Icon + title */}
              <div style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    style={{ width: 52, height: 52, borderRadius: "var(--r-xl)", background: `${step.color}18`, border: `1px solid ${step.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}
                  >
                    <StepIcon size={24} color={step.color} />
                  </motion.div>
                  {!step.required && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", background: "var(--bg-raised)", color: "var(--text-muted)", borderRadius: "var(--r-full)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Optional
                    </span>
                  )}
                </div>

                <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 1.6rem)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.25, letterSpacing: "-0.03em" }}>
                  {step.title}
                </h1>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {step.subtitle}
                </p>
              </div>

              {/* Input areas */}
              {(step.type === "text" || step.type === "number") && (
                <input
                  autoFocus
                  type={step.type}
                  value={data[step.field]}
                  onChange={e => { setSingle(e.target.value); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder={step.placeholder}
                  min={step.min}
                  max={step.max}
                  className="input"
                  style={{ fontSize: "1.25rem", fontWeight: 700, padding: "0.875rem 1.125rem", letterSpacing: "-0.02em" }}
                />
              )}

              {step.type === "chips" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                  {step.options.map((opt, i) => (
                    <OptionChip
                      key={opt}
                      label={step.labels ? step.labels[i] : opt}
                      selected={val === opt}
                      onClick={() => { setSingle(opt); setError(""); }}
                    />
                  ))}
                </div>
              )}

              {step.type === "multiChips" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                  {step.options.map(opt => (
                    <OptionChip
                      key={opt}
                      label={opt}
                      multi
                      selected={(data[step.field] || []).includes(opt)}
                      onClick={() => { toggleMulti(opt); setError(""); }}
                    />
                  ))}
                  <p style={{ width: "100%", margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Select all that apply</p>
                </div>
              )}

              {step.type === "gridCards" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {step.options.map(opt => (
                    <GridCard
                      key={opt.id}
                      label={opt.label}
                      desc={opt.desc}
                      selected={val === opt.id}
                      onClick={() => { setSingle(opt.id); setError(""); }}
                    />
                  ))}
                </div>
              )}

              {step.type === "imageUpload" && (
                <ImageUploader 
                  value={data[step.field]} 
                  onChange={(val) => { setSingle(val); setError(""); }} 
                />
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--r-lg)", background: "var(--error-dim)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.875rem" }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions row */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
                {!step.required && (
                  <motion.button
                    onClick={goSkip}
                    disabled={saving}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1,
                      padding: "0.9375rem",
                      borderRadius: "var(--r-full)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: saving ? "not-allowed" : "pointer",
                      transition: "all 200ms ease",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "var(--bg-raised)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    Skip
                  </motion.button>
                )}
                
                <motion.button
                  onClick={goNext}
                  disabled={saving}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    flex: step.required ? "1" : "2",
                    padding: "0.9375rem",
                    borderRadius: "var(--r-full)",
                    background: saving ? "var(--bg-raised)" : "var(--primary-500)",
                    color: saving ? "var(--text-muted)" : "var(--text-inverse)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: saving ? "none" : "0 0 0 0 rgba(34,197,94,0), 0 8px 24px -4px rgba(34,197,94,0.35)",
                    transition: "all 200ms ease",
                    letterSpacing: "0.01em",
                  }}
                >
                  {saving ? (
                    <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating plan…</>
                  ) : stepIndex === TOTAL - 1 ? (
                    <><Zap size={18} /> Generate Plan</>
                  ) : (
                    <>{step.required ? "Continue" : "Next"} <ArrowRight size={18} /></>
                  )}
                </motion.button>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
