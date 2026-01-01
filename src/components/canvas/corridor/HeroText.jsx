import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * HeroText Component - Hand-drawn Style
 * 
 * ITOM branding with Gloria Hallelujah font feel.
 * Positioned to fit within corridor walls.
 * Dodges RIGHT when camera approaches.
 */
const HeroText = ({ position = [0, 0.3, 0] }) => {
    const groupRef = useRef();
    const underlineRef = useRef();
    const { camera } = useThree();

    // Dodge state
    const dodgeX = useRef(0);
    const targetDodgeX = useRef(0);

    // Animation loop
    useFrame((state) => {
        if (!groupRef.current) return;

        // === DODGE LOGIC ===
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        const distance = camera.position.z - worldPos.z;

        // Dodge parameters
        const DODGE_START = 5;   // Start dodging when camera is 5 units away
        const DODGE_PEAK = 0;    // Maximum dodge at 0 units
        const DODGE_END = -2;    // Stop dodging after camera passes
        const DODGE_AMOUNT = 2; // Move RIGHT (positive X)

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

        // Apply position with dodge
        groupRef.current.position.x = position[0] + dodgeX.current;

        // Breathing animation
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;

        // Pulsing underline
        if (underlineRef.current) {
            const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 2.5) * 0.3;
            underlineRef.current.material.opacity = pulse;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Main Title - ITOM (smaller to fit corridor) */}
            <Text
                position={[0, 0.2, 0]}
                fontSize={0.8}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.05}
            >
                ITOM
            </Text>

            {/* Hand-drawn style underline (wavy) */}
            <WavyUnderline
                ref={underlineRef}
                position={[0, -0.1, 0.01]}
                width={1.4}
            />

            {/* Tagline */}
            <Text
                position={[0, -0.3, 0]}
                fontSize={0.12}
                color="#666666"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.15}
            >
                creative developer
            </Text>

            {/* Decorative brackets */}
            <Text
                position={[-0.75, -0.3, 0]}
                fontSize={0.14}
                color="#39FF14"
                anchorX="center"
                anchorY="middle"
            >
                {"<"}
            </Text>
            <Text
                position={[0.75, -0.3, 0]}
                fontSize={0.14}
                color="#39FF14"
                anchorX="center"
                anchorY="middle"
            >
                {"/>"}
            </Text>

            {/* Small doodle stars around title */}
            <SmallStar position={[-0.7, 0.5, 0]} />
            <SmallStar position={[0.8, 0.4, 0]} scale={0.7} />
            <SmallStar position={[-0.5, -0.5, 0]} scale={0.5} />
        </group>
    );
};

// Easing function
const easeOutQuad = (t) => t * (2 - t);

/**
 * Wavy underline - hand-drawn style
 */
const WavyUnderline = ({ position, width = 1.5 }) => {
    const points = useMemo(() => {
        const pts = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments - 0.5) * width;
            const y = Math.sin(i * 0.8) * 0.015;
            pts.push(x, y, 0);
        }
        return new Float32Array(pts);
    }, [width]);

    return (
        <group position={position}>
            {/* Main line */}
            <mesh>
                <planeGeometry args={[width, 0.02]} />
                <meshBasicMaterial color="#39FF14" transparent opacity={0.9} />
            </mesh>

            {/* Second offset line for sketch effect */}
            <mesh position={[0.02, -0.015, -0.001]}>
                <planeGeometry args={[width * 0.95, 0.012]} />
                <meshBasicMaterial color="#39FF14" transparent opacity={0.4} />
            </mesh>
        </group>
    );
};

/**
 * Small decorative star
 */
const SmallStar = ({ position, scale = 1 }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z = state.clock.elapsedTime * 0.3;
            ref.current.scale.setScalar(scale * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.1));
        }
    });

    return (
        <group ref={ref} position={position} scale={scale}>
            <mesh rotation={[0, 0, 0]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.06, 0.015]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
                <planeGeometry args={[0.06, 0.015]} />
                <meshBasicMaterial color="#333" />
            </mesh>
        </group>
    );
};

export default HeroText;
