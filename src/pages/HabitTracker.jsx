import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, Plus, CheckCircle2, Circle, ChevronLeft,
    TrendingUp, Activity, Sparkles, X, Edit3, Trash2, AlertTriangle, ArrowDown, Calendar
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
    getHabits, getTodayStatus, createHabit, logHabit,
    deleteHabit, updateHabit, getHabitLogs, HABIT_TEMPLATES
} from '../services/habitApi';

const MOTIVATIONAL_QUOTES = [
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    "The secret of your future is hidden in your daily routine.",
    "Small steps in the right direction can turn out to be the biggest step of your life.",
    "Discipline is doing what needs to be done, even if you don't want to do it.",
    "Don't watch the clock; do what it does. Keep going.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Your habits calculate your future.",
    "Motivation is what gets you started. Habit is what keeps you going."
];

export default function HabitTracker() {
    const navigate = useNavigate();
    const { success, info, error: showError } = useToast();
    const [habits, setHabits] = useState([]);
    const [todayStatus, setTodayStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState("");
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [habitLogs, setHabitLogs] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadData();
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [habitsData, todayData] = await Promise.all([
                getHabits(),
                getTodayStatus()
            ]);

            if (habitsData.success) setHabits(habitsData.habits);
            if (todayData.success) setTodayStatus(todayData);
        } catch (error) {
            console.error('Error loading habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHabitHistory = async (habitId) => {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await getHabitLogs(
                habitId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );

            if (response.success) {
                setHabitLogs(response.logs);
            }
        } catch (error) {
            console.error('Error loading habit history:', error);
        }
    };

    const handleCheckIn = async (habitId, currentValue, goalValue, goalType) => {
        try {
            const completed = true;
            const newValue = goalValue;

            await logHabit(habitId, {
                date: new Date().toISOString().split('T')[0],
                completed,
                value: newValue
            });

            const habitName = habits.find(h => h._id === habitId)?.name || 'habit';
            success(`Completed ${habitName}! 🎉`);

            await loadData();
        } catch (error) {
            console.error('Error checking in habit:', error);
            showError('Failed to update habit');
        }
    };

    const handleCreateHabit = async (template) => {
        try {
            await createHabit(template);
            success('New habit created! 🚀');
            await loadData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error creating habit:', error);
            showError('Failed to create habit');
        }
    };

    const confirmDelete = (habitId) => {
        setDeletingId(habitId);
    };

    const handleDeleteHabit = async (habitId) => {
        try {
            setHabits(prev => prev.filter(h => h._id !== habitId));
            setDeletingId(null);

            await deleteHabit(habitId);
            success('Habit deleted');

            await loadData();
        } catch (error) {
            console.error('Error deleting habit:', error);
            showError('Failed to delete habit');
            loadData();
        }
    };

    const openCalendar = async (habit) => {
        setSelectedHabit(habit);
        await loadHabitHistory(habit._id);
        setShowCalendar(true);
    };

    const handleBatchCheckIn = async () => {
        const uncompleted = todayStatus?.habits?.filter(h => !h.completed) || [];
        for (const habitStatus of uncompleted) {
            const habit = habits.find(h => h._id === habitStatus.habitId);
            if (habit) {
                await handleCheckIn(habitStatus.habitId, habitStatus.value, habitStatus.goal, habit.goalType);
            }
        }
        success("All habits completed! You're unstoppable! 💪");
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

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
                    <p style={{ color: "#10b981", fontWeight: "600" }}>Loading habits...</p>
                </div>
            </div>
        );
    }

    const completedToday = todayStatus?.summary?.completed || 0;
    const totalHabits = todayStatus?.summary?.total || 0;
    const completionPercentage = todayStatus?.summary?.percentage || 0;
    const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.longestStreak || 0), 0);
    const totalCompletionRate = habits.length > 0
        ? Math.round(habits.reduce((sum, h) => sum + (h.completionRate || 0), 0) / habits.length)
        : 0;

    return (
        <div style={{ background: "#000000", minHeight: "100vh", padding: "2rem 1rem", color: "white", fontFamily: "Poppins, sans-serif" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

                {/* Header */}
                <div style={{ ...cardStyle, background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>My Habits</h1>
                            <p style={{ color: "#a3a3a3", margin: 0, fontSize: "1.1rem" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1f2937", width: "32px", height: "32px", borderRadius: "50%", color: "#10b981", fontWeight: "bold", marginRight: "0.5rem" }}>
                                    {completedToday}
                                </span>
                                of <strong style={{ color: "white" }}>{totalHabits}</strong> completed today. Keep the streak alive! 🔥
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            {totalHabits > 0 && completedToday < totalHabits && (
                                <button
                                    onClick={handleBatchCheckIn}
                                    style={{
                                        padding: "0.75rem 1.25rem",
                                        borderRadius: "999px",
                                        border: "1px solid rgba(59, 130, 246, 0.3)",
                                        background: "rgba(59, 130, 246, 0.1)",
                                        color: "#60a5fa",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)"}
                                >
                                    <CheckCircle2 size={18} />
                                    Complete All
                                </button>
                            )}
                            <button
                                onClick={scrollToBottom}
                                style={{
                                    ...btnStyle,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    borderRadius: "999px"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Plus size={18} />
                                Add New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                    <StatCard title="Today" value={completedToday} target={totalHabits} unit="" color="#10b981" icon={<CheckCircle2 size={20} />} />
                    <StatCard title="Success" value={completionPercentage} target={100} unit="%" color="#3b82f6" icon={<TrendingUp size={20} />} />
                    <StatCard title="Streak" value={longestStreak} target={30} unit="days" color="#f97316" icon={<Flame size={20} />} />
                    <StatCard title="Overall" value={totalCompletionRate} target={100} unit="%" color="#a855f7" icon={<Activity size={20} />} />
                </div>

                {/* Habits List */}
                {habits.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: "center", padding: "4rem 2rem", border: "1px dashed rgba(255,255,255,0.1)" }}>
                        <Sparkles style={{ margin: "0 auto 1rem", color: "rgba(16, 185, 129, 0.5)" }} size={48} />
                        <p style={{ color: "#6b7280", fontSize: "1.1rem", marginBottom: "1rem" }}>No habits yet. Start by adding one below!</p>
                        <button
                            onClick={scrollToBottom}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#10b981",
                                fontWeight: "bold",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                margin: "0 auto",
                                textDecoration: "underline"
                            }}
                        >
                            Go to Add Habit <ArrowDown size={16} />
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                        {todayStatus?.habits?.map((habitStatus) => {
                            const habit = habits.find(h => h._id === habitStatus.habitId);
                            if (!habit) return null;
                            return (
                                <HabitCard
                                    key={habit._id}
                                    habit={habit}
                                    status={habitStatus}
                                    onCheckIn={handleCheckIn}
                                    onDelete={handleDeleteHabit}
                                    onConfirmDelete={() => confirmDelete(habit._id)}
                                    isDeleting={deletingId === habit._id}
                                    onCancelDelete={() => setDeletingId(null)}
                                    onViewCalendar={openCalendar}
                                    cardStyle={cardStyle}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Motivation Quote */}
                <div style={{ marginTop: "2rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem" }}>
                    <p style={{ fontSize: "1.5rem", fontStyle: "italic", color: "rgba(16, 185, 129, 0.8)", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                        "{quote}"
                    </p>
                </div>

                {/* Add Habit Section */}
                <div style={{ marginTop: "3rem" }} id="add-habit-section">
                    <div style={{ ...cardStyle, background: "linear-gradient(to bottom, #1a1a1a, #000000)" }}>
                        <div style={{ marginBottom: "2rem" }}>
                            <h2 style={{ fontSize: "2rem", fontWeight: "bold", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ padding: "0.75rem", background: "#10b981", borderRadius: "0.75rem", color: "black" }}>
                                    <Plus size={24} strokeWidth={3} />
                                </div>
                                Add a New Habit
                            </h2>
                            <p style={{ color: "#d1d5db", margin: 0, fontSize: "1.1rem" }}>Choose a template to start tracking instantly.</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                            {HABIT_TEMPLATES.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCreateHabit(template)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                        padding: "1.5rem",
                                        borderRadius: "1rem",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                        color: "white"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                >
                                    <div style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "0.75rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "2rem",
                                        background: "rgba(0,0,0,0.5)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        flexShrink: 0
                                    }}>
                                        {template.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{template.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "#a3a3a3" }}>
                                            Target: <span style={{ color: "white", fontWeight: "600" }}>{template.goalValue} {template.unit}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Calendar Modal */}
            {showCalendar && selectedHabit && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem"
                }}>
                    <div
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }}
                        onClick={() => setShowCalendar(false)}
                    />
                    <div style={{
                        position: "relative",
                        background: "#1a1a1a",
                        width: "100%",
                        maxWidth: "500px",
                        borderRadius: "1.5rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "1.5rem"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ fontSize: "2rem" }}>{selectedHabit.icon}</div>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{selectedHabit.name}</h2>
                                    <p style={{ fontSize: "0.85rem", color: "#a3a3a3", margin: 0 }}>History (Last 30 Days)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCalendar(false)}
                                style={{ background: "transparent", border: "none", color: "#a3a3a3", cursor: "pointer", padding: "0.5rem" }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
                            {habitLogs.slice(0, 14).map((log, i) => (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "0.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: log.completed ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
                                        background: log.completed ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.03)",
                                        color: log.completed ? "#10b981" : "#6b7280"
                                    }}>
                                        {log.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </div>
                                    <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{new Date(log.date).getDate()}</span>
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
const StatCard = ({ title, value, target, unit, color, icon }) => {
    const percentage = Math.min(100, Math.round((value / target) * 100)) || 0;

    const cardStyle = {
        background: "rgba(26, 26, 26, 0.95)",
        borderRadius: "2rem",
        padding: "1.5rem",
        border: "1px solid rgba(16, 185, 129, 0.1)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        color: "white",
        borderTop: `4px solid ${color}`
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", color: color }}>
                    {icon}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{value}</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{unit}</span>
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.1)", height: "6px", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${percentage}%`, height: "100%", background: color, transition: "width 0.5s" }} />
            </div>
        </div>
    );
};

const HabitCard = ({ habit, status, onCheckIn, onDelete, onViewCalendar, onConfirmDelete, isDeleting, onCancelDelete, cardStyle }) => {
    const isCompleted = status.completed;

    return (
        <div style={{
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            transition: "all 0.2s",
            position: "relative"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
                <div
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", flex: 1 }}
                    onClick={() => onViewCalendar(habit)}
                >
                    <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "0.75rem",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem"
                    }}>
                        {habit.icon}
                    </div>
                    <div>
                        <h3 style={{ fontWeight: "bold", fontSize: "1.1rem", margin: "0 0 0.25rem 0" }}>{habit.name}</h3>
                        <div style={{ fontSize: "0.75rem", color: "#f97316", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Flame size={12} /> {habit.currentStreak} day streak
                        </div>
                    </div>
                </div>

                {isDeleting ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            onClick={() => onDelete(habit._id)}
                            style={{
                                fontSize: "0.75rem",
                                background: "#ef4444",
                                color: "white",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                fontWeight: "bold",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            Confirm
                        </button>
                        <button
                            onClick={onCancelDelete}
                            style={{
                                padding: "0.5rem",
                                color: "#a3a3a3",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "0.5rem"
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onConfirmDelete}
                        style={{
                            padding: "0.5rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            cursor: "pointer",
                            borderRadius: "0.5rem",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <div style={{ marginTop: "auto" }}>
                <button
                    onClick={() => onCheckIn(habit._id, status.value, status.goal, habit.goalType)}
                    disabled={isCompleted}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        border: isCompleted ? "1px solid rgba(16, 185, 129, 0.3)" : "none",
                        background: isCompleted ? "rgba(16, 185, 129, 0.1)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: isCompleted ? "#10b981" : "white",
                        cursor: isCompleted ? "default" : "pointer",
                        transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => !isCompleted && (e.currentTarget.style.background = "linear-gradient(135deg, #059669 0%, #047857 100%)")}
                    onMouseOut={(e) => !isCompleted && (e.currentTarget.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)")}
                >
                    {isCompleted ? <><CheckCircle2 size={18} /> Done</> : <><Circle size={18} /> Mark Complete</>}
                </button>
            </div>
        </div>
    );
};
