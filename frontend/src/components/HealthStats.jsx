/**
 * HealthStats — Displays Wearable Vitals + Live Environmental Data
 */
import React from 'react';

function StatCard({ label, value, unit, icon, color }) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 flex flex-col items-center justify-center text-center rounded-2xl shadow-xl transition-all duration-300 hover:bg-slate-800/60 hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-full mb-3 bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-lg`}>
                {icon}
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-100">{value !== undefined && value !== null ? value : '--'}</span>
                {value !== undefined && value !== null && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
            </div>
        </div>
    );
}

export default function HealthStats({ heartRate, spo2, temperature, humidity, windSpeed }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
                label="Heart Rate"
                value={heartRate}
                unit="bpm"
                icon="❤️"
                color="from-rose-500/20 to-rose-600/10 border border-rose-500/30 text-rose-400"
            />
            <StatCard
                label="SpO₂"
                value={spo2}
                unit="%"
                icon="💧"
                color="from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 text-indigo-400"
            />
            <StatCard
                label="Temp"
                value={temperature ? Math.round(temperature) : null}
                unit="°C"
                icon="🌡️"
                color="from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400"
            />
            <StatCard
                label="Humidity"
                value={humidity}
                unit="%"
                icon="💨"
                color="from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-400"
            />
            <StatCard
                label="Wind"
                value={windSpeed}
                unit="m/s"
                icon="🍃"
                color="from-slate-500/20 to-slate-600/10 border border-slate-500/30 text-slate-300"
            />
        </div>
    );
}
