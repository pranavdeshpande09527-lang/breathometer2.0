import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Hero Section */}
            <div className="text-center mb-16 relative z-10 animate-slide-up">
                <div className="w-16 h-16 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10">
                    <span className="text-3xl filter drop-shadow-md">🫁</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                    Real-Time Air Quality &<br />Lung Health Monitoring
                </h1>
                <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                    Personalized lung impact analysis powered by AI
                </p>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">

                {/* User Portal Card */}
                <div
                    onClick={() => navigate('/login/user')}
                    className="group cursor-pointer bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800/60 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col items-center text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        👤
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-indigo-300 transition-colors">User Portal</h2>
                    <p className="text-slate-400 mb-8 flex-1">
                        Track air exposure, lung risk score, alerts, and dashboard
                    </p>
                    <button className="w-full py-3 px-6 rounded-xl font-semibold bg-slate-800 text-slate-200 border border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300">
                        Continue as User
                    </button>
                </div>

                {/* Doctor Portal Card */}
                <div
                    onClick={() => navigate('/login/doctor')}
                    className="group cursor-pointer bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800/60 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col items-center text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        🩺
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-emerald-300 transition-colors">Doctor Portal</h2>
                    <p className="text-slate-400 mb-8 flex-1">
                        Monitor patient reports, risk trends, analytics
                    </p>
                    <button className="w-full py-3 px-6 rounded-xl font-semibold bg-slate-800 text-slate-200 border border-slate-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                        Continue as Doctor
                    </button>
                </div>

            </div>
        </div>
    );
}
