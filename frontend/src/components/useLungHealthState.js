import { useMemo } from 'react';

// Centralize the visual state definitions so they can be easily mapped 
const HEALTH_VISUALS = {
    healthy: {
        color: '#0891b2', // Cyan
        emissive: '#06b6d4',
        particleColor: '#22d3ee',
        particleSpeed: 1.5,
        coreColor: '#cffafe',
        veinColor: '#67e8f9',
        message: "You have strong lung health",
        messageClass: "text-cyan-400 border-cyan-400 bg-cyan-400/10",
        fogColor: '#000000',
        fogDensity: 0
    },
    moderate: {
        color: '#b45309', // Amber / Yellowish
        emissive: '#d97706',
        particleColor: '#fbbf24',
        particleSpeed: 1.0,
        coreColor: '#fef3c7',
        veinColor: '#fcd34d',
        message: "Lung capacity is moderate",
        messageClass: "text-amber-400 border-amber-400 bg-amber-400/10",
        fogColor: '#000000',
        fogDensity: 0
    },
    low: {
        color: '#be123c', // Red / Rose
        emissive: '#e11d48',
        particleColor: '#fb7185',
        particleSpeed: 0.5,
        coreColor: '#ffe4e6',
        veinColor: '#fda4af',
        message: "Lung capacity is low — Possible damage detected",
        messageClass: "text-rose-100 border-rose-500 bg-rose-900/60 shadow-[0_0_10px_rgba(225,29,72,0.5)]",
        fogColor: '#4a044e', // smoky dark pink/purple 
        fogDensity: 0.15
    }
};

/**
 * Hook to intelligently determine the visual lung state
 * based on ML score or interactive hold duration.
 */
export function useLungHealthState({ timeMs, gameState, bestScore, mlScore }) {
    return useMemo(() => {
        let state = 'healthy';

        // 1. If ML score is available, it overrides the real-time interaction
        if (mlScore !== undefined && mlScore !== null) {
            if (mlScore > 75) state = 'healthy';
            else if (mlScore >= 40) state = 'moderate';
            else state = 'low';
        } else {
            // 2. Fallback to interactive mode based on hold duration
            let evaluateTime = timeMs;

            // If idle, show them their best score state (or healthy if brand new)
            if (gameState === 'idle') {
                evaluateTime = bestScore * 1000;
                if (bestScore === 0) {
                    evaluateTime = 30000; // Force healthy for totally new user at 0s
                }
            }

            const seconds = evaluateTime / 1000;

            if (seconds >= 30) state = 'healthy';
            else if (seconds >= 15) state = 'moderate';
            else state = 'low';
        }

        return {
            state,
            visuals: HEALTH_VISUALS[state]
        };
    }, [timeMs, gameState, bestScore, mlScore]);
}
