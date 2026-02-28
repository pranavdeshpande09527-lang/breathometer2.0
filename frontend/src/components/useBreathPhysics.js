import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo } from "react";

export function useBreathPhysics({
    groupRef,
    leftLobeRef,
    rightLobeRef,
    leftCoreRef,
    rightCoreRef,
    veinGroupRef,
    isBreathing,
    capacity,
    healthState
}) {
    const baseScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
    const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        const time = clock.getElapsedTime();
        const breathingProgress = capacity / 100;

        // Health state modifiers
        const isLow = healthState === 'low';
        const isModerate = healthState === 'moderate';

        const heartbeatRate = isLow ? 8 : (isModerate ? 7 : 6); // Faster, more irregular if low
        const heartbeatIrregularity = isLow ? Math.sin(time * 15) * 0.005 : 0;
        const heartbeat = Math.sin(time * heartbeatRate) * 0.005 + Math.sin(time * (heartbeatRate * 2)) * 0.005 + heartbeatIrregularity;

        const expansionAmplitude = isLow ? 0.15 : (isModerate ? 0.25 : 0.35); // Lower expansion if damaged

        const breathPulse = Math.sin(time * 2.5) * 0.015;
        const finalPulse = isBreathing ? (breathPulse * breathingProgress) + heartbeat : heartbeat * 0.5;

        // Bronchial rotation and scale
        if (veinGroupRef.current) {
            veinGroupRef.current.rotation.y = time * 0.15;
            veinGroupRef.current.rotation.z = Math.sin(time * 0.8) * 0.08;
            const veinScale = 1 + heartbeat * 4;
            veinGroupRef.current.scale.setScalar(veinScale * 0.85);
            // Flicker if low
            if (isLow && Math.random() > 0.95) {
                veinGroupRef.current.scale.setScalar(veinScale * 0.82);
            }
        }

        // Add micro-delay between lobes (asymmetry) & Diaphragm Sim
        if (isBreathing) {
            // Non-linear easeInOutSine expansion curve over progress: (1 - Math.cos(Math.PI * progress)) / 2
            const easedProgress = (1 - Math.cos(Math.PI * breathingProgress)) / 2;
            const s = 1 + easedProgress * expansionAmplitude;
            targetScale.set(s, s * 1.05, s * 1.1);
            groupRef.current.scale.set(
                targetScale.x + finalPulse,
                targetScale.y + finalPulse,
                targetScale.z + finalPulse
            );

            // Gravity sag adjustment (diaphragm moves down during deep inhale)
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.25 - (easedProgress * 0.1), 0.04);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0.15, 0.04);
        } else {
            groupRef.current.scale.lerp(baseScale, 0.1);
            // Gravity sag when idle (a bit lower)
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -0.05, 0.08);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.08);
        }

        // Materials update for FX
        if (leftLobeRef.current && rightLobeRef.current && leftCoreRef.current && rightCoreRef.current) {
            const baseDistort = isLow ? 0.25 : 0.15; // More distorted surface if low
            const distortValue = isBreathing ? baseDistort + 0.2 + breathingProgress * 0.25 : baseDistort;
            leftLobeRef.current.distort = distortValue;

            // Introduce slight asymmetry in surface distortion
            rightLobeRef.current.distort = Math.max(0, distortValue - 0.05);

            const coreGlow = isBreathing ? 0.6 + breathingProgress * 1.8 : (isLow ? 0.15 : 0.3);
            const pulseGlow = Math.max(0, heartbeat * 15);
            leftCoreRef.current.emissiveIntensity = coreGlow + pulseGlow;
            rightCoreRef.current.emissiveIntensity = coreGlow + pulseGlow;
        }
    });
}
