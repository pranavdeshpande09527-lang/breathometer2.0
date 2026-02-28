import axios from 'axios';

// Use same base URL as global api.js or fallback to localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach Authorization token if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Since the backend might not have these endpoints yet, we use mock fallbacks when API fails.
export const getPatients = async () => {
    try {
        const response = await api.get('/api/doctor/patients');
        return response.data;
    } catch (error) {
        console.warn('Backend /api/doctor/patients failed, using mock data.');
        return [
            { id: '1', name: 'Alex Mercer', riskLevel: 'High', lastUpdated: '10 mins ago' },
            { id: '2', name: 'Sarah Connor', riskLevel: 'Moderate', lastUpdated: '1 hour ago' },
            { id: '3', name: 'James Holden', riskLevel: 'Low', lastUpdated: '3 hours ago' },
            { id: '4', name: 'Ellen Ripley', riskLevel: 'Moderate', lastUpdated: '1 day ago' },
            { id: '5', name: 'John Shepard', riskLevel: 'Low', lastUpdated: '2 days ago' },
        ];
    }
};

export const getPatientDetails = async (id) => {
    try {
        const response = await api.get(`/api/doctor/patients/${id}`);
        return response.data;
    } catch (error) {
        console.warn(`Backend /api/doctor/patients/${id} failed, using mock data.`);
        const riskLevel = id === '1' ? 'High' : (id === '2' || id === '4') ? 'Moderate' : 'Low';
        const riskScore = id === '1' ? 88 : (id === '2' || id === '4') ? 55 : 22;

        return {
            id,
            name: id === '1' ? 'Alex Mercer' : 'Mock Patient',
            riskScore,
            riskLevel,
            timeline: [
                { day: 'Mon', aqi: 150, risk: 80 },
                { day: 'Tue', aqi: 160, risk: 85 },
                { day: 'Wed', aqi: 140, risk: 75 },
                { day: 'Thu', aqi: 180, risk: 88 },
                { day: 'Fri', aqi: 190, risk: 90 },
                { day: 'Sat', aqi: 170, risk: 86 },
                { day: 'Sun', aqi: 155, risk: 82 },
            ],
            lungMetrics: {
                spO2: id === '1' ? '92%' : '98%',
                fev1: id === '1' ? '65%' : '85%',
                fvc: id === '1' ? '70%' : '90%',
            },
            recommendations: [
                'Schedule immediate telehealth follow-up',
                'Prescribe bronchodilator adjustments',
                'Advise strict indoor isolation due to AQI',
            ]
        };
    }
};

export const getAnalytics = async () => {
    try {
        const response = await api.get('/api/doctor/analytics');
        return response.data;
    } catch (error) {
        console.warn('Backend /api/doctor/analytics failed, using mock data.');
        return {
            averageRisk: 48,
            totalPatients: 142,
            highRiskCount: 18,
            moderateRiskCount: 45,
            lowRiskCount: 79,
        };
    }
};

export const getAQI = async (city) => {
    try {
        const response = await api.get(`/api/doctor/aqi/${encodeURIComponent(city)}`);
        return response.data;
    } catch (error) {
        console.warn(`Backend /api/doctor/aqi/${city} failed. Falling back to public AQI route or mock.`);
        try {
            // Fallback to our existing public AQI route if possible
            const publicRes = await api.get(`/aqi/${encodeURIComponent(city)}`);
            if (publicRes.data && publicRes.data.aqi) {
                return {
                    aqi: publicRes.data.aqi,
                    category: publicRes.data.aqi > 150 ? 'Hazardous' : publicRes.data.aqi > 100 ? 'Unhealthy' : publicRes.data.aqi > 50 ? 'Moderate' : 'Good',
                    temp: publicRes.data.temp
                };
            }
        } catch (innerErr) {
            // Ignore inner error and just mock
        }

        // Final fallback mock
        return {
            aqi: Math.floor(Math.random() * 200) + 50,
            category: 'Unhealthy for Sensitive Groups',
            temp: 24
        };
    }
};
