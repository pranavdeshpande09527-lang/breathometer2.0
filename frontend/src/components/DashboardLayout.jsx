import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import BreathometerLogo from './BreathometerLogo';
import SathiChat from './SathiChat';

/* ── Sidebar Navigation Items ────────────────────────────── */
// These can be dynamically filtered in the future based on user role
const getNavItems = (role) => {
    if (role === 'doctor') {
        return [
            { to: '/doctor-dashboard', label: 'Patient Overview', icon: '🩺' },
            { to: '/analytics', label: 'Global Analytics', icon: '🌍' },
        ];
    }
    return [
        { to: '/dashboard', label: 'My Dashboard', icon: '🫁' },
        { to: '/timeline', label: 'Timeline', icon: '📊' },
        { to: '/analytics', label: 'Community Analytics', icon: '🌍' },
    ];
};

export default function DashboardLayout() {
    const role = localStorage.getItem('role') || 'user';
    const navItems = getNavItems(role);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
    };

    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 flex flex-col z-50">
                {/* Logo */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-xl shadow-lg shadow-indigo-500/10">
                            <BreathometerLogo className="w-10 h-10 drop-shadow-lg" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 tracking-wider">
                                BREATHOMETER
                            </h1>
                            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">AI Lung Monitor</p>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 shadow-md'
                                }`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer & Logout */}
                <div className="p-4 border-t border-slate-700/50 flex flex-col gap-3">
                    <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                        <p className="text-[11px] text-slate-400">System Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-glow"></span>
                            <span className="text-xs text-emerald-400">All systems operational</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 text-sm text-rose-400 font-medium bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area (renders the nested page based on route) */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>

            {/* Chatbot overlay available on all authenticated pages */}
            <SathiChat />
        </div>
    );
}
