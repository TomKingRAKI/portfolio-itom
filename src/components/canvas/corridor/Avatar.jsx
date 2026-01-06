import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Avatar Component - Hand-drawn sketch style character
 * 
 * New sketchy avatar with WOW effects:
 * - Subtle floating animation
 * - Parallax depth effect on scroll
 * - Hand-drawn line style matching entrance
 * - Dodges when camera approaches
 */
const Avatar = ({ position = [10, -20, 30] }) => {
    const meshRef = useRef();
    const groupRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 1.2, height: 2.4 });
    const { camera } = useThree();

    // Dodge state
    const dodgeX = useRef(0);
    const targetDodgeX = useRef(0);

    // Floating animation state
    const floatOffset = useRef(0);
    const wobble = useRef(0);

    // Load new sketch avatar texture
    const texture = useTexture('/textures/corridor/avatar_sketch.webp');
    texture.colorSpace = THREE.SRGBColorSpace;

    // Calculate proper aspect ratio (SAME size on all devices)
    useEffect(() => {
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const baseHeight = 2.3; // Fixed size, no mobile scaling
            setDimensions({
                width: baseHeight * aspectRatio,
                height: baseHeight
            });
        }
    }, [texture]);

    // Main animation loop with WOW effects
    useFrame((state) => {
        if (!groupRef.current || !meshRef.current) return;

        const time = state.clock.elapsedTime;

        // === DODGE LOGIC ===
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const distance = camera.position.z - worldPos.z;

        // Dodge parameters - matches HeroText timing
        const DODGE_START = 3;  // Was 5, now same as text
        const DODGE_PEAK = 0;
        const DODGE_END = -2;
        const DODGE_AMOUNT = -1.5;

        if (distance > DODGE_PEAK && distance < DODGE_START) {
            const t = (DODGE_START - distance) / (DODGE_START - DODGE_PEAK);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else if (distance <= DODGE_PEAK && distance > DODGE_END) {
            const t = (distance - DODGE_END) / (DODGE_PEAK - DODGE_END);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else {
            targetDodgeX.current = 0;
        }

        dodgeX.current = THREE.MathUtils.lerp(dodgeX.current, targetDodgeX.current, 0.08);

        // Apply position with dodge only (NO floating - stays on floor)
        groupRef.current.position.x = position[0] + dodgeX.current;
        groupRef.current.position.y = position[1]; // Fixed Y position

        // No animations - avatar just stands still and moves sideways
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Shadow/depth layer for sketchy effect */}
            <mesh position={[0.02, -0.02, -0.01]}>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    opacity={0.15}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Main avatar */}
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
