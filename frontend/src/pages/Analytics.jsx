/**
 * Analytics Page — Public Health Analytics Panel
 * Doughnut chart for risk distribution + city stats.
 */
import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import PublicStats from '../components/PublicStats';
import { getAnalytics } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ── Mock data ─────────────────────────────────────────── */
const MOCK_ANALYTICS = {
    total_users: 1247,
    total_readings: 18432,
    cities_monitored: 12,
    average_aqi_today: 134,
    risk_distribution: { Safe: 42, Moderate: 35, 'High Risk': 23 },
    top_polluted_cities: [
        { city: 'Delhi', aqi: 285, dominant_pollutant: 'PM2.5' },
        { city: 'Mumbai', aqi: 172, dominant_pollutant: 'PM10' },
        { city: 'Kolkata', aqi: 158, dominant_pollutant: 'PM2.5' },
        { city: 'Bangalore', aqi: 98, dominant_pollutant: 'O3' },
        { city: 'Chennai', aqi: 87, dominant_pollutant: 'NO2' },
    ],
    health_alerts_today: 38,
    top_symptoms: [
        { symptom: 'Dry Cough', percentage: 42 },
        { symptom: 'Wheezing', percentage: 28 },
        { symptom: 'Shortness of Breath', percentage: 18 },
        { symptom: 'Eye Irritation', percentage: 12 }
    ],
    demographics_affected: {
        children_under_12: 15,
        adults: 35,
        seniors_over_60: 50
    }
};

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const resp = await getAnalytics();
                setData(resp);
            } catch {
                setData(MOCK_ANALYTICS);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const dist = data?.risk_distribution || {};

    const doughnutData = {
        labels: Object.keys(dist),
        datasets: [
            {
                data: Object.values(dist),
                backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                borderColor: '#0f172a',
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { family: 'Inter' }, usePointStyle: true, padding: 20 },
            },
        },
    };

    const barData = {
        labels: (data?.top_polluted_cities || []).map((c) => c.city),
        datasets: [
            {
                label: 'AQI',
                data: (data?.top_polluted_cities || []).map((c) => c.aqi),
                backgroundColor: (data?.top_polluted_cities || []).map((c) =>
                    c.aqi <= 100 ? 'rgba(16, 185, 129, 0.6)' : c.aqi <= 200 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(244, 63, 94, 0.6)'
                ),
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const barOptions = {
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
                padding: 12,
                cornerRadius: 12,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } } },
        },
    };

    /* ── KPI cards ───────────────────────────────────────── */
    const kpis = [
        { label: 'Total Users', value: data?.total_users?.toLocaleString(), icon: '👥' },
        { label: 'Readings Today', value: data?.total_readings?.toLocaleString(), icon: '📡' },
        { label: 'Cities Monitored', value: data?.cities_monitored, icon: '🏙️' },
        { label: 'Alerts Today', value: data?.health_alerts_today, icon: '🚨' },
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            <div>
                <h1 className="text-2xl font-bold text-ink-dark">Public Health Analytics</h1>
                <p className="text-sm text-ink-muted mt-1">Aggregated environmental health data across cities</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <div key={i} className="glass-card-hover p-5 text-center">
                        <span className="text-2xl">{kpi.icon}</span>
                        <p className="text-2xl font-bold text-ink-dark mt-2">{kpi.value}</p>
                        <p className="text-[11px] text-ink-muted uppercase tracking-wider mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-ink-dark mb-4">Risk Distribution</h3>
                    <div style={{ height: '280px' }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-ink-dark mb-4">City AQI Comparison</h3>
                    <div style={{ height: '280px' }}>
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* Detailed Health Symptoms & Demographics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Reported Symptoms */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-ink-dark mb-4 border-b border-brand-sand pb-2">Top Reported Symptoms Today</h3>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {(data?.top_symptoms || []).map((symptomData, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-ink-dark">{symptomData.symptom}</span>
                                    <span className="text-xs text-ink-muted">{symptomData.percentage}%</span>
                                </div>
                                <div className="w-full bg-surface-base0 rounded-full h-2 overflow-hidden border border-brand-sand/30">
                                    <div
                                        className="h-2 rounded-full bg-brand-orange transition-all duration-1000"
                                        style={{ width: `${symptomData.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Highly Vulnerable Demographics Analysis */}
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-ink-dark mb-4 border-b border-brand-sand pb-2">Vulnerability Demographics</h3>
                        <p className="text-xs text-ink-muted mb-6">Of the users reporting respiratory distress today, this is the breakdown of age groups highly affected by the current AQI anomalies.</p>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-surface-base0 rounded-xl border border-brand-sand/50">
                                <span className="text-3xl mb-2 block">👶</span>
                                <p className="text-2xl font-bold text-brand-teal mt-1">{data?.demographics_affected?.children_under_12}%</p>
                                <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Children &lt;12</p>
                            </div>
                            <div className="p-4 bg-surface-base0 rounded-xl border border-brand-sand/50">
                                <span className="text-3xl mb-2 block">🧑</span>
                                <p className="text-2xl font-bold text-warning-400 mt-1">{data?.demographics_affected?.adults}%</p>
                                <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Adults (12-60)</p>
                            </div>
                            <div className="p-4 bg-surface-base0 rounded-xl border border-brand-sand/50">
                                <span className="text-3xl mb-2 block">🧓</span>
                                <p className="text-2xl font-bold text-danger-400 mt-1">{data?.demographics_affected?.seniors_over_60}%</p>
                                <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Seniors 60+</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* City Table */}
            <PublicStats analytics={data} />
        </div>
    );
}
