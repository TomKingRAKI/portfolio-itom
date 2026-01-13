import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import PaperAirplane from './PaperAirplane';
import InfiniteSkyManager from './InfiniteSkyManager';
// useScene removed as exit logic is now prop-driven

// Chunk length for looping flight effect (matches SkyChunk)
const CHUNK_LENGTH = 40;

const AboutRoom = ({ showRoom, onReady, isExiting }) => {
    const { camera } = useThree();

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    // Momentum-based scroll state
    const scrollPosition = useRef(0);
    const scrollVelocity = useRef(0);
    const [displayProgress, setDisplayProgress] = useState(0);

    // Save base camera rotation on first render
    const baseCameraRotation = useRef({ x: 0, y: 0, z: 0 });
    const isFlightActive = useRef(false);

    // Smoothed flight effect values
    const currentBank = useRef(0);
    const currentPitch = useRef(0);

    // Ready detection + flight animation
    useFrame((state, delta) => {
        if (!hasSignaledReady.current) {
            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                hasSignaledReady.current = true;
                onReady?.();
            }
        }

        // Apply velocity to position (momentum)
        scrollPosition.current += scrollVelocity.current * delta * 60;
        // No clamp - allow flying backward too!

        // Friction
        scrollVelocity.current *= 0.95;
        if (Math.abs(scrollVelocity.current) < 0.001) {
            scrollVelocity.current = 0;
        }

        setDisplayProgress(scrollPosition.current);

        // === EXITING: Straighten camera continuously while exiting ===
        if (isExiting) {
            // Quickly lerp back to 0 tilt
            currentBank.current = THREE.MathUtils.lerp(currentBank.current, 0, 0.1);
            currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, 0, 0.1);

            // Apply straightened rotation relative to base
            if (isFlightActive.current) {
                camera.rotation.x = baseCameraRotation.current.x + currentPitch.current;
                camera.rotation.z = baseCameraRotation.current.z + currentBank.current;
            }
            return;
        }

        // === FLIGHT EFFECT (camera rotation only) ===
        // Activate flight only after first scroll
        if (!isFlightActive.current && scrollPosition.current > 0.5) {
            isFlightActive.current = true;
            baseCameraRotation.current = {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            };
        }

        if (isFlightActive.current) {
            // Get position within current chunk (0 to 1)
            const chunkProgress = (scrollPosition.current % CHUNK_LENGTH) / CHUNK_LENGTH;

            // Flight maneuver pattern - loops back to start at each chunk
            const bankAngle = Math.sin(chunkProgress * Math.PI * 2) * 0.12;
            const pitchAngle = Math.sin(chunkProgress * Math.PI * 4) * 0.05;

            // Smooth lerp
            const lerpSpeed = 1 - Math.pow(0.02, delta);
            currentBank.current = THREE.MathUtils.lerp(currentBank.current, bankAngle, lerpSpeed);
            currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, pitchAngle, lerpSpeed);

            // Apply to camera (base + effect)
            camera.rotation.x = baseCameraRotation.current.x + currentPitch.current;
            camera.rotation.z = baseCameraRotation.current.z + currentBank.current;
        }
    });

    // Handle scroll wheel (desktop)
    useEffect(() => {
        const handleWheel = (e) => {
            scrollVelocity.current += e.deltaY * 0.002;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Handle touch (mobile) - vertical swipe = scroll
    const lastTouchY = useRef(0);
    useEffect(() => {
        const handleTouchStart = (e) => {
            if (e.touches.length === 1) {
                lastTouchY.current = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                const deltaY = lastTouchY.current - e.touches[0].clientY;
                lastTouchY.current = e.touches[0].clientY;
                // Convert touch movement to scroll velocity
                scrollVelocity.current += deltaY * 0.005;
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    // Calculate airplane tilt based on current maneuvers
    const airplanePitch = currentPitch.current * 3 + 0.1;
    const airplaneBank = -currentBank.current * 2;

    return (
        <group position={[0, 0, -5]}>
            {/* === PAPER AIRPLANE (follows camera maneuvers) === */}
            <PaperAirplane
                position={[0, -0.3, -2]}
                rotation={[airplanePitch, 0, airplaneBank]}
                scale={0.8}
                color="#faf8f5"
            />

            {/* === INFINITE SKY WITH CLOUDS === */}
            <InfiniteSkyManager scrollProgress={displayProgress} />

            {/* === SKY BACKDROP === */}
            <mesh position={[0, 0, -200]}>
                <planeGeometry args={[300, 150]} />
                <meshBasicMaterial color="#87CEEB" side={THREE.DoubleSide} />
            </mesh>

            {/* Debug text */}
            <Text position={[0, 1.5, -3]} color="#333" fontSize={0.2} anchorX="center">
                {`Scroll: ${displayProgress.toFixed(1)} | Chunk: ${(displayProgress % CHUNK_LENGTH).toFixed(1)}`}
            </Text>
        </group>
    );
};

export default AboutRoom;
