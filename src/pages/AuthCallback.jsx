import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/api';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Temporarily set token in localStorage so getProfile can use it
            localStorage.setItem('token', token);

            getProfile().then(res => {
                // res.user contains the profile data
                login(res.user, token);
                navigate('/userinfo');
            }).catch(err => {
                console.error("Failed to fetch profile", err);
                localStorage.removeItem('token'); // Cleanup
                navigate('/login');
            });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate, login]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#000',
            color: '#fff',
            fontSize: '1.2rem'
        }}>
            Processing login...
        </div>
    );
}
