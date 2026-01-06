import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Doodles Component - Hand-drawn Sketch Elements
 * 
 * WOW Effects for Awwwards SOTD:
 * - Sketchy paper elements (paper ball, airplane, pencil, coffee)
 * - Parallax scatter on scroll
 * - MOUSE PUSH: doodles get repelled by cursor
 * - Floating animations with physics-like feel
 * - Consistent hand-drawn aesthetic
 */
const Doodles = () => {
    const groupRef = useRef();
    const { camera, pointer, viewport } = useThree();

    // Track dodge amounts for scatter effect
    const dodgeMultiplier = useRef(0);
    const targetDodge = useRef(0);

    // Mouse position in world coordinates
    const mousePos = useRef(new THREE.Vector2(0, 0));

    // Load all sketch textures
    const textures = useTexture({
        paperBall: '/textures/corridor/decorations/paper_ball.webp',
        paperAirplane: '/textures/corridor/decorations/paper_airplane.webp',
        pencil: '/textures/corridor/decorations/pencil.webp',
        coffeeCup: '/textures/corridor/decorations/coffee_cup.webp',
    });

    // Set color space for all textures
    Object.values(textures).forEach(tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    useFrame(() => {
        if (!groupRef.current) return;

        // === MOUSE POSITION TRACKING ===
        // Convert pointer (-1 to 1) to approximate world coordinates
        mousePos.current.x = pointer.x * viewport.width * 0.5;
        mousePos.current.y = pointer.y * viewport.height * 0.5;

        // Get world position for dodge calculation
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        const distance = camera.position.z - worldPos.z;

        // Dodge/scatter parameters - matches HeroText timing
        const DODGE_START = 3;
        const DODGE_PEAK = 0;
        const DODGE_END = -2;

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
            {/* Paper Airplane - BIGGER, above head */}
            <SketchElement
                texture={textures.paperAirplane}
                position={[0.5, 0.8, 0.3]}
                scale={0.55}
                dodgeDir={[1.5, 0.8]}
                dodgeRef={dodgeMultiplier}
                mousePos={mousePos}
                rotationSpeed={0.15}
                floatSpeed={0.7}
                floatAmount={0.04}
            />

            {/* Paper Ball - BIGGER, lower left near creative developer */}
            <SketchElement
                texture={textures.paperBall}
                position={[-0.9, -0.7, 0.4]}
                scale={0.4}
                dodgeDir={[-1.2, -0.3]}
                dodgeRef={dodgeMultiplier}
                mousePos={mousePos}
                rotationSpeed={0.4}
                floatSpeed={0.5}
                floatAmount={0.02}
            />

            {/* Second Paper Ball - upper left, bigger */}
            <SketchElement
                texture={textures.paperBall}
                position={[-1.3, 0.5, -0.2]}
                scale={0.3}
                dodgeDir={[-1.0, 0.5]}
                dodgeRef={dodgeMultiplier}
                mousePos={mousePos}
                rotationSpeed={-0.3}
                floatSpeed={0.6}
                floatAmount={0.03}
            />

            {/* Pencil - BIGGER, under creative developer */}
            <SketchElement
                texture={textures.pencil}
                position={[0.7, -0.8, 0.5]}
                scale={0.5}
                dodgeDir={[1.3, 0.2]}
                dodgeRef={dodgeMultiplier}
                mousePos={mousePos}
                rotationSpeed={0.1}
                floatSpeed={0.4}
                floatAmount={0.02}
                initialRotation={-0.4}
            />

            {/* Coffee Cup - bigger, upper right */}
            <SketchElement
                texture={textures.coffeeCup}
                position={[1.2, 0.6, -0.1]}
                scale={0.35}
                dodgeDir={[0.8, 0.6]}
                dodgeRef={dodgeMultiplier}
                mousePos={mousePos}
                rotationSpeed={0.05}
                floatSpeed={0.35}
                floatAmount={0.025}
            />

            {/* Animated hand-drawn stars */}
            <AnimatedStar position={[-1.5, 1.2, 0]} scale={0.1} speed={0.4} dodgeDir={[-1.2, 0.3]} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[1.6, 0.8, -0.5]} scale={0.08} speed={0.5} dodgeDir={[1.0, 0.4]} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[-1.2, 0.1, 0.5]} scale={0.06} speed={0.3} dodgeDir={[-0.8, -0.2]} dodgeRef={dodgeMultiplier} />
            <AnimatedStar position={[1.3, 1.4, -1]} scale={0.07} speed={0.6} dodgeDir={[0.9, 0.5]} dodgeRef={dodgeMultiplier} />

            {/* Hand-drawn circles */}
            <DoodleCircle position={[1.2, -0.2, 0.2]} scale={0.05} dodgeDir={[1.0, -0.3]} dodgeRef={dodgeMultiplier} />
            <DoodleCircle position={[-1.3, 1.0, 0.3]} scale={0.04} dodgeDir={[-0.9, 0.4]} dodgeRef={dodgeMultiplier} />

            {/* Squiggly decorative lines */}
            <Squiggle position={[-1.6, 0.5, -0.3]} rotation={0.2} dodgeDir={[-1.1, 0.1]} dodgeRef={dodgeMultiplier} />
            <Squiggle position={[1.4, 0.3, 0.2]} rotation={-0.3} dodgeDir={[1.2, 0.0]} dodgeRef={dodgeMultiplier} />

            {/* Thought bubble near avatar */}
            <ThoughtBubble position={[0.9, 0.7, 0.5]} dodgeDir={[0.8, 0.3]} dodgeRef={dodgeMultiplier} />
        </group>
    );
};

