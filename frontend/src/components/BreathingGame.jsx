import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    Sphere,
    MeshDistortMaterial,
    Sparkles,
    Float,
    Environment,
    ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

// Define the game stages for visual progression
const STAGES = [
    { threshold: 0, name: 'Beginner Diver', color: 'border-cyan-400', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.4)]', bgGlow: 'bg-cyan-400/5', text: 'text-cyan-400', fill: '#22d3ee' },
    { threshold: 15, name: 'Pearl Diver', color: 'border-teal-400', glow: 'shadow-[0_0_40px_rgba(45,212,191,0.5)]', bgGlow: 'bg-teal-400/10', text: 'text-teal-400', fill: '#2dd4bf' },
    { threshold: 30, name: 'Deep Sea Explorer', color: 'border-emerald-400', glow: 'shadow-[0_0_50px_rgba(52,211,153,0.6)]', bgGlow: 'bg-emerald-400/15', text: 'text-emerald-400', fill: '#34d399' },
    { threshold: 60, name: 'Free Dive Champion', color: 'border-amber-400', glow: 'shadow-[0_0_60px_rgba(251,191,36,0.8)]', bgGlow: 'bg-amber-400/20', text: 'text-amber-400', fill: '#fbbf24' }
];

import { LungVisualState } from './LungVisualState';
import { useLungHealthState } from './useLungHealthState';

