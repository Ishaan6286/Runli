import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_URL = `${API_BASE}/habits`;

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a new habit
export const createHabit = async (habitData) => {
    const response = await axios.post(API_URL, habitData, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Get all user habits
export const getHabits = async () => {
    const response = await axios.get(API_URL, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Get a specific habit
export const getHabit = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Update a habit
export const updateHabit = async (id, habitData) => {
    const response = await axios.put(`${API_URL}/${id}`, habitData, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Delete a habit
export const deleteHabit = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Log habit completion
export const logHabit = async (id, logData) => {
    const response = await axios.post(`${API_URL}/${id}/log`, logData, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Get habit logs for a date range
export const getHabitLogs = async (id, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_URL}/${id}/logs`, {
        headers: getAuthHeader(),
        params
    });
    return response.data;
};

// Get today's status for all habits
export const getTodayStatus = async () => {
    const response = await axios.get(`${API_URL}/today/status`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Predefined habit templates
export const HABIT_TEMPLATES = [
    {
        name: 'Drink Water',
        type: 'water',
        icon: '💧',
        color: '#3b82f6',
        goalType: 'count',
        goalValue: 8,
        unit: 'glasses'
    },
    {
        name: 'Sleep Well',
        type: 'sleep',
        icon: '😴',
        color: '#8b5cf6',
        goalType: 'duration',
        goalValue: 8,
        unit: 'hours'
    },
    {
        name: 'Daily Steps',
        type: 'steps',
        icon: '🚶',
        color: '#10b981',
        goalType: 'count',
        goalValue: 10000,
        unit: 'steps'
    },
    {
        name: 'Meditation',
        type: 'meditation',
        icon: '🧘',
        color: '#f59e0b',
        goalType: 'duration',
        goalValue: 15,
        unit: 'minutes'
    },
    {
        name: 'Stretching',
        type: 'stretching',
        icon: '🤸',
        color: '#ec4899',
        goalType: 'boolean',
        goalValue: 1,
        unit: ''
    },
    {
        name: 'Take Supplements',
        type: 'supplements',
        icon: '💊',
        color: '#ef4444',
        goalType: 'boolean',
        goalValue: 1,
        unit: ''
    }
];