const easeOutQuad = (t) => t * (2 - t);
const DOODLE_DODGE_AMOUNT = 1.8;

/**
 * Sketch Element - textured 2D element with floating animation
 */
const SketchElement = ({
    texture,
    position,
    scale = 0.3,
    dodgeDir = [0, 0],
    dodgeRef,
    mousePos,
    rotationSpeed = 0.1,
    floatSpeed = 0.5,
    floatAmount = 0.03,
    initialRotation = 0
}) => {
    const ref = useRef();
    const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

    // Accumulated mouse push offset (doesn't return to 0)
    const accumulatedPushX = useRef(0);
    const accumulatedPushY = useRef(0);

    // Calculate dimensions from texture
    useEffect(() => {
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            setDimensions({
                width: scale * aspectRatio,
                height: scale
            });
        }
    }, [texture, scale]);

    useFrame((state) => {
        if (!ref.current) return;

        const time = state.clock.elapsedTime;
        const dodge = (dodgeRef?.current || 0) * DOODLE_DODGE_AMOUNT;

        // Current actual position (base + accumulated push)
        const currentX = position[0] + accumulatedPushX.current;
        const currentY = position[1] + accumulatedPushY.current;

        // === MOUSE PUSH EFFECT - ACCUMULATES PERMANENTLY ===
        if (mousePos?.current) {
            // Calculate distance from CURRENT position (not base)
            const dx = currentX - mousePos.current.x;
            const dy = currentY - mousePos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Push strength inversely proportional to distance
            const PUSH_RADIUS = 0.8;   // How close mouse needs to be
            const PUSH_STRENGTH = 0.03; // Push per frame when in range

            if (dist < PUSH_RADIUS && dist > 0.01) {
                const pushFactor = (1 - dist / PUSH_RADIUS) * PUSH_STRENGTH;
                // ACCUMULATE the push (doesn't return!)
                accumulatedPushX.current += (dx / dist) * pushFactor;
                accumulatedPushY.current += (dy / dist) * pushFactor;
            }
        }

        // Apply dodge + accumulated push
        ref.current.position.x = position[0] + dodgeDir[0] * dodge + accumulatedPushX.current;
        ref.current.position.y = position[1] + dodgeDir[1] * dodge + accumulatedPushY.current + Math.sin(time * floatSpeed + position[0]) * floatAmount;
        ref.current.position.z = position[2];

        // Rotation animation
        ref.current.rotation.z = initialRotation + Math.sin(time * rotationSpeed) * 0.1;

        // Subtle scale pulse
        const pulse = 1 + Math.sin(time * 1.5 + position[0] * 2) * 0.03;
        ref.current.scale.setScalar(pulse);
    });

    return (
        <group ref={ref} position={position}>
            {/* Shadow layer */}
            <mesh position={[0.01, -0.01, -0.01]}>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    opacity={0.15}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    alphaTest={0.5}
                />
            </mesh>
            {/* Main element */}
            <mesh>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    alphaTest={0.5}
                />
            </mesh>
        </group>
    );
};


