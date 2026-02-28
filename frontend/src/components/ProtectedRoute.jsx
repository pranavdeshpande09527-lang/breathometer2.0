import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute
 * Checks if a user is authenticated (JWT) and matches the required role.
 * If unauthorized, redirects back to the Landing page.
 */
export default function ProtectedRoute({ requiredRole }) {
    // Basic mock authentication check since backend JWT integration isn't finished yet
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role') || 'guest'; // e.g., 'user', 'doctor'

    // If no token exists, immediately redirect to landing
    if (!token) {
        // You can also pass state to show a "Please login" toast
        return <Navigate to="/" replace />;
    }

    // If role doesn't match the required route role(s), redirect to their explicit dashboard or landing
    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(userRole)) {
            if (userRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
            if (userRole === 'user') return <Navigate to="/dashboard" replace />;
            return <Navigate to="/" replace />;
        }
    }

    // Authorized. Render the nested child routes (which will be DashboardLayout -> Page)
    return <Outlet />;
}
