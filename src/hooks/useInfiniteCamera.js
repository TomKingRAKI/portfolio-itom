import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Door positions for auto-glance
const DOOR_POSITIONS = [
    { z: -18, side: 'left' },
    { z: -32, side: 'right' },
    { z: -48, side: 'left' },
    { z: -62, side: 'right' },
];

/**
 * useInfiniteCamera Hook
 * 
 * When disabled: does NOT touch camera at all (GSAP can control it)
 * When enabled: takes over camera control with scroll/parallax
 */
const useInfiniteCamera = ({
    segmentLength = 80,
    scrollSpeed = 0.02,
    parallaxIntensity = 0.3,
    smoothing = 0.06,
    glanceIntensity = 0.15,
    enabled = true
} = {}) => {
    const { camera } = useThree();

    // Camera tracking
    const targetZ = useRef(28);
    const currentZ = useRef(28);
    const parallax = useRef({ x: 0, y: 0 });
    const targetParallax = useRef({ x: 0, y: 0 });
    const glanceOffset = useRef(0);
    const currentSegment = useRef(0);
    const enabledRef = useRef(enabled);
    const justEnabled = useRef(false);

    // Update enabled ref
    useEffect(() => {
        const wasEnabled = enabledRef.current;
        enabledRef.current = enabled;

        // When becoming enabled, sync with current camera position
        if (enabled && !wasEnabled) {
            justEnabled.current = true;
            targetZ.current = camera.position.z;
            currentZ.current = camera.position.z;
            // Sync Y from actual camera position (0.2 is base)
            const currentY = camera.position.y - 0.2;
            parallax.current = { x: camera.position.x, y: currentY };
            targetParallax.current = { x: 0, y: 0 }; // Will smoothly go to neutral
        }
    }, [enabled, camera]);

    // Handle wheel scroll
    const handleWheel = useCallback((e) => {
        if (!enabledRef.current) return;

        e.preventDefault();
        const delta = e.deltaY * scrollSpeed;
        targetZ.current -= delta;
    }, [scrollSpeed]);

    // Handle mouse parallax
    const handleMouseMove = useCallback((e) => {
        if (!enabledRef.current) return;

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

    // Main camera update loop
    useFrame(() => {
        // When disabled, DO NOT touch camera - let GSAP control it
        if (!enabledRef.current) {
            return;
        }

        // Smooth Z movement
        currentZ.current = THREE.MathUtils.lerp(currentZ.current, targetZ.current, smoothing);

        // Smooth parallax - gradual enable after entrance
        const parallaxSmoothing = justEnabled.current ? 0.02 : smoothing * 0.8;
        parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, targetParallax.current.x, parallaxSmoothing);
        parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, targetParallax.current.y, parallaxSmoothing);

        // After a bit, normal smoothing
        if (justEnabled.current && Math.abs(parallax.current.x - targetParallax.current.x) < 0.01) {
            justEnabled.current = false;
        }

        // Calculate segment position for auto-glance
        const posInSegment = ((10 - currentZ.current) % segmentLength + segmentLength) % segmentLength;

        // Auto-glance at doors
        let targetGlance = 0;
        for (const door of DOOR_POSITIONS) {
            const doorPosInSegment = -door.z;
            const distToDoor = Math.abs(posInSegment - doorPosInSegment);

            if (distToDoor < 10) {
                const glanceStrength = 1 - (distToDoor / 10);
                targetGlance = door.side === 'left' ? -glanceIntensity * glanceStrength : glanceIntensity * glanceStrength;
                break;
            }
        }
        glanceOffset.current = THREE.MathUtils.lerp(glanceOffset.current, targetGlance, 0.05);

        // Apply to camera
        camera.position.z = currentZ.current;
        camera.position.x = parallax.current.x;
        camera.position.y = 0.2 + parallax.current.y;

        // Look direction with glance
        const lookX = parallax.current.x * 0.3 + glanceOffset.current * 8;
        camera.lookAt(lookX, 0.13 + parallax.current.y, currentZ.current - 10);

        // Update segment tracking
        const segment = Math.floor((10 - currentZ.current) / segmentLength);
        if (segment !== currentSegment.current) {
            currentSegment.current = segment;
        }
    });

    return {
        getCurrentSegment: () => currentSegment.current,
        getCameraZ: () => currentZ.current
    };
};

export default useInfiniteCamera;
