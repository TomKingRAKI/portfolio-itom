import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useScrollCamera Hook
 * 
 * Scroll-based camera movement along Z axis.
 * For corridor: z=8 (start) to z=-15 (deep into corridor).
 * User can approach avatar, pass it, and continue walking through corridor.
 */
const useScrollCamera = ({
    minZ = 8,
    maxZ = -15,
    speed = 0.03,
    smoothing = 0.08
} = {}) => {
    const { camera } = useThree();
    const targetZ = useRef(minZ);
    const currentZ = useRef(minZ);

    // Handle wheel events
    const handleWheel = useCallback((e) => {
        e.preventDefault();

        // Scroll down = move forward (decrease Z)
        const delta = e.deltaY * speed;
        targetZ.current = THREE.MathUtils.clamp(
            targetZ.current - delta,
            maxZ,
            minZ
        );
    }, [speed, minZ, maxZ]);

    // Add wheel listener
    useEffect(() => {
        // Listen on window for full coverage
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    // Smooth camera movement with lerping
    useFrame(() => {
        currentZ.current = THREE.MathUtils.lerp(
            currentZ.current,
            targetZ.current,
            smoothing
        );

        camera.position.z = currentZ.current;
    });

    // Return progress for external use (0 = start, 1 = end)
    const getProgress = useCallback(() => {
        return (minZ - currentZ.current) / (minZ - maxZ);
    }, [minZ, maxZ]);

    return { getProgress };
};

export default useScrollCamera;
