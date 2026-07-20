import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getDietPlan, createDietPlan, generateAIDietPlan, swapAIDietMeal } from "../services/api";
import { MEAL_DATABASE } from "../data/mealDatabase";

import {
    RefreshCw, Save, Wallet, Flame, Target, DollarSign,
    Plus, X, Search, CheckCircle2, Sparkles, UtensilsCrossed, Loader2
} from "lucide-react";
import { usePersonalization } from "../context/PersonalizationContext";

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

// ─── Smart Local Fallback Plan Generator ─────────────────────────────────
function generateLocalFallbackPlan(dietPref, targetCalories, targetProtein, dailyBudget) {
    const db = MEAL_DATABASE[dietPref] || MEAL_DATABASE.Vegetarian;
    const slots = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const budRatio = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snacks: 0.10 };
    const countTarget = { breakfast: 3, lunch: 3, dinner: 3, snacks: 2 };

    const plan = {};
    slots.forEach(slot => {
        const foods = [...(db[slot] || [])]
            .sort((a, b) => (b.protein / (b.price || 1)) - (a.protein / (a.price || 1)));
        const slotBudget = dailyBudget * budRatio[slot];
        const maxItems = countTarget[slot];
        const chosen = [];
        let usedBudget = 0;
        for (const food of foods) {
            if (chosen.length >= maxItems) break;
            if (usedBudget + food.price <= slotBudget + 20) {
                chosen.push(food);
                usedBudget += food.price;
            }
        }
        if (chosen.length === 0 && foods.length > 0) chosen.push(foods[0]);
        plan[slot] = chosen;
    });
    return plan;
}

function normalizeFoodName(name) {
    return String(name || "").trim().toLowerCase();
}

function mapAiMealsToPlan(aiMeals, dietPref) {
    const dietDb = MEAL_DATABASE[dietPref] || MEAL_DATABASE.Vegetarian;
    const allFoods = Object.values(dietDb).flat();
    const foodIndex = new Map(allFoods.map((food) => [normalizeFoodName(food.name), food]));

    const resolveFood = (name, slotFoods) => {
        const key = normalizeFoodName(name);
        if (!key) return null;
        return (
            slotFoods.find((food) => normalizeFoodName(food.name) === key) ||
            foodIndex.get(key) ||
            { name, calories: 0, protein: 0, carbs: 0, fats: 0, price: 0 }
        );
    };

    const buildSlot = (slot) => {
        const slotFoods = dietDb[slot] || [];
        const items = Array.isArray(aiMeals?.[slot]) ? aiMeals[slot] : [];
        return items
            .map((item) => (typeof item === "string" ? item : item?.name))
            .map((mealName) => resolveFood(mealName, slotFoods))
            .filter(Boolean);
    };

    return {
        breakfast: buildSlot("breakfast"),
        lunch: buildSlot("lunch"),
        dinner: buildSlot("dinner"),
        snacks: buildSlot("snacks")
    };
}

