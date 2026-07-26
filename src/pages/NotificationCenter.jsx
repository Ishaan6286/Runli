import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getNotificationHistory, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../services/api';

export default function NotificationCenter() {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getNotificationHistory();
            if (data.success && data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            showError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            showError('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            success('All notifications marked as read');
        } catch (error) {
            showError('Failed to mark all as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            success('Notification deleted');
        } catch (error) {
            showError('Failed to delete notification');
        }
    };

    const handleClick = async (notification) => {
        if (!notification.isRead) {
            handleMarkRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white', paddingBottom: '5rem' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} /> Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{unreadCount}</span>}
                    </h1>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Mark all read</button>
                )}
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
                        <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notifications.map(n => (
                            <div 
                                key={n._id} 
                                onClick={() => handleClick(n)}
                                style={{ 
                                    background: n.isRead ? 'rgba(26, 26, 26, 0.5)' : 'rgba(16, 185, 129, 0.1)', 
                                    border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.2)'}`,
                                    borderRadius: '0.75rem', 
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    cursor: n.link ? 'pointer' : 'default',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: n.isRead ? '500' : 'bold', color: n.isRead ? '#d1d5db' : 'white' }}>{n.title}</h3>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: n.isRead ? '#9ca3af' : '#d1d5db', lineHeight: 1.4 }}>{n.message}</p>
                                    {n.link && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>
                                            <ExternalLink size={14} /> Open Link
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                                    {!n.isRead && (
                                        <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.25rem' }} title="Mark as Read">
                                            <CheckCircle2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', opacity: 0.7 }} title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
