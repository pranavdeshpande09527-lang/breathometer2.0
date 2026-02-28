import React, { useState, useEffect } from 'react';
import AQIWidget from '../components/AQIWidget';
import { getPatients, getPatientDetails, getAnalytics } from '../api/doctorApi';
import { Line as LineChart } from 'react-chartjs-2';

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

// Reusable Risk Badge Component
const RiskBadge = ({ level, className = '' }) => {
    let colors = 'bg-slate-800 text-slate-400 border-slate-700';
    if (level === 'Low') colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (level === 'Moderate') colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (level === 'High') colors = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

    return (
        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${colors} ${className}`}>
            {level}
        </span>
    );
};

export default function DoctorDashboard() {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');

    // Detailed View State
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [trendDays, setTrendDays] = useState(7);

    // Page load state
    const [loadingPage, setLoadingPage] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            const [patientsData, analyticsData] = await Promise.all([
                getPatients(),
                getAnalytics()
            ]);
            setPatients(patientsData);
            setFilteredPatients(patientsData);
            setAnalytics(analyticsData);
            setLoadingPage(false);
        };
        fetchInitialData();
    }, []);

    // Search & Filter Effect
    useEffect(() => {
        let result = patients;
        if (search) {
            result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (filterLevel !== 'All') {
            result = result.filter(p => p.riskLevel === filterLevel);
        }
        setFilteredPatients(result);
    }, [search, filterLevel, patients]);

    // Handle Patient Selection
    const handleSelectPatient = async (id) => {
        if (id === selectedPatientId) return;
        setSelectedPatientId(id);
        setLoadingDetails(true);
        const details = await getPatientDetails(id);
        setPatientDetails(details);
        setLoadingDetails(false);
    };

    // Chart Data Preparation
    const timelineData = patientDetails ? {
        labels: patientDetails.timeline.slice(0, trendDays).map(t => t.day),
        datasets: [
            {
                label: 'Risk %',
                data: patientDetails.timeline.slice(0, trendDays).map(t => t.risk),
                borderColor: '#10b981', // emerald-500 base, can be dynamic
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#10b981',
                pointRadius: 4,
            }
        ]
    } : null;

    const chartOptions = {
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
            }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, min: 0, max: 100 }
        }
    };

    if (loadingPage) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up flex flex-col gap-6">

            {/* Header Section */}
            <header className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-xl print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                        <span className="text-emerald-400">⚕️</span> Clinical Monitoring Panel
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium tracking-wide">
                        Real-Time Lung Risk & Patient Analytics
                    </p>
                </div>
                {/* AQI Widget injected into Header */}
                <AQIWidget />
            </header>

            {/* Main Application Matrix */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 print:block">

                {/* Left Column: Patient List */}
                <div className="xl:col-span-1 bg-slate-900/40 border border-slate-700/50 rounded-2xl flex flex-col h-[800px] overflow-hidden shadow-xl print:hidden">
                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-200 mb-4">Patient Directory</h2>
                        <input
                            type="text"
                            placeholder="🔍 Search patients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-sm rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 mb-3"
                        />
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-sm rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                            <option value="All">All Risk Levels</option>
                            <option value="High">High Risk</option>
                            <option value="Moderate">Moderate Risk</option>
                            <option value="Low">Low Risk</option>
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {filteredPatients.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center mt-6 italic">No patients found</p>
                        ) : (
                            filteredPatients.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelectPatient(p.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedPatientId === p.id
                                        ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-200">{p.name}</h3>
                                        <RiskBadge level={p.riskLevel} />
                                    </div>
                                    <p className="text-xs text-slate-500">Updated: {p.lastUpdated}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area: Patient Detail View */}
                <div className="xl:col-span-3 flex flex-col gap-6 print:block">

                    {/* Patient Overview Panel */}
                    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl min-h-[500px] flex flex-col print:bg-white print:text-black print:border-none print:shadow-none print:p-0">

                        {!selectedPatientId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
                                <span className="text-6xl mb-4 opacity-50">📋</span>
                                <h2 className="text-xl font-medium">No Patient Selected</h2>
                                <p className="text-sm mt-2">Select a patient from the directory to view detailed clinical analytics.</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="flex-1 flex flex-col gap-6 animate-pulse p-4">
                                <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                                <div className="h-32 bg-slate-800 rounded w-full"></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-slate-800 rounded"></div>
                                    <div className="h-24 bg-slate-800 rounded"></div>
                                    <div className="h-24 bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            patientDetails && (
                                <div className="flex-1 flex flex-col animate-slide-up">

                                    {/* Print Only Header */}
                                    <div className="hidden print:block mb-8 border-b border-gray-200 pb-4">
                                        <h1 className="text-3xl font-bold text-black">Breathometer Clinical Report</h1>
                                        <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
                                    </div>

                                    {/* Patient Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-700/50 pb-6 gap-4 print:border-gray-200">
                                        <div>
                                            <h2 className="text-3xl font-extrabold text-slate-100 print:text-black">{patientDetails.name}</h2>
                                            <p className="text-sm text-slate-400 mt-1 print:text-gray-600">ID: {patientDetails.id} • Last consultation: Today</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <RiskBadge level={patientDetails.riskLevel} className="text-sm px-3 py-1.5" />
                                            <button
                                                onClick={() => window.print()}
                                                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-premium flex items-center gap-2 print:hidden"
                                            >
                                                <span>📥</span> Download Report
                                            </button>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center print:bg-transparent print:border-gray-200">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 print:text-gray-500">Risk Score</span>
                                            <span className={`text-3xl font-black ${patientDetails.riskScore > 75 ? 'text-rose-400' : patientDetails.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>{patientDetails.riskScore}%</span>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center print:bg-transparent print:border-gray-200">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 print:text-gray-500">SpO₂</span>
                                            <span className="text-3xl font-black text-indigo-400">{patientDetails.lungMetrics.spO2}</span>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center print:bg-transparent print:border-gray-200">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 print:text-gray-500">FEV1</span>
                                            <span className="text-3xl font-black text-slate-200 print:text-black">{patientDetails.lungMetrics.fev1}</span>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center print:bg-transparent print:border-gray-200">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 print:text-gray-500">FVC</span>
                                            <span className="text-3xl font-black text-slate-200 print:text-black">{patientDetails.lungMetrics.fvc}</span>
                                        </div>
                                    </div>

                                    {/* Chart Area */}
                                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 mb-8 shadow-inner print:bg-transparent print:border-gray-200 print:shadow-none print:break-inside-avoid">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider print:text-black">Exposure Timeline</h3>
                                            <div className="flex bg-slate-800 rounded-lg p-1 print:hidden">
                                                <button onClick={() => setTrendDays(7)} className={`px-3 py-1 text-xs font-semibold rounded-md ${trendDays === 7 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>7D</button>
                                                <button onClick={() => setTrendDays(30)} className={`px-3 py-1 text-xs font-semibold rounded-md ${trendDays === 30 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>30D</button>
                                            </div>
                                        </div>
                                        <div className="h-48 w-full">
                                            <LineChart data={timelineData} options={chartOptions} />
                                        </div>
                                    </div>

                                    {/* AI Recommendations */}
                                    <div className="print:break-inside-avoid">
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2 print:text-black">
                                            🤖 AI Clinical Intelligence
                                        </h3>
                                        <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-xl print:bg-transparent print:border-gray-200">
                                            <ul className="space-y-3">
                                                {patientDetails.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex items-start gap-3">
                                                        <span className="text-indigo-400 shrink-0">❖</span>
                                                        <span className="text-sm text-indigo-100 leading-relaxed font-medium print:text-black">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                </div>
                            )
                        )}
                    </div>

                    {/* Phase 3: Analytics Panel (Always Visible below patient details) */}
                    {analytics && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center hover:bg-slate-800 transition-colors cursor-default">
                                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Total Patients</span>
                                <span className="text-3xl font-black text-slate-100">{analytics.totalPatients}</span>
                            </div>
                            <div className="bg-slate-900/60 p-5 rounded-2xl border border-rose-500/20 shadow-xl flex flex-col items-center hover:bg-rose-900/20 transition-colors cursor-default">
                                <span className="text-xs text-rose-400/80 uppercase tracking-widest font-bold mb-1">High Risk</span>
                                <span className="text-3xl font-black text-rose-400">{analytics.highRiskCount}</span>
                            </div>
                            <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/20 shadow-xl flex flex-col items-center hover:bg-amber-900/20 transition-colors cursor-default">
                                <span className="text-xs text-amber-400/80 uppercase tracking-widest font-bold mb-1">Moderate Risk</span>
                                <span className="text-3xl font-black text-amber-400">{analytics.moderateRiskCount}</span>
                            </div>
                            <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col items-center hover:bg-emerald-900/20 transition-colors cursor-default">
                                <span className="text-xs text-emerald-400/80 uppercase tracking-widest font-bold mb-1">Average Risk</span>
                                <span className="text-3xl font-black text-emerald-400">{analytics.averageRisk}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
