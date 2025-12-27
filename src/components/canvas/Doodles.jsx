import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Doodles Component - Enhanced Hand-drawn Elements
 * 
 * More sketchy decorations for the corridor.
 */
const Doodles = () => {
    return (
        <group>
            {/* Floating stars */}
            <AnimatedStar position={[-1.5, 1.2, 0]} scale={0.12} speed={0.4} />
            <AnimatedStar position={[1.6, 1.0, -0.5]} scale={0.1} speed={0.5} />
            <AnimatedStar position={[-1.2, 0.3, 0.5]} scale={0.08} speed={0.3} />
            <AnimatedStar position={[1.3, 1.4, -1]} scale={0.09} speed={0.6} />

            {/* Squiggly lines */}
            <Squiggle position={[-1.7, 0.8, -0.3]} rotation={0.2} />
            <Squiggle position={[1.5, 0.5, 0.2]} rotation={-0.3} />

            {/* Circles */}
            <DoodleCircle position={[1.4, 1.3, -0.2]} scale={0.06} />
            <DoodleCircle position={[-1.3, -0.2, 0.3]} scale={0.05} />

            {/* Arrows */}
            <DoodleArrow position={[0, -1.2, 1]} />

            {/* Thought bubble near avatar */}
            <ThoughtBubble position={[0.8, 0.8, 0.5]} />
        </group>
    );
};

/**
 * Animated rotating star
 */
const AnimatedStar = ({ position, scale = 0.1, speed = 0.5 }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z = state.clock.elapsedTime * speed;
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.03;
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
const Squiggle = ({ position, rotation = 0 }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
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
const DoodleCircle = ({ position, scale = 0.08 }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
            ref.current.scale.setScalar(scale * pulse);
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
 * Animated scroll arrow
 */
const DoodleArrow = ({ position }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.5) * 0.06;
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Arrow shaft */}
            <mesh position={[0, 0.1, 0]}>
                <planeGeometry args={[0.025, 0.18]} />
                <meshBasicMaterial color="#2a2a2a" side={2} />
            </mesh>
            {/* Arrow head left */}
            <mesh position={[-0.045, 0, 0]} rotation={[0, 0, -0.7]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" side={2} />
            </mesh>
            {/* Arrow head right */}
            <mesh position={[0.045, 0, 0]} rotation={[0, 0, 0.7]}>
                <planeGeometry args={[0.08, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" side={2} />
            </mesh>
        </group>
    );
};

/**
 * Thought bubble (comic style)
 */
const ThoughtBubble = ({ position }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
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
