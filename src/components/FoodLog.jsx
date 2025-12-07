import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Select from "react-select";
import { useAuth } from "../context/AuthContext";
import { logFood, getFoodLog } from "../services/api";


const MEALS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks"];
const FOOD_CSV_PATH = "/foods.csv";

export default function FoodLog() {
  const { user } = useAuth();
  const [foods, setFoods] = useState([]);
  const [log, setLog] = useState(MEALS.reduce((acc, m) => ({ ...acc, [m]: [] }), {}));
  const [inputs, setInputs] = useState(MEALS.reduce((a, m) => ({ ...a, [m]: { selected: null, portion: 1 } }), {}));

  useEffect(() => {
    fetch(FOOD_CSV_PATH)
      .then(res => res.text())
      .then(text => {
        const parsed = Papa.parse(text, { header: true });
        setFoods(parsed.data.filter(row => row["Dish Name"] && row["Calories (kcal)"]));
      });
  }, []);

  // Load backend data
  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      getFoodLog(today).then(res => {
        if (res.foodLog) {
          const newLog = MEALS.reduce((acc, m) => ({ ...acc, [m]: [] }), {});
          res.foodLog.foods.forEach(f => {
            let meal = "Snacks";
            if (f.mealType) {
              const cap = f.mealType.charAt(0).toUpperCase() + f.mealType.slice(1);
              if (MEALS.includes(cap)) meal = cap;
              else if (cap === "Snack") meal = "Snacks";
            }

            if (newLog[meal]) {
              newLog[meal].push({
                "Dish Name": f.name,
                Calories: f.calories,
                Protein: f.protein,
                Carbs: f.carbs,
                Fats: f.fats,
                portion: Number(f.quantity) || 1
              });
            }
          });
          setLog(newLog);
        }
      }).catch(err => console.error("Error loading food log:", err));
    }
  }, [user]);

  const foodOptions = foods.map(f => ({
    value: f["Dish Name"],
    label: `${f["Dish Name"]} (${f["Calories (kcal)"]} kcal)`,
    ...f
  }));

  const handleAdd = async (meal) => {
    const { selected, portion } = inputs[meal];
    if (!selected) return;
    const food = foods.find(f => f["Dish Name"] === selected.value);
    if (food) {
      const p = Number(portion);
      const newEntry = {
        ...food,
        portion: p,
        Calories: +food["Calories (kcal)"] * p,
        Protein: +food["Protein (g)"] * p,
        Carbs: +food["Carbohydrates (g)"] * p,
        Fats: +food["Fats (g)"] * p,
      };

      setLog(prev => ({
        ...prev,
        [meal]: [...prev[meal], newEntry]
      }));

      setInputs(prev => ({
        ...prev,
        [meal]: { selected: null, portion: 1 }
      }));

      // Save to backend
      if (user) {
        try {
          let backendMealType = meal.toLowerCase();
          if (backendMealType === "snacks") backendMealType = "snack";
          if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(backendMealType)) backendMealType = 'snack';

          await logFood(new Date(), {
            name: food["Dish Name"],
            quantity: String(p),
            calories: newEntry.Calories,
            protein: newEntry.Protein,
            carbs: newEntry.Carbs,
            fats: newEntry.Fats,
            mealType: backendMealType
          });
        } catch (err) {
          console.error("Failed to save food log", err);
        }
      }
    }
  };

  // Aggregate for macros/pie
  const allEntries = MEALS.flatMap(meal => log[meal]);
  const summary = allEntries.reduce(
    (acc, f) => ({
      Calories: acc.Calories + Number(f.Calories || 0),
      Protein: acc.Protein + Number(f.Protein || 0),
      Carbs: acc.Carbs + Number(f.Carbs || 0),
      Fats: acc.Fats + Number(f.Fats || 0),
    }),
    { Calories: 0, Protein: 0, Carbs: 0, Fats: 0 }
  );
  const macroData = [
    { label: "Carbs", value: summary.Carbs, color: "#34d399" },
    { label: "Protein", value: summary.Protein, color: "#10b981" },
    { label: "Fats", value: summary.Fats, color: "#059669" },
  ];
  const totalMacro = Math.max(1, summary.Carbs + summary.Protein + summary.Fats);
  let startAngle = 0;
  const pieArcs = macroData.map(({ value, color }, i) => {
    const angle = (value / totalMacro) * 360;
    const path = describeArc(60, 60, 45, startAngle, startAngle + angle);
    const segment = (
      <path
        key={i}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={15}
        strokeLinecap="butt"
      />
    );
    startAngle += angle;
    return segment;
  });

  // Custom styles for react-select to get a dark, glassy dropdown
  const selectStyles = {
    control: base => ({
      ...base,
      background: "#1a1a1a",
      fontSize: "1rem",
      minHeight: "42px",
      borderRadius: "0.75rem",
      borderColor: "rgba(16, 185, 129, 0.2)",
      color: "white",
      boxShadow: "none",
      "&:hover": {
        borderColor: "rgba(16, 185, 129, 0.5)"
      }
    }),
    menu: base => ({
      ...base,
      background: "#1a1a1a",
      border: "1px solid rgba(16, 185, 129, 0.2)",
      zIndex: 50
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused
        ? "rgba(16, 185, 129, 0.1)"
        : "#1a1a1a",
      color: state.isSelected ? "#10b981" : "#ffffff",
      fontWeight: state.isSelected ? 700 : 500,
      cursor: "pointer"
    }),
    singleValue: base => ({
      ...base,
      color: "white"
    }),
    input: base => ({
      ...base,
      color: "white"
    })
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#000000",
        padding: "4rem 0",
        boxSizing: "border-box",
        overflowX: "auto"
      }}
    >

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: "2rem",
          boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.15)",
          background: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(16, 185, 129, 0.1)",
          padding: "2.5rem 2rem",
          width: "94vw",
          display: "flex",
          gap: 45,
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}
      >
        {/* LEFT: Meal Splits */}
        <div style={{ flex: 2, minWidth: 350 }}>
          <div style={{
            fontWeight: 900,
            color: "#ffffff",
            fontSize: "2.2rem",
            marginBottom: "2rem",
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Track Your Indian Meals
          </div>
          {MEALS.map(meal =>
            <div key={meal} style={{ marginBottom: 32 }}>
              <div style={{
                fontWeight: 700, fontSize: 21, color: "#10b981",
                marginBottom: 12, marginLeft: 6, letterSpacing: 0.3
              }}>{meal}</div>
              <div style={{
                background: "#121212",
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "1.5rem",
                minHeight: 40
              }}>
                {log[meal].length === 0 &&
                  <div style={{
                    color: "#737373",
                    textAlign: "center",
                    fontWeight: 500,
                    fontSize: 15
                  }}>No food added yet</div>
                }
                {log[meal].map((l, idx) => (
                  <div key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#e5e5e5",
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderRadius: 8,
                      marginBottom: 4
                    }}>
                    <span>{l["Dish Name"]}</span>
                    <span style={{ color: "#10b981" }}>{l.Calories} kcal</span>
                  </div>
                ))}
                {/* Controls */}
                <div style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 12,
                  alignItems: "center"
                }}>
                  <div style={{ flex: 1 }}>
                    <Select
                      options={foodOptions}
                      value={inputs[meal].selected}
                      onChange={s => setInputs(prev => ({ ...prev, [meal]: { ...prev[meal], selected: s } }))}
                      placeholder="Search food..."
                      isClearable
                      styles={selectStyles}
                      filterOption={(option, input) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={inputs[meal].portion}
                    style={{
                      width: 60,
                      height: 42,
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      fontWeight: 600,
                      color: "white",
                      background: "#1a1a1a",
                      fontSize: 16,
                      textAlign: "center",
                      outline: "none"
                    }}
                    onChange={e => setInputs(prev => ({
                      ...prev, [meal]: { ...prev[meal], portion: e.target.value }
                    }))}
                  />
                  <button
                    type="button"
                    style={{
                      padding: "0 24px",
                      height: 42,
                      borderRadius: "0.75rem",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      fontSize: "1rem",
                      boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.2)";
                    }}
                    onClick={() => handleAdd(meal)}
                  >Add</button>
                </div>
              </div>
            </div>
          )}
          {/* DAILY TOTALS */}
          <div style={{
            marginTop: 32,
            padding: "1.5rem",
            background: "rgba(16, 185, 129, 0.1)",
            borderRadius: "1rem",
            fontWeight: 700,
            textAlign: "center",
            color: "#10b981",
            fontSize: "1.2rem",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}>
            Total – <span style={{ color: "white" }}>{summary.Calories} kcal</span>
            <span style={{ margin: "0 8px", color: "#525252" }}>|</span>
            {summary.Protein.toFixed(1)}g protein
            <span style={{ margin: "0 8px", color: "#525252" }}>|</span>
            {summary.Carbs.toFixed(1)}g carbs
            <span style={{ margin: "0 8px", color: "#525252" }}>|</span>
            {summary.Fats.toFixed(1)}g fats
          </div>
        </div>
        {/* RIGHT: CHART & MACRO TABLE */}
        <div style={{
          flex: 1,
          minWidth: 340,
          background: "#121212",
          borderRadius: "1.5rem",
          border: "1px solid rgba(255,255,255,0.05)",
          padding: "2rem",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <svg width={160} height={160} style={{ margin: "20px 0 30px 0", display: "block" }}>
            {pieArcs}
          </svg>
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            marginBottom: "20px",
            fontWeight: 700, fontSize: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399" }}></div>
              <span style={{ color: "#d4d4d4" }}>Carbs</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }}></div>
              <span style={{ color: "#d4d4d4" }}>Protein</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#059669" }}></div>
              <span style={{ color: "#d4d4d4" }}>Fats</span>
            </div>
          </div>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            fontSize: "0.95rem",
            color: "#a3a3a3"
          }}>
            <thead>
              <tr style={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                <th style={{ textAlign: "left", paddingLeft: "12px" }}>Food</th>
                <th style={{ textAlign: "right" }}>Kcal</th>
                <th style={{ textAlign: "right" }}>P</th>
                <th style={{ textAlign: "right" }}>C</th>
                <th style={{ textAlign: "right", paddingRight: "12px" }}>F</th>
              </tr>
            </thead>
            <tbody>
              {allEntries.map((l, idx) => (
                <tr key={idx}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8
                  }}>
                  <td style={{ textAlign: "left", padding: "12px", borderRadius: "8px 0 0 8px", color: "white", fontWeight: 600 }}>{l["Dish Name"]}</td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{l.Calories}</td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{l.Protein}</td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{l.Carbs}</td>
                  <td style={{ textAlign: "right", padding: "12px", borderRadius: "0 8px 8px 0" }}>{l.Fats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Pie chart helpers
function polarToCartesian(cx, cy, r, a) {
  let rad = ((a - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(x, y, r, startAngle, endAngle) {
  let start = polarToCartesian(x, y, r, endAngle);
  let end = polarToCartesian(x, y, r, startAngle);
  let arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    arcSweep,
    0,
    end.x,
    end.y
  ].join(" ");
}
