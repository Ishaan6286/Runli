import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const PersonalizationContext = createContext();

export const usePersonalization = () => useContext(PersonalizationContext);

export const PersonalizationProvider = ({ children }) => {
    const [userContext, setUserContext] = useState({
        profile: {
            goal: "Muscle Gain",
            weight: 75,
            activityLevel: "Active",
            bmi: 22,
        },
        habits: {
            sleepHoursLastNight: 7, // default good
            waterIntake: 2000,
        },
        history: {
            missedWorkoutsThisWeek: 0,
            currentStreak: 3,
        },
        loading: true
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const profile = await getProfile();
                if (profile) {
                    setUserContext(prev => ({
                        ...prev,
                        profile: {
                            ...prev.profile,
                            ...profile
                        },
                        loading: false
                    }));
                }
            } catch (err) {
                console.warn("Could not fetch profile, using defaults for personalization.");
                setUserContext(prev => ({ ...prev, loading: false }));
            }
        };
        fetchUserData();
    }, []);

    // ── Engine Utilities ──

    // Auto-adjust a workout based on context
    const adjustWorkout = (workoutName, type) => {
        if (type !== 'strength') return workoutName;
        
        if (userContext.history.missedWorkoutsThisWeek > 1) {
            return `${workoutName} (Re-acclimation / Lighter Sets)`;
        }
        if (userContext.habits.sleepHoursLastNight < 6) {
            return `${workoutName} (Active Recovery Focus)`;
        }
        return workoutName;
    };

    // Greeting logic for Today.jsx
    const getGreetingState = () => {
        if (userContext.history.missedWorkoutsThisWeek > 1) {
            return {
                title: "Welcome Back!",
                subtitle: "Let's ease back into it. Your plan has been modified for re-acclimation today."
            };
        }
        if (userContext.habits.sleepHoursLastNight < 6) {
            return {
                title: "Rough night of sleep?",
                subtitle: "We've swapped heavy lifts for an active recovery focus today."
            };
        }
        return {
            title: "Ready to crush it?",
            subtitle: `Your ${userContext.profile.goal} plan is loaded and ready.`
        };
    };

    // Daily focus label
    const getDailyFocus = () => {
        if (userContext.history.missedWorkoutsThisWeek > 1) {
            return "Ease Back In - Light Session";
        }
        if (userContext.habits.sleepHoursLastNight < 6) {
            return "Recovery & Mobility Focus";
        }
        return "Push Hard - Full Intensity";
    };

    // Macro computation using goal & weight
    const calculateDailyMacros = () => {
        const weight = userContext.profile.weight || 75;
        const goal = userContext.profile.goal || "Muscle Gain";
        const activity = userContext.profile.activityLevel || "Active";
        
        // Base BMR estimate
        let calories = weight * 24; 
        if (activity === "Active" || activity === "Athlete") calories *= 1.5;
        else calories *= 1.2;

        if (goal === "Muscle Gain") calories += 300;
        else if (goal === "Weight Loss" || goal === "Lose Weight") calories -= 400;

        const protein = Math.round(weight * 2.2); // high protein approach
        const fatCalories = calories * 0.25;
        const fats = Math.round(fatCalories / 9);
        const carbCalories = calories - (protein * 4) - fatCalories;
        const carbs = Math.max(0, Math.round(carbCalories / 4));
        
        return {
            calories: Math.round(calories),
            protein,
            carbs,
            fats
        };
    };

    // Control hooks (mocking dynamic environmental changes for demonstration)
    const setSleepHours = (hours) => {
        setUserContext(prev => ({ ...prev, habits: { ...prev.habits, sleepHoursLastNight: hours } }));
    };
    
    const setMissedWorkouts = (count) => {
        setUserContext(prev => ({ ...prev, history: { ...prev.history, missedWorkoutsThisWeek: count } }));
    };

    return (
        <PersonalizationContext.Provider value={{ 
            userContext, 
            adjustWorkout, 
            getGreetingState,
            getDailyFocus, 
            calculateDailyMacros,
            setSleepHours,
            setMissedWorkouts
        }}>
            {children}
        </PersonalizationContext.Provider>
    );
};
