import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- THIS IS THE FIX ---
    // The logout function now handles updating the isFirstLogin flag on the backend.
    const logout = useCallback(async () => {
        // If the user logging out is on their first session, call the API to update the flag.
        if (user && user.isFirstLogin) {
            try {
                await api('/users/me/complete-onboarding', 'POST');
            } catch (error) {
                // Log the error but proceed with logout regardless, as it's not a critical failure.
                console.error("Failed to update onboarding status on logout:", error);
            }
        }

        // Standard logout procedure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
    }, [navigate, user]); // Add `user` to the dependency array

    const fetchUser = useCallback(async () => {
        if (localStorage.getItem('accessToken')) {
            try {
                const userData = await api('/users/me');
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Failed to fetch user, logging out.", error);
                // Call the modified logout function which handles token clearing and navigation
                logout();
            }
        }
        setLoading(false);
    }, [logout]); // logout is now a dependency of fetchUser

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