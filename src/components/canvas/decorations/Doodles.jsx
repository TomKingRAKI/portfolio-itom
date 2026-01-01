import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Doodles Component - Enhanced Hand-drawn Elements
 * 
 * More sketchy decorations for the corridor.
 * All doodles scatter to sides when camera approaches.
 */
const Doodles = () => {
    const groupRef = useRef();
    const { camera } = useThree();

    // Track dodge amounts for each side
    const dodgeMultiplier = useRef(0);
    const targetDodge = useRef(0);

    useFrame(() => {
        if (!groupRef.current) return;

        // Get world position
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        const distance = camera.position.z - worldPos.z;

        // Dodge parameters
        const DODGE_START = 5;   // Start dodging when camera is 5 units away
        const DODGE_PEAK = 0;    // Maximum dodge at 0 units
        const DODGE_END = -2;    // Stop dodging after camera passes

        if (distance > DODGE_PEAK && distance < DODGE_START) {
            const t = (DODGE_START - distance) / (DODGE_START - DODGE_PEAK);
            targetDodge.current = easeOutQuad(t);
        } else if (distance <= DODGE_PEAK && distance > DODGE_END) {
            const t = (distance - DODGE_END) / (DODGE_PEAK - DODGE_END);
            targetDodge.current = easeOutQuad(t);
        } else {
            targetDodge.current = 0;
        }

        dodgeMultiplier.current = THREE.MathUtils.lerp(
            dodgeMultiplier.current,
            targetDodge.current,
            0.08
        );
    });

    return (
        <group ref={groupRef}>
            {/* Floating stars - scatter to sides */}
            <AnimatedStar position={[-1.5, 1.2, 0]} scale={0.12} speed={0.4} dodgeDir={-1} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[1.6, 1.0, -0.5]} scale={0.1} speed={0.5} dodgeDir={1} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[-1.2, 0.3, 0.5]} scale={0.08} speed={0.3} dodgeDir={-1} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[1.3, 1.4, -1]} scale={0.09} speed={0.6} dodgeDir={1} dodgeRef={dodgeMultiplier} />

            {/* Squiggly lines */}
            <Squiggle position={[-1.7, 0.8, -0.3]} rotation={0.2} dodgeDir={-1} dodgeRef={dodgeMultiplier} />
            <Squiggle position={[1.5, 0.5, 0.2]} rotation={-0.3} dodgeDir={1} dodgeRef={dodgeMultiplier} />

            {/* Circles */}
            <DoodleCircle position={[1.4, 1.3, -0.2]} scale={0.06} dodgeDir={1} dodgeRef={dodgeMultiplier} />
            <DoodleCircle position={[-1.3, -0.2, 0.3]} scale={0.05} dodgeDir={-1} dodgeRef={dodgeMultiplier} />

            {/* Thought bubble near avatar */}
            <ThoughtBubble position={[0.8, 0.8, 0.5]} dodgeDir={1} dodgeRef={dodgeMultiplier} />
        </group>
    );
};

const easeOutQuad = (t) => t * (2 - t);
const DOODLE_DODGE_AMOUNT = 1.5; // How far doodles scatter

/**
 * Animated rotating star
 */
const AnimatedStar = ({ position, scale = 0.1, speed = 0.5, dodgeDir = 0, dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z = state.clock.elapsedTime * speed;
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.03;

            // Apply dodge
            const dodgeOffset = (dodgeRef?.current || 0) * dodgeDir * DOODLE_DODGE_AMOUNT;
            ref.current.position.x = position[0] + dodgeOffset;
        }
    });

    return (
        <group ref={ref} position={position} scale={scale}>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
                    <planeGeometry args={[1, 0.15]} />
                    <meshBasicMaterial color="#2a2a2a" transparent opacity={0.8} side={2} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Squiggly hand-drawn line
 */
const Squiggle = ({ position, rotation = 0, dodgeDir = 0, dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const dodgeOffset = (dodgeRef?.current || 0) * dodgeDir * DOODLE_DODGE_AMOUNT;
            ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + dodgeOffset;
        }
    });

    return (
        <group ref={ref} position={position} rotation={[0, 0, rotation]}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh key={i} position={[i * 0.08, Math.sin(i * 1.5) * 0.04, 0]}>
                    <circleGeometry args={[0.018, 8]} />
                    <meshBasicMaterial color="#444" transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Hand-drawn circle
 */
const DoodleCircle = ({ position, scale = 0.08, dodgeDir = 0, dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
            ref.current.scale.setScalar(scale * pulse);

            // Apply dodge
            const dodgeOffset = (dodgeRef?.current || 0) * dodgeDir * DOODLE_DODGE_AMOUNT;
            ref.current.position.x = position[0] + dodgeOffset;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <ringGeometry args={[0.7, 1, 12]} />
            <meshBasicMaterial color="#333" transparent opacity={0.5} side={2} />
        </mesh>
    );
};

/**
 * Animated scroll arrow - fades down when dodging
 */
const DoodleArrow = ({ position, dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const dodgeAmount = dodgeRef?.current || 0;
            // Arrow moves down and fades when dodging
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.5) * 0.06 - dodgeAmount * 0.5;
            ref.current.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = 1 - dodgeAmount * 0.8;
                }
            });
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Arrow shaft */}
            <mesh position={[0, 0.1, 0]}>
                <planeGeometry args={[0.025, 0.18]} />
                <meshBasicMaterial color="#2a2a2a" side={2} transparent />
            </mesh>
            {/* Arrow head left */}
            <mesh position={[-0.045, 0, 0]} rotation={[0, 0, -0.7]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" side={2} transparent />
            </mesh>
            {/* Arrow head right */}
            <mesh position={[0.045, 0, 0]} rotation={[0, 0, 0.7]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" side={2} transparent />
            </mesh>
        </group>
    );
};

/**
 * Thought bubble (comic style)
 */
const ThoughtBubble = ({ position, dodgeDir = 0, dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;

            // Apply dodge
            const dodgeOffset = (dodgeRef?.current || 0) * dodgeDir * DOODLE_DODGE_AMOUNT;
            ref.current.position.x = position[0] + dodgeOffset;
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Main bubble */}
            <mesh>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh>
                <ringGeometry args={[0.14, 0.16, 16]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Small bubbles leading to it */}
            <mesh position={[-0.12, -0.12, 0]}>
                <circleGeometry args={[0.04, 8]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.12, -0.12, 0]}>
                <ringGeometry args={[0.035, 0.045, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            <mesh position={[-0.18, -0.2, 0]}>
                <circleGeometry args={[0.025, 8]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.18, -0.2, 0]}>
                <ringGeometry args={[0.02, 0.028, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Content inside bubble - "?" or icon */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.06, 0.08]} />
                <meshBasicMaterial color="#39FF14" />
            </mesh>
        </group>
    );
};

export default Doodles;
