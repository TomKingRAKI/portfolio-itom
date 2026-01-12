import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import PaperAirplane from './PaperAirplane';
import InfiniteSkyManager from './InfiniteSkyManager';

const AboutRoom = ({ showRoom, onReady }) => {
    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    // Momentum-based scroll state
    const scrollPosition = useRef(0);
    const scrollVelocity = useRef(0);
    const [displayProgress, setDisplayProgress] = useState(0);

    // Ready detection
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
        scrollPosition.current = Math.max(0, scrollPosition.current);

        // Friction
        scrollVelocity.current *= 0.95;
        if (Math.abs(scrollVelocity.current) < 0.001) {
            scrollVelocity.current = 0;
        }

        setDisplayProgress(scrollPosition.current);
    });

    // Handle scroll wheel
    useEffect(() => {
        const handleWheel = (e) => {
            scrollVelocity.current += e.deltaY * 0.002;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <group position={[0, 0, -5]}>
            {/* === PAPER AIRPLANE (static, in front of camera) === */}
            <PaperAirplane
                position={[0, -0.3, -2]}
                rotation={[0.1, 0, 0]}
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
                {`Scroll: ${displayProgress.toFixed(1)}`}
            </Text>
        </group>
    );
};

export default AboutRoom;
