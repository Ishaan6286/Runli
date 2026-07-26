import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, 
  Search, Video, Calendar, ArrowLeft, RefreshCw, Copy, Edit2, PlayCircle, MessageSquare
} from 'lucide-react';
import { exerciseCatalog } from '../data/exerciseCatalog';
import { updateProfile } from '../services/api';
import { useToast } from '../context/ToastContext';

const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkoutEditor() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [targetDayIndex, setTargetDayIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("All");

  // Edit Exercise Modal State
  const [editingExercise, setEditingExercise] = useState(null); 
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  // Drag & Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [draggedDayIndex, setDraggedDayIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);
    let loadedPlan = null;

    try {
      const token = localStorage.getItem("token");
      if (token && token !== "null") {
        const res = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.user?.workoutPlan) {
          loadedPlan = data.user.workoutPlan;
        }
      }
      
      if (!loadedPlan) {
        const userInfo = JSON.parse(localStorage.getItem("runliUserInfo")) || {};
        loadedPlan = userInfo.workoutPlan;
      }
    } catch (e) {
      console.error("Failed to load workout plan", e);
    }

    if (!loadedPlan || loadedPlan.length === 0) {
      // Create empty 7-day plan
      loadedPlan = DAYNAMES.map(day => ({
        day,
        focus: "Rest",
        isRestDay: true,
        notes: "",
        exercises: []
      }));
    }

    setPlan(loadedPlan);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save to backend
      await updateProfile({ workoutPlan: plan });
      
      // 2. Save to local storage for instant sync
      const userInfo = JSON.parse(localStorage.getItem("runliUserInfo")) || {};
      userInfo.workoutPlan = plan;
      localStorage.setItem("runliUserInfo", JSON.stringify(userInfo));

      // 3. Clear gym mode cache to force update
      localStorage.removeItem('lastWorkoutDate');
      
      success("Workout plan saved successfully!");
      navigate('/plan');
    } catch (e) {
      showError("Failed to save workout plan.");
    } finally {
      setSaving(false);
    }
  };

  const addExerciseToDay = (dayIndex, exerciseName, catalogInfo) => {
    const newPlan = [...plan];
    newPlan[dayIndex].isRestDay = false;
    if (newPlan[dayIndex].focus === "Rest") {
        newPlan[dayIndex].focus = catalogInfo.muscleGroup || "Mixed";
    }

    newPlan[dayIndex].exercises.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: exerciseName,
      muscleGroup: catalogInfo.muscleGroup,
      equipment: catalogInfo.equipment,
      videoKey: catalogInfo.videoKey,
      sets: 3,
      reps: 10,
      restTime: 60,
      notes: ""
    });

    setPlan(newPlan);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const removeExercise = (dayIndex, exIndex) => {
    const newPlan = [...plan];
    newPlan[dayIndex].exercises.splice(exIndex, 1);
    
    if (newPlan[dayIndex].exercises.length === 0) {
      newPlan[dayIndex].isRestDay = true;
      newPlan[dayIndex].focus = "Rest";
    }
    
    setPlan(newPlan);
  };

  const duplicateExercise = (dayIndex, exIndex) => {
    const newPlan = [...plan];
    const exercise = { ...newPlan[dayIndex].exercises[exIndex] };
    exercise.id = Date.now().toString(); // New unique ID
    newPlan[dayIndex].exercises.splice(exIndex + 1, 0, exercise);
    setPlan(newPlan);
  };

  const updateDayNotes = (dayIndex, notes) => {
    const newPlan = [...plan];
    newPlan[dayIndex].notes = notes;
    setPlan(newPlan);
  };

  const updateDayFocus = (dayIndex, focus) => {
    const newPlan = [...plan];
    newPlan[dayIndex].focus = focus;
    setPlan(newPlan);
  };

  const saveEditedExercise = (updatedExercise) => {
    const newPlan = [...plan];
    const exIndex = newPlan[editingDayIndex].exercises.findIndex(e => e.id === updatedExercise.id);
    if (exIndex !== -1) {
      newPlan[editingDayIndex].exercises[exIndex] = updatedExercise;
      setPlan(newPlan);
    }
    setEditingExercise(null);
  };

  const handleDragStart = (e, dayIndex, itemIndex) => {
    setDraggedDayIndex(dayIndex);
    setDraggedItemIndex(itemIndex);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const handleDragEnter = (e, dayIndex, itemIndex) => {
    e.preventDefault();
    if (dayIndex !== draggedDayIndex) return; // Only allow reordering within the same day for now
    setDragOverItemIndex(itemIndex);
  };

  const handleDragEnd = () => {
    if (draggedDayIndex !== null && draggedItemIndex !== null && dragOverItemIndex !== null && draggedItemIndex !== dragOverItemIndex) {
      const newPlan = [...plan];
      const items = newPlan[draggedDayIndex].exercises;
      const [reorderedItem] = items.splice(draggedItemIndex, 1);
      items.splice(dragOverItemIndex, 0, reorderedItem);
      setPlan(newPlan);
    }
    setDraggedItemIndex(null);
    setDraggedDayIndex(null);
    setDragOverItemIndex(null);
  };

  const createFromScratch = () => {
    if (window.confirm("Are you sure? This will erase your current plan.")) {
      setPlan(DAYNAMES.map(day => ({
        day, focus: "Rest", isRestDay: true, notes: "", exercises: []
      })));
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Editor...</div>;
  }

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', paddingTop: 'clamp(1.25rem, 4vw, 2rem)', paddingBottom: 100, minHeight: '100vh', color: 'white' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/plan')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>Workout Editor</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={createFromScratch} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saving ? <span className="loader-small" /> : <Save size={18} />} Save Changes
          </button>
        </div>
      </div>

      {/* 7-Day Plan List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {plan.map((dayData, dayIndex) => (
          <div key={dayData.day} className="card" style={{ borderColor: dayData.isRestDay ? 'rgba(255,255,255,0.1)' : 'var(--primary-500)', transition: 'all 0.3s' }}>
            
            {/* Day Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: dayData.isRestDay ? 'var(--text-muted)' : 'white' }}>{dayData.day}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Focus:</span>
                  <input 
                    type="text" 
                    value={dayData.focus}
                    onChange={(e) => updateDayFocus(dayIndex, e.target.value)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', color: 'var(--primary-400)', outline: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '2px 0' }}
                  />
                </div>
              </div>
              <button 
                onClick={() => { setTargetDayIndex(dayIndex); setShowSearchModal(true); }}
                className="btn btn-primary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> Add Exercise
              </button>
            </div>

            {/* Day Notes */}
            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Day notes (e.g. Focus on depth, Use lifting straps...)"
                value={dayData.notes || ""}
                onChange={(e) => updateDayNotes(dayIndex, e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.75rem', color: 'white', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            {/* Exercises List */}
            {dayData.exercises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '2rem' }}>🏖️</span>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Rest Day. No exercises scheduled.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayData.exercises.map((ex, exIndex) => (
                  <div 
                    key={ex.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, dayIndex, exIndex)}
                    onDragEnter={(e) => handleDragEnter(e, dayIndex, exIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', 
                      background: dragOverItemIndex === exIndex && draggedDayIndex === dayIndex ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', 
                      padding: '0.75rem 1rem', borderRadius: '0.5rem', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <GripVertical size={20} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ex.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                        <span>{ex.sets} Sets × {ex.reps} Reps</span>
                        <span>•</span>
                        <span>{ex.restTime}s Rest</span>
                        {ex.notes && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--amber-400)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <MessageSquare size={10} /> Notes added
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => duplicateExercise(dayIndex, exIndex)} className="btn-icon" style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }} title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => { setEditingDayIndex(dayIndex); setEditingExercise({ ...ex }); }} className="btn-icon" style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'var(--primary-400)' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => removeExercise(dayIndex, exIndex)} className="btn-icon" style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: '#ef4444' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Search Exercise Modal --- */}
      <AnimatePresence>
        {showSearchModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowSearchModal(false)} />
            
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '1rem', border: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Add Exercise</h3>
                <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search exercises..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
                  />
                </div>
                <select 
                  value={filterMuscle}
                  onChange={(e) => setFilterMuscle(e.target.value)}
                  style={{ padding: '0.75rem 1rem', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', color: 'white', outline: 'none', flex: '0 0 auto' }}
                >
                  <option value="All">All Muscles</option>
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Biceps">Biceps</option>
                  <option value="Triceps">Triceps</option>
                  <option value="Quads & Glutes">Legs</option>
                  <option value="Hamstrings">Hamstrings</option>
                  <option value="Calves">Calves</option>
                  <option value="Core">Core</option>
                </select>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(exerciseCatalog)
                  .filter(([name, info]) => {
                    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesMuscle = filterMuscle === "All" || info.muscleGroup.includes(filterMuscle) || (filterMuscle === "Legs" && info.muscleGroup.includes("Quads"));
                    return matchesSearch && matchesMuscle;
                  })
                  .map(([name, info]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-raised)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                          <span>{info.muscleGroup}</span> • <span>{info.equipment}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => addExerciseToDay(targetDayIndex, name, info)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                      >
                        Add
                      </button>
                    </div>
                ))}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Edit Exercise Modal --- */}
      <AnimatePresence>
        {editingExercise && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} onClick={() => setEditingExercise(null)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-surface)', borderRadius: '1rem', border: '1px solid var(--border-strong)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-400)' }}>Edit Exercise</h3>
                <button onClick={() => setEditingExercise(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{editingExercise.name}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sets</label>
                  <input type="number" value={editingExercise.sets} onChange={(e) => setEditingExercise({ ...editingExercise, sets: parseInt(e.target.value) || 0 })} className="input" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reps</label>
                  <input type="text" value={editingExercise.reps} onChange={(e) => setEditingExercise({ ...editingExercise, reps: e.target.value })} className="input" style={{ width: '100%' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rest Time (seconds)</label>
                <input type="number" value={editingExercise.restTime} onChange={(e) => setEditingExercise({ ...editingExercise, restTime: parseInt(e.target.value) || 0 })} className="input" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exercise Notes</label>
                <textarea 
                  value={editingExercise.notes} 
                  onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })} 
                  placeholder="e.g. Keep elbows tucked, pause at bottom..."
                  className="input" 
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} 
                />
              </div>

              <button onClick={() => saveEditedExercise(editingExercise)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                Save Changes
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
