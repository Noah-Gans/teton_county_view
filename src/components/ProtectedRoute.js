import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, subscriptionStatus, loading } = useUser();

  // If still checking Auth or Firestore, show a spinner or blank
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no user or not active subscription, redirect
  if (!user || subscriptionStatus !== 'active') {
    return <Navigate to="/login" replace />;
    // or /login, or a "subscribe" route—your choice
  }

  // Otherwise, render the protected page
  return children;
}

export default ProtectedRoute;
