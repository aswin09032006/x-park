import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../pages/LoadingPage'; // Import your Loader component

/**
 * A wrapper component that protects a route based on authentication and roles.
 * It now handles the initial loading state from the AuthContext.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The component to render if authorized.
 * @param {Array<string>} [props.allowedRoles] - Optional array of roles that are allowed access.
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // --- START OF FIX ---

    // 1. While the authentication status is being checked, show a loader.
    // This prevents any premature redirects or rendering of the child component.
    if (loading) {
        return <Loader />;
    }

    // 2. Once loading is complete, check for authentication. If not authenticated, redirect to login.
    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // --- END OF FIX ---

    // 3. If authenticated, check for role-based authorization (if allowedRoles are provided).
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to a safe default page (like their own dashboard) if the role is not authorized.
        // You could also create a dedicated '/unauthorized' page for a better UX.
        switch (user.role) {
            case 'student': return <Navigate to="/dashboard" replace />;
            case 'teacher': return <Navigate to="/teacher-dashboard" replace />;
            case 'admin': return <Navigate to="/admin-dashboard" replace />;
            default: return <Navigate to="/" replace />;
        }
    }

    // 4. If all checks pass, render the requested child component.
    return children;
};

export default ProtectedRoute;