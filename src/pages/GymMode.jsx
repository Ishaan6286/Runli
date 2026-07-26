import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Play, Pause, RotateCcw, CheckCircle, Circle,
    Volume2, VolumeX, X, Clock, Dumbbell, Video, PlayCircle,
    TrendingUp, AlertCircle, Calendar, Calculator, Disc, ScanLine, MessageSquare, ChevronDown
} from 'lucide-react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import PoseCamera from '../components/PoseCamera.jsx';
import { motivationalQuotes } from '../data/quotes';
import usePlan from '../hooks/usePlan.js';
import { LockBadge } from '../components/ProGate.jsx';
import { usePersonalization } from '../context/PersonalizationContext';
import { getVideoByExerciseName } from '../data/videoCatalog';
import VideoPlayerOverlay from '../components/video/VideoPlayerOverlay';

const getVideoKeyForExercise = (exerciseName) => getVideoByExerciseName(exerciseName)?.title || null;

// Workout Split Data (Synced exactly with Today.jsx)
const SPLITS = [
    { focus: 'Chest + Triceps', emoji: '💪', exercises: ['Bench Press 4×8-12', 'Incline DB Press 4×10', 'Cable Flyes 3×15', 'Tricep Pushdowns 3×12'] },
    { focus: 'Back + Biceps', emoji: '🦾', exercises: ['Pull-Ups 4×8-10', 'Seated Cable Row 4×10', 'Barbell Curl 3×12', 'Face Pulls 3×15'] },
    { focus: 'Legs + Core', emoji: '🦵', exercises: ['Barbell Squat 4×8-12', 'Leg Press 3×12', 'Hamstring Curl 3×12', 'Hanging Leg Raises 3×15'] },
    { focus: 'Shoulders + Abs', emoji: '⚡', exercises: ['OHP 4×10', 'Lateral Raises 3×15', 'Rear Delt Fly 3×15', 'Plank 90s ×3'] },
    { focus: 'Full Body HIIT', emoji: '🔥', exercises: ['Deadlift 4×6', 'Push-Ups 3×20', 'Walking Lunges 3×20', 'Mountain Climbers 40s×3'] },
    { focus: 'Active Recovery', emoji: '🧘', exercises: ['Yoga Flow 30min', 'Foam Rolling 10min', 'Walking 40min', 'Light Core 3×12'] },
    { focus: 'Upper Circuit', emoji: '💥', exercises: ['Chin-Ups 3×8', 'Push-Ups 3×20', 'Front Raise 3×12', 'Tricep Extensions 3×15'] },
];

const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getSplitByFrequency(freq = 4) {
    let split = [];
    for (let i = 0; i < freq; i++) {
        let sidx = i % (SPLITS.length - 1);
        if (freq >= 5 && i === freq - 1) sidx = SPLITS.length - 1;
        split.push({
            day: DAYNAMES[i % DAYNAMES.length],
            focus: SPLITS[sidx].focus,
            exercises: SPLITS[sidx].exercises
        });
    }
    return split;
}



// Audio Context for Beeps
const playBeep = (freq = 440, duration = 0.1, type = 'sine') => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
};

