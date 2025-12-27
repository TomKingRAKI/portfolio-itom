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
 * Supports: desktop (mouse/wheel) + mobile (touch/gyroscope)
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
    const targetGlance = useRef(0); // For door hover glance
    const currentSegment = useRef(0);
    const enabledRef = useRef(enabled);
    const justEnabled = useRef(false);

    // Mobile touch tracking
    const touchStart = useRef({ x: 0, y: 0 });
    const swipeGlance = useRef(0); // Horizontal swipe-based camera rotation
    const targetSwipeGlance = useRef(0);
    const useGyroscope = useRef(false);

    // Limits for swipe glance (in radians, ~15 degrees each way)
    const MAX_SWIPE_GLANCE = 0.26;

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

    // Handle wheel scroll (desktop)
    const handleWheel = useCallback((e) => {
        if (!enabledRef.current) return;

        e.preventDefault();
        const delta = e.deltaY * scrollSpeed;
        targetZ.current -= delta;
    }, [scrollSpeed]);

    // Handle mouse parallax (desktop)
    const handleMouseMove = useCallback((e) => {
        if (!enabledRef.current) return;

        targetParallax.current.x = ((e.clientX / window.innerWidth) * 2 - 1) * parallaxIntensity;
        targetParallax.current.y = -((e.clientY / window.innerHeight) * 2 - 1) * parallaxIntensity * 0.5;
    }, [parallaxIntensity]);

    // Handle touch start (mobile)
    const handleTouchStart = useCallback((e) => {
        if (!enabledRef.current) return;
        touchStart.current.x = e.touches[0].clientX;
        touchStart.current.y = e.touches[0].clientY;
    }, []);

    // Handle touch move (mobile scroll + horizontal glance)
    const handleTouchMove = useCallback((e) => {
        if (!enabledRef.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        // Vertical scroll (original behavior)
        const deltaY = (touchStart.current.y - currentY) * scrollSpeed * 1.5;
        targetZ.current -= deltaY;

        // Horizontal swipe -> camera glance (NEW)
        const deltaX = (touchStart.current.x - currentX) * 0.003; // Subtle multiplier
        targetSwipeGlance.current += deltaX;

        // Clamp to limits (±15 degrees)
        targetSwipeGlance.current = Math.max(-MAX_SWIPE_GLANCE, Math.min(MAX_SWIPE_GLANCE, targetSwipeGlance.current));

        touchStart.current.x = currentX;
        touchStart.current.y = currentY;
    }, [scrollSpeed, MAX_SWIPE_GLANCE]);

    // Handle device orientation (gyroscope for mobile parallax)
    const handleDeviceOrientation = useCallback((e) => {
        if (!enabledRef.current || !useGyroscope.current) return;

        // gamma: left-to-right tilt (-90 to 90)
        // beta: front-to-back tilt (-180 to 180), 45 is roughly "holding phone naturally"
        const gamma = e.gamma || 0;
        const beta = e.beta || 0;

        // Clamp values and convert to parallax
        const clampedGamma = Math.max(-45, Math.min(45, gamma));
        const clampedBeta = Math.max(0, Math.min(90, beta)) - 45; // Center around 45 degrees

        targetParallax.current.x = (clampedGamma / 45) * parallaxIntensity;
        targetParallax.current.y = -(clampedBeta / 45) * parallaxIntensity * 0.5;
    }, [parallaxIntensity]);

    // Request gyroscope permission (iOS 13+)
    const requestGyroscopePermission = useCallback(async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    useGyroscope.current = true;
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                }
            } catch (error) {
                console.log('Gyroscope permission denied');
            }
        } else {
            // Non-iOS or older browsers - just add listener
            useGyroscope.current = true;
            window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
    }, [handleDeviceOrientation]);

    // Handle door hover events (dispatched from Door.jsx)
    useEffect(() => {
        const handleDoorHover = (e) => {
            if (!enabledRef.current) return;
            // e.detail.direction: 'left', 'right', or null (leave)
            if (e.detail.direction === 'left') {
                targetGlance.current = -glanceIntensity * 0.5; // Very subtle turn
            } else if (e.detail.direction === 'right') {
                targetGlance.current = glanceIntensity * 0.5; // Very subtle turn
            } else {
                targetGlance.current = 0;
            }
        };

        window.addEventListener('doorHover', handleDoorHover);
        return () => window.removeEventListener('doorHover', handleDoorHover);
    }, [glanceIntensity]);

    useEffect(() => {
        // Desktop events
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);

        // Mobile events
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Try to enable gyroscope (will work on Android, need permission on iOS)
        requestGyroscopePermission();

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, [handleWheel, handleMouseMove, handleTouchStart, handleTouchMove, handleDeviceOrientation, requestGyroscopePermission]);

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

        // Glance toward doors on hover (targetGlance set by doorHover events)
        // Very slow lerp for smooth transition
        glanceOffset.current = THREE.MathUtils.lerp(glanceOffset.current, targetGlance.current, 0.04);

        // Smooth swipe glance (mobile horizontal swipe)
        swipeGlance.current = THREE.MathUtils.lerp(swipeGlance.current, targetSwipeGlance.current, 0.08);

        // Apply to camera
        camera.position.z = currentZ.current;
        camera.position.x = parallax.current.x;
        camera.position.y = 0.2 + parallax.current.y;

        // Look direction with glance + swipe glance - reduced multiplier for subtle effect
        const lookX = parallax.current.x * 0.3 + glanceOffset.current * 3 + swipeGlance.current * 4;
        camera.lookAt(lookX, 0.13 + parallax.current.y, currentZ.current - 10);

        // Update segment tracking
        const segment = Math.floor((10 - currentZ.current) / segmentLength);
        if (segment !== currentSegment.current) {
            currentSegment.current = segment;
        }
    });

    return {
        getCurrentSegment: () => currentSegment.current,
        getCameraZ: () => currentZ.current,
        requestGyroscopePermission // Expose for UI button (iOS needs user interaction)
    };
};

export default useInfiniteCamera;