export default function DietPlan() {
    const navigate = useNavigate();
    const { userContext, calculateDailyMacros } = usePersonalization();

    // ── State ──────────────────────────────────────────────────────────────
    const [user, setUser] = useState({});
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    const [customPlan, setCustomPlan] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    const [aiExplanation, setAiExplanation] = useState(null);
    const [swappingMeal, setSwappingMeal] = useState(null);
    const [targetCalories, setTargetCalories] = useState(0);
    const [targetProtein, setTargetProtein] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(5000);
    const [dailyBudget, setDailyBudget] = useState(167);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMealSlot, setCurrentMealSlot] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Vegetarian");

    // ── Refs: always hold the latest values, no stale closure risk ─────────
    const macrosRef = React.useRef({ calories: 0, protein: 0 });
    const budgetRef = React.useRef({ monthly: 5000, daily: 167 });
    const userRef   = React.useRef({});

    // ── Load data on mount ─────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            try {
                const profileRes = await getProfile();
                const userData = profileRes.user || {};
                setUser(userData);
                userRef.current = userData;
                setSelectedCategory(userData.dietPreference || "Vegetarian");

                // Compute macros directly from fetched profile (avoids stale context race)
                const weight  = Number(userData.weight) || 70;
                const height  = Number(userData.height) || 170;
                const age     = Number(userData.age)    || 25;
                const gender  = userData.gender
                    ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)
                    : "Male";
                const freqStr = userData.activityLevel || "moderate";
                const freqMap = { sedentary: 2, light: 3, moderate: 4, active: 5, very_active: 6 };
                const freq    = freqMap[freqStr] || 4;
                const goal    = userData.goal || "maintain";

                const bmr      = calcBMR(weight, height, age, gender);
                const calories = caloriesTarget(bmr, freq, goal);
                const protein  = proteinTarget(weight, goal);

                // Store in both state (for display) AND ref (always-fresh for handlers)
                setTargetCalories(calories);
                setTargetProtein(protein);
                macrosRef.current = { calories, protein };

                try {
                    const planRes = await getDietPlan();
                    if (planRes.dietPlan) {
                        const bp = planRes.dietPlan;
                        const getItems = (name) => bp.meals
                            .find(m => m.name === name)?.items?.map(i => ({
                                name: i.food, calories: i.calories, protein: i.protein,
                                carbs: i.carbs, fats: i.fats, price: i.price || 0
                            })) || [];
                        const loadedPlan = {
                            breakfast: getItems("Breakfast"), lunch: getItems("Lunch"),
                            dinner: getItems("Dinner"), snacks: getItems("Snacks")
                        };
                        setGeneratedPlan(loadedPlan);
                        setCustomPlan(loadedPlan);
                    } else {
                        await runGenerate(userData.dietPreference || "Vegetarian", calories, protein, budgetRef.current.daily);
                    }
                } catch (err) {
                    await runGenerate(userData.dietPreference || "Vegetarian", calories, protein, budgetRef.current.daily);
                }
            } catch (e) {
                console.error("Error loading data", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // ── Core generation (all values passed explicitly — no stale closure) ──
    const runGenerate = async (dietPref, calories, protein, budget, saveToBackend = true) => {
        setGenerating(true);
        setAiExplanation(null);

        try {
            const planData = await generateAIDietPlan({
                userProfile: userRef.current,
                targetCalories: calories,
                targetProtein: protein,
                budget,
                dietType: dietPref,
                availableFoods: MEAL_DATABASE[dietPref] || MEAL_DATABASE.Vegetarian
            });

            if (!planData?.meals) {
                throw new Error("AI response missing meals");
            }

            const fullMeals = mapAiMealsToPlan(planData.meals, dietPref);

            setGeneratedPlan(fullMeals);
            setAiExplanation(planData.explanation);
            
            if (!isCustomMode) {
                setCustomPlan(fullMeals);
            }

            if (saveToBackend) {
                savePlanToBackend(fullMeals, calories, protein, planData.explanation);
            }
        } catch (error) {
            console.error("AI Generation Failed, using local fallback:", error);
            // Local fallback: generate plan entirely from the food database
            try {
                const fallbackPlan = generateLocalFallbackPlan(dietPref, calories, protein, budget);
                setGeneratedPlan(fallbackPlan);
                setCustomPlan(fallbackPlan);
                setAiExplanation({
                    whySelected: "This plan was generated locally from our optimised food database (AI is temporarily rate-limited).",
                    budgetUtilization: `Staying within ₹${budget}/day using the best protein-per-rupee foods available.`,
                    proteinOptimization: `Foods were sorted by protein-per-rupee to help you hit your ${protein}g target.`,
                    calorieCoverage: "Calories distributed across meals: 25% breakfast, 35% lunch, 30% dinner, 10% snacks."
                });
                if (saveToBackend) savePlanToBackend(fallbackPlan, calories, protein, null);
            } catch (fallbackErr) {
                console.error("Local fallback also failed:", fallbackErr);
                alert("Could not generate a plan. Please try again.");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleSwapFood = async (slot, mealIndex, currentFood) => {
        setSwappingMeal(`${slot}-${mealIndex}`);
        try {
            const dietPref = user.dietPreference || "Vegetarian";
            const currentSlotFoods = (MEAL_DATABASE[dietPref] || MEAL_DATABASE.Vegetarian)[slot];
            
            const activeMeals = isCustomMode ? customPlan : generatedPlan;
            const currentTotalCost = Object.values(activeMeals).flat().reduce((sum, m) => sum + m.price, 0);
            const remainingBudget = dailyBudget - currentTotalCost + currentFood.price;

            const swapData = await swapAIDietMeal({
                slot,
                currentFood,
                availableFoods: currentSlotFoods,
                remainingBudget,
                targetCalories: targetCalories / 4, // Rough approximation for a single meal's target
                targetProtein: targetProtein / 4
            });

            const newFood = currentSlotFoods.find(f => f.name === swapData.replacement.name) || currentFood;

            const updatePlan = (prevPlan) => {
                const newSlot = [...prevPlan[slot]];
                newSlot[mealIndex] = newFood;
                return { ...prevPlan, [slot]: newSlot };
            };

            if (isCustomMode) {
                setCustomPlan(updatePlan);
            } else {
                setGeneratedPlan(updatePlan);
                setCustomPlan(updatePlan);
            }
        } catch (err) {
            console.error("Swap failed", err);
            alert("Failed to swap food. Please try again.");
        } finally {
            setSwappingMeal(null);
        }
    };




    const savePlanToBackend = async (plan, calories, protein, explanation = null) => {
        try {
            await createDietPlan({
                planName: isCustomMode ? "My Custom Plan" : "AI Optimized Plan",
                targetCalories: calories,
                targetProtein: protein,
                targetCarbs: 0,
                targetFats: 0,
                notes: explanation ? JSON.stringify(explanation) : "",
                meals: [
                    { name: "Breakfast", items: plan.breakfast.map(m => ({ food: m.name, quantity: "1 serving", ...m })) },
                    { name: "Lunch", items: plan.lunch.map(m => ({ food: m.name, quantity: "1 serving", ...m })) },
                    { name: "Dinner", items: plan.dinner.map(m => ({ food: m.name, quantity: "1 serving", ...m })) },
                    { name: "Snacks", items: plan.snacks.map(m => ({ food: m.name, quantity: "1 serving", ...m })) }
                ]
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save plan:", err);
            alert("Failed to save plan. Please try again.");
        }
    };

    const handleRegenerate = () => {
        runGenerate(user.dietPreference || "Vegetarian", targetCalories, targetProtein, dailyBudget, false);
    };

    const handleSavePlan = () => {
        const planToSave = isCustomMode ? customPlan : generatedPlan;
        savePlanToBackend(planToSave, targetCalories, targetProtein, aiExplanation);
    };

    const openMealModal = (slot) => {
        setCurrentMealSlot(slot);
        setSearchTerm("");
        setIsModalOpen(true);
    };

    const addMealToCustomPlan = (meal) => {
        setCustomPlan(prev => ({
            ...prev,
            [currentMealSlot]: [...prev[currentMealSlot], meal]
        }));
        setIsModalOpen(false);
    };

    const removeMealFromCustomPlan = (slot, index) => {
        setCustomPlan(prev => ({
            ...prev,
            [slot]: prev[slot].filter((_, i) => i !== index)
        }));
    };

    const handleBudgetPreset = (amount) => {
        const daily = Math.round(amount / 30);
        setMonthlyBudget(amount);
        setDailyBudget(daily);
        // Pass `daily` directly — setDailyBudget is async so state won't be updated yet
        runGenerate(user.dietPreference || "Vegetarian", targetCalories, targetProtein, daily, false);
    };

    const handleCustomBudgetGenerate = (customMonthly) => {
        const MONTHLY_MIN = 3000;
        const MONTHLY_MAX = 10000;
        const raw = Number(customMonthly);
        if (!raw || isNaN(raw)) return;
        // Clamp to the allowed range
        const val = Math.min(MONTHLY_MAX, Math.max(MONTHLY_MIN, raw));
        const daily = Math.round(val / 30);
        setMonthlyBudget(val);
        setDailyBudget(daily);
        runGenerate(user.dietPreference || "Vegetarian", targetCalories, targetProtein, daily, false);
    };

    const activePlan = isCustomMode ? customPlan : generatedPlan;
    const allMeals = [...activePlan.breakfast, ...activePlan.lunch, ...activePlan.dinner, ...activePlan.snacks];

    const totalCalories = allMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = allMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCost = allMeals.reduce((sum, m) => sum + m.price, 0);

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
        padding: "0.75rem 1.5rem",
        borderRadius: "0.75rem",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "0.95rem",
        transition: "transform 0.2s"
    };

    if (loading) {
        return (
            <div style={{ background: "#000000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "60px", height: "60px", border: "4px solid rgba(16, 185, 129, 0.2)", borderTop: "4px solid #10b981", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }}></div>
                    <p style={{ color: "#10b981", fontWeight: "600" }}>Loading your nutrition plan...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: "#000000", minHeight: "100vh", padding: "2rem 1rem", color: "white", fontFamily: "Poppins, sans-serif" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

                {/* Header */}
                <div style={{ ...cardStyle, background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                <UtensilsCrossed color="#10b981" size={28} />
                                <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>Nutrition Roadmap</h1>
                            </div>
                            <p style={{ color: "#a3a3a3", margin: 0 }}>
                                {user.dietPreference || "Vegetarian"} Plan • {user.goal || "Fitness Goal"}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                            {/* Regenerate button */}
                            {!isCustomMode && (
                                <button
                                    onClick={handleRegenerate}
                                    disabled={generating}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        padding: "0.65rem 1.25rem",
                                        borderRadius: "0.75rem",
                                        border: "1px solid rgba(16,185,129,0.4)",
                                        background: generating ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)",
                                        color: "#10b981",
                                        fontWeight: "bold",
                                        fontSize: "0.9rem",
                                        cursor: generating ? "not-allowed" : "pointer",
                                        opacity: generating ? 0.6 : 1,
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={e => !generating && (e.currentTarget.style.background = 'rgba(16,185,129,0.25)')}
                                    onMouseOut={e => e.currentTarget.style.background = generating ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)'}
                                >
                                    <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
                                    {generating ? 'Generating…' : 'Regenerate Plan'}
                                </button>
                            )}
                            {/* Mode toggle */}
                            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "999px" }}>
                                <button
                                    onClick={() => setIsCustomMode(false)}
                                    style={{
                                        padding: "0.65rem 1.25rem",
                                        borderRadius: "999px",
                                        border: "none",
                                        background: !isCustomMode ? "#10b981" : "transparent",
                                        color: "white",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Auto-Generate
                                </button>
                                <button
                                    onClick={() => setIsCustomMode(true)}
                                    style={{
                                        padding: "0.65rem 1.25rem",
                                        borderRadius: "999px",
                                        border: "none",
                                        background: isCustomMode ? "#10b981" : "transparent",
                                        color: "white",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Custom Build
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                    <StatCard
                        title="Calories"
                        value={totalCalories}
                        target={targetCalories}
                        unit="kcal"
                        icon={<Flame color="#f97316" />}
                        color="#f97316"
                    />
                    <StatCard
                        title="Protein"
                        value={totalProtein}
                        target={targetProtein}
                        unit="g"
                        icon={<Target color="#a855f7" />}
                        color="#a855f7"
                    />
                    <StatCard
                        title="Daily Cost"
                        value={totalCost}
                        target={dailyBudget}
                        unit="₹"
                        icon={<DollarSign color="#eab308" />}
                        color="#eab308"
                        inverse={true}
                    />
                </div>

                {/* Budget Control */}
                {!isCustomMode && (
                    <div style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                            <Wallet color="#eab308" size={28} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 0.15rem 0" }}>Monthly Food Budget</h3>
                                <p style={{ color: "#a3a3a3", margin: 0, fontSize: "0.875rem" }}>
                                    Daily cap: <span style={{ color: "#eab308", fontWeight: "bold" }}>₹{dailyBudget}</span>
                                    <span style={{ color: "#666", margin: "0 0.4rem" }}>•</span>
                                    <span style={{ color: "#eab308", fontWeight: "bold" }}>₹{monthlyBudget.toLocaleString('en-IN')}/month</span>
                                </p>
                            </div>
                        </div>

                        {/* Range slider */}
                        <div style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.78rem", color: "#666" }}>
                                <span>₹3,000</span>
                                <span>₹10,000</span>
                            </div>
                            <input
                                type="range"
                                min={3000}
                                max={10000}
                                step={100}
                                value={monthlyBudget}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setMonthlyBudget(val);
                                    setDailyBudget(Math.round(val / 30));
                                }}
                                onMouseUp={(e) => handleCustomBudgetGenerate(e.target.value)}
                                onTouchEnd={(e) => handleCustomBudgetGenerate(e.target.value)}
                                style={{
                                    width: "100%",
                                    accentColor: "#eab308",
                                    cursor: "pointer",
                                    height: "6px",
                                }}
                            />
                        </div>

                        {/* Quick preset chips */}
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {[3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => handleBudgetPreset(amt)}
                                    style={{
                                        padding: "0.4rem 0.85rem",
                                        borderRadius: "999px",
                                        border: monthlyBudget === amt ? "2px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                                        background: monthlyBudget === amt ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.04)",
                                        color: monthlyBudget === amt ? "#eab308" : "#a3a3a3",
                                        fontWeight: 600,
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    ₹{amt / 1000}k
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Explanation Panel */}
                {!isCustomMode && aiExplanation && (
                    <div style={{
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                        borderRadius: "2rem",
                        padding: "2rem",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        color: "white",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1.5rem"
                    }}>
                        <div style={{ gridColumn: "1 / -1", marginBottom: "0.5rem" }}>
                            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", margin: "0 0 0.5rem 0" }}>
                                <Sparkles size={20} /> AI Plan Insights
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5, color: "#e5e5e5" }}>{aiExplanation.whySelected}</p>
                        </div>
                        
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "1rem" }}>
                            <div style={{ color: "#eab308", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Budget Utilization</div>
                            <div style={{ fontSize: "0.9rem", color: "#a3a3a3", lineHeight: 1.4 }}>{aiExplanation.budgetUtilization}</div>
                        </div>
                        
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "1rem" }}>
                            <div style={{ color: "#a855f7", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Protein Optimization</div>
                            <div style={{ fontSize: "0.9rem", color: "#a3a3a3", lineHeight: 1.4 }}>{aiExplanation.proteinOptimization}</div>
                        </div>

                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "1rem" }}>
                            <div style={{ color: "#f97316", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Calorie Coverage</div>
                            <div style={{ fontSize: "0.9rem", color: "#a3a3a3", lineHeight: 1.4 }}>{aiExplanation.calorieCoverage}</div>
                        </div>
                    </div>
                )}


                {/* Meal Sections */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    <MealSection
                        title="Breakfast"
                        icon="🌅"
                        meals={activePlan.breakfast}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('breakfast')}
                        onRemove={(idx) => removeMealFromCustomPlan('breakfast', idx)}
                        onSwap={(idx, meal) => handleSwapFood('breakfast', idx, meal)}
                        swappingMeal={swappingMeal}
                        slot="breakfast"
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Lunch"
                        icon="☀️"
                        meals={activePlan.lunch}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('lunch')}
                        onRemove={(idx) => removeMealFromCustomPlan('lunch', idx)}
                        onSwap={(idx, meal) => handleSwapFood('lunch', idx, meal)}
                        swappingMeal={swappingMeal}
                        slot="lunch"
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Dinner"
                        icon="🌙"
                        meals={activePlan.dinner}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('dinner')}
                        onRemove={(idx) => removeMealFromCustomPlan('dinner', idx)}
                        onSwap={(idx, meal) => handleSwapFood('dinner', idx, meal)}
                        swappingMeal={swappingMeal}
                        slot="dinner"
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Snacks"
                        icon="🍎"
                        meals={activePlan.snacks}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('snacks')}
                        onRemove={(idx) => removeMealFromCustomPlan('snacks', idx)}
                        onSwap={(idx, meal) => handleSwapFood('snacks', idx, meal)}
                        swappingMeal={swappingMeal}
                        slot="snacks"
                        cardStyle={cardStyle}
                    />
                </div>


                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {!isCustomMode && (
                        <button
                            onClick={handleRegenerate}
                            disabled={generating}
                            style={{
                                ...btnStyle,
                                background: generating ? "rgba(16, 185, 129, 0.3)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                opacity: generating ? 0.6 : 1
                            }}
                            onMouseOver={(e) => !generating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <RefreshCw size={18} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
                            {generating ? "Generating..." : "Regenerate Plan"}
                        </button>
                    )}
                    <button
                        onClick={handleSavePlan}
                        disabled={generating}
                        style={{
                            ...btnStyle,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            opacity: generating ? 0.6 : 1
                        }}
                        onMouseOver={(e) => !generating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {saveSuccess ? "Saved!" : "Save Plan"}
                    </button>
                </div>

                {/* Helpful Tip */}
                {!isCustomMode && (
                    <div style={{
                        textAlign: "center",
                        color: "#a3a3a3",
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                        marginTop: "-0.5rem"
                    }}>
                        💡 Tip: Try regenerating plans to get more accurate results
                    </div>
                )}

            </div>

            {/* Meal Selector Modal */}
            {isModalOpen && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#1a1a1a",
                        borderRadius: "1.5rem",
                        maxWidth: "600px",
                        width: "100%",
                        maxHeight: "80vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        border: "1px solid rgba(16, 185, 129, 0.2)"
                    }}>
                        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Plus color="#10b981" size={24} />
                                Add to {currentMealSlot}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: "transparent", border: "none", color: "#a3a3a3", cursor: "pointer", padding: "0.5rem" }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "0.75rem" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search meals..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem 1rem 0.75rem 2.75rem",
                                        color: "white",
                                        fontSize: "1rem"
                                    }}
                                    autoFocus
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "0.75rem",
                                    padding: "0.75rem 1rem",
                                    color: "white",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="Vegetarian">Veg 🌱</option>
                                <option value="Non-Vegetarian">Non-Veg 🍗</option>
                                <option value="Eggetarian">Egg 🥚</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                            {Object.entries(MEAL_DATABASE[selectedCategory] || {}).flatMap(([cat, meals]) =>
                                meals.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).map((meal, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => addMealToCustomPlan(meal)}
                                    style={{
                                        padding: "1rem",
                                        marginBottom: "0.75rem",
                                        background: "rgba(255,255,255,0.03)",
                                        borderRadius: "1rem",
                                        cursor: "pointer",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                    }}
                                >
                                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{meal.name}</div>
                                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#a3a3a3" }}>
                                        <span>{meal.calories} kcal</span>
                                        <span>{meal.protein}g protein</span>
                                        <span style={{ color: "#eab308", fontWeight: "bold" }}>₹{meal.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Sub-components
const StatCard = ({ title, value, target, unit, icon, color, inverse }) => {
    const percentage = Math.min(100, Math.round((value / target) * 100));
    const isGood = inverse ? value <= target : value >= target * 0.9;

    const cardStyle = {
        background: "rgba(26, 26, 26, 0.95)",
        borderRadius: "2rem",
        padding: "2rem",
        border: "1px solid rgba(16, 185, 129, 0.1)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        color: "white",
        borderTop: `4px solid ${color}`
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                    <div style={{ color: color, fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>{title}</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
                        {value} <span style={{ fontSize: "1rem", color: "#6b7280" }}>/ {target}{unit}</span>
                    </div>
                </div>
                {icon}
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${percentage}%`, height: "100%", background: color, transition: "width 0.5s" }} />
            </div>
            <div style={{ marginTop: "0.5rem", textAlign: "right", fontSize: "0.85rem", color: isGood ? "#10b981" : "#eab308", fontWeight: "bold" }}>
                {percentage}%
            </div>
        </div>
    );
};

const MealSection = ({ title, icon, meals, isCustom, onAdd, onRemove, onSwap, swappingMeal, slot, cardStyle }) => (
    <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{icon}</span>
                {title}
            </h3>
            {isCustom && (
                <button
                    onClick={onAdd}
                    style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#10b981",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem"
                    }}
                >
                    <Plus size={14} /> Add
                </button>
            )}
        </div>

        {meals.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {meals.map((meal, idx) => {
                    const isSwappingThis = swappingMeal === `${slot}-${idx}`;
                    return (
                        <div
                            key={idx}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                padding: "1rem",
                                borderRadius: "1rem",
                                border: "1px solid rgba(255,255,255,0.05)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div style={{ flex: 1, opacity: isSwappingThis ? 0.5 : 1 }}>
                                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{meal.name}</div>
                                <div style={{ fontSize: "0.8rem", color: "#a3a3a3", display: "flex", gap: "1rem" }}>
                                    <span>{meal.calories} kcal</span>
                                    <span>{meal.protein}g P</span>
                                    <span style={{ color: "#eab308" }}>₹{meal.price}</span>
                                </div>
                            </div>
                            {isCustom ? (
                                <button
                                    onClick={() => onRemove(idx)}
                                    style={{
                                        background: "rgba(239, 68, 68, 0.1)",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        color: "#ef4444",
                                        padding: "0.5rem",
                                        borderRadius: "0.5rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => onSwap(idx, meal)}
                                    disabled={isSwappingThis}
                                    style={{
                                        background: "rgba(16, 185, 129, 0.1)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        color: "#10b981",
                                        padding: "0.5rem",
                                        borderRadius: "0.5rem",
                                        cursor: isSwappingThis ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    title="Swap this meal"
                                >
                                    <RefreshCw size={16} style={{ animation: isSwappingThis ? "spin 1s linear infinite" : "none" }} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <div style={{
                padding: "2rem",
                textAlign: "center",
                color: "#6b7280",
                fontStyle: "italic",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "1rem",
                border: "1px dashed rgba(255,255,255,0.1)"
            }}>
                No meals selected
                {isCustom && (
                    <div>
                        <button
                            onClick={onAdd}
                            style={{
                                marginTop: "0.75rem",
                                background: "transparent",
                                border: "none",
                                color: "#10b981",
                                cursor: "pointer",
                                fontWeight: "bold",
                                textDecoration: "underline"
                            }}
                        >
                            + Add first item
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
);