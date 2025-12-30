import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Door Component - Enhanced with floating label and proximity glow
 */
const Door = ({
    position,
    side = 'left',
    rotationY = null, // Optional explicit rotation override
    label,
    icon,
    color = '#f5f0e6',
    onEnter,
    autoCloseDelay = 3000
}) => {
    const doorRef = useRef();
    const frameRef = useRef();
    const glowRef = useRef();
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNear, setIsNear] = useState(false);
    const { camera } = useThree();
    const closeTimerRef = useRef(null);

    const doorWidth = 1.2;
    const doorHeight = 2.2;
    const frameThickness = 0.1;

    // Check proximity for glow effect
    useFrame(() => {
        const distance = Math.abs(camera.position.z - position[2]);
        const near = distance < 8;
        if (near !== isNear) {
            setIsNear(near);
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
        frameRef.current.getWorldPosition(doorWorldPos);

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

    useFrame(() => {
        if (doorRef.current && !isOpen && !isAnimating) {
            const targetScale = isHovered ? 1.02 : 1;
            doorRef.current.scale.x = THREE.MathUtils.lerp(doorRef.current.scale.x, targetScale, 0.1);
            doorRef.current.scale.y = THREE.MathUtils.lerp(doorRef.current.scale.y, targetScale, 0.1);
        }

        // Glow intensity based on proximity
        if (glowRef.current) {
            const targetOpacity = isNear ? 0.6 : 0.1;
            glowRef.current.material.opacity = THREE.MathUtils.lerp(
                glowRef.current.material.opacity,
                targetOpacity,
                0.08
            );
        }
    });

    const doorRotationY = rotationY !== null ? rotationY : (side === 'left' ? Math.PI / 2 : -Math.PI / 2);

    return (
        <group position={position} rotation={[0, doorRotationY, 0]} ref={frameRef}>
            {/* === FLOATING LABEL (always visible) === */}
            <group position={[0, doorHeight / 2 + 0.5, 0.3]}>
                {/* Label border (back layer) */}
                <mesh position={[0, 0, -0.02]}>
                    <planeGeometry args={[label.length * 0.08 + 0.35, 0.3]} />
                    <meshBasicMaterial color="#1a1a1a" />
                </mesh>

                {/* Label background (middle layer) */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[label.length * 0.08 + 0.3, 0.25]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>

                {/* Label text (front layer) */}
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.12}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    renderOrder={3}
                    depthOffset={-1}
                >
                    {icon} {label}
                </Text>

                {/* Arrow pointing down */}
                <Text
                    position={[0, -0.2, 0.01]}
                    fontSize={0.15}
                    color="#39FF14"
                    anchorX="center"
                    renderOrder={3}
                    depthOffset={-1}
                >
                    ▼
                </Text>
            </group>

            {/* === PROXIMITY GLOW === */}
            <mesh
                ref={glowRef}
                position={[0, 0, -0.1]}
            >
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
                    onPointerEnter={() => {
                        setIsHovered(true);
                    }}
                    onPointerLeave={() => {
                        setIsHovered(false);
                    }}
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
    );
};

export default Door;
