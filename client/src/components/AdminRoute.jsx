import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // --- THIS IS THE FIX ---
  // The user's role must be 'schooladmin' to access this route.
  // The previous version was incorrectly checking for 'admin'.
  if (!isAuthenticated || user?.role !== 'schooladmin') {
    // Redirect them to the main login page if not an admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;