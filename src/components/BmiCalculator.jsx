import React, { useState } from "react";


export default function BmiCalculator() {
  const [gender, setGender] = useState("");
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [bmi, setBmi] = useState(null);
  const [feedback, setFeedback] = useState("");

  function round2(x) { return Math.round(x * 100) / 100; }

  function computeBmi() {
    let hM = 0, wK = 0;
    if (heightCm) hM = Number(heightCm) / 100;
    else if (heightFt || heightIn) hM = ((+heightFt || 0) * 12 + (+heightIn || 0)) * 0.0254;
    if (weightKg) wK = +weightKg;
    else if (weightLbs) wK = +weightLbs * 0.453592;
    if (hM > 0 && wK > 0) {
      const bmiVal = wK / (hM * hM);
      setBmi(round2(bmiVal));
      let f = "";
      if (bmiVal < 18.5) f = "Underweight 🟦 – focus on nourishing meals and strength work.";
      else if (bmiVal < 24.9) f = "Normal 👏 – keep up the good work and active life!";
      else if (bmiVal < 30) f = "Overweight ☑️ – focus on more movement and healthier eating.";
      else f = "Obese 🟥 – small, steady fitness and food changes will help.";
      setFeedback(f);
    } else {
      setBmi(null);
      setFeedback("Please enter valid height and weight.");
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        background: "#000000",
        minHeight: 480,
        padding: "56px 0 76px 0",
        boxSizing: "border-box",
      }}
    >

      <div
        style={{
          maxWidth: 465,
          width: "97vw",
          margin: "0 auto",
          background: "rgba(26, 26, 26, 0.95)",
          borderRadius: "2rem",
          boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.3)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(16, 185, 129, 0.1)",
          padding: "49px 39px 35px 39px",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <div style={{
          fontWeight: 900,
          fontSize: "2.2rem",
          letterSpacing: 0.4,
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "12px",
          textAlign: "center"
        }}>
          Check Your BMI & Fitness
        </div>
        <div style={{
          fontWeight: 700,
          fontSize: "1.08rem",
          color: "#a3a3a3",
          marginBottom: 23,
          textAlign: "center"
        }}>
          Enter your details below. Only height & weight are needed – rest is optional!
        </div>
        {/* Gender */}
        <div style={{ marginBottom: 21, width: "100%" }}>
          <div style={{
            fontWeight: 900, fontSize: 18, marginBottom: 8, color: "#ffffff"
          }}>
            Gender
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["Female", "Male"].map(opt => (
              <label key={opt} style={{
                background: gender === opt.toLowerCase()
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "rgba(255,255,255,0.05)",
                borderRadius: 16,
                color: gender === opt.toLowerCase() ? "#ffffff" : "#a3a3a3",
                fontWeight: 800,
                fontSize: 17,
                padding: "7px 30px",
                cursor: "pointer",
                border: gender === opt.toLowerCase() ? "none" : "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease"
              }}>
                <input
                  type="radio"
                  style={{ display: "none" }}
                  checked={gender === opt.toLowerCase()}
                  onChange={() => setGender(opt.toLowerCase())}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
        {/* Age */}
        <div style={{ marginBottom: 21, width: "100%" }}>
          <div style={{
            fontWeight: 700, fontSize: 18, marginBottom: 7, color: "#ffffff"
          }}>
            Age <span style={{ fontWeight: 500, fontSize: 15, color: "#737373" }}>(optional)</span>
          </div>
          <div style={{ display: "flex", gap: 13 }}>
            <input type="number" min={0} value={years} onChange={e => setYears(e.target.value)} placeholder="Years"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)", color: "#ffffff", background: "#1a1a1a", borderRadius: 10,
                fontWeight: 700, padding: "8px 15px", fontSize: 17, width: 80, outline: "none"
              }}
            />
            <input type="number" min={0} value={months} onChange={e => setMonths(e.target.value)} placeholder="Months"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)", color: "#ffffff", background: "#1a1a1a", borderRadius: 10,
                fontWeight: 700, padding: "8px 15px", fontSize: 17, width: 90, outline: "none"
              }}
            />
          </div>
        </div>
        {/* Height */}
        <div style={{ marginBottom: 19, width: "100%" }}>
          <div style={{
            fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#ffffff"
          }}>
            Height
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <input
              type="number"
              min={0}
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              placeholder="cm"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "#1a1a1a",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 700,
                padding: "8px 14px",
                fontSize: 18,
                width: 106,
                outline: "none"
              }}
            />
            <span style={{ color: "#10b981", fontWeight: 700 }}>or</span>
            <input type="number" min={0} value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="ft"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)", background: "#1a1a1a", color: "#ffffff", borderRadius: 12,
                fontWeight: 700, padding: "8px 10px", fontSize: 18, width: 54, outline: "none"
              }}
            />
            <input type="number" min={0} value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="in"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)", background: "#1a1a1a", color: "#ffffff", borderRadius: 12,
                fontWeight: 700, padding: "8px 10px", fontSize: 18, width: 54, outline: "none"
              }}
            />
          </div>
        </div>
        {/* Weight */}
        <div style={{ marginBottom: 23, width: "100%" }}>
          <div style={{
            fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#ffffff"
          }}>
            Weight
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <input
              type="number"
              min={0}
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              placeholder="kg"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "#1a1a1a",
                borderRadius: 12,
                fontWeight: 700,
                padding: "8px 14px",
                color: "#ffffff",
                fontSize: 18,
                width: 106,
                outline: "none"
              }}
            />
            <span style={{ color: "#10b981", fontWeight: 700 }}>or</span>
            <input
              type="number"
              min={0}
              value={weightLbs}
              onChange={e => setWeightLbs(e.target.value)}
              placeholder="lbs"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "#1a1a1a",
                borderRadius: 12,
                fontWeight: 700,
                padding: "8px 14px",
                color: "#ffffff",
                fontSize: 18,
                width: 106,
                outline: "none"
              }}
            />
          </div>
        </div>
        {/* Submit button */}
        <button
          onClick={computeBmi}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            fontWeight: 900,
            border: "none",
            fontSize: 23,
            borderRadius: 21,
            width: "100%",
            padding: "13px 0",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)",
            cursor: "pointer",
            marginBottom: 27,
            marginTop: 10,
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6), 0 12px 15px -6px rgba(16, 185, 129, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)";
          }}
        >
          Calculate my BMI!
        </button>
        {bmi && (
          <div style={{
            textAlign: "center",
            borderRadius: 15,
            fontWeight: 900,
            fontSize: "1.18rem",
            marginTop: 16,
            color: "#34d399",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            padding: "18px 0 13px 0"
          }}>
            Your BMI: <span style={{ color: "#10b981", fontWeight: 900, fontSize: 32 }}>{bmi}</span>
            <div style={{
              color: "#ffffff",
              marginTop: 8,
              letterSpacing: 0.12,
              fontWeight: 700
            }}>{feedback}</div>
          </div>
        )}
        {!bmi && feedback && (
          <div style={{
            textAlign: "center", color: "#ef4444", marginTop: 13, fontWeight: 800, fontSize: 18
          }}>{feedback}</div>
        )}
      </div>
    </div>
  );
}
