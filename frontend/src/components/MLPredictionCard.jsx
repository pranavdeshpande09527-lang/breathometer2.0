/**
 * MLPredictionCard — Simple PM2.5 and PM10 prediction from weather inputs.
 * Auto-syncs with Dashboard city and real-time weather data.
 */
import React, { useState, useEffect } from 'react';
import { predictAirQuality } from '../services/api';

const FIELDS = [
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'humidity', label: 'Humidity', unit: '%' },
    { key: 'pressure', label: 'Pressure', unit: 'hPa' },
    { key: 'visibility', label: 'Visibility', unit: 'km' },
    { key: 'wind_speed', label: 'Wind Speed', unit: 'km/h' },
];

export default function MLPredictionCard({ dashboardCity, dashboardAqi, onPredict }) {
    const [form, setForm] = useState({
        temperature: '',
        humidity: '',
        pressure: '',
        visibility: '',
        wind_speed: '',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auto-sync form with dashboard real-time data and trigger prediction
    useEffect(() => {
        if (dashboardAqi && dashboardCity) {
            const newForm = {
                temperature: Math.round(dashboardAqi.temperature || 0),
                humidity: Math.round(dashboardAqi.humidity || 0),
                pressure: Math.round(dashboardAqi.pressure || 0),
                visibility: Math.max(1, Math.round((dashboardAqi.visibility || 0) / 1000)), // m to km
                wind_speed: Math.round((dashboardAqi.wind_speed || 0) * 3.6), // m/s to km/h
            };
            setForm(newForm);

            // Auto-trigger prediction
            handlePredict(newForm, dashboardCity);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardAqi, dashboardCity]);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handlePredict = async (currentForm = form, currentCity = dashboardCity) => {
        setError(null);
        setResult(null);

        // Validate all fields filled
        for (const f of FIELDS) {
            if (currentForm[f.key] === '' || isNaN(Number(currentForm[f.key]))) {
                setError(`Valid ${f.label} is required for AI prediction.`);
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                temperature: Number(currentForm.temperature),
                humidity: Number(currentForm.humidity),
                pressure: Number(currentForm.pressure),
                visibility: Number(currentForm.visibility),
                wind_speed: Number(currentForm.wind_speed),
                city: currentCity?.trim() || 'Delhi'
            };
            const data = await predictAirQuality(payload);
            setResult({ pm25: data.predicted_pm25, pm10: data.predicted_pm10 });
            if (onPredict) {
                onPredict(data.predicted_pm25, data.predicted_pm10);
            }
        } catch (err) {
            setError(err?.response?.data?.detail || 'Prediction failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    // Color based on PM2.5 level
    const getColor = (pm25) => {
        if (pm25 <= 50) return '#1aaf64';
        if (pm25 <= 100) return '#f5a623';
        if (pm25 <= 150) return '#ff8c00';
        if (pm25 <= 200) return '#e53935';
        return '#8e24aa';
    };

    const getLabel = (pm25) => {
        if (pm25 <= 50) return 'Good';
        if (pm25 <= 100) return 'Moderate';
        if (pm25 <= 150) return 'Unhealthy for Sensitive';
        if (pm25 <= 200) return 'Unhealthy';
        return 'Very Unhealthy';
    };

    return (
        <div className="glass-card p-6 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                </div>
                <div>
                    <h3 className="text-ink-dark font-semibold">ML Air Quality Prediction for {dashboardCity || '...'}</h3>
                    <p className="text-xs text-ink-muted">Dual Random Forests · PM2.5 & PM10</p>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
            )}

            {/* Result */}
            {result !== null && (
                <div className="mt-5 grid grid-cols-2 gap-4 animate-slide-up">
                    <div className="text-center bg-surface-base rounded-xl p-4 border border-brand-terracotta/5">
                        <p className="text-xs text-ink-muted mb-1">Predicted PM2.5</p>
                        <p className="text-4xl font-bold" style={{ color: getColor(result.pm25) }}>
                            {result.pm25}
                        </p>
                        <p className="text-sm mt-1" style={{ color: getColor(result.pm25) }}>
                            {getLabel(result.pm25)}
                        </p>
                    </div>
                    <div className="text-center bg-surface-base rounded-xl p-4 border border-brand-terracotta/5">
                        <p className="text-xs text-ink-muted mb-1">Predicted PM10</p>
                        <p className="text-4xl font-bold text-blue-400">
                            {result.pm10}
                        </p>
                        <p className="text-sm mt-1 text-blue-400">
                            µg/m³
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
