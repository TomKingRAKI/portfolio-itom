import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Door positions for auto-glance (relative within segment)
const DOOR_POSITIONS = [
    { z: -18, side: 'left' },
    { z: -32, side: 'right' },
    { z: -48, side: 'left' },
    { z: -62, side: 'right' },
];

// Key positions - MOVED entrance doors to Z=20 to avoid conflict with segment -1's SegmentDoors at Z=15
const CAMERA_START_Z = 60; // Start further back
const ENTRANCE_DOORS_Z = 20; // Safe position, no conflict with segments
const CAMERA_WAITING_Z = ENTRANCE_DOORS_Z + 5; // Stop 5 units before entrance doors
const CAMERA_AFTER_DOORS_Z = 5; // After walking through (inside segment 0, near ITOM at Z≈5)

/**
 * useInfiniteCamera Hook - Unified Camera Control
 * 
 * No phase-based re-rendering - always smooth transitions.
 */
const useInfiniteCamera = ({
    segmentLength = 80,
    scrollSpeed = 0.02,
    parallaxIntensity = 0.3,
    smoothing = 0.06,
    glanceIntensity = 0.15,
    loadingPhase = 'ready',
    onReachDoors
} = {}) => {
    const { camera } = useThree();

    // Camera tracking
    const targetZ = useRef(CAMERA_START_Z);
    const currentZ = useRef(CAMERA_START_Z);
    const parallax = useRef({ x: 0, y: 0 });
    const targetParallax = useRef({ x: 0, y: 0 });
    const glanceOffset = useRef(0);
    const hasReachedDoors = useRef(false);
    const phaseRef = useRef(loadingPhase);
    const initialized = useRef(false);

    // Update phase ref
    useEffect(() => {
        phaseRef.current = loadingPhase;
    }, [loadingPhase]);

    // Initialize camera ONCE
    useEffect(() => {
        if (!initialized.current) {
            camera.position.set(0, 0.2, CAMERA_START_Z);
            initialized.current = true;
        }
    }, [camera]);

    // Handle wheel scroll - only in 'ready' phase
    const handleWheel = useCallback((e) => {
        if (phaseRef.current !== 'ready') return;

        e.preventDefault();
        const delta = e.deltaY * scrollSpeed;
        targetZ.current -= delta;
    }, [scrollSpeed]);

    // Handle mouse parallax - only in 'ready' phase
    const handleMouseMove = useCallback((e) => {
        if (phaseRef.current !== 'ready') return;

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
    useFrame((state, delta) => {
        const phase = phaseRef.current;

        // === LOADING PHASE: Auto-scroll toward entrance doors ===
        if (phase === 'loading') {
            if (targetZ.current > CAMERA_WAITING_Z) {
                targetZ.current -= delta * 8; // Smooth auto-scroll

                if (targetZ.current <= CAMERA_WAITING_Z) {
                    targetZ.current = CAMERA_WAITING_Z;
                    if (!hasReachedDoors.current) {
                        hasReachedDoors.current = true;
                        onReachDoors?.();
                    }
                }
            }
        }

        // === DOORS PHASE: Stay at waiting position ===
        if (phase === 'doors') {
            targetZ.current = CAMERA_WAITING_Z;
        }

        // === Smooth Z movement (all phases) ===
        currentZ.current = THREE.MathUtils.lerp(currentZ.current, targetZ.current, smoothing);

        // === Parallax (only ready phase) ===
        if (phase === 'ready') {
            parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, targetParallax.current.x, smoothing * 0.8);
            parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, targetParallax.current.y, smoothing * 0.8);
        } else {
            parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, 0, 0.05);
            parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, 0, 0.05);
        }

        // === Auto-glance at doors (only ready phase) ===
        let targetGlance = 0;
        if (phase === 'ready') {
            const posInSegment = ((10 - currentZ.current) % segmentLength + segmentLength) % segmentLength;

            for (const door of DOOR_POSITIONS) {
                const doorPosInSegment = -door.z;
                const distToDoor = Math.abs(posInSegment - doorPosInSegment);

                if (distToDoor < 10) {
                    const glanceStrength = 1 - (distToDoor / 10);
                    targetGlance = door.side === 'left' ? -glanceIntensity * glanceStrength : glanceIntensity * glanceStrength;
                    break;
                }
            }
        }
        glanceOffset.current = THREE.MathUtils.lerp(glanceOffset.current, targetGlance, 0.05);

        // === Apply to camera ===
        camera.position.z = currentZ.current;
        camera.position.x = parallax.current.x;
        camera.position.y = 0.2 + parallax.current.y;

        // === Look direction ===
        const lookX = parallax.current.x * 0.3 + glanceOffset.current * 8;
        camera.lookAt(lookX, parallax.current.y * 0.2, currentZ.current - 10);
    });

    // Function to set target Z externally (for entering animation)
    const setTargetZ = useCallback((z) => {
        targetZ.current = z;
    }, []);

    // Function to get current camera Z
    const getCameraZ = useCallback(() => currentZ.current, []);

    return {
        getCameraZ,
        setTargetZ,
        ENTRANCE_DOORS_Z,
        CAMERA_AFTER_DOORS_Z
    };
};

export default useInfiniteCamera;
