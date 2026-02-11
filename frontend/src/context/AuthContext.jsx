import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { setToken, removeToken, getToken } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (getToken()) {
                try {
                    const res = await authAPI.getCurrentUser();
                    setUser(res.data);
                } catch (err) {
                    console.error('Failed to load user:', err);
                    removeToken();
                }
            }
            setLoading(false);
        };
        
        loadUser();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await authAPI.login({ username, password });
            setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            return { 
                success: false, 
                message: err.response?.data?.message || 'Login failed' 
            };
        }
    };

    const register = async (username, password, role) => {
        try {
            const res = await authAPI.register({ username, password, role });
            setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            return { 
                success: false, 
                message: err.response?.data?.message || 'Registration failed' 
            };
        }
    };

    const logout = () => {
        removeToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            register, 
            logout, 
            loading,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};