/**
 * Dashboard Page — Personal Lung Health Dashboard
 * Displays AQI, risk gauge, health stats, and alert panel using STRICT REAL-TIME data.
 */
import React, { useState, useEffect } from 'react';
import AQICard from '../components/AQICard';
import RiskGauge from '../components/RiskGauge';
import AlertPanel from '../components/AlertPanel';
import HealthStats from '../components/HealthStats';
import HealthProfile from '../components/HealthProfile';
import RiskExplanation from '../components/RiskExplanation';
import MLPredictionCard from '../components/MLPredictionCard';
import LungRiskCard from '../components/LungRiskCard';
import WeeklyReportCard from '../components/WeeklyReportCard';
import BreathingGame from '../components/BreathingGame';
import { getAQI, calculateRisk } from '../services/api';

/* ── Mock wearable data (since we don't have real hardware sensors yet) ── */
const MOCK_WEARABLE = { heart_rate: 78, spo2: 96.5 };

export default function Dashboard() {
    const [city, setCity] = useState('Delhi');
    const [searchInput, setSearchInput] = useState('Delhi');
    const [aqiData, setAqiData] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [wearable] = useState(MOCK_WEARABLE);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [profile, setProfile] = useState(null);
    const [prevRisk, setPrevRisk] = useState(null);

    const [predictedPm25, setPredictedPm25] = useState(null);
    const [predictedPm10, setPredictedPm10] = useState(null);

    // Weather state is now primarily fed by the real AQI API response, but can be updated by ML if needed
    const [fetchedWeather, setFetchedWeather] = useState({ temp: null, hum: null, aqi: null });

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setCity(searchInput.trim());
        }
    };

    const handlePredictions = (pm25, pm10) => {
        setPredictedPm25(pm25);
        setPredictedPm10(pm10);
    };

    const handleWeatherFetched = (temp, hum, fetchedAqi, fetchedCity) => {
        setFetchedWeather({ temp, hum, aqi: fetchedAqi });
        if (fetchedCity) {
            setCity(fetchedCity);
            setSearchInput(fetchedCity);
        }
    };

    async function fetchData() {
        setLoading(true);
        setApiError(null);
        try {
            // 1. Fetch strict real-time AQI and Weather data
            const aqi = await getAQI(city);
            setAqiData(aqi);

            // Sync weather state for the prediction models to use
            setFetchedWeather({
                temp: aqi.temperature,
                hum: aqi.humidity,
                aqi: aqi.aqi
            });

            // 2. Calculate base risk from backend API securely
            const risk = await calculateRisk({
                aqi: aqi.aqi,
                heart_rate: wearable.heart_rate,
                spo2: wearable.spo2,
                city,
                profile,
            });
            setPrevRisk(riskData?.risk_score || null);
            setRiskData(risk);
        } catch (err) {
            console.error('Strict API validation failed:', err);

            // Extract best error message
            let errMsg = 'Connection failed.';
            if (err.response?.data?.detail) {
                errMsg = typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail);
            } else if (err.message) {
                errMsg = err.message;
            }

            setApiError(`Unable to fetch real-time environmental data for '${city}'. Error: ${errMsg}. Please verify API configuration or try another city.`);
            setAqiData(null);
            setRiskData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // Removed wearable and profile to prevent infinite re-render loops from HealthProfile triggering new object references
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [city]);

    // Save latest real data to localStorage for SathiChat context
    useEffect(() => {
        if (aqiData) localStorage.setItem('breathometer_aqi', JSON.stringify(aqiData));
        if (riskData) localStorage.setItem('breathometer_risk', JSON.stringify(riskData));
    }, [aqiData, riskData]);

    const riskTrend = prevRisk && riskData
        ? (riskData.risk_score > prevRisk ? 'up' : riskData.risk_score < prevRisk ? 'down' : 'flat')
        : 'flat';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Fetching real-time environmental data...</p>
            </div>
        );
    }

    // STRICT ERROR BOUNDARY — If backend fails, we show this block. NO MOCKS ALLOWED.
    if (apiError) {
        return (
            <div className="space-y-6 animate-slide-up">
                <HealthProfile onProfileUpdate={setProfile} />
                <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl shadow-rose-500/10">
                    <span className="text-6xl mb-4">⚠️</span>
                    <h2 className="text-2xl font-bold text-rose-400 mb-2">Connection Error</h2>
                    <p className="text-rose-200/80 mb-6 max-w-lg">{apiError}</p>

                    <form onSubmit={handleSearch} className="flex gap-4 w-full max-w-md justify-center mb-4">
                        <input
                            type="text"
                            name="searchCity"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Try another city..."
                            className="flex-1 bg-black/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        />
                        <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-colors">
                            Search City
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        {profile?.name ? `Hello ${profile.name} 👋` : 'Health Dashboard'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Real-time monitoring</p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-2xl shadow-lg w-full md:w-auto">
                    <span className="pl-3 text-slate-400 text-lg">📍</span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search any city..."
                        className="bg-transparent text-slate-100 placeholder-slate-500 px-2 py-1 focus:outline-none w-full md:w-48"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md">
                        Search
                    </button>
                </form>
            </div>

            {/* Health Profile */}
            <HealthProfile onProfileUpdate={setProfile} />

            {/* Top Row: AQI + Risk Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                <AQICard data={aqiData} />
                <div className="relative">
                    <RiskGauge score={riskData?.risk_score} level={riskData?.risk_level} />
                    {/* Risk Trend Indicator */}
                    {riskTrend !== 'flat' && (
                        <div className={`absolute top-6 right-6 flex items-center gap-1 font-bold text-lg px-3 py-1 rounded-full ${riskTrend === 'up' ? 'text-rose-400 bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                            {riskTrend === 'up' ? '↑' : '↓'}
                        </div>
                    )}
                </div>
            </div>

            {/* Health & Environment Stats (now fed with live weather data!) */}
            <HealthStats
                heartRate={wearable.heart_rate}
                spo2={wearable.spo2}
                temperature={aqiData?.temperature}
                humidity={aqiData?.humidity}
                windSpeed={aqiData?.wind_speed}
            />

            {/* AI Predictions & Breathing Game Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {/* ML Prediction Card */}
                <MLPredictionCard
                    dashboardCity={city}
                    dashboardAqi={aqiData}
                    onPredict={handlePredictions}
                />

                {/* Gamified Lung Capacity Tester */}
                <BreathingGame />
            </div>

            {/* Lung Infection Risk Prediction Card */}
            <LungRiskCard
                aqiData={aqiData}
                profile={profile}
                predictedPm25={predictedPm25}
                predictedPm10={predictedPm10}
                fetchedWeather={fetchedWeather}
            />

            {/* Weekly Lungs AI Report */}
            <WeeklyReportCard
                aqiData={aqiData}
                profile={profile}
                predictedPm25={predictedPm25}
                predictedPm10={predictedPm10}
                fetchedWeather={fetchedWeather}
            />

            {/* Alert Panel */}
            <AlertPanel riskData={riskData} />

            {/* AI Explanation */}
            <RiskExplanation aqiData={aqiData} riskData={riskData} profile={profile} />
        </div>
    );
}
