/**
 * RiskGauge — Semi-circular gauge showing the risk score
 */
import React from 'react';

const getColor = (level) => {
    if (level === 'Safe') return { stroke: '#10b981', text: 'text-safe-500', label: 'text-safe-500' };
    if (level === 'Moderate') return { stroke: '#f59e0b', text: 'text-warning-500', label: 'text-warning-500' };
    return { stroke: '#f43f5e', text: 'text-danger-500', label: 'text-danger-500' };
};

export default function RiskGauge({ score = 0, level = 'Safe' }) {
    const colors = getColor(level);
    const maxScore = 150; // visual max
    const pct = Math.min(score / maxScore, 1);
    const circumference = Math.PI * 80; // half-circle with r=80
    const dashOffset = circumference * (1 - pct);

    return (
        <div className="glass-card-hover p-6 flex flex-col items-center">
            <p className="text-xs text-ink-muted uppercase tracking-wider font-medium mb-4">Lung Risk Score</p>

            <div className="relative">
                <svg width="200" height="120" viewBox="0 0 200 120">
                    {/* Background arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* Score arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>

                {/* Score text */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className={`text-4xl font-extrabold ${colors.text}`}>{score}</span>
                </div>
            </div>

            <span className={`mt-2 px-4 py-1 rounded-full text-sm font-semibold ${colors.label} bg-surface-card shadow-premium border border-brand-terracotta/10`}>
                {level}
            </span>
        </div>
    );
}
