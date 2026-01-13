import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCursor, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// ============================================
// 🌊 CONTACT ROOM v2 - MESSAGE IN A BOTTLE
// Immersive experience: write message, roll into bottle, throw
// ============================================

const WAVE_LAYERS = 4;

// ============================================
// ⚙️ CAMERA SETTINGS - TWEAK HERE
// ============================================
const CAMERA_SETTINGS = {
    // Rotation X: How much to look down (radians)
    // -1.5 is straight down (-90 deg), -1.2 is ~70 deg
    lookDownAngle: -1.2,

    // Rotation Y: Left/Right turn
    // Set to 0 to force center, or null to keep current direction
    forceCenterY: -1.05, // FORCE CENTER to align paper straight

    // Rotation Z: Tilt/Roll
    // Set to 0 to straighten the camera
    forceStraightZ: 0,

    // Animation speed
    lerpSpeed: 2.5
};

// Experience phases
const PHASE = {
    ENTERING: 'entering',      // Camera entering room
    LOOKING_DOWN: 'looking_down', // Camera animating to look at dock
    WRITING: 'writing',        // User writing on paper
    ROLLING: 'rolling',        // Paper rolling into bottle
    HOLDING: 'holding',        // Camera holding bottle, looking at sea
    THROWING: 'throwing',      // Bottle being thrown
    DONE: 'done'               // Bottle floating away
};

