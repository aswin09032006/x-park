import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../pages/LoadingPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        switch (user.role) {
            case 'student': return <Navigate to="/dashboard" replace />;
            case 'schooladmin': return <Navigate to="/admin/dashboard" replace />;
            case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
            default: return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;