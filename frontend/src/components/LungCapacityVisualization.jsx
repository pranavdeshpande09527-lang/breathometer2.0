import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    Sphere,
    MeshDistortMaterial,
    Sparkles,
    Float,
    PerspectiveCamera,
    Environment,
    ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

/* =========================
   3D Lung Model Component
========================= */

function LungModel({ isBreathing, capacity }) {
    const groupRef = useRef(null);
    const leftLobeRef = useRef(null);
    const rightLobeRef = useRef(null);

    // Memoized values for performance
    const baseScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
    const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
    const colorCyan = useMemo(() => new THREE.Color("#22d3ee"), []);
    const colorRose = useMemo(() => new THREE.Color("#f43f5e"), []);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        const breathingProgress = capacity / 100;
        const time = clock.getElapsedTime();

        // Pulse Logic
        const pulseFactor = Math.sin(time * 3.5) * 0.012;
        const finalPulse = isBreathing ? pulseFactor * breathingProgress : pulseFactor * 0.3;

        if (isBreathing) {
            // Scaling
            const s = 1 + breathingProgress * 0.28;
            targetScale.set(s, s * 1.05, s);
            groupRef.current.scale.set(
                targetScale.x + finalPulse,
                targetScale.y + finalPulse,
                targetScale.z + finalPulse
            );

            // Position
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.2, 0.04);
        } else {
            // Exhale
            groupRef.current.scale.lerp(baseScale, 0.12);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
        }

        // Material Updates (Direct Access for 60fps)
        if (leftLobeRef.current && rightLobeRef.current) {
            const glowIntensity = isBreathing ? 0.3 + breathingProgress * 1.2 : 0.2;
            leftLobeRef.current.emissiveIntensity = glowIntensity;
            rightLobeRef.current.emissiveIntensity = glowIntensity;

            const distortValue = isBreathing ? 0.3 + breathingProgress * 0.2 : 0.15;
            leftLobeRef.current.distort = distortValue;
            rightLobeRef.current.distort = distortValue;
        }
    });

    return (
        <group ref={groupRef}>
            <Sparkles
                count={isBreathing ? 120 : 40}
                speed={isBreathing ? 1.5 : 0.4}
                opacity={isBreathing ? 0.8 : 0.2}
                color="#22d3ee"
                size={3}
                scale={5}
                noise={1}
            />

            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Left Lobe */}
                <Sphere args={[1.1, 128, 128]} position={[-1.1, 0, 0]} scale={[0.8, 1.35, 0.7]}>
                    <MeshDistortMaterial
                        ref={leftLobeRef}
                        color="#0891b2"
                        emissive="#06b6d4"
                        emissiveIntensity={0.2}
                        distort={0.15}
                        speed={2}
                        roughness={0.1}
                        metalness={0.9}
                        transparent
                        opacity={0.7}
                        transmission={0.4}
                        thickness={2}
                    />
                </Sphere>

                {/* Right Lobe */}
                <Sphere args={[1.1, 128, 128]} position={[1.1, 0, 0]} scale={[0.8, 1.35, 0.7]}>
                    <MeshDistortMaterial
                        ref={rightLobeRef}
                        color="#0891b2"
                        emissive="#06b6d4"
                        emissiveIntensity={0.2}
                        distort={0.15}
                        speed={2}
                        roughness={0.1}
                        metalness={0.9}
                        transparent
                        opacity={0.7}
                        transmission={0.4}
                        thickness={2}
                    />
                </Sphere>
            </Float>

            {/* Internal Vein Structure (Abstract) */}
            <group position={[0, -0.2, 0.2]} scale={0.8} opacity={0.3}>
                <mesh>
                    <torusKnotGeometry args={[0.5, 0.01, 100, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
                </mesh>
            </group>
        </group>
    );
}

/* =========================
   Main Visualization
========================= */

