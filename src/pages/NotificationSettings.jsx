import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, BellOff, Settings, Zap, Coffee, Moon, Activity } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getNotificationSettings, updateNotificationSettings } from '../services/api';
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush } from '../services/pushService';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    
    const [settings, setSettings] = useState({
        workout: true, diet: true, water: true, meals: true,
        protein: true, sleep: true, habits: true, progress: true,
        weeklyReport: true, aiMotivation: true, restDay: true,
        quietHoursStart: '22:00', quietHoursEnd: '07:00'
    });
    
    const [pushEnabled, setPushEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
        checkPushStatus();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getNotificationSettings();
            if (data.success && data.settings) {
                setSettings(data.settings);
            }
        } catch (error) {
            showError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const checkPushStatus = async () => {
        if (!isPushSupported()) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
    };

    const handleTogglePush = async () => {
        try {
            if (pushEnabled) {
                await unsubscribeUserFromPush();
                setPushEnabled(false);
                success('Push notifications disabled');
            } else {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    await subscribeUserToPush();
                    setPushEnabled(true);
                    success('Push notifications enabled');
                } else {
                    showError('Notification permission denied');
                }
            }
        } catch (error) {
            showError('Error updating push status');
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateNotificationSettings(settings);
            success('Settings saved successfully');
        } catch (error) {
            showError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{color: '#10b981'}}>Loading...</p></div>;
    }

    const cardStyle = {
        background: 'rgba(26, 26, 26, 0.95)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '1rem'
    };

    const ToggleRow = ({ label, desc, checked, onChange, icon: Icon }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {Icon && <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '0.5rem' }}><Icon size={20} /></div>}
                <div>
                    <div style={{ fontWeight: '600', color: 'white' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>{desc}</div>
                </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input 
                    type="checkbox" 
                    checked={checked} 
                    onChange={(e) => onChange(e.target.checked)} 
                    style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: checked ? '#10b981' : '#4b5563', transition: '.4s', borderRadius: '24px'
                }}>
                    <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                        transform: checked ? 'translateX(26px)' : 'translateX(0)'
                    }} />
                </span>
            </label>
        </div>
    );

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white', paddingBottom: '5rem' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Notification Settings</h1>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
                
                {/* Master Push Toggle */}
                <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {pushEnabled ? <Bell size={20} color="#10b981" /> : <BellOff size={20} color="#ef4444" />}
                                Enable Push Notifications
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#a3a3a3' }}>Allow Runli to send you reminders even when closed.</p>
                        </div>
                        <button 
                            onClick={handleTogglePush}
                            style={{ padding: '0.5rem 1rem', background: pushEnabled ? 'rgba(239,68,68,0.1)' : '#10b981', color: pushEnabled ? '#ef4444' : 'black', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {pushEnabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>

                {!isPushSupported() && (
                    <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        Push notifications are not supported in your current browser or device.
                    </div>
                )}

                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#a3a3a3', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quiet Hours</h3>
                <div style={{ ...cardStyle }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a3a3a3', marginBottom: '0.25rem' }}>Start Time</label>
                            <input type="time" value={settings.quietHoursStart} onChange={(e) => handleChange('quietHoursStart', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '0.5rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a3a3a3', marginBottom: '0.25rem' }}>End Time</label>
                            <input type="time" value={settings.quietHoursEnd} onChange={(e) => handleChange('quietHoursEnd', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '0.5rem' }} />
                        </div>
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>All notifications will be silenced during these hours.</p>
                </div>

                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#a3a3a3', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Preferences</h3>
                <div style={{ ...cardStyle }}>
                    <ToggleRow label="Workout Reminders" desc="Morning and evening gym check-ins" icon={Activity} checked={settings.workout} onChange={(v) => handleChange('workout', v)} />
                    <ToggleRow label="Rest Day" desc="Recovery day tips and stretch reminders" checked={settings.restDay} onChange={(v) => handleChange('restDay', v)} />
                    <ToggleRow label="Diet & Macros" desc="Meal logs, protein goals, calorie checks" icon={Coffee} checked={settings.diet} onChange={(v) => handleChange('diet', v)} />
                    <ToggleRow label="Hydration" desc="Water intake reminders" checked={settings.water} onChange={(v) => handleChange('water', v)} />
                    <ToggleRow label="Habits" desc="Reminders for your daily habits" checked={settings.habits} onChange={(v) => handleChange('habits', v)} />
                    <ToggleRow label="Sleep" desc="Wind down and sleep tracking reminders" icon={Moon} checked={settings.sleep} onChange={(v) => handleChange('sleep', v)} />
                    <ToggleRow label="AI Motivation" desc="Personalized coaching based on your data" icon={Zap} checked={settings.aiMotivation} onChange={(v) => handleChange('aiMotivation', v)} />
                    <ToggleRow label="Weekly Report" desc="Sunday evening progress summaries" checked={settings.weeklyReport} onChange={(v) => handleChange('weeklyReport', v)} />
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'black', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}
                >
                    {saving ? 'Saving...' : 'Save Preferences'}
                </motion.button>
            </div>
        </div>
    );
}