export default function GymMode() {
    const navigate = useNavigate();
    const { isPro, isElite, triggerUpgrade } = usePlan();
    const { adjustWorkout } = usePersonalization();

    // Stopwatch State
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Rest Timer State
    const [restTime, setRestTime] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Video State
    const [exploreVideo, setExploreVideo] = useState(null);

    // Daily Quote
    const [quote, setQuote] = useState("");

    // Plate Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [targetWeight, setTargetWeight] = useState('');
    const [calculatedPlates, setCalculatedPlates] = useState([]);

    // Workout State - Now Dynamic
    const [workouts, setWorkouts] = useState([]);
    const [todaysFocus, setTodaysFocus] = useState("Chest + Triceps");

    // Tracker State
    const [trackerData, setTrackerData] = useState({}); // { exerciseId: { weight: 0, rpe: 0, notes: '' } }
    const [history, setHistory] = useState({}); // Loaded from localStorage

    // Pose Camera State
    const [activePose, setActivePose] = useState(null); // { workoutId, exerciseName }

    // Plank Timer State
    const [showPlankTimer, setShowPlankTimer] = useState(false);
    const [plankDuration, setPlankDuration] = useState(60); // Default 60 seconds
    const [plankTimeLeft, setPlankTimeLeft] = useState(60);
    const [isPlankRunning, setIsPlankRunning] = useState(false);

    useEffect(() => {
        // Set Daily Quote
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);

        // Load History
        const savedHistory = localStorage.getItem('gymModeHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }

        // Load User Profile and Generate Today's Workout
        try {
            const userInfo = JSON.parse(localStorage.getItem("runliUserInfo")) || {};
            const frequency = Number(userInfo.frequency) || 4;

            // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
            const today = new Date().getDay();
            // Convert to Monday = 0, Tuesday = 1, etc.
            const dayIndex = today === 0 ? 6 : today - 1;

            // Get today's workout
            let todaysWorkout = null;
            if (userInfo.workoutPlan && userInfo.workoutPlan.length > 0) {
                todaysWorkout = userInfo.workoutPlan[dayIndex % userInfo.workoutPlan.length];
            } else {
                const workoutSplit = getSplitByFrequency(frequency);
                todaysWorkout = workoutSplit[dayIndex % workoutSplit.length];
            }

            setTodaysFocus(adjustWorkout(todaysWorkout.focus, 'strength'));
            
            if (todaysWorkout.isRestDay || !todaysWorkout.exercises || todaysWorkout.exercises.length === 0) {
                setWorkouts([]); // empty array triggers Rest Day UI
                return;
            }
            setTodaysFocus(adjustWorkout(todaysWorkout.focus, 'strength'));

            // Convert exercises to workout format
            const generatedWorkouts = [
                { id: 1, name: "Warm-up: 5 min Cardio", completed: false, videoKey: null, type: "cardio" }
            ];

            todaysWorkout.exercises.forEach((exercise, index) => {
                if (typeof exercise === 'string') {
                    // Parse legacy string format
                    const match = exercise.match(/^(.+?)\s+(\d+)[x×](\d+)(?:-(\d+))?/);
                    if (match) {
                        const [, name, sets, repsMin, repsMax] = match;
                        const adjustedName = adjustWorkout(name.trim(), 'strength');
                        generatedWorkouts.push({
                            id: index + 2,
                            name: adjustedName,
                            sets: parseInt(sets),
                            reps: repsMax ? parseInt(repsMax) : parseInt(repsMin),
                            completed: false,
                            videoKey: getVideoKeyForExercise(adjustedName),
                            type: "strength"
                        });
                    } else {
                        generatedWorkouts.push({
                            id: index + 2,
                            name: exercise,
                            completed: false,
                            videoKey: getVideoKeyForExercise(exercise),
                            type: "cardio"
                        });
                    }
                } else {
                    // New Custom Object Format
                    const adjustedName = adjustWorkout(exercise.name.trim(), 'strength');
                    generatedWorkouts.push({
                        id: exercise.id || (index + 2),
                        name: adjustedName,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        notes: exercise.notes,
                        completed: false,
                        videoKey: exercise.videoKey || getVideoKeyForExercise(exercise.name.trim()),
                        type: "strength"
                    });
                }
            });

            generatedWorkouts.push({
                id: generatedWorkouts.length + 1,
                name: "Cool-down: Stretching",
                completed: false,
                videoKey: null,
                type: "cardio"
            });

            setWorkouts(generatedWorkouts);
        } catch (error) {
            console.error("Error loading workout plan:", error);
            // Fallback to default workout
            setWorkouts([
                { id: 1, name: "Warm-up: 5 min Cardio", completed: false, videoKey: null, type: "cardio" },
                { id: 2, name: "Bench Press", sets: 3, reps: 10, completed: false, videoKey: "Bench Press (Flat)", type: "strength" },
                { id: 3, name: "Incline Dumbbell Press", sets: 3, reps: 12, completed: false, videoKey: "Dumbbell Press (Incline)", type: "strength" },
                { id: 4, name: "Cable Flyes", sets: 3, reps: 15, completed: false, videoKey: "Cable Crossover", type: "strength" },
                { id: 5, name: "Tricep Pushdowns", sets: 3, reps: 12, completed: false, videoKey: "Triceps Pushdown", type: "strength" },
                { id: 6, name: "Overhead Extensions", sets: 3, reps: 12, completed: false, videoKey: "Overhead Triceps Extension", type: "strength" },
                { id: 7, name: "Cool-down: Stretching", completed: false, videoKey: null, type: "cardio" }
            ]);
        }

        // Save today's date for daily workout update check
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastWorkoutDate', today);
    }, []);

    // Daily Workout Update - Check if day has changed and update workout
    useEffect(() => {
        const checkWorkoutUpdate = () => {
            const lastWorkoutDate = localStorage.getItem('lastWorkoutDate');
            const today = new Date().toISOString().split('T')[0];

            if (lastWorkoutDate && lastWorkoutDate !== today) {
                // Day has changed - regenerate workout for new day
                try {
                    const userInfo = JSON.parse(localStorage.getItem("runliUserInfo")) || {};
                    const frequency = Number(userInfo.frequency) || 4;

                    const todayDate = new Date().getDay();
                    const dayIndex = todayDate === 0 ? 6 : todayDate - 1;

                    let todaysWorkout = null;
                    if (userInfo.workoutPlan && userInfo.workoutPlan.length > 0) {
                        todaysWorkout = userInfo.workoutPlan[dayIndex % userInfo.workoutPlan.length];
                    } else {
                        const workoutSplit = getSplitByFrequency(frequency);
                        todaysWorkout = workoutSplit[dayIndex % workoutSplit.length];
                    }
                    
                    setTodaysFocus(adjustWorkout(todaysWorkout.focus, 'strength'));

                    if (todaysWorkout.isRestDay || !todaysWorkout.exercises || todaysWorkout.exercises.length === 0) {
                        setWorkouts([]);
                        localStorage.setItem('lastWorkoutDate', today);
                        return;
                    }

                    // Regenerate workouts
                    const generatedWorkouts = [
                        { id: 1, name: "Warm-up: 5 min Cardio", completed: false, videoKey: null, type: "cardio" }
                    ];

                    todaysWorkout.exercises.forEach((exercise, index) => {
                        if (typeof exercise === 'string') {
                            const match = exercise.match(/^(.+?)\s+(\d+)[x×](\d+)(?:-(\d+))?/);
                            if (match) {
                                const [, name, sets, repsMin, repsMax] = match;
                                const adjustedName = adjustWorkout(name.trim(), 'strength');
                                generatedWorkouts.push({
                                    id: index + 2,
                                    name: adjustedName,
                                    sets: parseInt(sets),
                                    reps: repsMax ? parseInt(repsMax) : parseInt(repsMin),
                                    completed: false,
                                    videoKey: getVideoKeyForExercise(name.trim()),
                                    type: "strength"
                                });
                            } else {
                                generatedWorkouts.push({
                                    id: index + 2,
                                    name: exercise,
                                    completed: false,
                                    videoKey: getVideoKeyForExercise(exercise),
                                    type: "cardio"
                                });
                            }
                        } else {
                            const adjustedName = adjustWorkout(exercise.name.trim(), 'strength');
                            generatedWorkouts.push({
                                id: exercise.id || (index + 2),
                                name: adjustedName,
                                sets: exercise.sets,
                                reps: exercise.reps,
                                notes: exercise.notes,
                                completed: false,
                                videoKey: exercise.videoKey || getVideoKeyForExercise(exercise.name.trim()),
                                type: "strength"
                            });
                        }
                    });

                    generatedWorkouts.push({
                        id: generatedWorkouts.length + 1,
                        name: "Cool-down: Stretching",
                        completed: false,
                        videoKey: null,
                        type: "cardio"
                    });

                    setWorkouts(generatedWorkouts);
                    localStorage.setItem('lastWorkoutDate', today);
                } catch (error) {
                    console.error("Error updating workout:", error);
                }
            }
        };

        checkWorkoutUpdate();

        // Check every minute for day change
        const interval = setInterval(checkWorkoutUpdate, 60000);
        return () => clearInterval(interval);
    }, []);

    // Stopwatch Logic with Native Background Support
    useEffect(() => {
        let interval;
        let bgTime = 0;
        let listenerPromise = null;

        const setupBackgroundTimers = async () => {
            if (isRunning && window.Capacitor && window.Capacitor.isNativePlatform()) {
                await KeepAwake.keepAwake();

                listenerPromise = window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) {
                        bgTime = Date.now();
                    } else if (bgTime > 0) {
                        const elapsedSeconds = Math.floor((Date.now() - bgTime) / 1000);
                        setTime(t => t + elapsedSeconds);
                        bgTime = 0;
                    }
                });
            }
        };

        if (isRunning) {
            interval = setInterval(() => setTime(t => t + 1), 1000);
            setupBackgroundTimers();
        }

        return () => {
            clearInterval(interval);
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                KeepAwake.allowSleep().catch(() => { });
            }
            if (listenerPromise) {
                listenerPromise.then(l => l.remove()).catch(() => { });
            }
        };
    }, [isRunning]);

    // Rest Timer Logic with Audio Cues
    useEffect(() => {
        let interval;
        if (isResting && restTime > 0) {
            interval = setInterval(() => {
                setRestTime(prev => {
                    if (prev <= 4 && prev > 1) playBeep(600, 0.1); // Beep at 3, 2, 1
                    if (prev === 1) playBeep(800, 0.4); // Long beep at 0 (GO)
                    return prev - 1;
                });
            }, 1000);
        } else if (restTime === 0) {
            setIsResting(false);
        }
        return () => clearInterval(interval);
    }, [isResting, restTime]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleWorkout = (id) => {
        setWorkouts(workouts.map(w =>
            w.id === id ? { ...w, completed: !w.completed } : w
        ));
    };

    const startRest = (seconds) => {
        setRestTime(seconds);
        setIsResting(true);
    };

    // Plank Timer Logic
    useEffect(() => {
        let interval;
        if (isPlankRunning && plankTimeLeft > 0) {
            interval = setInterval(() => {
                setPlankTimeLeft(prev => {
                    if (prev <= 4 && prev > 1) playBeep(600, 0.1);
                    if (prev === 1) playBeep(800, 0.4);
                    return prev - 1;
                });
            }, 1000);
        } else if (plankTimeLeft === 0) {
            setIsPlankRunning(false);
            playBeep(1000, 1); // Victory beep
        }
        return () => clearInterval(interval);
    }, [isPlankRunning, plankTimeLeft]);

    const startPlankTimer = () => {
        setPlankTimeLeft(plankDuration);
        setIsPlankRunning(true);
    };

    const resetPlankTimer = () => {
        setIsPlankRunning(false);
        setPlankTimeLeft(plankDuration);
    };

    const closePlankTimer = () => {
        setShowPlankTimer(false);
        setIsPlankRunning(false);
        setPlankTimeLeft(plankDuration);
    };

    const playVideo = (e, video) => {
        e.stopPropagation();
        setExploreVideo(video);
    };

    const handleTrackerChange = (id, field, value) => {
        setTrackerData(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const saveSet = (e, workout) => {
        e.stopPropagation();
        const data = trackerData[workout.id];
        if (!data || !data.weight || !data.rpe) return;

        const newEntry = {
            date: new Date().toISOString(),
            weight: parseFloat(data.weight),
            rpe: parseInt(data.rpe),
            reps: workout.reps, // Assuming target reps for now
            sets: workout.sets
        };

        const updatedHistory = {
            ...history,
            [workout.name]: [...(history[workout.name] || []), newEntry]
        };

        setHistory(updatedHistory);
        localStorage.setItem('gymModeHistory', JSON.stringify(updatedHistory));

        // Auto-complete workout
        toggleWorkout(workout.id);

        // Reset inputs slightly to show saved state (optional, keeping simple for now)
        alert(`Saved! Great job on ${workout.name}.`);
    };

    const getRecommendation = (workoutName) => {
        const exerciseHistory = history[workoutName];
        if (!exerciseHistory || exerciseHistory.length === 0) return null;

        const lastSession = exerciseHistory[exerciseHistory.length - 1];
        const { weight, rpe } = lastSession;

        if (rpe <= 6) return { text: `Increase weight (+2.5kg)`, color: '#10b981' }; // Green
        if (rpe >= 9) return { text: `Decrease weight or same`, color: '#ef4444' }; // Red
        return { text: `Keep weight same`, color: '#fbbf24' }; // Yellow
    };

    // 1RM Calculation
    const calculate1RM = (weight, reps) => {
        if (!weight || !reps) return 0;
        // Epley Formula
        return Math.round(weight * (1 + reps / 30));
    };

    // Plate Calculator Logic
    const calculatePlates = () => {
        const target = parseFloat(targetWeight);
        if (!target || target < 20) {
            setCalculatedPlates([]);
            return;
        }

        const barWeight = 20;
        let remainingWeight = (target - barWeight) / 2;
        const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
        const result = [];

        for (let plate of plates) {
            while (remainingWeight >= plate) {
                result.push(plate);
                remainingWeight -= plate;
            }
        }
        setCalculatedPlates(result);
    };

    return (
        <div className="page-wrapper" style={{ padding: 'clamp(1rem, 3vw, 2rem)', paddingTop: 'clamp(1.25rem, 4vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Dumbbell size={32} color="var(--primary-500)" />
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                            fontWeight: 800,
                            color: 'var(--primary-400)',
                            margin: 0,
                            letterSpacing: '-0.02em'
                        }}>GYM MODE</h1>
                        <div style={{
                            fontSize: '0.9375rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem',
                            fontWeight: 600
                        }}>
                            Today: <span style={{ color: 'var(--primary-400)' }}>{todaysFocus}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn-icon"
                        onClick={() => setShowCalculator(!showCalculator)}
                        style={{
                            width: 48, height: 48,
                            background: showCalculator ? 'var(--primary-500)' : 'var(--bg-raised)',
                            color: showCalculator ? 'var(--text-inverse)' : 'var(--text-primary)',
                            border: `2px solid ${showCalculator ? 'var(--primary-500)' : 'var(--border-strong)'}`
                        }}
                        title="Plate Calculator"
                    >
                        <Calculator size={24} strokeWidth={2.5} />
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { if (!isElite) { triggerUpgrade('pose_detection'); return; } setActivePose({ workoutId: 'auto', exerciseName: 'Auto-Detect' }); }}
                        style={{ padding: '0 1.25rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isElite ? 1 : 0.6 }}
                    >
                        <ScanLine size={16} /> Auto-Detect
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowPlankTimer(true)}
                        style={{ padding: '0 1.25rem', fontSize: '0.9375rem' }}
                    >
                        Plank Timer
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => navigate('/')}
                        style={{ width: 48, height: 48, background: 'var(--red-500)', color: 'white', border: 'none' }}
                        title="Exit Gym Mode"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Plate Calculator Modal/Section */}
            {showCalculator && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', borderColor: 'var(--primary-500)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Disc size={20} /> Plate Calculator
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <input
                            type="number"
                            placeholder="Target (kg)"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="input"
                            style={{ flex: 1, maxWidth: 200 }}
                        />
                        <button className="btn btn-primary" onClick={calculatePlates}>
                            Calculate
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Per Side:</span>
                        {calculatedPlates.length > 0 ? calculatedPlates.map((plate, idx) => (
                            <div key={idx} style={{
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                background: 'var(--bg-surface)',
                                border: '2px solid var(--primary-500)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)'
                            }}>
                                {plate}
                            </div>
                        )) : <span style={{ color: 'var(--text-muted)' }}>Enter weight (min 20kg bar)</span>}
                    </div>
                </div>
            )}

            {/* Daily Motivation */}
            <div style={{
                background: 'var(--bg-raised)',
                borderLeft: '4px solid var(--primary-500)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <Calendar size={24} color="var(--primary-400)" />
                <div>
                    <span style={{ color: 'var(--primary-400)', fontWeight: 700, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Daily Motivation</span>
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9375rem' }}>"{quote}"</span>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                gap: '2rem',
                flex: 1
            }}>
                {/* Left Column: Workout & Timers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Timers Section */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                        gap: '1rem'
                    }}>
                        {/* Workout Timer */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-400)' }}>
                                <Clock size={24} strokeWidth={2.5} />
                                <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.05em' }}>WORKOUT TIME</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-400)' }}>
                                {formatTime(time)}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsRunning(!isRunning)}
                                    className="btn btn-primary"
                                    style={{ background: isRunning ? 'var(--red-500)' : 'var(--primary-500)', borderColor: 'transparent' }}
                                >
                                    {isRunning ? 'PAUSE' : 'START'}
                                </button>
                                <button
                                    onClick={() => { setIsRunning(false); setTime(0); }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 0.875rem' }}
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Rest Timer */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--amber-400)' }}>
                                <Clock size={24} strokeWidth={2.5} />
                                <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.05em' }}>REST TIMER</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: isResting ? 'var(--amber-400)' : 'var(--text-muted)' }}>
                                {formatTime(restTime)}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[30, 60, 90, 120].map(seconds => (
                                    <button
                                        key={seconds}
                                        onClick={() => startRest(seconds)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                                    >
                                        {seconds}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Workout Checklist & Smart Tracker */}
                    <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CheckCircle size={22} color="var(--primary-400)" />
                            TODAY'S WORKOUT
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {workouts.length === 0 ? (
                                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏖️</span>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>Rest Day</h3>
                                    <p>Take time to recover, stretch, and stay hydrated.</p>
                                </div>
                            ) : workouts.map(workout => {
                                const formVideo = getVideoByExerciseName(workout.videoKey || workout.name);
                                const recommendation = getRecommendation(workout.name);
                                const currentData = trackerData[workout.id] || {};

                                return (
                                    <div
                                        key={workout.id}
                                        style={{
                                            padding: '1rem',
                                            background: workout.completed ? 'var(--primary-dim)' : 'var(--bg-raised)',
                                            borderRadius: 'var(--r-lg)',
                                            border: `1px solid ${workout.completed ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div onClick={() => toggleWorkout(workout.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {workout.completed ?
                                                    <CheckCircle size={24} color="var(--primary-500)" /> :
                                                    <Circle size={24} color="var(--text-muted)" />
                                                }
                                                <div>
                                                    <span style={{
                                                        fontSize: '1.0625rem',
                                                        color: workout.completed ? 'var(--primary-400)' : 'var(--text-primary)',
                                                        textDecoration: workout.completed ? 'line-through' : 'none',
                                                        fontWeight: 500,
                                                        display: 'block'
                                                    }}>
                                                        {workout.name}
                                                    </span>
                                                    {workout.type === 'strength' && (
                                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block' }}>
                                                            {workout.sets} sets x {workout.reps} reps
                                                        </span>
                                                    )}
                                                    {workout.notes && (
                                                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--amber-400)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <MessageSquare size={12} /> {workout.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {workout.type === 'strength' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (!isElite) { triggerUpgrade('pose_detection'); return; } setActivePose({ workoutId: workout.id, exerciseName: workout.name }); }}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem', color: isElite ? 'var(--primary-400)' : 'var(--text-muted)', borderColor: isElite ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)' }}
                                                        title={isElite ? 'Analyze Form (AI)' : 'Elite feature'}
                                                    >
                                                        <ScanLine size={14} /> Analyze
                                                    </button>
                                                )}
                                                {formVideo && (
                                                    <button className="btn-icon" onClick={(e) => playVideo(e, formVideo)} style={{ width: 36, height: 36, color: 'var(--primary-500)' }} title="Watch Form Video">
                                                        <PlayCircle size={22} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Smart Tracker Inputs (Only for Strength) */}
                                        {workout.type === 'strength' && !workout.completed && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid var(--border-subtle)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem'
                                            }}>
                                                {recommendation && (
                                                    <div style={{ fontSize: '0.875rem', color: recommendation.color, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-overlay)', padding: '0.5rem', borderRadius: 'var(--r-md)' }}>
                                                        <TrendingUp size={16} />
                                                        Suggestion: {recommendation.text}
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Weight (kg)</label>
                                                        <input type="number" placeholder="0" value={trackerData[workout.id]?.weight || ''} onChange={(e) => handleTrackerChange(workout.id, 'weight', e.target.value)} onClick={(e) => e.stopPropagation()} className="input" style={{ width: '100%', padding: '0.4rem 0.6rem' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>RPE (1-10)</label>
                                                        <input type="number" placeholder="-" max="10" value={trackerData[workout.id]?.rpe || ''} onChange={(e) => handleTrackerChange(workout.id, 'rpe', e.target.value)} onClick={(e) => e.stopPropagation()} className="input" style={{ width: '100%', padding: '0.4rem 0.6rem' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                        <button className="btn btn-primary" onClick={(e) => saveSet(e, workout)} style={{ width: '100%', padding: '0.5rem' }}>Log Set</button>
                                                    </div>
                                                </div>

                                                {/* 1RM Estimate */}
                                                {currentData.weight > 0 && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '-0.25rem' }}>
                                                        Est. 1RM: <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>{calculate1RM(currentData.weight, workout.reps)}kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Media */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Video size={22} color="var(--primary-400)" />
                            FORM GUIDE
                        </h2>
                        <div style={{ flex: 1, background: '#000', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Select an exercise to view form guide.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plank Timer Modal */}
            {showPlankTimer && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <button className="btn-icon" onClick={closePlankTimer} style={{ position: 'absolute', top: '2rem', right: '2rem', width: 64, height: 64, background: 'var(--red-500)', color: 'white', border: 'none', zIndex: 101, boxShadow: 'var(--shadow-lg)' }}>
                        <X size={32} strokeWidth={3} />
                    </button>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, color: 'var(--primary-400)', marginBottom: '2rem', textAlign: 'center' }}>PLANK TIMER</h1>

                    {!isPlankRunning && (
                        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Set Duration</label>
                            <input type="range" min="30" max="300" step="10" value={plankDuration} onChange={(e) => { const val = Number(e.target.value); setPlankDuration(val); setPlankTimeLeft(val); }} style={{ width: '300px', height: '8px', background: 'var(--bg-raised)', borderRadius: '4px', outline: 'none', cursor: 'pointer', accentColor: 'var(--primary-500)' }} />
                            <div style={{ color: 'var(--primary-400)', fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>{formatTime(plankDuration)}</div>
                        </div>
                    )}

                    <div style={{ fontSize: 'clamp(5rem, 20vw, 12rem)', fontWeight: 900, fontFamily: 'monospace', color: plankTimeLeft <= 10 ? 'var(--red-500)' : 'var(--primary-400)', textShadow: '0 0 40px rgba(16, 185, 129, 0.4)', marginBottom: '3rem', lineHeight: 1 }}>
                        {formatTime(plankTimeLeft)}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={isPlankRunning ? () => setIsPlankRunning(false) : startPlankTimer} style={{ padding: '1rem 3rem', fontSize: '1.5rem', background: isPlankRunning ? 'var(--red-500)' : 'var(--primary-500)', borderColor: 'transparent' }}>
                            {isPlankRunning ? <><Pause size={28} /> PAUSE</> : <><Play size={28} /> START</>}
                        </button>
                        <button className="btn btn-secondary" onClick={resetPlankTimer} style={{ padding: '1rem 3rem', fontSize: '1.5rem' }}>
                            <RotateCcw size={28} /> RESET
                        </button>
                    </div>
                    {isPlankRunning && (
                        <div style={{ marginTop: '3rem', fontSize: '1.5rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                            Stay strong! You've got this! 💪
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {activePose && isElite && (
                    <PoseCamera
                        key={activePose.workoutId}
                        exerciseName={activePose.exerciseName}
                        onClose={({ reps, overallScore }) => {
                            if (reps > 0 || overallScore > 0) {
                                setTrackerData(prev => ({ ...prev, [activePose.workoutId]: { ...prev[activePose.workoutId], reps, formScore: overallScore } }));
                            }
                            setActivePose(null);
                        }}
                    />
                )}
            </AnimatePresence>
            
            {/* New Explore Video Overlay */}
            {exploreVideo && (
                <VideoPlayerOverlay video={exploreVideo} onClose={() => setExploreVideo(null)} />
            )}
        </div>
    );
}
