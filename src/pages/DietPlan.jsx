import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getDietPlan, createDietPlan } from "../services/api";
import { MEAL_DATABASE } from "../data/mealDatabase";
import {
    RefreshCw, Save, Wallet, Flame, Target, DollarSign,
    Plus, X, Search, CheckCircle2, Sparkles, UtensilsCrossed
} from "lucide-react";

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

export default function DietPlan() {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    const [customPlan, setCustomPlan] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    const [targetCalories, setTargetCalories] = useState(0);
    const [targetProtein, setTargetProtein] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(10000);
    const [dailyBudget, setDailyBudget] = useState(333);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMealSlot, setCurrentMealSlot] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Vegetarian");

    useEffect(() => {
        const loadData = async () => {
            try {
                const profileRes = await getProfile();
                const userData = profileRes.user || {};
                setUser(userData);
                setSelectedCategory(userData.dietPreference || "Vegetarian");

                const age = Number(userData.age) || 25;
                const weight = Number(userData.weight) || 70;
                const height = Number(userData.height) || 170;
                const gender = userData.gender ? (userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)) : "Male";
                const freqStr = userData.activityLevel || "moderate";
                const freqMap = { 'sedentary': 2, 'light': 3, 'moderate': 4, 'active': 5, 'very_active': 6 };
                const freq = freqMap[freqStr] || 4;
                const target = userData.goal || "maintain";

                const bmr = calcBMR(weight, height, age, gender);
                const calories = caloriesTarget(bmr, freq, target);
                const protein = proteinTarget(weight, target);

                setTargetCalories(calories);
                setTargetProtein(protein);

                try {
                    const planRes = await getDietPlan();
                    if (planRes.dietPlan) {
                        const backendPlan = planRes.dietPlan;
                        const getItems = (name) => backendPlan.meals.find(m => m.name === name)?.items.map(i => ({
                            name: i.food,
                            calories: i.calories,
                            protein: i.protein,
                            carbs: i.carbs,
                            fats: i.fats,
                            price: i.price || 0
                        })) || [];

                        const loadedPlan = {
                            breakfast: getItems("Breakfast"),
                            lunch: getItems("Lunch"),
                            dinner: getItems("Dinner"),
                            snacks: getItems("Snacks")
                        };
                        setGeneratedPlan(loadedPlan);
                        setCustomPlan(loadedPlan);
                    } else {
                        generateAndSavePlan(userData.dietPreference || "Vegetarian", calories, protein, dailyBudget);
                    }
                } catch (err) {
                    generateAndSavePlan(userData.dietPreference || "Vegetarian", calories, protein, dailyBudget);
                }
            } catch (e) {
                console.error("Error loading data", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const generatePlanData = (dietPref, targetCal, targetProt, budget) => {
        const meals = MEAL_DATABASE[dietPref] || MEAL_DATABASE.Vegetarian;
        const sortCheapest = (list) => [...list].sort((a, b) => a.price - b.price);
        const filterByBudget = (mealList) => mealList.filter(m => m.price <= budget);

        const affordableBreakfast = sortCheapest(filterByBudget(meals.breakfast));
        const affordableLunch = sortCheapest(filterByBudget(meals.lunch));
        const affordableDinner = sortCheapest(filterByBudget(meals.dinner));
        const affordableSnacks = sortCheapest(filterByBudget(meals.snacks));

        const breakfastOptions = affordableBreakfast.length > 0 ? affordableBreakfast : meals.breakfast;
        const lunchOptions = affordableLunch.length > 0 ? affordableLunch : meals.lunch;
        const dinnerOptions = affordableDinner.length > 0 ? affordableDinner : meals.dinner;
        const snackOptions = affordableSnacks.length > 0 ? affordableSnacks : meals.snacks;

        const breakfastMeals = [];
        const lunchMeals = [];
        const dinnerMeals = [];
        const snackMeals = [];

        let totalCal = 0;
        let totalProt = 0;
        let totalCost = 0;

        const addMeals = (options, target, list, limit, preferNonVeg = false) => {
            let currentCal = 0;
            const availableOptions = [...options];

            // If Non-Vegetarian and preferNonVeg is true, try to add at least one chicken/fish option first
            if (preferNonVeg && dietPref === "Non-Vegetarian") {
                const nonVegOptions = availableOptions.filter(m =>
                    m.name.toLowerCase().includes('chicken') ||
                    m.name.toLowerCase().includes('fish') ||
                    m.name.toLowerCase().includes('mutton') ||
                    m.name.toLowerCase().includes('prawn')
                );

                if (nonVegOptions.length > 0 && list.length < limit) {
                    const randomNonVeg = nonVegOptions[Math.floor(Math.random() * nonVegOptions.length)];
                    if ((totalCost + randomNonVeg.price) <= budget * 30) {
                        list.push(randomNonVeg);
                        currentCal += randomNonVeg.calories;
                        totalCal += randomNonVeg.calories;
                        totalProt += randomNonVeg.protein;
                        totalCost += randomNonVeg.price;

                        // Remove from available options
                        const idx = availableOptions.findIndex(m => m.name === randomNonVeg.name);
                        if (idx !== -1) availableOptions.splice(idx, 1);
                    }
                }
            }

            // Add remaining meals
            while (currentCal < target && list.length < limit && availableOptions.length > 0) {
                const index = Math.floor(Math.random() * Math.min(5, availableOptions.length));
                const meal = availableOptions[index];
                if (!list.find(m => m.name === meal.name)) {
                    list.push(meal);
                    currentCal += meal.calories;
                    totalCal += meal.calories;
                    totalProt += meal.protein;
                    totalCost += meal.price;
                }
                availableOptions.splice(index, 1);
            }
        };

        addMeals(breakfastOptions, targetCal * 0.25, breakfastMeals, 3, false);
        addMeals(lunchOptions, targetCal * 0.35, lunchMeals, 3, true); // Prefer non-veg for lunch
        addMeals(dinnerOptions, targetCal * 0.30, dinnerMeals, 3, true); // Prefer non-veg for dinner

        const remainingCal = targetCal - totalCal;
        const remainingProt = targetProt - totalProt;
        let snackCal = 0;
        let snackProt = 0;
        const availableSnacks = [...snackOptions];

        while ((snackCal < remainingCal || snackProt < remainingProt) && snackMeals.length < 5 && totalCost < budget && availableSnacks.length > 0) {
            const index = Math.floor(Math.random() * Math.min(5, availableSnacks.length));
            const snack = availableSnacks[index];
            if ((totalCost + snack.price) <= budget) {
                snackMeals.push(snack);
                snackCal += snack.calories;
                snackProt += snack.protein;
                totalCost += snack.price;
            }
            availableSnacks.splice(index, 1);
        }

        return {
            breakfast: breakfastMeals,
            lunch: lunchMeals,
            dinner: dinnerMeals,
            snacks: snackMeals
        };
    };

    const generateAndSavePlan = async (dietPref, calories, protein, budget, saveToBackend = false) => {
        setGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        const newPlan = generatePlanData(dietPref, calories, protein, budget);
        setGeneratedPlan(newPlan);
        if (!isCustomMode) {
            setCustomPlan(newPlan);
        }

        if (saveToBackend) {
            savePlanToBackend(newPlan, calories, protein);
        }
        setGenerating(false);
    };

    const savePlanToBackend = async (plan, calories, protein) => {
        try {
            await createDietPlan({
                planName: isCustomMode ? "My Custom Plan" : "My Generated Plan",
                targetCalories: calories,
                targetProtein: protein,
                targetCarbs: 0,
                targetFats: 0,
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
        generateAndSavePlan(user.dietPreference || "Vegetarian", targetCalories, targetProtein, dailyBudget, false);
    };

    const handleSavePlan = () => {
        const planToSave = isCustomMode ? customPlan : generatedPlan;
        savePlanToBackend(planToSave, targetCalories, targetProtein);
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
        setMonthlyBudget(amount);
        const daily = Math.round(amount / 30);
        setDailyBudget(daily);
        generateAndSavePlan(user.dietPreference || "Vegetarian", targetCalories, targetProtein, daily, false);
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
                        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "999px" }}>
                            <button
                                onClick={() => setIsCustomMode(false)}
                                style={{
                                    padding: "0.75rem 1.5rem",
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
                                    padding: "0.75rem 1.5rem",
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <Wallet color="#eab308" size={32} />
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 0.25rem 0" }}>Monthly Budget</h3>
                                    <p style={{ color: "#a3a3a3", margin: 0 }}>Daily Cap: <span style={{ color: "#eab308", fontWeight: "bold" }}>₹{dailyBudget}</span></p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {[3000, 5000, 10000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => handleBudgetPreset(amt)}
                                        style={{
                                            padding: "0.75rem 1.25rem",
                                            borderRadius: "0.75rem",
                                            border: monthlyBudget === amt ? "2px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                                            background: monthlyBudget === amt ? "rgba(234, 179, 8, 0.1)" : "transparent",
                                            color: monthlyBudget === amt ? "#eab308" : "#a3a3a3",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        ₹{amt / 1000}k
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    value={monthlyBudget}
                                    min={1000}
                                    max={50000}
                                    step={100}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setMonthlyBudget(val);
                                        setDailyBudget(Math.round(val / 30));
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.target.blur(); // Trigger onBlur
                                            generateAndSavePlan(user.dietPreference || "Vegetarian", targetCalories, targetProtein, dailyBudget, false);
                                        }
                                    }}
                                    onBlur={() => {
                                        generateAndSavePlan(user.dietPreference || "Vegetarian", targetCalories, targetProtein, dailyBudget, false);
                                    }}
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem 1rem",
                                        color: "white",
                                        fontWeight: "bold",
                                        width: "120px"
                                    }}
                                    placeholder="Custom"
                                />
                                <button
                                    onClick={() => generateAndSavePlan(user.dietPreference || "Vegetarian", targetCalories, targetProtein, dailyBudget, false)}
                                    disabled={generating}
                                    style={{
                                        padding: "0.75rem 1.25rem",
                                        borderRadius: "0.75rem",
                                        border: "none",
                                        background: generating ? "rgba(16, 185, 129, 0.3)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        fontWeight: "bold",
                                        cursor: generating ? "not-allowed" : "pointer",
                                        transition: "all 0.2s",
                                        opacity: generating ? 0.6 : 1
                                    }}
                                    onMouseOver={(e) => !generating && (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {generating ? "..." : "Generate"}
                                </button>
                            </div>
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
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Lunch"
                        icon="☀️"
                        meals={activePlan.lunch}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('lunch')}
                        onRemove={(idx) => removeMealFromCustomPlan('lunch', idx)}
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Dinner"
                        icon="🌙"
                        meals={activePlan.dinner}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('dinner')}
                        onRemove={(idx) => removeMealFromCustomPlan('dinner', idx)}
                        cardStyle={cardStyle}
                    />
                    <MealSection
                        title="Snacks"
                        icon="🍎"
                        meals={activePlan.snacks}
                        isCustom={isCustomMode}
                        onAdd={() => openMealModal('snacks')}
                        onRemove={(idx) => removeMealFromCustomPlan('snacks', idx)}
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

const MealSection = ({ title, icon, meals, isCustom, onAdd, onRemove, cardStyle }) => (
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
                {meals.map((meal, idx) => (
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
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{meal.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#a3a3a3", display: "flex", gap: "1rem" }}>
                                <span>{meal.calories} kcal</span>
                                <span>{meal.protein}g P</span>
                                <span style={{ color: "#eab308" }}>₹{meal.price}</span>
                            </div>
                        </div>
                        {isCustom && (
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
                        )}
                    </div>
                ))}
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