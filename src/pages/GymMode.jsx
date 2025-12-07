import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play, Pause, RotateCcw, CheckCircle, Circle,
    Volume2, VolumeX, X, Clock, Dumbbell, Video, PlayCircle,
    TrendingUp, AlertCircle, Calendar, Calculator, Disc
} from 'lucide-react';
import { motivationalQuotes } from '../data/quotes';

// Workout Split Data (from PlanPage)
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

// YouTube video IDs from Video Dashboard
const exerciseVideos = {
    "Bench Press (Flat)": "SCVCLChPQFY",
    "Dumbbell Press (Incline)": "8iPEnn-ltC8",
    "Cable Crossover": "taI4XduLpTk",
    "Triceps Pushdown": "2-LAMcpzODU",
    "Overhead Triceps Extension": "YbX7Wd8jQ-Q",
    "Dumbbell Fly": "eozdVDA78K0"
};

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

    // Stopwatch State
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Rest Timer State
    const [restTime, setRestTime] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Video State
    const [currentVideo, setCurrentVideo] = useState({
        title: "Bench Press Form",
        url: "https://www.youtube.com/embed/SCVCLChPQFY"
    });

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

            // Generate workout split based on frequency
            const workoutSplit = getSplitByFrequency(frequency);

            // Get today's workout (cycle through the split)
            const todaysWorkout = workoutSplit[dayIndex % workoutSplit.length];
            setTodaysFocus(todaysWorkout.focus);

            // Convert exercises to workout format
            const generatedWorkouts = [
                { id: 1, name: "Warm-up: 5 min Cardio", completed: false, videoKey: null, type: "cardio" }
            ];

            todaysWorkout.exercises.forEach((exercise, index) => {
                // Parse exercise string like "Barbell Bench Press 4x8-12"
                const match = exercise.match(/^(.+?)\s+(\d+)x(\d+)(?:-(\d+))?/);
                if (match) {
                    const [, name, sets, repsMin, repsMax] = match;
                    generatedWorkouts.push({
                        id: index + 2,
                        name: name.trim(),
                        sets: parseInt(sets),
                        reps: repsMax ? parseInt(repsMax) : parseInt(repsMin),
                        completed: false,
                        videoKey: null,
                        type: "strength"
                    });
                } else {
                    // For exercises without set/rep format (like "Plank (90 sec) x3")
                    generatedWorkouts.push({
                        id: index + 2,
                        name: exercise,
                        completed: false,
                        videoKey: null,
                        type: "cardio"
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

                    const workoutSplit = getSplitByFrequency(frequency);
                    const todaysWorkout = workoutSplit[dayIndex % workoutSplit.length];
                    setTodaysFocus(todaysWorkout.focus);

                    // Regenerate workouts
                    const generatedWorkouts = [
                        { id: 1, name: "Warm-up: 5 min Cardio", completed: false, videoKey: null, type: "cardio" }
                    ];

                    todaysWorkout.exercises.forEach((exercise, index) => {
                        const match = exercise.match(/^(.+?)\s+(\d+)x(\d+)(?:-(\d+))?/);
                        if (match) {
                            const [, name, sets, repsMin, repsMax] = match;
                            generatedWorkouts.push({
                                id: index + 2,
                                name: name.trim(),
                                sets: parseInt(sets),
                                reps: repsMax ? parseInt(repsMax) : parseInt(repsMin),
                                completed: false,
                                videoKey: null,
                                type: "strength"
                            });
                        } else {
                            generatedWorkouts.push({
                                id: index + 2,
                                name: exercise,
                                completed: false,
                                videoKey: null,
                                type: "cardio"
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

    // Stopwatch Logic
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => setTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
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

    const playVideo = (e, workout) => {
        e.stopPropagation(); // Prevent toggling completion
        if (workout.videoKey && exerciseVideos[workout.videoKey]) {
            setCurrentVideo({
                title: workout.name,
                url: `https://www.youtube.com/embed/${exerciseVideos[workout.videoKey]}`
            });
        }
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
        <div style={{
            minHeight: '100vh',
            background: '#000000',
            color: '#ffffff',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                paddingBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Dumbbell size={32} color="#10b981" />
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0
                        }}>GYM MODE</h1>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#a3a3a3',
                            marginTop: '0.25rem',
                            fontWeight: 600
                        }}>
                            Today: <span style={{ color: '#10b981' }}>{todaysFocus}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        style={{
                            background: showCalculator ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: showCalculator ? 'black' : 'white'
                        }}
                        title="Plate Calculator"
                    >
                        <Calculator size={24} />
                    </button>
                    <button
                        onClick={() => setShowPlankTimer(true)}
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '0.75rem',
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Plank Timer
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={24} color="white" />
                    </button>
                </div>
            </div>

            {/* Plate Calculator Modal/Section */}
            {showCalculator && (
                <div style={{
                    background: 'rgba(26, 26, 26, 0.95)',
                    border: '1px solid #10b981',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    <h3 style={{ marginTop: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Disc size={20} /> Plate Calculator
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <input
                            type="number"
                            placeholder="Target Weight (kg)"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={calculatePlates}
                            style={{
                                background: '#10b981',
                                color: 'black',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Calculate
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: '#a3a3a3', marginRight: '0.5rem' }}>Per Side:</span>
                        {calculatedPlates.length > 0 ? calculatedPlates.map((plate, idx) => (
                            <div key={idx} style={{
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                background: '#333',
                                border: '2px solid #10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                color: 'white'
                            }}>
                                {plate}
                            </div>
                        )) : <span style={{ color: '#525252' }}>Enter weight (min 20kg bar)</span>}
                    </div>
                </div>
            )}

            {/* Daily Motivation */}
            <div style={{
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 100%)',
                borderLeft: '4px solid #10b981',
                padding: '1rem',
                borderRadius: '0 1rem 1rem 0',
                fontStyle: 'italic',
                color: '#d1d5db',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <Calendar size={24} color="#10b981" />
                <div>
                    <span style={{ color: '#10b981', fontWeight: 700, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>DAILY MOTIVATION</span>
                    "{quote}"
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
                        <div style={{
                            background: 'rgba(26, 26, 26, 0.95)',
                            borderRadius: '1.5rem',
                            padding: '1.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a3a3a3' }}>
                                <Clock size={20} />
                                <span style={{ fontWeight: 600 }}>WORKOUT TIME</span>
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>
                                {formatTime(time)}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsRunning(!isRunning)}
                                    style={{
                                        background: isRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: isRunning ? '#ef4444' : '#10b981',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem 1.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {isRunning ? 'PAUSE' : 'START'}
                                </button>
                                <button
                                    onClick={() => { setIsRunning(false); setTime(0); }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Rest Timer */}
                        <div style={{
                            background: 'rgba(26, 26, 26, 0.95)',
                            borderRadius: '1.5rem',
                            padding: '1.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a3a3a3' }}>
                                <Clock size={20} />
                                <span style={{ fontWeight: 600 }}>REST TIMER</span>
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace', color: isResting ? '#fbbf24' : '#a3a3a3' }}>
                                {formatTime(restTime)}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[30, 60, 90, 120, 150].map(seconds => (
                                    <button
                                        key={seconds}
                                        onClick={() => startRest(seconds)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {seconds}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Workout Checklist & Smart Tracker */}
                    <div style={{
                        background: 'rgba(26, 26, 26, 0.95)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        flex: 1,
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CheckCircle size={24} color="#10b981" />
                            TODAY'S WORKOUT
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {workouts.map(workout => {
                                const recommendation = getRecommendation(workout.name);
                                const currentData = trackerData[workout.id] || {};
                                const estimated1RM = calculate1RM(currentData.weight, currentData.rpe ? workout.reps : 0); // Using target reps for 1RM calc context if RPE is set, or better yet, just use weight if available. Actually, 1RM needs reps performed. I'll use workout.reps as a proxy for "reps performed" for now since we don't track actual reps yet.

                                return (
                                    <div
                                        key={workout.id}
                                        style={{
                                            padding: '1rem',
                                            background: workout.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '1rem',
                                            border: workout.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem'
                                        }}
                                    >
                                        {/* Header Row */}
                                        <div
                                            onClick={() => toggleWorkout(workout.id)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {workout.completed ?
                                                    <CheckCircle size={24} color="#10b981" /> :
                                                    <Circle size={24} color="#525252" />
                                                }
                                                <div>
                                                    <span style={{
                                                        fontSize: '1.1rem',
                                                        color: workout.completed ? '#10b981' : 'white',
                                                        textDecoration: workout.completed ? 'line-through' : 'none',
                                                        fontWeight: 500,
                                                        display: 'block'
                                                    }}>
                                                        {workout.name}
                                                    </span>
                                                    {workout.type === 'strength' && (
                                                        <span style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>
                                                            {workout.sets} sets x {workout.reps} reps
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {workout.videoKey && (
                                                <button
                                                    onClick={(e) => playVideo(e, workout)}
                                                    style={{
                                                        background: 'rgba(16, 185, 129, 0.2)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '36px',
                                                        height: '36px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: '#10b981'
                                                    }}
                                                    title="Watch Form Video"
                                                >
                                                    <PlayCircle size={20} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Smart Tracker Inputs (Only for Strength) */}
                                        {workout.type === 'strength' && !workout.completed && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem'
                                            }}>
                                                {recommendation && (
                                                    <div style={{
                                                        fontSize: '0.9rem',
                                                        color: recommendation.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        background: 'rgba(0,0,0,0.3)',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem'
                                                    }}>
                                                        <TrendingUp size={16} />
                                                        Suggestion: {recommendation.text}
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: '#a3a3a3', display: 'block', marginBottom: '0.25rem' }}>Weight (kg)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={trackerData[workout.id]?.weight || ''}
                                                            onChange={(e) => handleTrackerChange(workout.id, 'weight', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: '100%',
                                                                background: 'rgba(0,0,0,0.3)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                color: 'white',
                                                                padding: '0.5rem',
                                                                borderRadius: '0.5rem'
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: '#a3a3a3', display: 'block', marginBottom: '0.25rem' }}>RPE (1-10)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="-"
                                                            max="10"
                                                            value={trackerData[workout.id]?.rpe || ''}
                                                            onChange={(e) => handleTrackerChange(workout.id, 'rpe', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: '100%',
                                                                background: 'rgba(0,0,0,0.3)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                color: 'white',
                                                                padding: '0.5rem',
                                                                borderRadius: '0.5rem'
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                        <button
                                                            onClick={(e) => saveSet(e, workout)}
                                                            style={{
                                                                width: '100%',
                                                                background: '#10b981',
                                                                color: 'black',
                                                                border: 'none',
                                                                padding: '0.5rem',
                                                                borderRadius: '0.5rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Log Set
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 1RM Estimate Display */}
                                                {currentData.weight > 0 && (
                                                    <div style={{ fontSize: '0.8rem', color: '#a3a3a3', textAlign: 'right', marginTop: '-0.25rem' }}>
                                                        Est. 1RM: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{calculate1RM(currentData.weight, workout.reps)}kg</span>
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

                {/* Right Column: Media & Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Video Player Placeholder */}
                    <div style={{
                        background: 'rgba(26, 26, 26, 0.95)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Video size={24} color="#10b981" />
                            FORM GUIDE: <span style={{ color: '#10b981', fontWeight: 400 }}>{currentVideo.title}</span>
                        </h2>
                        <div style={{
                            flex: 1,
                            background: '#000',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '300px'
                        }}>
                            <iframe
                                width="100%"
                                height="100%"
                                src={currentVideo.url}
                                title={currentVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: 'absolute', top: 0, left: 0 }}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Fullscreen Plank Timer Modal */}
            {showPlankTimer && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: '#000000',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    {/* Close Button */}
                    <button
                        onClick={closePlankTimer}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <X size={24} />
                    </button>

                    {/* Title */}
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        PLANK TIMER
                    </h1>

                    {/* Duration Selector (only show when not running) */}
                    {!isPlankRunning && (
                        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                            <label style={{
                                color: '#a3a3a3',
                                fontSize: '1.2rem',
                                display: 'block',
                                marginBottom: '1rem',
                                fontWeight: 600
                            }}>
                                Set Duration
                            </label>
                            <input
                                type="range"
                                min="30"
                                max="300"
                                step="10"
                                value={plankDuration}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPlankDuration(val);
                                    setPlankTimeLeft(val);
                                }}
                                style={{
                                    width: '300px',
                                    height: '8px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                            <div style={{
                                color: '#10b981',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                marginTop: '1rem'
                            }}>
                                {formatTime(plankDuration)}
                            </div>
                        </div>
                    )}

                    {/* Countdown Display */}
                    <div style={{
                        fontSize: '12rem',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: plankTimeLeft <= 10 ? '#ef4444' : '#10b981',
                        textShadow: '0 0 40px rgba(16, 185, 129, 0.5)',
                        marginBottom: '3rem',
                        lineHeight: 1
                    }}>
                        {formatTime(plankTimeLeft)}
                    </div>

                    {/* Control Buttons */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <button
                            onClick={isPlankRunning ? () => setIsPlankRunning(false) : startPlankTimer}
                            style={{
                                background: isPlankRunning
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: isPlankRunning ? '#ef4444' : 'white',
                                border: 'none',
                                borderRadius: '1rem',
                                padding: '1.5rem 4rem',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isPlankRunning ? (
                                <>
                                    <Pause size={32} />
                                    PAUSE
                                </>
                            ) : (
                                <>
                                    <Play size={32} />
                                    START
                                </>
                            )}
                        </button>

                        <button
                            onClick={resetPlankTimer}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '1rem',
                                padding: '1.5rem 4rem',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <RotateCcw size={32} />
                            RESET
                        </button>
                    </div>

                    {/* Motivational Text */}
                    {isPlankRunning && (
                        <div style={{
                            marginTop: '3rem',
                            fontSize: '1.5rem',
                            color: '#a3a3a3',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            Stay strong! You've got this! 💪
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
