import React from "react";
import { useNavigate } from "react-router-dom";
import RecommendationSection from '../components/RecommendationSection';
import { getRecommendations } from '../utils/recommendationEngine';


// SPLIT GENERATOR BASED ON FREQUENCY
const SPLITS = [
  {
    focus: "Chest + Triceps",
    exercises: [
      "Barbell Bench Press 4x8-12",
      "Incline Dumbbell Press 4x10-12",
      "Cable Flyes 3x12-15",
      "Triceps Rope Pushdown 3x12-15"
    ]
  },
  {
    focus: "Back + Biceps",
    exercises: [
      "Pull-Ups / Lat Pulldowns 4x8-12",
      "Seated Cable Row 4x10-12",
      "Barbell Bicep Curl 3x10-12",
      "Face Pulls 3x12-15"
    ]
  },
  {
    focus: "Legs + Core",
    exercises: [
      "Barbell Squat 4x8-12",
      "Hamstring Curl 3x12",
      "Leg Press 3x10-12",
      "Hanging Leg Raises 3x15"
    ]
  },
  {
    focus: "Shoulders + Abs",
    exercises: [
      "Overhead Dumbbell Press 4x10-12",
      "Lateral Raises 3x12-15",
      "Rear Delt Flyes 3x15",
      "Plank (90 sec) x3"
    ]
  },
  {
    focus: "Full Body or HIIT",
    exercises: [
      "Deadlift 4x6",
      "Push-Ups 3x20",
      "Walking Lunges 3x20",
      "Mountain Climbers (40sec) x3"
    ]
  },
  {
    focus: "Active Recovery",
    exercises: [
      "Yoga Flow 30min",
      "Foam Rolling 10min",
      "Walking 40min",
      "Light Core (Bird Dog, Dead Bug) 3x12"
    ]
  },
  {
    focus: "Upper Body Circuit",
    exercises: [
      "Chin-Ups 3x8",
      "Push-Ups 3x20",
      "Front Dumbbell Raise 3x12",
      "Cable Triceps Extension 3x15"
    ]
  }
];

const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getSplitByFrequency(freq = 4) {
  // Cycle through SPLITS, skip "Active Recovery" unless it's the final slot
  let split = [];
  for (let i = 0; i < freq; i++) {
    let sidx = i % (SPLITS.length - 1);
    // If it's the last day, and >4 days, make it "Active Recovery"
    if (freq >= 5 && i === freq - 1) sidx = SPLITS.length - 1;
    split.push({
      day: DAYNAMES[i % DAYNAMES.length],
      focus: SPLITS[sidx].focus,
      exercises: SPLITS[sidx].exercises
    });
  }
  return split;
}