export default function BreathingGame({ mlScore = null }) {
    const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'finished'
    const [timeMs, setTimeMs] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);

    // Call the custom hook to determine the dynamic health state
    const healthData = useLungHealthState({ timeMs, gameState, bestScore, mlScore });

    const intervalRef = useRef(null);
    const startTimeRef = useRef(0);
    const wasKeyboardRef = useRef(false);

    // Derived capacity for the 3D model (0-100% over 4 seconds max)
    const capacity = Math.min(100, (timeMs / 4000) * 100);

    // Load best score on mount
    useEffect(() => {
        const savedBest = localStorage.getItem('breathometer_best_score');
        if (savedBest) {
            setBestScore(parseFloat(savedBest));
        }
    }, []);

    const formatTime = (ms) => {
        return Math.floor(ms / 1000).toString();
    };

    const elapsedSeconds = timeMs / 1000;
    const currentStage = [...STAGES].reverse().find(s => elapsedSeconds >= s.threshold) || STAGES[0];

    // Added support for spacebar to start/stop
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                if (gameState === 'idle') {
                    e.preventDefault(); // Prevent scrolling
                    wasKeyboardRef.current = true;
                    startGame(e);
                } else if (gameState === 'playing') {
                    e.preventDefault(); // Prevent scrolling while holding
                }
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space' && gameState === 'playing' && wasKeyboardRef.current) {
                e.preventDefault();
                wasKeyboardRef.current = false;
                stopGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    const startGame = (e) => {
        if (e && e.preventDefault && e.type !== 'mousedown') e.preventDefault();
        if (gameState !== 'idle') return;

        setGameState('playing');
        setTimeMs(0);
        setIsNewRecord(false);
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            setTimeMs(Date.now() - startTimeRef.current);
        }, 50);
    };

    const stopGame = () => {
        if (gameState !== 'playing') return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;

            // Extra logic to quickly reverse the timeMs to simulate exhalation
            const exhalingInterval = setInterval(() => {
                setTimeMs(prev => {
                    const next = prev - 80;
                    if (next <= 0) {
                        clearInterval(exhalingInterval);
                        return 0;
                    }
                    return next;
                });
            }, 20);
        }

        const finalTimeSec = parseFloat((timeMs / 1000).toFixed(1));
        setGameState('finished');
        setFinalScore(finalTimeSec);

        if (finalTimeSec > bestScore) {
            setBestScore(finalTimeSec);
            localStorage.setItem('breathometer_best_score', finalTimeSec.toString());
            setIsNewRecord(true);
        }
    };

    const resetGame = (e) => {
        if (e) e.stopPropagation();
        setGameState('idle');
        setTimeMs(0);
        setFinalScore(0);
        setIsNewRecord(false);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Scaled down SVG Ring Calculations, but maintaining clear visuals
    const radius = 55; // Slightly larger ring for better visibility
    const strokeWidth = 6;
    const circleCircumference = 2 * Math.PI * radius;
    const maxReferenceTime = 60000;
    const fillPercentage = Math.min((timeMs / maxReferenceTime), 1);
    const strokeDashoffset = circleCircumference - (fillPercentage * circleCircumference);

    return (
        <div
            className="col-span-1 relative w-full rounded-2xl overflow-hidden select-none touch-none min-h-[160px] lg:min-h-[180px] flex flex-col pt-3 pb-3 group"
            style={{
                background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}
            onMouseUp={() => !wasKeyboardRef.current && stopGame()}
            onMouseLeave={() => !wasKeyboardRef.current && stopGame()}
            onTouchEnd={() => !wasKeyboardRef.current && stopGame()}
            onTouchCancel={() => !wasKeyboardRef.current && stopGame()}
        >
            {/* Dynamic Background Atmosphere */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                <div
                    className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] opacity-20 transition-all duration-1000"
                    style={{
                        background: `radial-gradient(circle at center, ${gameState === 'playing' ? '#0e7490' : '#1e1b4b'} 0%, transparent 70%)`,
                        transform: 'scale(1)'
                    }}
                />
            </div>

            {/* Header / Logo Component - Increased text size for legibility */}
            <div className="absolute top-3 left-4 flex items-center gap-1.5 z-10 transition-transform duration-300 hover:scale-105 cursor-default">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M 6 4 C 3 4 2 7 2 12 C 2 17 4 20 8 20 C 10 20 11 18 11 15 C 11 12 10 10 11 8 C 11 5 10 4 6 4 Z M 18 4 C 21 4 22 7 22 12 C 22 17 20 20 16 20 C 14 20 13 18 13 15 C 13 12 14 10 13 8 C 13 5 14 4 18 4 Z M 12 8 L 12 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span className="text-cyan-400 font-bold tracking-widest text-[10px] lg:text-xs opacity-90">BREATHOMETER</span>
            </div>

            {/* Title & Dynamic Health Message */}
            <div className="w-full text-center z-10 mt-0 mb-0 absolute top-2 inset-x-0 pointer-events-none flex flex-col items-center">
                <h2 className="text-slate-200 font-bold tracking-[0.2em] text-[11px] lg:text-xs uppercase opacity-80 mb-0.5">Lung Test</h2>
                <div className={`px-3 py-0.5 rounded-full border border-opacity-50 backdrop-blur-sm ${healthData.visuals.messageClass} transition-colors duration-500`}>
                    <span className="font-bold tracking-widest uppercase text-[8px] lg:text-[9px]">{healthData.visuals.message}</span>
                </div>
            </div>

            {/* Main Center Area: Ring & Glowing Lung */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-3 mb-1">

                {/* Visual Container */}
                <div
                    className={`relative flex flex-col items-center justify-center w-[130px] h-[130px] lg:w-[140px] lg:h-[140px] group/lung transition-transform duration-300 hover:scale-105 active:scale-95 ${gameState === 'idle' ? 'cursor-pointer' : ''}`}
                    onMouseDown={(e) => {
                        if (gameState === 'idle') {
                            e.preventDefault(); // Prevent standard click behavior/focus
                            wasKeyboardRef.current = false;
                            startGame(e);
                        }
                    }}
                    onTouchStart={(e) => {
                        if (gameState === 'idle') {
                            // Cannot prevent default entirely on touchstart if we want smooth scrolling outside, but for the game we do.
                            wasKeyboardRef.current = false;
                            startGame(e);
                        }
                    }}
                >

                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all duration-300 group-hover/lung:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] z-20 pointer-events-none" viewBox="0 0 200 200">
                        {/* Background Track Circle */}
                        <circle
                            cx="100" cy="100" r={radius}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            className="shadow-inner transition-colors duration-300 group-hover/lung:stroke-[#2f3e53]"
                        />
                        {/* Progress Fill Circle */}
                        <circle
                            cx="100" cy="100" r={radius}
                            fill="none"
                            stroke={currentStage.fill}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-300 ease-linear drop-shadow-md"
                        />
                    </svg>

                    {/* Central 3D Visualizer Canvas */}
                    <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center pt-[15%] pointer-events-none">
                        <div className="w-[180%] h-[180%]">
                            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 40 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
                                <ambientLight intensity={0.4} />
                                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                                <pointLight position={[-10, -10, -10]} intensity={1} color="#22d3ee" />

                                <Environment preset="city" />

                                <LungVisualState isBreathing={gameState === 'playing'} capacity={capacity} healthData={healthData} />

                                <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />

                                <OrbitControls
                                    enableZoom={false}
                                    enablePan={false}
                                    minPolarAngle={Math.PI / 2.5}
                                    maxPolarAngle={Math.PI / 1.5}
                                    autoRotate={gameState !== 'playing'}
                                    autoRotateSpeed={0.8}
                                />
                            </Canvas>
                        </div>
                    </div>

                    {/* Timer Text overlaid completely centered in the lower half of the ring - Enalarged sizes */}
                    <div className="absolute bottom-[18%] flex flex-col items-center justify-center transform translate-y-1 w-full pointer-events-none z-30">
                        {gameState === 'idle' ? (
                            <>
                                <span className={`text-3xl lg:text-4xl font-bold tracking-wide ${currentStage.text} [text-shadow:0_0_8px_rgba(34,211,238,0.4)]`}>
                                    0s
                                </span>
                                <span className="text-[9px] lg:text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0 transition-colors duration-300 group-hover/lung:text-cyan-200">SECONDS</span>
                            </>
                        ) : gameState === 'playing' ? (
                            <>
                                <span className={`text-4xl lg:text-5xl font-bold tracking-wide text-white transition-colors duration-300 [text-shadow:0_0_12px_rgba(34,211,238,0.8)] animate-pulse`}>
                                    {formatTime(timeMs)}s
                                </span>
                                <span className="text-[9px] lg:text-[10px] text-slate-300 font-bold tracking-widest uppercase mt-0">SECONDS</span>
                            </>
                        ) : (
                            <>
                                <span className="text-4xl lg:text-5xl font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                                    {finalScore}s
                                </span>
                                <span className="text-[9px] lg:text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0 mb-1">SECONDS</span>
                                {isNewRecord && (
                                    <div className="mt-1 bg-amber-500/20 border border-amber-400/50 px-3 py-0.5 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                                        <span className="text-amber-400 font-bold tracking-widest uppercase text-[8px] animate-bounce block">🏆 NEW RECORD! 🏆</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Footer Area - Text legibility increased significantly */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between w-[95%] md:w-[85%] mx-auto z-10 gap-2 lg:gap-3 mt-auto border-t border-slate-700/50 pt-2 pb-1">

                {/* High Score Left */}
                <div className="flex-1 text-center sm:text-left text-[11px] lg:text-xs font-bold tracking-widest text-slate-300 uppercase transition-colors duration-300 hover:text-white cursor-default">
                    BEST: <span className="text-white ml-1 text-xs lg:text-sm">{bestScore}s</span>
                </div>

                {/* Center Button and Label */}
                <div className="flex flex-col flex-1 items-center justify-center gap-1 min-w-[120px]">
                    {/* Compact sleek pill button - Now acts distinctly based on state */}
                    {gameState === 'finished' ? (
                        <button
                            onClick={resetGame}
                            className="relative px-6 py-1.5 rounded-full font-bold tracking-widest text-[10px] lg:text-xs transition-all duration-300 overflow-hidden group border active:scale-95 bg-slate-700/80 border-cyan-500 text-cyan-300 hover:bg-slate-700 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-1">RETRY</span>
                        </button>
                    ) : (
                        <div
                            className={`relative px-6 py-1.5 rounded-full font-bold tracking-widest text-[10px] lg:text-xs transition-all duration-300 overflow-hidden group border select-none ${gameState === 'playing'
                                ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                : 'bg-[#e0533c]/10 border-[#e0533c] text-[#e0533c] shadow-[0_0_15px_rgba(224,83,60,0.3)]'
                                }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-1">
                                {gameState === 'playing' ? 'HOLDING...' : 'HOLD TO START'}
                            </span>
                        </div>
                    )}

                    <span className="text-[8px] lg:text-[9px] text-slate-400 tracking-widest font-semibold uppercase">
                        {gameState === 'playing' ? 'RELEASE LUNG TO STOP' : gameState === 'finished' ? 'CLICK RETRY TO PLAY AGAIN' : 'CLICK & HOLD LUNG OR SPACEBAR'}
                    </span>
                </div>

                {/* Status Indicator Right */}
                <div className="flex-1 flex justify-center sm:justify-end items-center">
                    <div className="bg-slate-800/80 border border-slate-700/50 px-3 py-1 rounded-full flex items-center gap-1.5 transition-transform duration-300 hover:scale-105 cursor-default mt-1 sm:mt-0">
                        <span className={`w-2 h-2 rounded-full ${gameState === 'playing' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse' : 'bg-slate-400'}`}></span>
                        <span className={`text-[9px] lg:text-[10px] font-bold tracking-widest uppercase ${gameState === 'playing' ? 'text-cyan-400' : 'text-slate-300'}`}>
                            {gameState === 'playing' ? 'ACTIVE' : 'READY'}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}
