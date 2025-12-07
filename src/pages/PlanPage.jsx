import React from "react";
import { useNavigate } from "react-router-dom";


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
    <div
      className="min-h-screen w-full flex justify-center items-start py-12 px-2"
      style={{
        background: "#000000",
        minHeight: "100vh",
        position: "relative",
        paddingTop: "6rem"
      }}
    >

      <div className="max-w-[1100px] w-full flex flex-col items-center gap-5">
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 900,
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "0.5rem",
          textAlign: "center",
          letterSpacing: "-0.5px"
        }}>
          Your Personalized Fitness Blueprint <span role="img" aria-label="target">🚀</span>
        </h1>
        <div style={{ color: "#a3a3a3", fontSize: "1.125rem", fontWeight: 500, marginBottom: "1.5rem", textAlign: "center" }}>
          Roadmap to your dream physique.
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Key Metrics */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
            {/* Main Goal Card */}
            <div style={{
              flex: "1 1 300px",
              background: "rgba(26, 26, 26, 0.95)",
              borderRadius: "1.5rem",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}>
              <span style={{ marginBottom: "0.5rem", fontSize: "1.125rem", fontWeight: 700, color: "#ffffff" }}>Main Goal</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "2rem" }} role="img">🎯</span>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{bmiVal || "--"}</div>
                  <div style={{ color: "#a3a3a3", fontWeight: 500 }}>{bmiVal && bmiCategory(bmiVal) ? `BMI — ${bmiCategory(bmiVal)}` : ""}</div>
                </div>
              </div>
              <div style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1.5rem",
                borderRadius: "1rem",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                fontWeight: 600,
                fontSize: "1rem"
              }}>
                {mainGoal}
              </div>
            </div>

            {/* Calories Card */}
            <div style={{
              flex: "1 1 300px",
              background: "rgba(26, 26, 26, 0.95)",
              borderRadius: "1.5rem",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}>
              <span style={{ color: "#fbbf24", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Calories</span>
              <span style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff" }}>{calories || "--"}</span>
              <span style={{ color: "#a3a3a3", fontWeight: 500, marginTop: "0.25rem" }}>kcal / day</span>
            </div>

            {/* Protein Card */}
            <div style={{
              flex: "1 1 300px",
              background: "rgba(26, 26, 26, 0.95)",
              borderRadius: "1.5rem",
              border: "1px solid rgba(236, 72, 153, 0.2)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}>
              <span style={{ color: "#f472b6", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Protein</span>
              <span style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff" }}>{protein || "--"}</span>
              <span style={{ color: "#a3a3a3", fontWeight: 500, marginTop: "0.25rem" }}>per day (g)</span>
            </div>
          </div>

          {/* Workout Split */}
          <div style={{
            background: "rgba(26, 26, 26, 0.95)",
            borderRadius: "1.5rem",
            border: "1px solid rgba(16, 185, 129, 0.1)",
            padding: "2rem",
            marginBottom: "1rem"
          }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Weekly Workout Split <span role="img" aria-label="workout">🏋️‍♂️</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
              {split.map((d, idx) => (
                <div key={idx} style={{
                  padding: "1rem",
                  background: "#121212",
                  borderRadius: "1rem",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                  <div style={{ color: "#10b981", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    {d.day} <span style={{ color: "#ffffff" }}>{d.focus}</span>
                  </div>
                  <ul style={{ marginLeft: "1.25rem", listStyleType: "disc", color: "#a3a3a3", lineHeight: "1.6" }}>
                    {d.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{
                background: "rgba(26, 26, 26, 0.95)",
                borderRadius: "1.5rem",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                padding: "1.5rem"
              }}>
                <div style={{ fontWeight: 700, color: "#facc15", marginBottom: "1rem" }}>⚠️ Avoid These</div>
                <ul style={{ color: "#d4d4d4", lineHeight: "1.6" }}>
                  <li><span style={{ color: "#facc15", fontWeight: 700 }}>Target:</span> {protein}g / day</li>
                  <li>Aim for <span style={{ fontWeight: 700 }}>0.7-1g/lb</span> of lean mass.</li>
                  <li>Spread intake across 4–5 meals.</li>
                  <li>Example: <span style={{ fontWeight: 700 }}>150g chicken breast</span> (45g)</li>
                </ul>
              </div>

              <div style={{
                background: "rgba(26, 26, 26, 0.95)",
                borderRadius: "1.5rem",
                border: "1px solid rgba(244, 114, 182, 0.3)",
                padding: "1.5rem"
              }}>
                <div style={{ fontWeight: 700, color: "#f472b6", marginBottom: "1rem" }}>Protein Intake Details</div>
                <ul style={{ color: "#d4d4d4", lineHeight: "1.6" }}>
                  <li><span style={{ fontWeight: 600, color: "#fbcfe8" }}>Aim:</span> For {protein}g per day.</li>
                  <li><span style={{ color: "#a3a3a3" }}>Good sources:</span> Chicken, fish, dairy, eggs, lentils.</li>
                  <li style={{ color: "#fbcfe8" }}>Spread in 4–5 meals for best results.</li>
                </ul>
              </div>
            </div>

            <div style={{
              background: "rgba(26, 26, 26, 0.95)",
              borderRadius: "1.5rem",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
              <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>Water Intake Details</div>
              <div>
                <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "2.5rem", marginBottom: "0.5rem" }}>{water} L</div>
                <div style={{ color: "#93c5fd", fontWeight: 500 }}>per day</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", items: "center", justifyContent: "center", textAlign: "center", color: "#a3a3a3" }}>
            <span style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>
              Stay consistent, eat clean, and trust the process. Runli's got your back <span style={{ color: "#facc15" }}>💪</span>
            </span>
            <button
              style={{
                padding: "1rem 3rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontWeight: 800,
                fontSize: "1.25rem",
                borderRadius: "9999px",
                border: "none",
                boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                alignSelf: "center",
                marginBottom: "1rem"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6), 0 12px 15px -6px rgba(16, 185, 129, 0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)";
              }}
              onClick={() => navigate("/diet-plan")}
            >
              Create Personalized Diet Plan
            </button>
            <button
              style={{
                padding: "1rem 3rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontWeight: 800,
                fontSize: "1.25rem",
                borderRadius: "9999px",
                border: "none",
                boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                alignSelf: "center"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6), 0 12px 15px -6px rgba(16, 185, 129, 0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)";
              }}
              onClick={() => navigate("/dashboard")}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