// FITNESS CALCS (same as before)
function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  const h = Number(height) / 100;
  return Number(weight) / (h * h);
}
function bmiCategory(bmi) {
  if (!bmi) return "";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
function calcBMR(weight, height, age, gender) {
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  if (gender === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age;
}
function caloriesTarget(bmr, freq, target) {
  const freqFactor = { 2: 1.3, 3: 1.45, 4: 1.6, 5: 1.7, 6: 1.78, 7: 1.83 }[freq] || 1.6;
  let value = bmr * freqFactor;
  if (/gain|bulk|muscle/i.test(target)) value *= 1.1;
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
  if (!weight) return 2.3;
  return Math.round(weight * 0.035 * 10) / 10;
}

export default function Plan() {
  const navigate = useNavigate();
  let user = {};
  try { user = JSON.parse(localStorage.getItem("runliUserInfo")) || {}; } catch { }
  const age = Number(user.age);
  const weight = Number(user.weight);
  const height = Number(user.height);
  const gender = user.gender || "";
  const freq = Number(user.frequency) || 4;

  const recommendations = React.useMemo(() => getRecommendations(), []);
  const targetPhysique = user.target || "";
  const protein = proteinTarget(weight, targetPhysique);
  const bmiVal = weight && height ? Number(calculateBMI(weight, height)).toFixed(1) : null;
  const bmr = calcBMR(weight, height, age, gender);
  const calories = caloriesTarget(bmr, freq, targetPhysique);
  const water = waterTarget(weight);
  const split = getSplitByFrequency(freq);

  let mainGoal = "-";
  if (user.targetWeight && user.targetDuration) {
    mainGoal = `Reach ${user.targetWeight}kg in ${user.targetDuration} month${user.targetDuration > 1 ? "s" : ""}`;
  } else if (targetPhysique) {
    mainGoal = targetPhysique;
  }

  return (
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", padding: "clamp(1rem, 3vw, 2rem)", paddingTop: "clamp(1.25rem, 4vw, 2rem)" }}>

      <div style={{ maxWidth: "1100px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{
            fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
            fontWeight: 800,
            color: "var(--primary-400)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Your Fitness Blueprint <span role="img" aria-label="target">🚀</span>
          </h1>
          <div style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", fontWeight: 500 }}>
            Roadmap to your dream physique.
          </div>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Key Metrics */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
            
            {/* Main Goal Card */}
            <div className="card" style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ marginBottom: "0.5rem", fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)" }}>Main Goal</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "2rem" }} role="img">🎯</span>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary-500)" }}>{bmiVal || "--"}</div>
                  <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{bmiVal && bmiCategory(bmiVal) ? `BMI — ${bmiCategory(bmiVal)}` : ""}</div>
                </div>
              </div>
              <div className="chip chip-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9375rem" }}>
                {mainGoal}
              </div>
            </div>

            {/* Calories Card */}
            <div className="card" style={{ flex: "1 1 300px", borderColor: "rgba(245, 158, 11, 0.2)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ color: "var(--amber-500)", fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.5rem" }}>Calories</span>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{calories || "--"}</span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500, marginTop: "0.25rem" }}>kcal / day</span>
            </div>

            {/* Protein Card */}
            <div className="card" style={{ flex: "1 1 300px", borderColor: "rgba(236, 72, 153, 0.2)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ color: "var(--purple-400)", fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.5rem" }}>Protein</span>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{protein || "--"}</span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500, marginTop: "0.25rem" }}>g / day</span>
            </div>
          </div>

          {/* Workout Split */}
          <div className="card" style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Weekly Workout Split <span role="img" aria-label="workout">🏋️‍♂️</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
              {split.map((d, idx) => (
                <div key={idx} style={{
                  padding: "1rem",
                  background: "var(--bg-raised)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ color: "var(--primary-400)", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.5rem" }}>
                    {d.day} <span style={{ color: "var(--text-primary)" }}>{d.focus}</span>
                  </div>
                  <ul style={{ marginLeft: "1.25rem", listStyleType: "disc", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    {d.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="card" style={{ borderColor: "rgba(234, 179, 8, 0.3)" }}>
                <div style={{ fontWeight: 700, color: "var(--amber-400)", marginBottom: "1rem" }}>⚠️ Remember</div>
                <ul style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  <li><span style={{ color: "var(--amber-400)", fontWeight: 700 }}>Target:</span> {protein}g protein / day</li>
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
              <div style={{ fontWeight: 700, color: "var(--blue-400)", marginBottom: "1rem" }}>Daily Hydration Target</div>
              <div>
                <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "2.75rem", marginBottom: "0.25rem" }}>{water} L</div>
                <div style={{ color: "var(--blue-500)", fontWeight: 500 }}>drink water!</div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={{ marginTop: "1rem" }}>
            <RecommendationSection recommendations={recommendations} />
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: "var(--text-secondary)" }}>
            <span style={{ marginBottom: "1.5rem", fontSize: "1.0625rem" }}>
              Stay consistent, eat clean, and trust the process. Runli's got your back. <span style={{ color: "var(--amber-400)" }}>💪</span>
            </span>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                className="btn btn-secondary"
                style={{ padding: "0.875rem 2rem", fontSize: "1.125rem" }}
                onClick={() => navigate("/diet-plan")}
                >
                View Diet Plan
                </button>
                <button
                className="btn btn-primary"
                style={{ padding: "0.875rem 2.5rem", fontSize: "1.125rem" }}
                onClick={() => navigate("/dashboard")}
                >
                Go to Dashboard
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
