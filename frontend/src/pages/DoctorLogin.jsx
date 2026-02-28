import React from 'react';

export default function DoctorLogin() {
    const handleLogin = (e) => {
        e.preventDefault();
        // Mocking a successful doctor login
        localStorage.setItem('token', 'mock_doctor_token_456');
        localStorage.setItem('role', 'doctor');
        window.location.href = '/doctor-dashboard';
    };

    return (
        <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-100 p-6">
            <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-emerald-500/20">
                <div className="text-center mb-8">
                    <span className="text-4xl">🩺</span>
                    <h2 className="text-2xl font-bold mt-4">Doctor Portal</h2>
                    <p className="text-slate-400 text-sm mt-1">Secure access for medical professionals</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Medical ID / Email</label>
                        <input type="email" placeholder="dr.smith@hospital.org" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors" required />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-4">
                        Sign In as Doctor
                    </button>
                </form>
            </div>
        </div>
    );
}
