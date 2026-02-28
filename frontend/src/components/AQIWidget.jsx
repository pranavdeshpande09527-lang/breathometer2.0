import React, { useState } from 'react';
import { getAQI } from '../api/doctorApi';

export default function AQIWidget() {
    const [city, setCity] = useState('');
    const [aqiData, setAqiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!city.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getAQI(city);
            setAqiData({
                aqi: data.aqi,
                category: data.category || getCategory(data.aqi),
            });
        } catch (err) {
            setError('Failed to fetch AQI data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getCategory = (val) => {
        if (val <= 50) return 'Good';
        if (val <= 100) return 'Moderate';
        if (val <= 150) return 'Unhealthy for Sensitive Groups';
        if (val <= 200) return 'Unhealthy';
        if (val <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    };

    const getBgColor = (category) => {
        const lower = category?.toLowerCase() || '';
        if (lower.includes('good')) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
        if (lower.includes('moderate')) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
        if (lower.includes('hazardous') || lower.includes('very')) return 'bg-rose-600/20 border-rose-600/50 text-rose-500';
        if (lower.includes('unhealthy')) return 'bg-rose-500/20 border-rose-500/50 text-rose-400';
        return 'bg-slate-800 border-slate-700 text-slate-300'; // fallback
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xl">
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                <input
                    type="text"
                    placeholder="Enter city..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 w-full md:w-40 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={loading || !city.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Check'}
                </button>
            </form>

            <div className="flex-1 w-full flex items-center justify-end">
                {error && <p className="text-rose-400 text-xs">{error}</p>}

                {aqiData && !error && (
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${getBgColor(aqiData.category)} animate-slide-up`}>
                        <div className="font-bold text-2xl tracking-tighter">{Math.round(aqiData.aqi)}</div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest leading-tight">Live AQI</span>
                            <span className="text-xs font-medium leading-tight">{aqiData.category}</span>
                        </div>
                    </div>
                )}

                {!aqiData && !loading && !error && (
                    <div className="text-slate-500 text-xs italic px-2 hidden md:block">
                        Enter a city for real-time AQI
                    </div>
                )}
            </div>
        </div>
    );
}
