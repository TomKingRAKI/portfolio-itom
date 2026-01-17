import { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import gsap from 'gsap';
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
    scrollEnabled = true,
    parallaxEnabled = true
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
    const scrollEnabledRef = useRef(scrollEnabled);
    const parallaxEnabledRef = useRef(parallaxEnabled);
    const justEnabled = useRef(false);

    // Mobile touch tracking
    const touchStart = useRef({ x: 0, y: 0 });
    const swipeGlance = useRef(0); // Horizontal swipe-based camera rotation
    const targetSwipeGlance = useRef(0);
    const useGyroscope = useRef(false);

    // Camera override - when true, external code (like DoorSection) controls camera
    const cameraOverride = useRef(false);

    // Limits for swipe glance (in radians, ~15 degrees each way)
    const MAX_SWIPE_GLANCE = 0.26;

    // Store last known mouse position (normalized -1 to 1)
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Update enabled refs
    useLayoutEffect(() => {
        const wasScrollEnabled = scrollEnabledRef.current;
        scrollEnabledRef.current = scrollEnabled;
        parallaxEnabledRef.current = parallaxEnabled;

        // When scroll becomes enabled, sync with current camera position
        if (scrollEnabled && !wasScrollEnabled) {
            // KILL GSAP TWEENS: Ensure no lingering entrance animations interfere
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);
            gsap.killTweensOf(camera.savedState); // Just in case

            justEnabled.current = true;

            // FORCE RESET Camera X to 0 to prevent "looking left/right"
            // The entrance animation might end slightly off-center
            camera.position.x = 0;
            camera.rotation.set(0, 0, 0); // Reset rotation to be safe

            targetZ.current = camera.position.z;
            currentZ.current = camera.position.z;

            // FIX: Set target to CURRENT camera position so it stays stable
            // We do NOT want to pan to the mouse immediately, as the mouse might be
            // far off-center (e.g. clicking a door handle).
            // We force 0 because we just forced camera.position.x to 0 above
            parallax.current = { x: 0, y: camera.position.y - 0.2 };
            targetParallax.current = { x: 0, y: camera.position.y - 0.2 };

            // FORCE RESET GLANCE & SWIPE: Prevent any residual inputs from entrance phase
            swipeGlance.current = 0;
            targetSwipeGlance.current = 0;
            glanceOffset.current = 0;
            targetGlance.current = 0;

            // Recalculate segment immediately to ensure glance calc is correct from frame 0
            currentSegment.current = Math.floor((10 - currentZ.current) / segmentLength);
        }
    }, [scrollEnabled, parallaxEnabled, camera, parallaxIntensity]);

    // Handle wheel scroll (desktop)
    const handleWheel = useCallback((e) => {
        if (!scrollEnabledRef.current) return;

        e.preventDefault();
        const delta = e.deltaY * scrollSpeed;
        targetZ.current -= delta;
    }, [scrollSpeed]);

    // Handle mouse parallax (desktop) - ALWAYS tracks mouse position
    // but only applies to targetParallax when enabled
    const handleMouseMove = useCallback((e) => {
        // Always track mouse position for smooth transition when enabled
        const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
        lastMousePos.current = { x: normalizedX, y: normalizedY };

        // Only apply parallax when enabled
        if (!parallaxEnabledRef.current) return;

        targetParallax.current.x = normalizedX * parallaxIntensity;
        targetParallax.current.y = -normalizedY * parallaxIntensity * 0.5;
    }, [parallaxIntensity]);

    // Handle touch start (mobile)
    const handleTouchStart = useCallback((e) => {
        // Always track touch start for potential parallax
        touchStart.current.x = e.touches[0].clientX;
        touchStart.current.y = e.touches[0].clientY;
    }, []);

    // Handle touch move (mobile scroll + horizontal glance)
    const handleTouchMove = useCallback((e) => {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        // Vertical scroll - only when scroll enabled
        if (scrollEnabledRef.current) {
            const deltaY = (touchStart.current.y - currentY) * scrollSpeed * 1.5;
            targetZ.current -= deltaY;
        }

        // Horizontal swipe -> camera glance (works with parallax enabled)
        if (parallaxEnabledRef.current) {
            const deltaX = (touchStart.current.x - currentX) * 0.003; // Subtle multiplier
            targetSwipeGlance.current += deltaX;

            // Clamp to limits (±15 degrees)
            targetSwipeGlance.current = Math.max(-MAX_SWIPE_GLANCE, Math.min(MAX_SWIPE_GLANCE, targetSwipeGlance.current));
        }

        touchStart.current.x = currentX;
        touchStart.current.y = currentY;
    }, [scrollSpeed, MAX_SWIPE_GLANCE]);

    // Handle device orientation (gyroscope for mobile parallax)
    const handleDeviceOrientation = useCallback((e) => {
        if (!parallaxEnabledRef.current || !useGyroscope.current) return;

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

    // (Removed manual doorHover listener - replaced with auto-glance in useFrame)

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
        // If camera override is active, let external code control the camera
        if (cameraOverride.current) {
            return;
        }

        const scrollActive = scrollEnabledRef.current;
        const parallaxActive = parallaxEnabledRef.current;

        // If nothing is enabled, do nothing
        if (!scrollActive && !parallaxActive) {
            return;
        }

        // Smooth parallax - always update when parallax is enabled
        if (parallaxActive) {
            const parallaxSmoothing = justEnabled.current ? 0.02 : smoothing * 0.8;
            parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, targetParallax.current.x, parallaxSmoothing);
            parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, targetParallax.current.y, parallaxSmoothing);

            // Smooth swipe glance (mobile horizontal swipe)
            swipeGlance.current = THREE.MathUtils.lerp(swipeGlance.current, targetSwipeGlance.current, 0.08);
        }

        // After a bit, normal smoothing
        if (justEnabled.current && Math.abs(parallax.current.x - targetParallax.current.x) < 0.01) {
            justEnabled.current = false;
        }

        // Z movement and door glance - only when scroll is enabled
        if (scrollActive) {
            // Smooth Z movement
            currentZ.current = THREE.MathUtils.lerp(currentZ.current, targetZ.current, smoothing);

            // Auto-glance proximity check
            targetGlance.current = calculateGlance(currentZ.current, currentSegment.current);

            // Dynamic smoothing: slow to look (0.03), fast to release (0.08)
            // This stops the camera from "dragging" after passing the door
            const isReleasing = Math.abs(targetGlance.current) < Math.abs(glanceOffset.current);
            const lerpSpeed = isReleasing ? 0.08 : 0.03;

            glanceOffset.current = THREE.MathUtils.lerp(glanceOffset.current, targetGlance.current, lerpSpeed);

            // Apply Z position to camera (only when scroll enabled)
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
        } else if (parallaxActive) {
            // Parallax-only mode (during GSAP animation)
            // Apply parallax as offset to current camera position, and adjust lookAt
            // Don't override camera.position.z - GSAP controls it
            camera.position.x = parallax.current.x;
            camera.position.y = 0.2 + parallax.current.y;

            // Look direction with parallax offset
            const lookX = parallax.current.x * 0.3 + swipeGlance.current * 4;
            camera.lookAt(lookX, 0.13 + parallax.current.y, camera.position.z - 10);
        }
    });

    // Helper to calculate glance based on Z position
    const calculateGlance = useCallback((z, segment) => {
        const zOffset = 10 - (segment * segmentLength);
        let bestStrength = 0;
        let bestDir = 0;

        const START_DIST = 15;
        const PEAK_DIST = 8;
        const END_DIST = -2;

        for (const door of DOOR_POSITIONS) {
            const doorGlobalZ = zOffset + door.z;
            const dist = z - doorGlobalZ;

            let strength = 0;
            if (dist > PEAK_DIST && dist < START_DIST) {
                strength = (START_DIST - dist) / (START_DIST - PEAK_DIST);
            } else if (dist <= PEAK_DIST && dist > END_DIST) {
                strength = (dist - END_DIST) / (PEAK_DIST - END_DIST);
            }

            if (strength > 0) {
                const easedStrength = strength * (2 - strength);
                const dir = door.side === 'left' ? -1 : 1;
                if (easedStrength > bestStrength) {
                    bestStrength = easedStrength;
                    bestDir = dir;
                }
            }
        }

        return bestDir * bestStrength * glanceIntensity * 3.5;
    }, [segmentLength, glanceIntensity]);

    // Function to enable/disable camera override
    const setCameraOverride = useCallback((active) => {
        cameraOverride.current = active;
        if (!active) {
            // When releasing override, sync our state with current camera position
            const z = camera.position.z;
            targetZ.current = z;
            currentZ.current = z;

            // Recalculate current segment immediately
            const initSegment = Math.floor((10 - z) / segmentLength);
            currentSegment.current = initSegment;

            // Sync parallax
            parallax.current = { x: camera.position.x, y: camera.position.y - 0.2 };
            targetParallax.current = { x: camera.position.x, y: camera.position.y - 0.2 };

            // Calculate "Ideal" glance for this position
            const initialGlance = calculateGlance(z, initSegment);

            // SOFT RESUME LOGIC:
            // Check if our current physical rotation matches the "ideal" glance.
            // If we just exited a room via teleport, we might be looking STRAIGHT (0),
            // but the "ideal" glance wants us to look at the door (nonzero).
            // Mismatch causes a SNAP.
            // Fix: If there's a mismatch, initialize glanceOffset to match REALITY, not IDEAL.

            // 1. Get current physical "glance" equivalent from rotation
            // rotation.y ≈ parallax + glance * 3 + swipe * 4
            // We assume parallax is synced above, swipe is 0.
            // So: currentRotationY ≈ (parallax.x * 0.3) + (glance * 3)
            // glance ≈ (currentRotationY - parallax.x * 0.3) / 3

            // Note: We use the camera's actual rotation.
            // We also need to account for the lookAt logic which isn't a pure rotation addition,
            // but for small angles, this approximation is sufficient to prevent the snap.
            const currentRotationY = camera.rotation.y;
            const parallaxContribution = parallax.current.x * 0.3;
            const derivedGlance = (currentRotationY - parallaxContribution) / 3;

            // 2. Check difference
            const diff = Math.abs(derivedGlance - initialGlance);

            // 3. If difference is significant (e.g. > 0.05 rads approx 3 deg), use DERIVED
            // This happens when we exit looking straight (0) but should be looking at door
            if (diff > 0.02) {
                // Initialize with current PHYSICAL state so we start from where we ARE
                glanceOffset.current = derivedGlance;
                // Target is still the IDEAL state, so we will smooth to it
                targetGlance.current = initialGlance;
            } else {
                // We are close enough, just snap to ideal to be precise
                glanceOffset.current = initialGlance;
                targetGlance.current = initialGlance;
            }

            // Reset swipe glance
            swipeGlance.current = 0;
            targetSwipeGlance.current = 0;
        }
    }, [camera, calculateGlance, segmentLength]);

    return {
        getCurrentSegment: () => currentSegment.current,
        getCameraZ: () => currentZ.current,
        setCameraOverride, // Allow external code to take over camera
        requestGyroscopePermission // Expose for UI button (iOS needs user interaction)
    };
};

export default useInfiniteCamera;