/**
 * Animated rotating star - hand-drawn style
 */
const AnimatedStar = ({ position, scale = 0.1, speed = 0.5, dodgeDir = [0, 0], dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.elapsedTime;
            const dodge = (dodgeRef?.current || 0) * DOODLE_DODGE_AMOUNT;

            ref.current.rotation.z = time * speed;
            ref.current.position.x = position[0] + dodgeDir[0] * dodge;
            ref.current.position.y = position[1] + dodgeDir[1] * dodge + Math.sin(time * 0.8 + position[0]) * 0.03;
            ref.current.scale.setScalar(scale * (1 + Math.sin(time * 2) * 0.15));
        }
    });

    return (
        <group ref={ref} position={position} scale={scale}>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
                    <planeGeometry args={[1, 0.12]} />
                    <meshBasicMaterial color="#2a2a2a" transparent opacity={0.7} side={2} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Squiggly hand-drawn line
 */
const Squiggle = ({ position, rotation = 0, dodgeDir = [0, 0], dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.elapsedTime;
            const dodge = (dodgeRef?.current || 0) * DOODLE_DODGE_AMOUNT;

            ref.current.position.x = position[0] + Math.sin(time * 0.5) * 0.02 + dodgeDir[0] * dodge;
            ref.current.position.y = position[1] + dodgeDir[1] * dodge;
        }
    });

    return (
        <group ref={ref} position={position} rotation={[0, 0, rotation]}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh key={i} position={[i * 0.07, Math.sin(i * 1.5) * 0.035, 0]}>
                    <circleGeometry args={[0.015, 8]} />
                    <meshBasicMaterial color="#444" transparent opacity={0.5} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Hand-drawn circle with pulsing animation
 */
const DoodleCircle = ({ position, scale = 0.08, dodgeDir = [0, 0], dodgeRef }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.elapsedTime;
            const dodge = (dodgeRef?.current || 0) * DOODLE_DODGE_AMOUNT;

            const pulse = 1 + Math.sin(time * 2) * 0.1;
            ref.current.scale.setScalar(scale * pulse);
            ref.current.position.x = position[0] + dodgeDir[0] * dodge;
            ref.current.position.y = position[1] + dodgeDir[1] * dodge;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <ringGeometry args={[0.6, 1, 12]} />
            <meshBasicMaterial color="#333" transparent opacity={0.4} side={2} />
        </mesh>
    );
};

/**
 * Thought bubble - comic style with animated content
 */
const ThoughtBubble = ({ position, dodgeDir = [0, 0], dodgeRef }) => {
    const ref = useRef();
    const contentRef = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.elapsedTime;
            const dodge = (dodgeRef?.current || 0) * DOODLE_DODGE_AMOUNT;

            ref.current.position.x = position[0] + dodgeDir[0] * dodge;
            ref.current.position.y = position[1] + dodgeDir[1] * dodge + Math.sin(time * 0.6) * 0.02;
        }

        if (contentRef.current) {
            // Pulsing content inside bubble
            const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            contentRef.current.material.opacity = pulse;
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Main bubble */}
            <mesh>
                <circleGeometry args={[0.12, 16]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh>
                <ringGeometry args={[0.11, 0.13, 16]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Small bubbles leading to main */}
            <mesh position={[-0.1, -0.1, 0]}>
                <circleGeometry args={[0.035, 8]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.1, -0.1, 0]}>
                <ringGeometry args={[0.03, 0.04, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            <mesh position={[-0.15, -0.16, 0]}>
                <circleGeometry args={[0.02, 8]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.15, -0.16, 0]}>
                <ringGeometry args={[0.015, 0.022, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Content inside bubble - code icon */}
            <mesh ref={contentRef} position={[0, 0, 0.01]}>
                <planeGeometry args={[0.05, 0.06]} />
                <meshBasicMaterial color="#39FF14" transparent opacity={0.9} />
            </mesh>
        </group>
    );
};

export default Doodles;
