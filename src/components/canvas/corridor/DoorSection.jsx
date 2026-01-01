import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Constants from CorridorSegment
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;
const DOOR_Z_SPAN = 4;
const CORRIDOR_HEIGHT = 3.5;

// Calculate sawtooth wall geometry
const WALL_DX = WALL_X_OUTER - WALL_X_INNER; // 1.8
const WALL_DZ = DOOR_Z_SPAN; // 4
const WALL_LENGTH = Math.sqrt(WALL_DX * WALL_DX + WALL_DZ * WALL_DZ);
const BASE_WALL_ANGLE = Math.atan2(WALL_DX, WALL_DZ); // Sawtooth angle (~24 degrees)

/**
 * DoorSection Component
 * 
 * Groups the angled wall + door + label as one unit.
 * Pivots from the OUTER edge (where wall connects to corridor).
 * Dynamic tilt: starts nearly flat, tilts more when camera approaches.
 */
const DoorSection = ({
    position, // [x, y, z] - center of the wall segment
    side = 'left',
    label,
    icon,
    color = '#f5f0e6',
    onEnter,
    autoCloseDelay = 3000
}) => {
    const groupRef = useRef(); // Main group that tilts
    const doorRef = useRef();
    const glowRef = useRef();
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNear, setIsNear] = useState(false);
    const { camera } = useThree();
    const closeTimerRef = useRef(null);

    // Dynamic tilt state
    const currentTilt = useRef(0);

    // Load wall texture
    const wallTexture = useTexture('/textures/corridor/wall_texture.webp');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(WALL_LENGTH / 2, CORRIDOR_HEIGHT / 2);

    const doorWidth = 1.2;
    const doorHeight = 2.2;
    const frameThickness = 0.1;

    // Tilt parameters
    // BASE_ROTATION: 90 degrees - wall starts as side wall (perpendicular to corridor)
    const BASE_ROTATION = Math.PI / 2; // 90 degrees - side wall orientation
    const BASE_TILT = 0.02;   // ~1 degree additional tilt towards camera
    const MAX_TILT = BASE_WALL_ANGLE + 0.1; // Sawtooth angle + extra (~27 degrees total tilt)
    const TILT_START = 15;    // Start tilting when camera is 12 units away
    const TILT_PEAK = 3;      // Max tilt at 2 units

    // Pivot offset - the group pivots from the OUTER edge
    // For left side: pivot at x = -WALL_X_OUTER (left edge)
    // For right side: pivot at x = +WALL_X_OUTER (right edge)
    const pivotX = side === 'left' ? -WALL_X_OUTER : WALL_X_OUTER;

    // Wall offset from pivot - wall extends FROM pivot INWARD
    // The OUTER EDGE of the wall is at X=0 (relative to pivot group)
    // Wall extends toward center of corridor by WALL_LENGTH/2
    // For left: wall extends in +X direction (toward center)
    // For right: wall extends in -X direction (toward center)
    const wallOffsetX = side === 'left'
        ? WALL_LENGTH / 2   // Wall center is at +half-length from pivot
        : -WALL_LENGTH / 2; // Wall center is at -half-length from pivot

    useFrame(() => {
        if (!groupRef.current) return;

        const distance = Math.abs(camera.position.z - position[2]);
        const near = distance < 8;
        if (near !== isNear) {
            setIsNear(near);
        }

        let targetTilt = BASE_TILT;

        if (distance < TILT_START && distance > TILT_PEAK) {
            // Approaching: ramp up tilt
            const t = (TILT_START - distance) / (TILT_START - TILT_PEAK);
            const easedT = t * (2 - t); // easeOutQuad
            targetTilt = BASE_TILT + (MAX_TILT - BASE_TILT) * easedT;
        } else if (distance <= TILT_PEAK) {
            // Very close: max tilt
            targetTilt = MAX_TILT;
        }

        // Smooth interpolation
        currentTilt.current = THREE.MathUtils.lerp(currentTilt.current, targetTilt, 0.06);

        // Apply rotation: BASE_ROTATION (90°) + dynamic tilt
        // Left walls: start at +90°, tilt towards camera (less rotation)
        // Right walls: start at -90°, tilt towards camera (less rotation = more positive)
        const baseDir = side === 'left' ? 1 : -1;
        const tiltDir = side === 'left' ? -1 : 1;
        groupRef.current.rotation.y = (BASE_ROTATION * baseDir) + (currentTilt.current * tiltDir);

        // Glow intensity
        if (glowRef.current) {
            const targetOpacity = isNear ? 0.6 : 0.1;
            glowRef.current.material.opacity = THREE.MathUtils.lerp(
                glowRef.current.material.opacity,
                targetOpacity,
                0.08
            );
        }

        // Door hover scale
        if (doorRef.current && !isOpen && !isAnimating) {
            const targetScale = isHovered ? 1.02 : 1;
            doorRef.current.scale.x = THREE.MathUtils.lerp(doorRef.current.scale.x, targetScale, 0.1);
            doorRef.current.scale.y = THREE.MathUtils.lerp(doorRef.current.scale.y, targetScale, 0.1);
        }
    });

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isAnimating) return;

        if (isOpen) {
            closeDoor();
            return;
        }

        setIsAnimating(true);

        const doorWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(doorWorldPos);

        const cameraTargetZ = doorWorldPos.z + 2.5;
        const cameraTargetX = side === 'left' ? -0.3 : 0.3;

        gsap.to(camera.position, {
            x: cameraTargetX,
            z: cameraTargetZ,
            duration: 1.0,
            ease: 'power2.inOut',
            onComplete: () => openDoor()
        });
    }, [camera, side, isOpen, isAnimating]);

    const openDoor = useCallback(() => {
        if (!doorRef.current) return;

        setIsOpen(true);
        const openAngle = side === 'left' ? Math.PI * 0.6 : -Math.PI * 0.6;

        gsap.to(doorRef.current.rotation, {
            y: openAngle,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                setIsAnimating(false);
                onEnter?.();
                closeTimerRef.current = setTimeout(() => closeDoor(), autoCloseDelay);
            }
        });
    }, [side, onEnter, autoCloseDelay]);

    const closeDoor = useCallback(() => {
        if (!doorRef.current || !isOpen) return;
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

        setIsAnimating(true);
        gsap.to(doorRef.current.rotation, {
            y: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => {
                setIsOpen(false);
                setIsAnimating(false);
            }
        });
    }, [isOpen]);

    return (
        // Outer group at pivot position (outer edge of wall)
        <group position={[pivotX, position[1], position[2]]}>
            {/* Inner group that rotates - contains wall + door */}
            <group ref={groupRef}>
                {/* Wall segment - outer edge at pivot, extends inward */}
                <mesh position={[wallOffsetX, 0, 0]}>
                    <planeGeometry args={[WALL_LENGTH, CORRIDOR_HEIGHT]} />
                    <meshStandardMaterial map={wallTexture} roughness={1} metalness={0} />
                </mesh>

                {/* Door and frame - centered on wall */}
                <group position={[wallOffsetX, -0.5, 0.1]}>
                    {/* === FLOATING LABEL === */}
                    <group position={[0, doorHeight / 2 + 0.5, 0.3]}>
                        <mesh position={[0, 0, -0.02]}>
                            <planeGeometry args={[label.length * 0.08 + 0.35, 0.3]} />
                            <meshBasicMaterial color="#1a1a1a" />
                        </mesh>
                        <mesh position={[0, 0, -0.01]}>
                            <planeGeometry args={[label.length * 0.08 + 0.3, 0.25]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.12}
                            color="#1a1a1a"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {icon} {label}
                        </Text>
                        <Text
                            position={[0, -0.2, 0.01]}
                            fontSize={0.15}
                            color="#39FF14"
                            anchorX="center"
                        >
                            ▼
                        </Text>
                    </group>

                    {/* === PROXIMITY GLOW === */}
                    <mesh ref={glowRef} position={[0, 0, -0.1]}>
                        <planeGeometry args={[doorWidth + 0.6, doorHeight + 0.6]} />
                        <meshBasicMaterial
                            color="#39FF14"
                            transparent
                            opacity={0.1}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* Door Frame */}
                    <group>
                        <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
                            <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, 0.12]} />
                            <meshStandardMaterial color="#2a2a2a" />
                        </mesh>
                        <mesh position={[-(doorWidth / 2 + frameThickness / 2), 0, 0]}>
                            <boxGeometry args={[frameThickness, doorHeight, 0.12]} />
                            <meshStandardMaterial color="#2a2a2a" />
                        </mesh>
                        <mesh position={[doorWidth / 2 + frameThickness / 2, 0, 0]}>
                            <boxGeometry args={[frameThickness, doorHeight, 0.12]} />
                            <meshStandardMaterial color="#2a2a2a" />
                        </mesh>
                    </group>

                    {/* Door Panel */}
                    <group ref={doorRef} position={[side === 'left' ? -doorWidth / 2 : doorWidth / 2, 0, 0]}>
                        <mesh
                            position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, 0, 0.02]}
                            onClick={handleClick}
                            onPointerEnter={() => setIsHovered(true)}
                            onPointerLeave={() => setIsHovered(false)}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshStandardMaterial color={isHovered ? '#ebe5d8' : color} roughness={0.85} />
                        </mesh>

                        {/* Decorative panels */}
                        <mesh position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, 0.4, 0.03]}>
                            <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.3]} />
                            <meshStandardMaterial color="#e8e2d5" roughness={1} />
                        </mesh>
                        <mesh position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, -0.35, 0.03]}>
                            <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.3]} />
                            <meshStandardMaterial color="#e8e2d5" roughness={1} />
                        </mesh>

                        {/* Handle */}
                        <mesh position={[side === 'left' ? doorWidth * 0.85 : -doorWidth * 0.85, 0, 0.06]}>
                            <sphereGeometry args={[0.055, 12, 12]} />
                            <meshStandardMaterial color="#222" metalness={0.7} roughness={0.25} />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};

export default DoorSection;
