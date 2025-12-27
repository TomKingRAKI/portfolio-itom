import { useRef, useEffect, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useCorridorCamera Hook
 * 
 * Handles scroll-based corridor navigation with seamless loop.
 */
const useCorridorCamera = ({
    corridorLength = 100,
    startZ = 5,
    endZ = -68,
    scrollSpeed = 0.02,
    parallaxIntensity = 0.3,
    smoothing = 0.06,
    onLoop
} = {}) => {
    const { camera } = useThree();

    const targetZ = useRef(startZ);
    const currentZ = useRef(startZ);
    const parallax = useRef({ x: 0, y: 0 });
    const targetParallax = useRef({ x: 0, y: 0 });
    const isLooping = useRef(false);

    // Handle wheel scroll
    const handleWheel = useCallback((e) => {
        if (isLooping.current) return;

        e.preventDefault();

        const delta = e.deltaY * scrollSpeed;
        targetZ.current = THREE.MathUtils.clamp(
            targetZ.current - delta,
            endZ,
            startZ
        );
    }, [scrollSpeed, startZ, endZ]);

    // Handle mouse parallax
    const handleMouseMove = useCallback((e) => {
        if (isLooping.current) return;

        targetParallax.current.x = ((e.clientX / window.innerWidth) * 2 - 1) * parallaxIntensity;
        targetParallax.current.y = -((e.clientY / window.innerHeight) * 2 - 1) * parallaxIntensity * 0.5;
    }, [parallaxIntensity]);

    useEffect(() => {
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleWheel, handleMouseMove]);

    // Camera update
    useFrame(() => {
        if (isLooping.current) return;

        // Smooth movement
        currentZ.current = THREE.MathUtils.lerp(currentZ.current, targetZ.current, smoothing);
        parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, targetParallax.current.x, smoothing * 0.8);
        parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, targetParallax.current.y, smoothing * 0.8);

        // Apply
        camera.position.z = currentZ.current;
        camera.position.x = parallax.current.x;
        camera.position.y = 0.2 + parallax.current.y;

        camera.lookAt(parallax.current.x * 0.3, parallax.current.y * 0.2, currentZ.current - 10);
    });

    // Seamless loop - called by LoopDoors
    const triggerLoop = useCallback(() => {
        if (isLooping.current) return;

        isLooping.current = true;
        onLoop?.();

        // Instant teleport to start (seamless because doors block view)
        setTimeout(() => {
            camera.position.z = startZ;
            targetZ.current = startZ;
            currentZ.current = startZ;

            setTimeout(() => {
                isLooping.current = false;
            }, 100);
        }, 200);
    }, [camera, startZ, onLoop]);

    return {
        triggerLoop,
        currentZ: currentZ.current,
        progress: (startZ - currentZ.current) / (startZ - endZ)
    };
};

export default useCorridorCamera;
