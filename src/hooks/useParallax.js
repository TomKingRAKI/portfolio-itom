import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';

/**
 * useParallax Hook
 * 
 * Tracks mouse movement and device orientation to create parallax effects.
 * Returns normalized values (-1 to 1) for X and Y axes.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.sensitivity - Mouse movement sensitivity
 * @param {number} options.smoothing - Interpolation smoothness
 * @param {boolean} options.enableDeviceOrientation - Enable mobile device orientation
 */
const useParallax = ({
    sensitivity = 0.5,
    smoothing = 0.1,
    enableDeviceOrientation = true
} = {}) => {
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef();

    // Handle mouse movement
    const handleMouseMove = useCallback((e) => {
        // Normalize to -1 to 1 range
        const x = ((e.clientX / window.innerWidth) * 2 - 1) * sensitivity;
        const y = ((e.clientY / window.innerHeight) * 2 - 1) * sensitivity;

        targetRef.current = { x, y };
    }, [sensitivity]);

    // Handle device orientation (mobile)
    const handleDeviceOrientation = useCallback((e) => {
        if (!e.gamma || !e.beta) return;

        // gamma: left/right tilt (-90 to 90)
        // beta: front/back tilt (-180 to 180)
        const x = THREE.MathUtils.clamp(e.gamma / 45, -1, 1) * sensitivity;
        const y = THREE.MathUtils.clamp((e.beta - 45) / 45, -1, 1) * sensitivity;

        targetRef.current = { x, y };
    }, [sensitivity]);

    // Animation loop for smooth interpolation
    useEffect(() => {
        const animate = () => {
            // Lerp current toward target
            currentRef.current.x = THREE.MathUtils.lerp(
                currentRef.current.x,
                targetRef.current.x,
                smoothing
            );
            currentRef.current.y = THREE.MathUtils.lerp(
                currentRef.current.y,
                targetRef.current.y,
                smoothing
            );

            // Update state (batched for performance)
            setParallax({
                x: currentRef.current.x,
                y: currentRef.current.y
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [smoothing]);

    // Set up event listeners
    useEffect(() => {
        // Desktop: mouse movement
        window.addEventListener('mousemove', handleMouseMove);

        // Mobile: device orientation (if supported and enabled)
        let orientationSupported = false;

        if (enableDeviceOrientation && window.DeviceOrientationEvent) {
            // Check if we need to request permission (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // Permission needs to be requested on user gesture
                // For now, we'll skip this and rely on mouse/touch
            } else {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
                orientationSupported = true;
            }
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (orientationSupported) {
                window.removeEventListener('deviceorientation', handleDeviceOrientation);
            }
        };
    }, [handleMouseMove, handleDeviceOrientation, enableDeviceOrientation]);

    return parallax;
};

export default useParallax;
