import React, { useState } from 'react';
import { generateWeeklyReport } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function WeeklyReportCard({ aqiData, profile, predictedPm25, predictedPm10, fetchedWeather }) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Reconstruct the current state to send to backend for simulation mapping
            const payload = {
                city: "Local",
                pm25: predictedPm25 || 45.0,
                pm10: predictedPm10 || 80.0,
                aqi: fetchedWeather?.aqi || aqiData?.aqi || 100,
                temperature: fetchedWeather?.temp || 28.5,
                humidity: fetchedWeather?.hum || 60.0,
                age: profile?.age || 30,
                smoking: profile?.smoker || false,
                cigarettes_per_day: 0,
                asthma: profile?.asthma || false,
                copd: profile?.copd || false,
                previous_infection: false,
                outdoor_exposure: "Low",
                cough_severity: 0,
                cough_type: "Dry",
                symptoms_duration_days: 0,
                breathlessness_severity: 0,
                wheezing: false,
                spo2: 98.0,
                fever: false,
                chest_pain: false
            };
            const data = await generateWeeklyReport(payload);
            setReport(data);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        if (level === 'Low') return 'text-brand-teal';
        if (level === 'Moderate') return 'text-warning-400';
        return 'text-danger-400';
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const getHexColor = (level) => {
        if (level === 'High') return '#f43f5e';      // rose-500
        if (level === 'Moderate') return '#f59e0b';  // amber-500
        return '#10b981';                            // emerald-500
    };

    const lineData = report ? {
        labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        datasets: [
            {
                label: 'Risk %',
                data: report.daily_risks,
                borderColor: getHexColor(report.avg_risk_level),
                backgroundColor: getHexColor(report.avg_risk_level) + '33', // 20% opacity
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: getHexColor(report.avg_risk_level),
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    } : null;

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: { label: (ctx) => `${ctx.raw}% Risk` }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
            y: { display: false, min: 0, max: 100 }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return (
        <div className="bg-surface-card shadow-premium border border-brand-sand backdrop-blur-md rounded-2xl p-6 shadow-xl mb-6 text-ink-dark relative overflow-hidden print:shadow-none print:border-none print:bg-white print:text-black">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 opacity-20 blur-[100px] rounded-full pointer-events-none transition-colors 
                ${report?.avg_risk_level === 'High' ? 'bg-danger-500' : report?.avg_risk_level === 'Moderate' ? 'bg-warning-500' : 'bg-surface-base0'}
            `} />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-brand-orange">📅</span> Weekly Lungs AI Report
                </h2>
                {!report && (
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-5 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all print:hidden"
                    >
                        {loading ? 'Analyzing...' : 'Generate Weekly Report'}
                    </button>
                )}
                {report && (
                    <button
                        onClick={handlePrintPDF}
                        className="px-4 py-2 bg-surface-base0 hover:bg-surface-card border border-brand-sand rounded-lg text-xs font-semibold text-ink-dark transition-colors print:hidden flex items-center gap-2"
                    >
                        Export PDF 🖨️
                    </button>
                )}
            </div>

            {error && <p className="text-danger-400 text-sm mb-4">{error}</p>}

            {/* Generated Report View */}
            {report && (
                <div className="animate-slide-up space-y-6 relative z-10 print:mt-0">

                    {/* Print-only title */}
                    <div className="hidden print:block mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold text-black font-serif">Breathometer Weekly Lung Analysis</h1>
                        <p className="text-sm text-gray-500 italic mt-1">Generated by Breathometer AI</p>
                    </div>

                    {/* Header Risk Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
                        <div className="bg-gray-900/40 p-5 rounded-2xl border border-brand-sand flex flex-col items-center justify-center text-center print:bg-transparent print:border-gray-200">
                            <p className="text-sm text-ink-muted uppercase tracking-widest font-semibold mb-2">Weekly Risk Level</p>
                            <div className="text-6xl font-black tracking-tighter mb-1">
                                <span className={getRiskColor(report.avg_risk_level)}>{report.avg_risk_percentage}%</span>
                            </div>
                            <div className={`text-sm font-bold uppercase tracking-widest ${getRiskColor(report.avg_risk_level)} px-3 py-1 bg-surface-card shadow-premium rounded-full border border-brand-sand`}>
                                {report.avg_risk_level} RISK
                            </div>
                        </div>

                        {/* Trend Graph & Summary */}
                        <div className="bg-gray-900/40 p-5 rounded-2xl border border-brand-sand flex flex-col justify-between print:bg-transparent print:border-gray-200 print:break-inside-avoid">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm font-semibold text-ink-muted">7-Day Risk Trend</p>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${report.trend === 'Increasing' ? 'text-danger-400 bg-danger-400/20' :
                                    report.trend === 'Decreasing' ? 'text-brand-teal bg-safe-400/20' :
                                        'text-warning-400 bg-warning-400/20'
                                    }`}>
                                    {report.trend === 'Increasing' ? '⬆ Increasing' : report.trend === 'Decreasing' ? '⬇ Decreasing' : '➖ Stable'}
                                </span>
                            </div>

                            {/* Mini 7 dot Line Graph using Chart.js */}
                            <div className="h-24 w-full mt-2">
                                <Line data={lineData} options={lineOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
                        {/* Summary Stats Grid */}
                        <div className="bg-gray-900/40 p-5 rounded-2xl border border-brand-sand print:bg-transparent print:border-gray-200 print:break-inside-avoid">
                            <h3 className="text-sm font-semibold text-ink-muted mb-4 border-b border-brand-sand pb-2">Weekly Averages</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-ink-muted">Avg AQI</p>
                                    <p className="text-lg font-bold">{report.avg_aqi}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-ink-muted">Avg SpO₂</p>
                                    <p className="text-lg font-bold text-blue-400">{report.avg_spo2}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-ink-muted">Cough Sev.</p>
                                    <p className="text-lg font-bold">{report.avg_cough_severity}/10</p>
                                </div>
                                <div>
                                    <p className="text-xs text-ink-muted">Highest Symptom</p>
                                    <p className="text-sm font-bold text-warning-400 mt-1">{report.highest_symptom}</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Insights & Recs & Diseases */}
                        <div className="flex flex-col gap-4 print:break-inside-avoid">
                            <div className="bg-primary-900/20 border border-primary-500/30 p-4 rounded-xl flex-1 print:bg-transparent print:border-gray-200">
                                <h3 className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span>🧠</span> AI Insights
                                </h3>
                                <ul className="space-y-2">
                                    {report.insights.map((insight, idx) => (
                                        <li key={idx} className="text-sm text-primary-100 flex items-start gap-2">
                                            <span className="text-brand-orange mt-0.5">•</span>
                                            <span className="leading-snug">{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-danger-900/20 border border-danger-500/30 p-4 rounded-xl flex-1 print:bg-transparent print:border-gray-200 print:mt-4">
                                <h3 className="text-xs font-bold text-danger-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span>🦠</span> Pollution-Related Disease Vulnerabilities
                                </h3>
                                <ul className="space-y-3">
                                    {report.disease_risks?.map((diseaseRisk, idx) => (
                                        <li key={idx} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-danger-100 font-medium">{diseaseRisk.name}</span>
                                                <span className="text-xs font-bold text-danger-400">{diseaseRisk.risk_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-danger-900/50 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-danger-500 h-1.5 rounded-full transition-all duration-1000"
                                                    style={{ width: `${diseaseRisk.risk_percentage}%` }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-safe-900/20 border border-safe-500/30 p-4 rounded-xl flex-1 print:bg-transparent print:border-gray-200 print:mt-4">
                                <h3 className="text-xs font-bold text-brand-teal uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>💡</span> Actionable Recommendation
                                </h3>
                                <p className="text-sm text-safe-100 font-medium leading-snug">
                                    {report.recommendation}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-brand-sand pt-4 mt-2 print:hidden">
                        <button onClick={handleGenerate} disabled={loading} className="text-xs text-ink-muted hover:text-ink-dark transition-colors flex items-center gap-1">
                            ↻ Regenerate Simulated Data
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
