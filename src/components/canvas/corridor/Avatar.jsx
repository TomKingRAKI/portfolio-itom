import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Avatar Component - Hand-drawn character
 * 
 * Main character with proper proportions and subtle idle animation.
 * Dodges LEFT when camera approaches to avoid collision.
 */
const Avatar = ({ position = [0, -0.4, 2] }) => {
    const meshRef = useRef();
    const groupRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 2.4, height: 3.0 });
    const { camera } = useThree();

    // Dodge state
    const dodgeX = useRef(0);
    const targetDodgeX = useRef(0);

    // Load avatar texture
    const texture = useTexture('/images/avatar-thinking.webp');
    texture.colorSpace = THREE.SRGBColorSpace;

    // Calculate proper aspect ratio
    useEffect(() => {
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const baseHeight = window.innerWidth < 768 ? 2.2 : 3.0;
            setDimensions({
                width: baseHeight * aspectRatio,
                height: baseHeight
            });
        }
    }, [texture]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
            if (texture.image) {
                const aspectRatio = texture.image.width / texture.image.height;
                const baseHeight = window.innerWidth < 768 ? 2.0 : 3.0;
                setDimensions({
                    width: baseHeight * aspectRatio,
                    height: baseHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [texture]);

    // Main animation loop
    useFrame((state) => {
        if (!groupRef.current || !meshRef.current) return;

        // === DODGE LOGIC ===
        // Get world position of avatar
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        // Distance from camera to avatar (positive = camera is in front/approaching)
        const distance = camera.position.z - worldPos.z;

        // Dodge parameters
        const DODGE_START = 5;   // Start dodging when camera is 8 units away
        const DODGE_PEAK = 0;    // Maximum dodge at 2 units
        const DODGE_END = -2;    // Stop dodging after camera passes
        const DODGE_AMOUNT = -1.5; // Move LEFT (negative X)

        // Calculate dodge amount based on distance
        if (distance > DODGE_PEAK && distance < DODGE_START) {
            // Approaching: ramp up 0 → 1
            const t = (DODGE_START - distance) / (DODGE_START - DODGE_PEAK);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else if (distance <= DODGE_PEAK && distance > DODGE_END) {
            // At peak or passing: full dodge, then ramp down
            const t = (distance - DODGE_END) / (DODGE_PEAK - DODGE_END);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else {
            // Out of range: no dodge
            targetDodgeX.current = 0;
        }

        // Smooth interpolation
        dodgeX.current = THREE.MathUtils.lerp(dodgeX.current, targetDodgeX.current, 0.08);

        // Apply dodge offset
        groupRef.current.position.x = position[0] + dodgeX.current;

        // === IDLE ANIMATIONS ===
        // Gentle sway
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.015;
        // Subtle breathing (scale)
        const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.008;
        meshRef.current.scale.y = breathe;

        // Billboard - always face camera
        meshRef.current.lookAt(camera.position);
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh ref={meshRef}>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};

// Easing function for smooth animation
const easeOutQuad = (t) => t * (2 - t);

export default Avatar;
