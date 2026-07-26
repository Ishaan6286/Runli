import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Calendar, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function WorkoutScheduleSettings() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({
    enabled: true,
    preferredTime: '08:00',
    days: ['Monday', 'Wednesday', 'Friday'],
    reminderLeadTime: 30
  });

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    getProfile().then(res => {
      if (res.user && res.user.workoutSchedule) {
        setSchedule(res.user.workoutSchedule);
      }
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const saveSettings = async () => {
    try {
      await updateProfile({ workoutSchedule: schedule });
      addToast('success', 'Schedule saved');
      navigate(-1);
    } catch (e) {
      addToast('error', 'Failed to save schedule');
    }
  };

  if (loading) return null;

  return (
    <div className="page-wrapper" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', paddingTop: 'env(safe-area-inset-top, 2rem)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn-icon">
            <ChevronLeft size={24} color="var(--text-primary)" />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Workout Schedule</h1>
        </div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Enable Smart Reminders</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Get notified before your workout</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule({ ...schedule, enabled: e.target.checked })} />
              <span className="slider round"></span>
            </label>
          </div>

          {schedule.enabled && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                  <Calendar size={18} color="var(--primary-500)" />
                  Workout Days
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DAYS.map(day => {
                    const isSelected = schedule.days.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--r-md)',
                          background: isSelected ? 'var(--primary-500)' : 'var(--bg-raised)',
                          color: isSelected ? '#000' : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Clock size={18} color="var(--amber-500)" />
                    Preferred Time
                  </div>
                  <input
                    type="time"
                    className="input"
                    value={schedule.preferredTime}
                    onChange={e => setSchedule({ ...schedule, preferredTime: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Clock size={18} color="var(--blue-500)" />
                    Remind Me
                  </div>
                  <select
                    className="input"
                    value={schedule.reminderLeadTime}
                    onChange={e => setSchedule({ ...schedule, reminderLeadTime: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    <option value={15}>15 mins before</option>
                    <option value={30}>30 mins before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                  </select>
                </div>
              </div>

            </>
          )}

          <button onClick={saveSettings} className="btn btn-primary" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} />
            Save Schedule
          </button>
        </motion.div>
      </div>
    </div>
  );
}
