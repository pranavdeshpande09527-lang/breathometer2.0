import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import UserLogin from './pages/UserLogin';
import DoctorLogin from './pages/DoctorLogin';
import FullScreenLoader from './components/FullScreenLoader';

// Protected Wrappers
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Protected Pages (User)
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import Analytics from './pages/Analytics';

// Protected Pages (Doctor)
import DoctorDashboard from './pages/DoctorDashboard';

/* ── Main App ────────────────────────────────────────────── */
export default function App() {
    const [appIsLoading, setAppIsLoading] = useState(true);

    useEffect(() => {
        // Let the beautiful SVG drawing and text fade animation play for 3.5s on boot
        const startupTimer = setTimeout(() => {
            setAppIsLoading(false);
        }, 3500);
        return () => clearTimeout(startupTimer);
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <FullScreenLoader isLoading={appIsLoading} />

            <Routes>
                {/* ── Public Routes (No Sidebar) ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login/user" element={<UserLogin />} />
                <Route path="/login/doctor" element={<DoctorLogin />} />

                {/* ── Protected Routes Wrapper (Includes Sidebar & Chatbot) ── */}
                <Route element={<DashboardLayout />}>

                    {/* Shared Routes (Both Roles) */}
                    <Route element={<ProtectedRoute requiredRole={['user', 'doctor']} />}>
                        <Route path="/analytics" element={<Analytics />} />
                    </Route>

                    {/* User Only Routes */}
                    <Route element={<ProtectedRoute requiredRole="user" />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/timeline" element={<Timeline />} />
                    </Route>

                    {/* Doctor Only Routes */}
                    <Route element={<ProtectedRoute requiredRole="doctor" />}>
                        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                    </Route>

                </Route>
            </Routes>
        </div>
    );
}
