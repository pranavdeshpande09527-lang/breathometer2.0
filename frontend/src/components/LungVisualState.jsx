import React, { useRef } from 'react';
import { Sphere, MeshDistortMaterial, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useBreathPhysics } from './useBreathPhysics';

export function LungVisualState({ isBreathing, capacity, healthData }) {
    const groupRef = useRef(null);
    const leftLobeRef = useRef(null);
    const rightLobeRef = useRef(null);
    const leftCoreRef = useRef(null);
    const rightCoreRef = useRef(null);
    const veinGroupRef = useRef(null);

    // Bind physical animations and visual changes per frame
    useBreathPhysics({
        groupRef, leftLobeRef, rightLobeRef, leftCoreRef, rightCoreRef, veinGroupRef,
        isBreathing, capacity, healthState: healthData.state
    });

    const v = healthData.visuals;

    return (
        <group ref={groupRef}>
            {/* Volumetric Fog equivalent for Low State (smoker/damage effect) */}
            {healthData.state === 'low' && (
                <mesh position={[0, 0, 0]} scale={[2.5, 2.5, 2.5]}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial color={v.fogColor} transparent opacity={v.fogDensity} depthWrite={false} />
                </mesh>
            )}

            {/* Ambient High-Tech Particles */}
            <Sparkles count={isBreathing ? 150 : 60} speed={isBreathing ? v.particleSpeed * 1.5 : v.particleSpeed * 0.3} opacity={isBreathing ? 0.9 : 0.3} color={v.particleColor} size={2} scale={5.5} noise={1.5} />
            <Sparkles count={isBreathing ? 60 : 15} speed={isBreathing ? v.particleSpeed * 2.5 : v.particleSpeed * 0.6} opacity={isBreathing ? 0.7 : 0.1} color="#ffffff" size={5} scale={4.5} noise={2.5} />

            <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.6}>

                {/* === LEFT LOBE COMPLEX === */}
                <group position={[-1.15, 0, 0]}>
                    {/* Layer 1: Outer Plasma Membrane (Glass-like with subsurface scattering tricks) */}
                    <Sphere args={[1.15, 64, 64]} scale={[0.8, 1.35, 0.7]}>
                        <MeshDistortMaterial
                            ref={leftLobeRef}
                            color={v.color}
                            emissive={v.emissive}
                            emissiveIntensity={0.1}
                            distort={0.15}
                            speed={2.5}
                            roughness={0.4} // Bump mapping style detail via roughness
                            metalness={0.8}
                            transparent
                            opacity={healthData.state === 'low' ? 0.6 : 0.35}
                            transmission={healthData.state === 'low' ? 0.2 : 0.9} // Glassy if healthy, solid/patchy if low
                            thickness={1.5}
                            clearcoat={1}
                            clearcoatRoughness={0.1}
                        />
                    </Sphere>
                    {/* Layer 2: Inner Glowing Energy Matrix (Wireframe) */}
                    <Sphere args={[0.95, 32, 32]} scale={[0.7, 1.25, 0.6]}>
                        <meshStandardMaterial
                            ref={leftCoreRef}
                            color={v.coreColor}
                            emissive={v.emissive}
                            emissiveIntensity={0.5}
                            roughness={0.5}
                            transparent
                            opacity={0.4}
                            wireframe={true}
                        />
                    </Sphere>
                </group>

                {/* === RIGHT LOBE COMPLEX === */}
                <group position={[1.15, -0.05, 0]}> {/* Slight procedural asymmetry downward */}
                    {/* Slight scale asymmetry applied to width */}
                    <Sphere args={[1.15, 64, 64]} scale={[0.8, 1.32, 0.7]}>
                        <MeshDistortMaterial
                            ref={rightLobeRef}
                            color={v.color}
                            emissive={v.emissive}
                            emissiveIntensity={0.1}
                            distort={0.15}
                            speed={2.5}
                            roughness={0.4}
                            metalness={0.8}
                            transparent
                            opacity={healthData.state === 'low' ? 0.6 : 0.35}
                            transmission={healthData.state === 'low' ? 0.2 : 0.9}
                            thickness={1.5}
                            clearcoat={1}
                            clearcoatRoughness={0.1}
                        />
                    </Sphere>
                    <Sphere args={[0.95, 32, 32]} scale={[0.7, 1.25, 0.6]}>
                        <meshStandardMaterial
                            ref={rightCoreRef}
                            color={v.coreColor}
                            emissive={v.emissive}
                            emissiveIntensity={0.5}
                            roughness={0.5}
                            transparent
                            opacity={0.4}
                            wireframe={true}
                        />
                    </Sphere>
                </group>

                {/* === BRONCHIAL / CENTRAL STRUCTURAL NETWORK === */}
                <group ref={veinGroupRef} position={[0, -0.1, 0.1]}>
                    {/* Structure removed per user request for simplicity */}
                </group>

            </Float>
        </group>
    );
}