export default function LungCapacityVisualization() {
    const [isBreathing, setIsBreathing] = useState(false);
    const [capacity, setCapacity] = useState(0);

    useEffect(() => {
        let interval;
        if (isBreathing) {
            interval = setInterval(() => {
                setCapacity((prev) => Math.min(100, prev + 1));
            }, 40); // 4-second inhale
        } else {
            interval = setInterval(() => {
                setCapacity((prev) => Math.max(0, prev - 2));
            }, 20); // Faster exhale
        }
        return () => clearInterval(interval);
    }, [isBreathing]);

    // UI Progress Data
    const radius = 135;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (capacity / 100) * circumference;

    return (
        <div className="relative w-full h-[550px] bg-[#020617] rounded-[32px] overflow-hidden shadow-2xl border border-slate-800/50 group">

            {/* Dynamic Background Atmosphere */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] opacity-20 transition-all duration-1000"
                    style={{
                        background: `radial-gradient(circle at center, ${isBreathing ? '#0e7490' : '#1e1b4b'} 0%, transparent 70%)`,
                        transform: `scale(${1 + capacity / 200})`,
                    }}
                />
                <div className="absolute inset-0 backdrop-blur-[100px]" />
            </div>

            {/* 3D Visualizer Canvas */}
            <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={40} />

                    <ambientLight intensity={0.4} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#22d3ee" />

                    <Environment preset="city" />

                    <LungModel isBreathing={isBreathing} capacity={capacity} />

                    <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 2.5}
                        maxPolarAngle={Math.PI / 1.5}
                        autoRotate={!isBreathing}
                        autoRotateSpeed={0.8}
                    />
                </Canvas>
            </div>

            {/* Modern UI Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-between p-8">

                {/* Header Branding */}
                <div className="w-full flex justify-between items-start">
                    <div className="flex flex-col">
                        <h2 className="text-white text-lg font-black tracking-tighter italic">VITAL_AI</h2>
                        <div className="w-8 h-[2px] bg-cyan-400 mt-1" />
                    </div>
                    <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                        <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">Real-time Analysis</span>
                    </div>
                </div>

                {/* Center UI - Circular Gauge */}
                <div className="relative flex items-center justify-center">
                    <svg className="w-[340px] h-[340px] -rotate-90">
                        <circle
                            cx="170" cy="170" r={radius}
                            fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10"
                        />
                        <circle
                            cx="170" cy="170" r={radius}
                            fill="none" stroke="url(#cyanGradient)" strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-150 ease-linear drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                        />
                        <defs>
                            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#0ea5e9" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Central Percentage */}
                    <div className="absolute flex flex-col items-center justify-center">
                        <div className="text-6xl font-black text-white tabular-nums tracking-tighter">
                            {Math.round(capacity)}
                            <span className="text-2xl text-cyan-400 ml-1">%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isBreathing ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
                                {isBreathing ? 'Inhaling' : 'Lung Vol'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Interaction */}
                <div className="w-full flex flex-col items-center gap-6">
                    <div className="flex gap-16 text-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Condition</span>
                            <span className="text-white text-xs font-bold">OPTIMAL</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Symmetry</span>
                            <span className="text-white text-xs font-bold">98.4%</span>
                        </div>
                    </div>

                    <button
                        onMouseDown={() => setIsBreathing(true)}
                        onMouseUp={() => setIsBreathing(false)}
                        onMouseLeave={() => setIsBreathing(false)}
                        onTouchStart={(e) => { e.preventDefault(); setIsBreathing(true); }}
                        onTouchEnd={() => setIsBreathing(false)}
                        className={`
              pointer-events-auto w-64 h-14 rounded-2xl font-black tracking-[0.2em] text-[11px] uppercase transition-all duration-500 transform
              ${isBreathing
                                ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] text-white scale-95 border-rose-400'
                                : 'bg-white text-black shadow-xl hover:scale-105 active:scale-95'
                            }
              border-2 border-transparent select-none active:opacity-90
            `}
                    >
                        {isBreathing ? 'Release to Exhale' : 'Hold to Synchronize'}
                    </button>
                </div>
            </div>
        </div>
    );
}
