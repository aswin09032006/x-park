import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../services/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(async (reason = 'user_initiated') => {
        const context = 'AuthContext.logout';
        logger.startNewTrace();
        logger.info(`Logout process started. Reason: ${reason}`, { context });

        if (user && user.isFirstLogin) {
            try {
                await api('/users/me/complete-onboarding', 'POST');
                logger.success('Onboarding status updated successfully on logout.', { context, details: { userId: user._id } });
            } catch (error) {
                logger.error('Failed to update onboarding status on logout.', { context, details: { userId: user?._id, error } });
            }
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
        logger.success('User successfully logged out.', { context });
    }, [navigate, user]);

    const fetchUser = useCallback(async () => {
        const context = 'AuthContext.fetchUser';
        // Only proceed if a token exists.
        if (localStorage.getItem('accessToken')) {
            try {
                const userData = await api('/users/me');
                setUser(userData);
                setIsAuthenticated(true);
                logger.info('User session re-validated successfully on page load.', { context, details: { userId: userData._id } });
            } catch (error) {
                // --- THIS IS THE FIX ---
                // If fetching the user fails (e.g., token expired and refresh failed, or network error),
                // we DO NOT call logout(). We simply clear the in-memory state.
                // This will cause ProtectedRoute to redirect to login, but the tokens remain
                // in localStorage for the api service to attempt a refresh on the next interaction.
                logger.warn("Failed to fetch user on initial load. Session may be expired.", { context, details: { error: error.message } });
                setUser(null);
                setIsAuthenticated(false);
                // DO NOT CALL logout() HERE.
            }
        }
        // Always set loading to false after the attempt is made.
        setLoading(false);
    }, []); // Removed logout from dependency array as it's not needed here.

    useEffect(() => {
        logger.info('AuthProvider mounted, attempting to fetch user session.', { context: 'AuthContext.useEffect' });
        fetchUser();
    }, [fetchUser]);

    const login = async (accessToken, refreshToken, userRole) => {
        const context = 'AuthContext.login';
        logger.info('Login successful, setting tokens and fetching user.', { context, details: { role: userRole } });
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setIsAuthenticated(true);
        setLoading(true); // Set loading to true before fetching user
        await fetchUser(); // This will fetch user and set loading to false

        // Navigate based on role after user data is fetched
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