const ContactRoom = ({ showRoom, onReady, isExiting }) => {
    const { camera } = useThree();

    useEffect(() => {
        // Set rotation order to YXZ to prevent Gimbal lock and mixing of axes
        // Y = Body turn (Yaw), X = Head tilt (Pitch), Z = Roll
        camera.rotation.order = 'YXZ';
    }, [camera]);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    // Phase state
    const [currentPhase, setCurrentPhase] = useState(PHASE.ENTERING);

    // Store original camera rotation to restore later
    const originalCameraRotation = useRef({ x: 0, y: 0, z: 0 });
    const hasAnimatedDown = useRef(false);
    // Latch exit state to prevent glitch
    const hasExitTriggered = useRef(false);
    if (isExiting) hasExitTriggered.current = true;

    // Refs for animations
    const waveRefs = useRef([]);
    const bottleRef = useRef();
    const paperRef = useRef();

    // ============================================
    // 📷 CAMERA ANIMATION - Look down at dock
    // Triggered after room is ready
    // ============================================
    // ============================================
    // 📷 CAMERA CONTROL
    // Simple Euler rotation to look down
    // ============================================

    // Target rotation values
    const targetRotX = useRef(0);
    const targetRotY = useRef(0);
    const targetRotZ = useRef(0);

    useEffect(() => {
        if (hasSignaledReady.current && !hasAnimatedDown.current && showRoom) {
            hasAnimatedDown.current = true;
            hasExitTriggered.current = false; // Reset latch

            // Capture landing rotation (usually 0,0,0)
            targetRotX.current = camera.rotation.x;
            targetRotY.current = camera.rotation.y;
            targetRotZ.current = camera.rotation.z;

            // Start sequence
            const timer = setTimeout(() => {
                setCurrentPhase(PHASE.LOOKING_DOWN);

                // 1. SET X (Looking down)
                targetRotX.current = CAMERA_SETTINGS.lookDownAngle;

                // 2. SET Y (Turning)
                if (CAMERA_SETTINGS.forceCenterY !== null) {
                    targetRotY.current = CAMERA_SETTINGS.forceCenterY;
                }
                // else: keep targetRotY as captured (current rotation)

                // 3. SET Z (Tilt)
                if (CAMERA_SETTINGS.forceStraightZ !== null) {
                    targetRotZ.current = CAMERA_SETTINGS.forceStraightZ;
                }
            }, 800);

            // Phase transition
            const phaseTimer = setTimeout(() => {
                setCurrentPhase(PHASE.WRITING);
            }, 2000);

            return () => {
                clearTimeout(timer);
                clearTimeout(phaseTimer);
            };
        }

        // EXIT ANIMATION CLEANUP
        // When room is finally hidden, reset everything
        if (!showRoom) {
            hasExitTriggered.current = false;
            if (hasAnimatedDown.current) {
                hasAnimatedDown.current = false;
                setCurrentPhase(PHASE.ENTERING);
                // Reset targets just in case
                targetRotX.current = 0;
                targetRotZ.current = 0;
            }
        }
    }, [hasSignaledReady.current, showRoom, camera]);

    // Frame Loop
    useFrame((state, delta) => {
        if (!hasSignaledReady.current) {
            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                hasSignaledReady.current = true;
                onReady?.();
            }
        }

        // 1. Camera Animation (Simple Lerp)
        // Animate even if !showRoom to allow exit transition
        if (hasAnimatedDown.current) {
            const lerpSpeed = delta * CAMERA_SETTINGS.lerpSpeed;

            if (isExiting || hasExitTriggered.current) {
                // EXIT MODE:
                // 1. Reset X (look up/forward) and Z (tilt) to 0
                camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, lerpSpeed);
                camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, lerpSpeed);

                // 2. DO NOT TOUCH Y!
                // DoorSection controls Y during exit (turning back to corridor)
                // If we lerp Y here, we fight the DoorSection animation
            } else {
                // NORMAL MODE:
                camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX.current, lerpSpeed);
                camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotY.current, lerpSpeed);
                camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRotZ.current, lerpSpeed);
            }
        }

        // 2. Wave Animation
        const time = state.clock.getElapsedTime();
        waveRefs.current.forEach((ref, i) => {
            if (ref) {
                const speed = 0.8 + i * 0.15;
                const amplitude = 0.15 - i * 0.02;
                const offset = i * 0.5;
                ref.position.y = Math.sin(time * speed + offset) * amplitude;
            }
        });

        // 3. Bottle Floating
        if (bottleRef.current && currentPhase !== PHASE.HOLDING) {
            // Adjust position based on phase
            // During WRITING, bottle is on the dock (stable)
            // Floating only if in water (not yet implemented fully, keeping float for now)
            bottleRef.current.position.y = Math.sin(time * 0.9 + 1) * 0.1 + (currentPhase === PHASE.WRITING ? 0.1 : 0);
            bottleRef.current.rotation.z = Math.sin(time * 0.7) * 0.08;
        }
    });

    return (
        <group position={[0, -0.7, -5]}>
            {/* ============================================
                🌅 SKY BACKDROP
            ============================================ */}
            <mesh position={[0, 10, -50]}>
                <planeGeometry args={[150, 80]} />
                <meshBasicMaterial color="#e8e8e8" side={THREE.DoubleSide} />
            </mesh>

            {/* ============================================
                🌊 OCEAN WAVE LAYERS
            ============================================ */}
            <group position={[0, -1, -8]}>
                {Array.from({ length: WAVE_LAYERS }).map((_, i) => (
                    <mesh
                        key={i}
                        ref={el => waveRefs.current[i] = el}
                        position={[0, -i * 0.1, -i * 8]}
                        rotation={[-Math.PI / 2.5, 0, 0]}
                    >
                        <planeGeometry args={[80, 30]} />
                        <meshBasicMaterial
                            color={`hsl(0, 0%, ${35 + i * 15}%)`}
                            transparent
                            opacity={1 - i * 0.1}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>

            {/* ============================================
                🏖️ DOCK / MOLO
            ============================================ */}
            <mesh position={[0, -0.1, 1.5]}>
                <boxGeometry args={[3, 0.2, 7]} />
                <meshStandardMaterial color="#888888" />
            </mesh>

            {/* ============================================
                📜 PAPER - Lying on dock (for writing)
                Visible during WRITING phase
            ============================================ */}
            {(currentPhase === PHASE.WRITING || currentPhase === PHASE.LOOKING_DOWN) && (
                <group ref={paperRef} position={[0, 0.05, 2]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[1.2, 1.6]} />
                        <meshBasicMaterial color="#f5f5f0" side={THREE.DoubleSide} />
                    </mesh>
                    <Text
                        position={[0, 0.01, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={0.08}
                        color="#333333"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {currentPhase === PHASE.WRITING
                            ? "[ click to write message ]"
                            : ""}
                    </Text>
                </group>
            )}

            {/* ============================================
                🍾 BOTTLE - Next to paper
                Will be picked up later
            ============================================ */}
            <group
                ref={bottleRef}
                position={[0.8, 0.1, 2.5]}
                rotation={[0, 0, Math.PI / 6]} // Lying on side
            >
                <mesh>
                    <planeGeometry args={[0.4, 0.8]} />
                    <meshBasicMaterial color="#666666" side={THREE.DoubleSide} />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.08}
                    color="#ffffff"
                    anchorX="center"
                >
                    BOTTLE
                </Text>
            </group>

            {/* ============================================
                📍 DEBUG - Current phase indicator
            ============================================ */}
            <Text
                position={[0, 2, 0]}
                fontSize={0.15}
                color="#333333"
                anchorX="center"
            >
                Phase: {currentPhase}
            </Text>
        </group>
    );
};

export default ContactRoom;
