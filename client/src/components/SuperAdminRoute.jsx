import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // User must be authenticated AND have the 'superadmin' role
  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SuperAdminRoute;