import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
    }, [navigate]);

    const fetchUser = useCallback(async () => {
        // Only fetch if a token exists
        if (localStorage.getItem('accessToken')) {
            try {
                const userData = await api('/users/me');
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                // If fetching user fails (e.g., token invalid), log out
                console.error("Failed to fetch user, logging out.", error);
                logout();
            }
        }
        setLoading(false);
    }, [logout]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (accessToken, refreshToken, userRole) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setIsAuthenticated(true);
        setLoading(true);
        await fetchUser(); // fetchUser will set loading to false

        // ROLE-BASED NAVIGATION AFTER LOGIN
        if (userRole === 'superadmin') {
            navigate('/superadmin/dashboard');
        } else if (userRole === 'schooladmin') {
            navigate('/admin/dashboard');
        } else {
            navigate('/dashboard');
        }
    };
    
    const value = { user, isAuthenticated, loading, login, logout, fetchUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);