'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await api.getProfile();
            setUser(data.user);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    }

    async function login(email, password) {
        const data = await api.login(email, password);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    }

    async function register(username, email, password, securityQuestion, securityAnswer) {
        const data = await api.register(username, email, password, securityQuestion, securityAnswer);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    async function refreshUser() {
        try {
            const data = await api.getProfile();
            setUser(data.user);
        } catch {
            // ignore
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
