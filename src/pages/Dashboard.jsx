import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Flame, TrendingUp, Calendar, Zap, Lightbulb, Search, Dumbbell, Target, RefreshCw, UtensilsCrossed, CheckCircle2, Circle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { getProgress, updateProgress, getInsight, getDietPlan, getProgressRange } from '../services/api';

// Helper functions
function calcBMR(weight, height, age, gender) {
  if (gender === "Female") return 10 * weight + 6.25 * height - 5 * age - 161;
  if (gender === "Male") return 10 * weight + 6.25 * height - 5 * age + 5;
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
  if (!weight) return 3100;
  return Math.round(weight * 35);
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  // Trackers
  const [waterIntake, setWaterIntake] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [wentToGym, setWentToGym] = useState(false);

  // Inputs
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [newWeight, setNewWeight] = useState('');

  // Data
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [streak, setStreak] = useState(0);
  const [insight, setInsight] = useState("Loading your daily tip...");
  const [dietPlanCompleted, setDietPlanCompleted] = useState([]);

  // New: Diet Plan
  const [dietPlan, setDietPlan] = useState(null);
  const [mealCompletion, setMealCompletion] = useState([]);

  // New: Weight History
  const [weightHistory, setWeightHistory] = useState([]);

  // Calendar View Toggle
  const [calendarView, setCalendarView] = useState('weekly'); // 'weekly' or 'monthly'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyActivity, setMonthlyActivity] = useState({});
  const [completedDays, setCompletedDays] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runliCompletedDays")) || Array(7).fill(false); } catch { return Array(7).fill(false); }
  });

  const [dailyGoals, setDailyGoals] = useState({ water: 3100, calories: 3044, protein: 107 });
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Styles matching Dashboard
  const cardStyle = {
    background: "rgba(26, 26, 26, 0.95)",
    borderRadius: "2rem",
    padding: "2rem",
    border: "1px solid rgba(16, 185, 129, 0.1)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    color: "white"
  };

  const btnStyle = {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem"
  };

  // --- Effects ---

  useEffect(() => {
    fetch('/foods.csv')
      .then(res => res.text())
      .then(text => {
        const parsed = Papa.parse(text, { header: true });
        setFoods(parsed.data.filter(row => row["Dish Name"] && row["Calories (kcal)"]));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("runliUserInfo")) || {};
      if (userInfo.weight) {
        const age = Number(userInfo.age) || 25;
        const weight = Number(userInfo.weight) || 70;
        setCurrentWeight(weight);
        const height = Number(userInfo.height) || 170;
        const gender = userInfo.gender || "Male";
        const freq = Number(userInfo.frequency) || 4;
        const target = userInfo.target || "";

        const bmr = calcBMR(weight, height, age, gender);
        setDailyGoals({
          water: waterTarget(weight),
          calories: caloriesTarget(bmr, freq, target),
          protein: proteinTarget(weight, target)
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  // Daily Reset Logic - Check for date change and reset trackers
  useEffect(() => {
    const checkDateChange = () => {
      const lastDate = localStorage.getItem('lastDashboardDate');
      const today = new Date().toISOString().split('T')[0];

      if (lastDate && lastDate !== today) {
        // New day detected - reset daily trackers
        setWaterIntake(0);
        setCaloriesConsumed(0);
        setProteinIntake(0);
        setWentToGym(false);
        // Note: currentWeight and other persistent data NOT reset

        // Reset weekly completion tracking
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1) { // Monday - reset weekly tracker
          setCompletedDays(Array(7).fill(false));
        }
      }

      localStorage.setItem('lastDashboardDate', today);
    };

    checkDateChange();

    // Check every minute for date change (handles midnight transition)
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      getProgress(today).then(res => {
        if (res.progress) {
          setWaterIntake(res.progress.waterIntake);
          setCaloriesConsumed(res.progress.caloriesConsumed);
          setProteinIntake(res.progress.proteinIntake);
          setWentToGym(res.progress.wentToGym);
          if (res.progress.weight) setCurrentWeight(res.progress.weight);
          if (res.progress.dietPlanCompleted) setDietPlanCompleted(res.progress.dietPlanCompleted);
          if (res.progress.mealCompletion) setMealCompletion(res.progress.mealCompletion || []);
        }
        setLoaded(true);
      }).catch(() => setLoaded(true));

      getInsight().then(res => res.insight && setInsight(res.insight)).catch(() => setInsight("Stay consistent!"));

      // Load Diet Plan
      getDietPlan().then(res => {
        if (res.dietPlan) {
          setDietPlan(res.dietPlan);
        }
      }).catch(console.error);

      // Load Weight History (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      getProgressRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ).then(res => {
        if (res.progress) {
          const weightData = res.progress
            .filter(p => p.weight)
            .map(p => ({ date: p.date, weight: p.weight }));
          setWeightHistory(weightData);

          // Build monthly activity map
          const activityMap = {};
          res.progress.forEach(p => {
            if (p.wentToGym) {
              activityMap[p.date] = true;
            }
          });
          setMonthlyActivity(activityMap);
        }
      }).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (loaded && user) {
      const today = new Date().toISOString().split('T')[0];
      const timer = setTimeout(() => {
        updateProgress(today, {
          waterIntake,
          caloriesConsumed,
          proteinIntake,
          wentToGym,
          weight: currentWeight,
          dietPlanCompleted,
          mealCompletion
        }).catch(console.error);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [waterIntake, caloriesConsumed, proteinIntake, wentToGym, currentWeight, dietPlanCompleted, mealCompletion, loaded, user]);

  useEffect(() => localStorage.setItem("runliCompletedDays", JSON.stringify(completedDays)), [completedDays]);

  const addWater = (amt) => setWaterIntake(p => Math.min(p + amt, dailyGoals.water));
  const addCalories = (amt) => setCaloriesConsumed(p => Math.min(p + amt, dailyGoals.calories * 1.5));
  const addProtein = (amt) => setProteinIntake(p => Math.min(p + amt, dailyGoals.protein * 1.5));

  const getProgressPercent = (curr, total) => Math.min((curr / total) * 100, 100);

  const foodOptions = foods.map(f => ({
    value: f["Dish Name"],
    label: `${f["Dish Name"]} (${f["Calories (kcal)"]} kcal)`,
    ...f
  }));

  const ToggleGym = () => {
    const newStatus = !wentToGym;
    setWentToGym(newStatus);

    // Update monthly activity
    const today = new Date().toISOString().split('T')[0];
    setMonthlyActivity(prev => ({
      ...prev,
      [today]: newStatus
    }));

    if (newStatus) {
      setStreak(s => s + 1);
      const newDays = [...completedDays];
      const dayIdx = (new Date().getDay() + 6) % 7;
      newDays[dayIdx] = true;
      setCompletedDays(newDays);
    } else {
      setStreak(s => Math.max(0, s - 1));
      const newDays = [...completedDays];
      const dayIdx = (new Date().getDay() + 6) % 7;
      newDays[dayIdx] = false;
      setCompletedDays(newDays);
    }
  };

  const toggleMealCompletion = (mealIndex) => {
    setMealCompletion(prev => {
      const newCompletion = [...prev];
      if (newCompletion.includes(mealIndex)) {
        return newCompletion.filter(i => i !== mealIndex);
      } else {
        return [...newCompletion, mealIndex];
      }
    });
  };

  const logWeight = () => {
    if (newWeight && !isNaN(newWeight)) {
      const weight = Number(newWeight);
      setCurrentWeight(weight);

      // Add to weight history
      const today = new Date().toISOString().split('T')[0];
      setWeightHistory(prev => {
        const filtered = prev.filter(w => w.date !== today);
        return [...filtered, { date: today, weight }].sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      setNewWeight('');
    }
  };

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
  };

  const isDayCompleted = (day) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthlyActivity[dateStr] || false;
  };

  return (
    <div style={{ background: "#000000", minHeight: "100vh", padding: window.innerWidth < 768 ? "1rem 0.5rem" : "2rem 1rem", color: "white", fontFamily: "Poppins, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Insight */}
        <div style={{ ...cardStyle, background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Lightbulb size={24} color="#10b981" />
          <div>
            <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>Daily Insight</div>
            <div style={{ fontStyle: "italic", fontSize: "1.1rem" }}>"{insight}"</div>
          </div>
        </div>

        {/* Quick Actions for Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <button
            onClick={() => navigate('/gym-mode')}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Dumbbell size={32} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Gym Mode</div>
              <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>Start Workout</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/habits')}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Target size={32} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Habit Tracker</div>
              <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>Track Streaks</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/diet-plan')}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <RefreshCw size={32} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Diet Plan</div>
              <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>Manage Meals</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/plan')}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Target size={32} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Plan Page</div>
              <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>View Fitness Plan</div>
            </div>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>

          {/* Gym Tracker */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Activity color="#6366f1" /> Daily Tracker
                </h2>
                <div style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>Consistency is key!</div>
              </div>
              <div style={{ background: "rgba(234, 179, 8, 0.1)", color: "#eab308", padding: "0.3rem 0.8rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Zap size={14} fill="currentColor" /> {streak} Day Streak
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button
                onClick={ToggleGym}
                style={{
                  width: "96px", height: "48px", borderRadius: "999px",
                  background: wentToGym ? "#6366f1" : "#1f2937",
                  border: wentToGym ? "none" : "1px solid rgba(255,255,255,0.1)",
                  position: "relative", cursor: "pointer", transition: "all 0.3s ease"
                }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", background: "white",
                  position: "absolute", top: "4px", left: wentToGym ? "52px" : "4px", transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </button>
              <div style={{ marginTop: "1rem", fontWeight: "600" }}>{wentToGym ? "Workout Complete! 💪" : "Tap to Check In"}</div>
            </div>
          </div>

          {/* Activity Calendar with Toggle */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <Calendar color="#10b981" /> Activity
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.3)", padding: "0.25rem", borderRadius: "999px" }}>
                <button
                  onClick={() => setCalendarView('weekly')}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    background: calendarView === 'weekly' ? "#10b981" : "transparent",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "all 0.2s"
                  }}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setCalendarView('monthly')}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    background: calendarView === 'monthly' ? "#10b981" : "transparent",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "all 0.2s"
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>

            {calendarView === 'weekly' ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {weekDays.map((day, idx) => (
                  <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: completedDays[idx] ? "#10b981" : "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: completedDays[idx] ? "white" : "#6b7280"
                    }}>
                      {completedDays[idx] && "✓"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "bold" }}>{day}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1rem", textAlign: "center", color: "#a3a3a3", fontWeight: "bold", fontSize: "0.9rem" }}>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} style={{ textAlign: "center", fontSize: "0.7rem", color: "#6b7280", fontWeight: "bold", marginBottom: "0.25rem" }}>{day}</div>
                  ))}
                  {getDaysInMonth().map((day, idx) => (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.5rem",
                        background: day && isDayCompleted(day) ? "#10b981" : day ? "rgba(255,255,255,0.05)" : "transparent",
                        border: day && isToday(day) ? "2px solid #10b981" : "none",
                        color: day && isDayCompleted(day) ? "white" : "#6b7280",
                        fontSize: "0.85rem",
                        fontWeight: day && isToday(day) ? "bold" : "normal"
                      }}
                    >
                      {day || ""}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trackers Grid - MOVED BELOW ACTIVITY */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>

          {/* Water */}
          <div style={{ ...cardStyle, borderTop: "4px solid #06b6d4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ color: "#06b6d4", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>Water</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{waterIntake} <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>/ {dailyGoals.water}ml</span></div>
              </div>
              <Droplets color="#06b6d4" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "99px", marginBottom: "1rem", overflow: "hidden" }}>
              <div style={{ width: `${getProgressPercent(waterIntake, dailyGoals.water)}%`, height: "100%", background: "#06b6d4" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => addWater(250)} style={{ ...btnStyle, background: "transparent", border: "1px solid #06b6d4", color: "#06b6d4" }}>+250</button>
              <button onClick={() => addWater(500)} style={{ ...btnStyle, background: "transparent", border: "1px solid #06b6d4", color: "#06b6d4" }}>+500</button>
            </div>
          </div>

          {/* Calories */}
          <div style={{ ...cardStyle, borderTop: "4px solid #f97316" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ color: "#f97316", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>Calories</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{caloriesConsumed} <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>/ {dailyGoals.calories}</span></div>
              </div>
              <Flame color="#f97316" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "99px", marginBottom: "1rem", overflow: "hidden" }}>
              <div style={{ width: `${getProgressPercent(caloriesConsumed, dailyGoals.calories)}%`, height: "100%", background: "#f97316" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                value={customCalories}
                onChange={e => setCustomCalories(e.target.value)}
                placeholder="Add..."
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.4rem", borderRadius: "5px", width: "100%" }}
              />
              <button onClick={() => { if (customCalories) { addCalories(Number(customCalories)); setCustomCalories(''); } }} style={{ ...btnStyle, background: "#f97316" }}>Add</button>
            </div>
          </div>

          {/* Protein */}
          <div style={{ ...cardStyle, borderTop: "4px solid #a855f7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ color: "#a855f7", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>Protein</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{proteinIntake}g <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>/ {dailyGoals.protein}g</span></div>
              </div>
              <Activity color="#a855f7" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "99px", marginBottom: "1rem", overflow: "hidden" }}>
              <div style={{ width: `${getProgressPercent(proteinIntake, dailyGoals.protein)}%`, height: "100%", background: "#a855f7" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                value={customProtein}
                onChange={e => setCustomProtein(e.target.value)}
                placeholder="Add..."
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.4rem", borderRadius: "5px", width: "100%" }}
              />
              <button onClick={() => { if (customProtein) { addProtein(Number(customProtein)); setCustomProtein(''); } }} style={{ ...btnStyle, background: "#a855f7" }}>Add</button>
            </div>
          </div>

        </div>

        {/* Diet Plan Tracker */}
        {dietPlan && (
          <div style={{ ...cardStyle, borderTop: "4px solid #10b981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <UtensilsCrossed color="#10b981" /> Today's Meal Plan
                </h2>
                <div style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
                  {mealCompletion.length} of {dietPlan.meals.reduce((sum, m) => sum + m.items.length, 0)} meals completed
                </div>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                {Math.round((mealCompletion.length / dietPlan.meals.reduce((sum, m) => sum + m.items.length, 0)) * 100) || 0}%
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              {dietPlan.meals.map((meal, mealIdx) => (
                <div key={mealIdx} style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontWeight: "bold", marginBottom: "0.75rem", fontSize: "1.1rem" }}>{meal.name}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {meal.items.map((item, itemIdx) => {
                      const globalIdx = dietPlan.meals.slice(0, mealIdx).reduce((sum, m) => sum + m.items.length, 0) + itemIdx;
                      const isCompleted = mealCompletion.includes(globalIdx);
                      return (
                        <div
                          key={itemIdx}
                          onClick={() => toggleMealCompletion(globalIdx)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            background: isCompleted ? "rgba(16, 185, 129, 0.1)" : "transparent",
                            border: `1px solid ${isCompleted ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)"}`,
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = isCompleted ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)"}
                          onMouseOut={(e) => e.currentTarget.style.background = isCompleted ? "rgba(16, 185, 129, 0.1)" : "transparent"}
                        >
                          {isCompleted ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#6b7280" />}
                          <div style={{ flex: 1, fontSize: "0.9rem", color: isCompleted ? "#10b981" : "white" }}>{item.food}</div>
                          <div style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>{item.calories} cal</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weight Log Graph with Input */}
        <div style={{ ...cardStyle, borderTop: "4px solid #a855f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <TrendingUp color="#a855f7" /> Weight Progress
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="number"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="Enter weight (kg)"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  width: "140px",
                  fontSize: "0.9rem"
                }}
              />
              <button
                onClick={logWeight}
                style={{
                  ...btnStyle,
                  background: "#a855f7",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <Plus size={16} /> Log
              </button>
            </div>
          </div>
          {weightHistory.length > 0 ? (
            <WeightChart data={weightHistory} />
          ) : (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280", fontStyle: "italic" }}>
              No weight data yet. Start logging your weight above!
            </div>
          )}
        </div>

        {/* Food Lookup - Fixed Colors */}
        <div style={{ ...cardStyle, borderTop: "4px solid #10b981" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <Search color="#10b981" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Food Lookup</h2>
          </div>
          <Select
            options={foodOptions}
            value={selectedFood}
            onChange={setSelectedFood}
            styles={{
              control: (base) => ({ ...base, background: "rgba(255,255,255,0.05)", borderColor: "rgba(16, 185, 129, 0.2)", color: "white" }),
              menu: (base) => ({ ...base, background: "#1a1a1a", color: "white" }),
              option: (base, state) => ({
                ...base,
                background: state.isFocused ? "rgba(16, 185, 129, 0.1)" : "#1a1a1a",
                color: "white",
                cursor: "pointer"
              }),
              singleValue: (base) => ({ ...base, color: "white" }),
              input: (base) => ({ ...base, color: "white" })
            }}
            placeholder="Search for a food item..."
            isClearable
          />
          {selectedFood && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginTop: "1.5rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "1rem" }}>
              {[
                { label: "Calories", val: selectedFood["Calories (kcal)"], unit: "kcal", color: "#f97316" },
                { label: "Protein", val: selectedFood["Protein (g)"], unit: "g", color: "#a855f7" },
                { label: "Carbs", val: selectedFood["Carbohydrates (g)"], unit: "g", color: "#3b82f6" },
                { label: "Fats", val: selectedFood["Fats (g)"], unit: "g", color: "#eab308" },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>{stat.label}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: stat.color }}>{stat.val}<span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{stat.unit}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Weight Chart Component
const WeightChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxWeight = Math.max(...data.map(d => d.weight)) + 2;
  const minWeight = Math.min(...data.map(d => d.weight)) - 2;
  const range = maxWeight - minWeight;

  const width = 800;
  const height = 200;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
    return { x, y, ...d };
  });

  // Generate smooth curve path using quadratic Bezier curves
  const generateSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // Calculate control point for smooth curve
      const controlX = (current.x + next.x) / 2;
      const controlY = (current.y + next.y) / 2;

      // Use quadratic Bezier curve
      path += ` Q ${current.x} ${current.y}, ${controlX} ${controlY}`;

      // If this is the last segment, complete it to the end point
      if (i === points.length - 2) {
        path += ` T ${next.x} ${next.y}`;
      }
    }

    return path;
  };

  const pathData = generateSmoothPath(points);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - padding - ratio * (height - 2 * padding);
          const weight = (minWeight + ratio * range).toFixed(1);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x={padding - 5} y={y + 4} fill="#6b7280" fontSize="12" textAnchor="end">{weight}kg</text>
            </g>
          );
        })}

        {/* Smooth curved line */}
        <path d={pathData} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#a855f7" />
            <title>{`${new Date(p.date).toLocaleDateString()}: ${p.weight}kg`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((p, i) => (
          <text key={i} x={p.x} y={height - padding + 20} fill="#6b7280" fontSize="10" textAnchor="middle">
            {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>
    </div>
  );
};